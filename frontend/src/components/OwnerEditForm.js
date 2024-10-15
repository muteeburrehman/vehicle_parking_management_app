import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Form, Button, Alert, Row, Col, Spinner, Table} from 'react-bootstrap';
import {useOwner} from '../hooks/useOwner';
import {useNavigate, useParams} from 'react-router-dom';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from '../assets/icons/pdf_icon.svg';
import companyLogo from '../assets/icons/Logo.png';
import toast from "bootstrap/js/src/toast";
import useAuth from "../hooks/useAuth";
import {deleteOwner} from "../services/deleteServices";
import {fetchVehiclesByOwnerId} from "../services/getVehicleService"; // Import the correct service
import {useContext} from "react";
import GetOwnersContext from "../context/GetOwnersContext";

const OwnerEditForm = () => {
    const {dni} = useParams();
    const {user} = useAuth();
    const {getOwnerByDNI, loading: loadingOwner, selectedOwner, getAllOwners} = useContext(GetOwnersContext);
    const {updateOwnerById, loading, error} = useOwner();
    const [validationErrors, setValidationErrors] = useState({});
    const [, setShowToast] = useState(false);
    const [, setToastMessage] = useState('');
    const [, setToastVariant] = useState('success');

    const [ownerData, setOwnerData] = useState({
        dni: '',
        first_name: '',
        last_name: '',
        email: '',
        bank_account_number: '',
        sage_client_number: '',
        phone_number: '',
        observations: '',
        created_by: '',
        modified_by: '',
        modification_time: ''
    });
    const [documents, setDocuments] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [isFormModified, setIsFormModified] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const isUser = user.role === 'user';
    const isAdmin = user.role === 'admin';
    const isSuperuser = user.role === 'superuser';

    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const backendURL = 'http://localhost:8000';

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
        const fetchOwnerData = async () => {
            if (dni) {
                try {
                    await getOwnerByDNI(dni);
                    await fetchVehicles(dni);
                } catch (err) {
                    console.error('Error fetching owner data:', err);
                    toast.error("Failed to fetch owner data!");
                }
            }
        };

        fetchOwnerData();
    }, [dni, getOwnerByDNI]);

    const fetchVehicles = async (ownerId) => {
        setLoadingVehicles(true);
        try {
            const vehiclesData = await fetchVehiclesByOwnerId(ownerId);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error("Failed to fetch vehicles!");
        } finally {
            setLoadingVehicles(false);
        }
    };

    useEffect(() => {
        if (!loadingOwner && selectedOwner) {
            setOwnerData({
                dni: selectedOwner.dni,
                first_name: selectedOwner.first_name,
                last_name: selectedOwner.last_name,
                email: selectedOwner.email,
                bank_account_number: selectedOwner.bank_account_number,
                sage_client_number: selectedOwner.sage_client_number,
                phone_number: selectedOwner.phone_number,
                observations: selectedOwner.observations,
                created_by: selectedOwner.created_by,
                modified_by: selectedOwner.modified_by || '',
                modification_time: selectedOwner.modification_time ? formatDateTime(selectedOwner.modification_time) : ''
            });

            const existingDocuments = selectedOwner.documents || [];
            setDocuments(existingDocuments);

            const initialDocumentPreviews = existingDocuments.map((doc) => ({
                name: doc.split('/').pop(),
                src: `${backendURL}/uploads/${encodeURIComponent(doc.split('/').pop())}`,
                isExisting: true,
            }));

            setDocumentPreviews(initialDocumentPreviews);
        }
    }, [loadingOwner, selectedOwner, backendURL]);

    // Validate the form before submission

    const validateIBAN = (iban) => {
        // Basic IBAN validation regex
        const ibanRegex = /^([A-Z]{2}[ -]?[0-9]{2})(?=(?:[ -]?[A-Z0-9]){9,30}$)((?:[ -]?[A-Z0-9]{3,5}){2,7})([ -]?[A-Z0-9]{1,3})?$/;
        return ibanRegex.test(iban.replace(/\s/g, ''));
    };


    // Validate the form before submission
    const validateForm = async () => {
        let errors = {};

        // Validate DNI
        if (!ownerData.dni) {
            errors.dni = 'DNI is required';
        }

        // Validate first name and last name
        if (!ownerData.first_name) {
            errors.first_name = 'First name is required';
        }
        if (!ownerData.last_name) {
            errors.last_name = 'Last name is required';
        }

        // Validate email format if email is provided
        if (ownerData.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ownerData.email)) {
            errors.email = 'Invalid email format';
        }

        // Validate bank account number (IBAN)
        if (!ownerData.bank_account_number) {
            errors.bank_account_number = 'Bank account number is required';
        } else if (!validateIBAN(ownerData.bank_account_number)) {
            errors.bank_account_number = 'Invalid IBAN format';
        }

        setValidationErrors(errors);

        // Return true if there are no errors
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setOwnerData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setIsFormModified(true);
    };

    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files);

        const newFiles = files.filter(file => !documents.some(doc => {
            if (typeof doc === 'string') return false;
            return doc.name === file.name && doc.size === file.size;
        }));

        const newPreviews = newFiles.map(file => ({
            name: file.name,
            src: URL.createObjectURL(file),
            isExisting: false
        }));

        setDocumentPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
        setDocuments(prevDocuments => [...prevDocuments, ...newFiles]);
        setIsFormModified(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        return () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        let hasChanges = false;
        Object.keys(ownerData).forEach(key => {
            if (key === 'modification_time') return;

            if (ownerData[key] !== null && ownerData[key] !== undefined && ownerData[key] !== selectedOwner[key]) {
                formData.append(key, ownerData[key]);
                hasChanges = true;
            }
        });

        const existingDocuments = selectedOwner.documents || [];
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
            formData.append('modification_time', new Date().toISOString());
            hasChanges = true;
        }

        if (!hasChanges) {
            setSuccessMessage('No changes to update.');
            return;
        }

        try {
            console.log('Submitting form data...');
            const updatedOwner = await updateOwnerById(dni, formData);
            console.log('Update successful:', updatedOwner);

            setOwnerData({
                ...updatedOwner,
                modification_time: formatDateTime(updatedOwner.modification_time)
            });

            const updatedDocuments = updatedOwner.documents || [];
            setDocuments(updatedDocuments);
            const updatedPreviews = updatedDocuments.map(doc => ({
                name: doc.split('/').pop(),
                src: `${backendURL}/uploads/${encodeURIComponent(doc.split('/').pop())}`,
                isExisting: true,
            }));
            setDocumentPreviews(updatedPreviews);

            setSuccessMessage('Owner successfully updated!');
            setIsFormModified(false);

            await getAllOwners();
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (err) {
            console.error('Failed to update owner:', err);
            if (err.response) {
                console.error('Response data:', err.response.data);
                console.error('Response status:', err.response.status);
                console.error('Response headers:', err.response.headers);
                toast.error(`Failed to update owner: ${err.response.data.detail || 'Unknown error'}`);
            } else if (err.request) {
                console.error('No response received:', err.request);
                toast.error("Failed to update owner: No response from server");
            } else {
                console.error('Error setting up request:', err.message);
                toast.error(`Failed to update owner: ${err.message}`);
            }
        }
    };

    const navigateToVehicleRegistration = () => {
        navigate(`/owner/${dni}/vehicle-registration`);
    };
    const handleDeleteOwner = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this owner?");
        if (confirmDelete) {
            try {
                await deleteOwner(dni);
                setToastMessage("Owner deleted successfully!");
                setToastVariant('success');
                setShowToast(true);
                setSuccessMessage('Owner deleted successfully');
                await getAllOwners();
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } catch (err) {
                console.error('Failed to delete owner:', err);
                setToastMessage(`Failed to delete owner: ${err.response?.data?.detail || err.message}`);
                setToastVariant('danger');
                setShowToast(true);
            }
        }
    };

    const handleRowClick = (licensePlate) => {
        navigate(`/vehicle/edit/${licensePlate}`);
    };

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle =>
            vehicle.lisence_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.owner_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [vehicles, searchTerm]);

    return (
        <div className="edit_owner_container mt-5">
            <img src={companyLogo} alt="Company Logo" className="register_owner_company_logo mb-3"/>
            <h2 className="edit_owner_heading">Edit Owner</h2>
            {loadingOwner ? (
                <Spinner animation="border"/>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formDni">
                                <Form.Label>DNI</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter DNI"
                                    name="dni"
                                    value={ownerData.dni}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.dni}
                                    required
                                    readOnly
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.dni}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="owner_formFirstName">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter First Name"
                                    name="first_name"
                                    value={ownerData.first_name}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.first_name}
                                    required
                                    readOnly={isUser}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.first_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formLastName">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Last Name"
                                    name="last_name"
                                    value={ownerData.last_name}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.last_name}
                                    required
                                    readOnly={isUser}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.last_name}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="owner_formEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter Email"
                                    name="email"
                                    value={ownerData.email}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.email}
                                    readOnly={isUser}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group controlId="owner_formBankAccount">
                                <Form.Label>Bank Account Number (IBAN)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter IBAN"
                                    name="bank_account_number"
                                    value={ownerData.bank_account_number}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.bank_account_number}
                                    required
                                    readOnly={isUser}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.bank_account_number}
                                </Form.Control.Feedback>
                            </Form.Group>


                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="owner_formPhoneNumber">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Phone Number"
                                    name="phone_number"
                                    value={ownerData.phone_number}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId="owner_formSageClientNumber">
                                <Form.Label>Sage Client Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Sage Client Number"
                                    name="sage_client_number"
                                    value={ownerData.sage_client_number}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Form.Group controlId="owner_formObservations">
                            <Form.Label>Observations</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter any observations"
                                name="observations"
                                value={ownerData.observations}
                                onChange={handleInputChange}
                                readOnly={isUser}
                            />
                        </Form.Group>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formCreatedBy">
                                <Form.Label>Created By:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Created by"
                                    name="created_by"
                                    value={ownerData.created_by}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.created_by}
                                    required
                                    readOnly
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.created_by}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formModifiedBy">
                                <Form.Label>Modified By:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modified_by"
                                    value={isFormModified ? user.email : ownerData.modified_by}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="owner_formModificationTime">
                                <Form.Label>Modification Time:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modification_time"
                                    value={isFormModified ? formatDateTime(new Date().toISOString()) : ownerData.modification_time}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group controlId="owner_formDocuments">
                        <Form.Label>Upload Documents (PDF only)</Form.Label>
                        <Form.Control
                            type="file"
                            multiple
                            accept=".pdf"
                            onChange={handleDocumentChange}
                            ref={fileInputRef}
                            readOnly={isUser}
                        />
                        <DocumentPreviewRow
                            documentPreviews={documentPreviews}
                            handleViewDocument={handleViewDocument}
                            handleRemoveDocument={handleRemoveDocument}
                            pdfIcon={pdfIcon}
                            readOnly={isUser}
                        />
                    </Form.Group>

                    {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}
                    {error && <Alert variant="danger" className="mt-3">{error.message}</Alert>}

                    {
                        (isSuperuser || isAdmin) && (
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm"/> Updating...
                                    </>
                                ) : (
                                    "Update Owner"
                                )}
                            </Button>
                        )
                    }

                    {isSuperuser && (
                        <Button variant="danger" onClick={handleDeleteOwner} style={{marginLeft: '10px'}}>
                            Delete Owner
                        </Button>
                    )}

                </Form>
            )}

            <h3 className="mt-5">Linked Vehicles</h3>
            {loadingVehicles ? (
                <Spinner animation="border"/>
            ) : (
                <>
                    <Form.Control
                        type="text"
                        placeholder="Search by license plate or owner ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3"
                    />
                    <Table striped bordered hover className="mt-3">
                        <thead>
                        <tr>
                            <th>License Plate</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Type</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map((vehicle) => (
                                <tr
                                    key={vehicle.lisence_plate}
                                    onClick={() => handleRowClick(vehicle.lisence_plate)}
                                    style={{cursor: 'pointer'}}
                                >
                                    <td>{vehicle.lisence_plate}</td>
                                    <td>{vehicle.brand}</td>
                                    <td>{vehicle.model}</td>
                                    <td>{vehicle.vehicle_type}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">No vehicles found for this owner.</td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                </>
            )}
            <Button variant="secondary" onClick={navigateToVehicleRegistration} className="mt-3">
                Register Vehicle
            </Button>

        </div>
    );
};

export default OwnerEditForm;
