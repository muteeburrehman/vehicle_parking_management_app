import React, {useState, useEffect, useRef} from 'react';
import {Form, Button, Alert, Row, Col, Spinner, Toast} from 'react-bootstrap';
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
import {checkActiveSubscription} from "../services/getVehicleService";

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
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

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

    const backendURL = process.env.REACT_APP_BASE_URL; // Update this based on your backend configuration

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
                    toast.error("Fallo al recuperar datos de vehículo!");
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
            toast.error("No se encuentra el Documento!");
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
            setSuccessMessage('Sin Cambios que Actualizar.');
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

            setSuccessMessage('Vehículo actualizado correctamente!');
            setIsFormModified(false);

            await getAllVehicles();

        } catch (err) {
            console.error('Failed to update vehicle:', err);
            toast.error("Fallo al actualizar vehículo.");
        }
    };

    const handleDeleteVehicle = async () => {
        const confirmDelete = window.confirm("Está seguro que quiere borrar este vehículo?");
        if (confirmDelete) {
            try {
                setIsCheckingSubscription(true);
                // Check for active subscriptions before proceeding with deletion
                const hasActiveSubscription = await checkActiveSubscription(lisence_plate);

                if (hasActiveSubscription) {
                    setToastMessage("No se puede borrar el vehículo: Existe un Abono Activo");
                    setToastVariant('warning');
                    setShowToast(true);
                    return;
                }

                // Proceed with deletion if no active subscriptions
                await deleteVehicle(lisence_plate);
                setToastMessage("Vehículo borrado con éxito!");
                setToastVariant('success');
                setShowToast(true);
                setSuccessMessage('Vehículo borrado con éxito!');
                await getAllVehicles();
                setTimeout(() => {
                    navigate("/vehicles");
                }, 2000);
            } catch (err) {
                console.error('Fallo al borrar vehículo:', err);
                setToastMessage(`Fallo al borrar vehículo: ${err.response?.data?.detail || err.message}`);
                setToastVariant('danger');
                setShowToast(true);
            } finally {
                setIsCheckingSubscription(false);
            }
        }
    };

    return (
        <div className="edit_vehicle_container mt-5">
            <img src={companyLogo} alt="Company Logo" className="register_owner_company_logo mb-3"/>
            <h2 className="edit_vehicle_heading">Editar Vehículo</h2>
            {loadingVehicle ? (
                <Spinner animation="border"/>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group controlId="vehicle_formPlateNumber" className="mb-3">
                                <Form.Label>Matrícula</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca Matrícula"
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
                                <Form.Label>Marca</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca Marca"
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
                                <Form.Label>Modelo</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca modelo"
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
                                <Form.Label>Tipo de Vehículo</Form.Label>
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
                                <Form.Label>DNI cliente:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca DNI del cliente"
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
                                <Form.Label>Observaciones</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    placeholder="Introduzca cualquier observación"
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
                                <Form.Label>Creado por</Form.Label>
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
                                <Form.Label>Modificado por:</Form.Label>
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
                                <Form.Label>Fecha de modificación:</Form.Label>
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
                                <Form.Label>Documentos</Form.Label>
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
                        <Button type="submit" className="mb-3"  disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm"/> : 'Actualizar Vehículo'}
                        </Button>
                    )}

                   {isSuperuser && (
                   <Button
                   variant="danger"
                   onClick={handleDeleteVehicle}
                   className="me-2 mb-3"
                   disabled={isCheckingSubscription}
                   >
                   {isCheckingSubscription ? 'Checking Subscriptions...' : 'Borrar Vehículo'}
                   </Button>
)}

{(isSuperuser || isAdmin) && (
  <Button variant="secondary" className="mb-3">
    Lista de Vehículos
  </Button>
)}

                </Form>

            )}

             {showToast && (
            <Toast
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={3000}
                autohide
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 1000
                }}
            >
                <Toast.Header>
                    <strong className="me-auto">Notification</strong>
                </Toast.Header>
                <Toast.Body className={`bg-${toastVariant} text-white`}>
                    {toastMessage}
                </Toast.Body>
            </Toast>
        )}

        </div>
    );
};

export default VehicleEditForm;
