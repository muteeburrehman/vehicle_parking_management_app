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
        modification_time: '',
        reduced_mobility_expiration: '',
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

    const backendURL = process.env.REACT_APP_BASE_URL;

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
                    console.error('Error al recuperar datos del propietario:', err);
                    toast.error("No se pudo obtener los datos del propietario!");
                }
            }
        };

        fetchOwnerData();
    }, [dni, getOwnerByDNI]);

    const fetchVehicles = async (ownerId) => {
    setLoadingVehicles(true);
    try {
        const vehiclesData = await fetchVehiclesByOwnerId(ownerId);
        console.log("Vehicles for this owner:", vehiclesData); // ADD THIS LINE
        setVehicles(vehiclesData);
    } catch (error) {
        console.error('Error al cargar los vehículos:', error);
        toast.error("No se pudo obtener los datos de los vehículos!");
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
                reduced_mobility_expiration: selectedOwner.reduced_mobility_expiration
                    ? selectedOwner.reduced_mobility_expiration.split('T')[0]
                    : '',
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
            setDocumentPreviews(initialDocumentPreviews);
        }
    }, [loadingOwner, selectedOwner, backendURL]);

    // Spanish IBAN validation
    const validateSpanishIBAN = (iban) => {
        if (!iban) return true; // Allow empty IBAN
        
        // Remove spaces and convert to uppercase
        const cleanIban = iban.replace(/\s/g, '').toUpperCase();
        
        // Spanish IBAN format: ES + 2 check digits + 20 digits
        const spanishIbanRegex = /^ES\d{22}$/;
        
        if (!spanishIbanRegex.test(cleanIban)) {
            return false;
        }
        
        // IBAN checksum validation (mod-97 algorithm)
        const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
        const numericString = rearranged.replace(/[A-Z]/g, (char) => 
            (char.charCodeAt(0) - 55).toString()
        );
        
        // Calculate mod 97 for large numbers
        let remainder = 0;
        for (let i = 0; i < numericString.length; i++) {
            remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
        }
        
        return remainder === 1;
    };

    // Validate the form before submission
    const validateForm = async () => {
        let errors = {};

        // Validate DNI
        if (!ownerData.dni) {
            errors.dni = 'Debe introducir el DNI';
        }

        // Validate first name and last name
        if (!ownerData.first_name) {
            errors.first_name = 'Debe de introducir un Nombre';
        }
        if (!ownerData.last_name) {
            errors.last_name = 'Debe de introducir los Apellidos';
        }

        // Validate email format if email is provided
        if (ownerData.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ownerData.email)) {
            errors.email = 'Formato de E-mail inválido';
        }

        // Validate Spanish IBAN format - only if it's provided
        if (ownerData.bank_account_number && !validateSpanishIBAN(ownerData.bank_account_number)) {
            errors.bank_account_number = 'Formato de IBAN español inválido (debe comenzar con ES seguido de 22 dígitos)';
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
            console.error("Documento inexistente en la posición:", index);
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
            setSuccessMessage('No hay cambios para actualizar.');
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

            setSuccessMessage('Cliente actualizado correctamente!');
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
        const confirmDelete = window.confirm("Está seguro que quiere borrar este cliente?");
        if (confirmDelete) {
            try {
                await deleteOwner(dni);
                setToastMessage("Cliente borrado correctamente!");
                setToastVariant('Éxito');
                setShowToast(true);
                setSuccessMessage('Cliente borrado con éxito');
                await getAllOwners();
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } catch (err) {
                console.error('Fallo al borrar el cliente:', err);
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
            <h2 className="edit_owner_heading">Ficha de Cliente</h2>
            {loadingOwner ? (
                <Spinner animation="border"/>
            ) : (
                <Form onSubmit={handleSubmit}>
                    {/* Row 1: DNI, First Name, Last Name, Email */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group controlId="owner_formDni">
                                <Form.Label>DNI</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca DNI"
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
                        <Col md={3}>
                            <Form.Group controlId="owner_formFirstName">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca Nombre"
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
                        <Col md={3}>
                            <Form.Group controlId="owner_formLastName">
                                <Form.Label>Apellidos</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Introduzca Apellidos"
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
                        <Col md={3}>
                            <Form.Group controlId="owner_formEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Email"
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

                    {/* Row 2: IBAN, SAGE Client Number, Phone, Reduced Mobility Expiration */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Form.Group controlId="owner_formBankAccount">
                                <Form.Label>IBAN (Opcional)</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                    name="bank_account_number"
                                    value={ownerData.bank_account_number}
                                    onChange={handleInputChange}
                                    isInvalid={!!validationErrors.bank_account_number}
                                    readOnly={isUser}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {validationErrors.bank_account_number}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="owner_formSageClientNumber">
                                <Form.Label>Nº Cliente SAGE</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="SAGE cliente"
                                    name="sage_client_number"
                                    value={ownerData.sage_client_number}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="owner_formPhoneNumber">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Teléfono"
                                    name="phone_number"
                                    value={ownerData.phone_number}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId="reduced_mobility_expiration">
                                <Form.Label>Vencimiento Movilidad Reducida</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="reduced_mobility_expiration"
                                    value={ownerData.reduced_mobility_expiration}
                                    onChange={handleInputChange}
                                    readOnly={isUser}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Row 3: Observations */}
                    <Row className="mb-3">
                        <Form.Group controlId="owner_formObservations">
                            <Form.Label>Observaciones</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Observaciones..."
                                name="observations"
                                value={ownerData.observations}
                                onChange={handleInputChange}
                                readOnly={isUser}
                            />
                        </Form.Group>
                    </Row>

                    {/* Row 4: Created by info */}
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formCreatedBy">
                                <Form.Label>Creado por:</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Creado por"
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

                    {/* Row 5: Modified by info */}
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="owner_formModifiedBy">
                                <Form.Label>Modificado por:</Form.Label>
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
                                <Form.Label>Última modificación:</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="modification_time"
                                    value={isFormModified ? formatDateTime(new Date().toISOString()) : ownerData.modification_time}
                                    readOnly
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Documents section */}
                    <Form.Group controlId="owner_formDocuments">
                        <Form.Label>Adjuntar Documentos (Sólo .PDF)</Form.Label>
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
                                className="mb-3"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm"/> Updating...
                                    </>
                                ) : (
                                    "Actualizar Ficha Cliente"
                                )}
                            </Button>
                        )
                    }

                    {isSuperuser && (
                        <Button variant="danger" className="mb-3" onClick={handleDeleteOwner} style={{marginLeft: '10px'}}>
                            Borrar Cliente
                        </Button>
                    )}

                </Form>
            )}

            <h3 className="mt-5">Vehículos Asociados</h3>
            {loadingVehicles ? (
                <Spinner animation="border"/>
            ) : (
                <>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por Matrícula o DNI"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-3"
                    />
                    <Table striped bordered hover className="mt-3">
                        <thead>
                        <tr>
                            <th>Matrícula</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Tipo</th>
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
                                <td colSpan="4" className="text-center">No se encontraron vehículos para este propietario.</td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
                </>
            )}
            <Button variant="secondary" onClick={navigateToVehicleRegistration} className="mt-3">
                +Registrar Nuevo Vehículo
            </Button>

        </div>
    );
};

export default OwnerEditForm;
