import React, {useState, useEffect, useRef} from 'react';
import {Form, Button, Alert, Row, Col, Spinner} from 'react-bootstrap';
import {useVehicle} from '../hooks/useVehicle'; // Assuming similar hook for vehicle CRUD
import {useNavigate, useParams} from 'react-router-dom';
import DocumentPreviewRow from './DocumentPreviewRow'; // Component to preview document files
import pdfIcon from '../assets/icons/pdf_icon.svg';
import companyLogo from '../assets/icons/Logo.png';
import toast from "bootstrap/js/src/toast";
import useAuth from "../hooks/useAuth";
import {deleteVehicle} from "../services/deleteServices";
import {useContext} from 'react';
import GetVehiclesContext from '../context/GetVehiclesContext';

const VehicleEditForm = () => {
    const {lisence_plate} = useParams();
    const {user} = useAuth();
    const {
        getVehicleByLisencePlate,
        loading: loadingVehicle,
        selectedVehicle,
        getAllVehicles
    } = useContext(GetVehiclesContext);
    const {updateVehicleByLisencePlate, loading, error} = useVehicle();
    const [, setShowToast] = useState(false);
    const [, setToastMessage] = useState('');
    const [, setToastVariant] = useState('success');
    const [vehicleData, setVehicleData] = useState({
        lisence_plate: '',
        model: '',
        brand: '',
        vehicle_type: '',
        owner_id: '', // Ensure this is included here
        observations: '',
        created_by: '',
        modified_by: '',
        modification_time: ''
    });
    const [documents, setDocuments] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [isFormModified, setIsFormModified] = useState(false);
    // Check the role of the user
    const isUser = user.role === 'user';
    const isAdmin = user.role === 'admin';
    const isSuperuser = user.role === 'superuser';

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const backendURL = 'http://localhost:8000'; // Update this based on your backend configuration

    // Helper function to format date and time
    const formatDateTime = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).format(date);
    };

    useEffect(() => {
        const fetchVehicleData = async () => {
            if (lisence_plate) {
                try {
                    await getVehicleByLisencePlate(lisence_plate);
                } catch (err) {
                    console.error('Error fetching vehicle data:', err);
                    toast.error("Failed to fetch vehicle data!");
                }
            }
        };

        fetchVehicleData();
    }, [lisence_plate, getVehicleByLisencePlate]);

    useEffect(() => {
        if (!loadingVehicle && selectedVehicle) {
            setVehicleData({
                lisence_plate: selectedVehicle.lisence_plate,
                model: selectedVehicle.model,
                brand: selectedVehicle.brand,
                vehicle_type: selectedVehicle.vehicle_type,
                owner_id: selectedVehicle.owner_id,
                observations: selectedVehicle.observations,
                created_by: selectedVehicle.created_by,
                modified_by: selectedVehicle.modified_by || '',
                modification_time: selectedVehicle.modification_time ? formatDateTime(selectedVehicle.modification_time) : ''
            });

            const existingDocuments = selectedVehicle.documents || [];
            setDocuments(existingDocuments);

            const initialDocumentPreviews = existingDocuments.map((doc) => ({
                name: doc.split('/').pop(),
                src: `${backendURL}/vehicle_uploads/${encodeURIComponent(doc.split('/').pop())}`,
                isExisting: true,
            }));

            setDocumentPreviews(initialDocumentPreviews);
        }
    }, [loadingVehicle, selectedVehicle, backendURL]);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setVehicleData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setIsFormModified(true);
    };

    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files); // Get selected files as an array

        // Filter out files that are already in the list based on name and size
        const newFiles = files.filter(file => !documents.some(doc => {
            if (typeof doc === 'string') return false; // Ignore existing documents (already uploaded)
            return doc.name === file.name && doc.size === file.size; // Prevent duplicates
        }));

        // Create previews for new files
        const newPreviews = newFiles.map(file => ({
            name: file.name,
            src: URL.createObjectURL(file), // Create a preview URL for the file
            isExisting: false
        }));

        // Preserve the existing previews and append the new ones
        setDocumentPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);

        // Append the new files to the existing documents
        setDocuments(prevDocuments => [...prevDocuments, ...newFiles]);
        setIsFormModified(true);

        // Reset file input to allow re-selection of the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input value
        }
    };

    useEffect(() => {
        return () => {
            // Cleanup URLs to prevent memory leaks
            documentPreviews.forEach(preview => {
                if (!preview.isExisting) {
                    URL.revokeObjectURL(preview.src);
                }
            });
        };
    }, [documentPreviews]);

    const handleViewDocument = (index) => {
        const upload = documentPreviews[index];

        if (upload) {
            if (upload.isExisting) {
                window.open(upload.src);
            } else {
                const fileURL = URL.createObjectURL(documents[index]);
                window.open(fileURL);
            }
        } else {
            console.error("Document does not exist at index:", index);
            toast.error("Document not found!");
        }
    };

    const handleRemoveDocument = (index) => {
        const documentToRemove = documentPreviews[index];
        if (!documentToRemove.isExisting) {
            URL.revokeObjectURL(documentToRemove.src);
        }
        setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
        setDocuments(prev => prev.filter((_, i) => i !== index));
        setIsFormModified(true);
    };
    const navigateToList = () => {
        navigate('/vehicles')
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        let hasChanges = false;
        // Append vehicle data, only if it has changed
        Object.keys(vehicleData).forEach(key => {
            // For modification_time, compare raw dates
            if (key === 'modification_time') return;

            if (
                vehicleData[key] !== null &&
                vehicleData[key] !== undefined &&
                vehicleData[key] !== selectedVehicle[key]
            ) {
                formData.append(key, vehicleData[key]);
                hasChanges = true;
            }
        });

        const existingDocuments = selectedVehicle.documents || [];
        const newDocuments = documents.filter(doc => doc instanceof File);
        const removedDocuments = existingDocuments.filter(doc =>
            !documentPreviews.some(preview => preview.name === doc.split('/').pop() && preview.isExisting)
        );

        newDocuments.forEach(doc => {
            formData.append('new_documents', doc);
        });

        removedDocuments.forEach(doc => {
            formData.append('remove_documents', doc.split('/').pop());
        });

        if (hasChanges || newDocuments.length > 0 || removedDocuments.length > 0) {
            formData.append('modified_by', user.email);
            formData.append('modification_time', new Date().toISOString()); // Use ISO string for backend consistency
            hasChanges = true;
        }

        // Log FormData contents for debugging
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
            console.log(key, value instanceof File ? `File: ${value.name}` : value);
        }

        // Only proceed with the update if there are changes
        if (!hasChanges) {
            setSuccessMessage('No changes to update.');
            return;
        }

        try {
            const updatedVehicle = await updateVehicleByLisencePlate(lisence_plate, formData);
            setVehicleData({
                lisence_plate: updatedVehicle.lisence_plate,
                model: updatedVehicle.model,
                brand: updatedVehicle.brand,
                vehicle_type: updatedVehicle.vehicle_type,
                owner_id: updatedVehicle.owner_id,
                observations: updatedVehicle.observations,
                created_by: updatedVehicle.created_by,
                modified_by: updatedVehicle.modified_by || '',
                modification_time: updatedVehicle.modification_time ? formatDateTime(updatedVehicle.modification_time) : ''
            });

            const updatedDocuments = updatedVehicle.documents || [];
            setDocuments(updatedDocuments);
            const updatedPreviews = updatedDocuments.map(doc => ({
                name: doc.split('/').pop(),
                src: `${backendURL}/vehicle_uploads/${encodeURIComponent(doc.split('/').pop())}`,
                isExisting: true,
            }));
            setDocumentPreviews(updatedPreviews);

            setSuccessMessage('Vehicle successfully updated!');
            setIsFormModified(false);

            await getAllVehicles();

        } catch (err) {
            console.error('Failed to update vehicle:', err);
            toast.error("Failed to update vehicle.");
        }
    };

    const handleDeleteVehicle = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this vehicle?");
        if (confirmDelete) {
            try {
                await deleteVehicle(lisence_plate);
                setToastMessage("Vehicle deleted successfully!");
                setToastVariant('success');
                setShowToast(true);
                setSuccessMessage('Vehicle deleted successfully');
                await getAllVehicles();
                setTimeout(() => {
                    navigate("/vehicles");
                }, 2000);
            } catch (err) {
                console.error('Failed to delete vehicle:', err);
                setToastMessage(`Failed to delete vehicle: ${err.response?.data?.detail || err.message}`);
                setToastVariant('danger');
                setShowToast(true);
            }
        }
    };

    return (
        <div className="edit_vehicle_container mt-5">
            <img src={companyLogo} alt="Company Logo" className="register_owner_company_logo mb-3"/>
            <h2 className="edit_vehicle_heading">Edit Vehicle</h2>
            {loadingVehicle ? (
                <Spinner animation="border"/>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formPlateNumber" className="mb-3">
                                <Form.Label>License Plate</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter License Plate"
                                    name="lisence_plate"
                                    value={vehicleData.lisence_plate}
                                    onChange={handleInputChange}
                                    required
                                    readOnly
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group controlId="vehicle_formBrand" className="mb-3">
                                <Form.Label>Brand</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Brand"
                                    name="brand"
                                    value={vehicleData.brand}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formModel" className="mb-3">
                                <Form.Label>Model</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Model"
                                    name="model"
                                    value={vehicleData.model}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group controlId="vehicle_formType" className="mb-3">
                                <Form.Label>Vehicle Type</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Vehicle Type"
                                    name="vehicle_type"
                                    value={vehicleData.vehicle_type}
                                    onChange={handleInputChange}
                                    required
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formOwnerDni" className="mb-3">
                                <Form.Label>Owner DNI</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Owner DNI"
                                    name="owner_id"
                                    value={vehicleData.owner_id}
                                    onChange={handleInputChange}
                                    required
                                    readOnly
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group controlId="vehicle_formObservations" className="mb-3">
                                <Form.Label>Observations</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    placeholder="Enter any observations"
                                    name="observations"
                                    value={vehicleData.observations}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_createdBy" className="mb-3">
                                <Form.Label>Created By</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Created by"
                                    name="created_by"
                                    value={vehicleData.created_by}
                                    onChange={handleInputChange}
                                    required
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formModifiedBy">
                                <Form.Label>Modified By:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modified_by"
                                    value={isFormModified ? user.email : vehicleData.modified_by}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formModificationTime">
                                <Form.Label>Modification Time:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modification_time"
                                    value={isFormModified ? formatDateTime(new Date().toISOString()) : vehicleData.modification_time}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <Form.Group controlId="vehicle_formDocuments" className="mb-3">
                                <Form.Label>Documents</Form.Label>
                                <Form.Control
                                    type="file"
                                    multiple
                                    accept="application/pdf, image/*"
                                    ref={fileInputRef}
                                    onChange={handleDocumentChange}
                                    disabled={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <DocumentPreviewRow
                        documentPreviews={documentPreviews}
                        handleRemoveDocument={handleRemoveDocument}
                        handleViewDocument={handleViewDocument}
                        pdfIcon={pdfIcon}
                        readOnly={isUser}
                    />

                    {successMessage && <Alert variant="success">{successMessage}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {(isSuperuser || isAdmin) && (
                        <Button type="submit" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm"/> : 'Update Vehicle'}
                        </Button>
                    )}

                    {isSuperuser && (
                        <Button variant="danger" onClick={handleDeleteVehicle} style={{marginLeft: '10px'}}
                                className="me-2">
                            Delete Vehicle
                        </Button>
                    )}

                    {(isSuperuser || isAdmin) && (
                        <Button variant={"secondary"} onClick={navigateToList}>
                            Vehicle List
                        </Button>
                    )}
                </Form>
            )}
        </div>
    );
};

export default VehicleEditForm;
