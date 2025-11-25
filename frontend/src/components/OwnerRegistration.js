import React, {useState, useRef} from "react";
import {Form, Button, Alert, Row, Col, Spinner, Modal} from "react-bootstrap";
import {useOwner} from "../hooks/useOwner"; // Import a function to check if DNI exists
import DocumentPreviewRow from "./DocumentPreviewRow";
import pdfIcon from '../assets/icons/pdf_icon.svg';
import companyLogo from '../assets/icons/Logo.png';
import {useNavigate} from "react-router-dom";
import {checkBankAccountExists, checkDniExists} from "../services/getOwnerService"
import useAuth from "../hooks/useAuth"; // Custom hook to get authenticated user


const OwnerRegistration = () => {
    const {user} = useAuth();
    const {addOwner, loading, error} = useOwner();
    const [ownerData, setOwnerData] = useState({
        dni: '',
        first_name: '',
        last_name: '',
        email: '',
        bank_account_number: '',
        reduced_mobility_expiration: '',
        phone_number: '',
        observations: '',
    });
    const [documents, setDocuments] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const fileInputRef = useRef(null);

    // Handle changes in input fields
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setOwnerData({
            ...ownerData,
            [name]: value,
        });
    };

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
            errors.dni = 'el DNI es obligatorio';
        } else {
            try {
                const dniExists = await checkDniExists(ownerData.dni);
                if (dniExists) {
                    errors.dni = 'Este DNI ya está registrado';
                }
            } catch (error) {
                console.error('Error comprobando el DNI:', error);
                errors.dni = 'Error al comprobar el DNI. Por favor, inténtelo de nuevo.';
            }
        }

        // Validate first name and last name
        if (!ownerData.first_name) {
            errors.first_name = 'El nombre es obligatorio';
        }
        if (!ownerData.last_name) {
            errors.last_name = 'Los apellidos son obligatorios';
        }

        // Validate email format if email is provided
        if (ownerData.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(ownerData.email)) {
            errors.email = 'Formato de E-mail no válido';
        }

        // Validate Spanish IBAN format - only if it's provided
        if (ownerData.bank_account_number && !validateSpanishIBAN(ownerData.bank_account_number)) {
            errors.bank_account_number = 'Formato de IBAN español inválido (debe comenzar con ES seguido de 22 dígitos)';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle document (file) input changes
    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.type === 'application/pdf');

        const newPreviews = validFiles.map(file => ({
            name: file.name,
            src: URL.createObjectURL(file),
        }));

        setDocumentPreviews(prev => [...prev, ...newPreviews]);
        setDocuments(prev => [...prev, ...validFiles]);

        // Reset the file input after adding files
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    // View a document in a new tab
    const handleViewDocument = (index) => {
        const document = documents[index];
        if (document) {
            const fileURL = URL.createObjectURL(document);
            window.open(fileURL);
        }
    };

    // Remove a selected document
    const handleRemoveDocument = (index) => {
        setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const isValid = await validateForm();
        if (!isValid) {
            return;
        }

        try {
            // Only check bank account if it's provided
            if (ownerData.bank_account_number) {
                const bankAccountExists = await checkBankAccountExists(ownerData.bank_account_number);
                if (bankAccountExists) {
                    setShowConfirmModal(true);
                    return;
                }
            }
            await submitOwnerData();
        } catch (error) {
            console.error('Error checking bank account:', error);
            setValidationErrors(prev => ({
                ...prev,
                bank_account_number: 'Error comprobando IBAN. Inténtelo de nuevo.'
            }));
        }
    };

    const submitOwnerData = async () => {
        try {
            await addOwner({
                ...ownerData,
                documents,
                registration_date: new Date().toLocaleString([], {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }),
                created_by: user.email,
                modified_by: ''
            });

            setSuccessMessage('Cliente registrado correctamente!');
            setOwnerData({
                dni: '',
                first_name: '',
                last_name: '',
                email: '',
                bank_account_number: '',
                sage_client_number: '',
                phone_number: '',
                observations: '',
                reduced_mobility_expiration: ''
            });
            setDocumentPreviews([]);
            setDocuments([]);

            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (error) {
            console.error('Failed to register owner:', error);
            setValidationErrors(prev => ({
                ...prev,
                submit: typeof error === 'string' ? error : 'Ocurrió un error inesperado'
            }));
        }
    };

    const handleConfirmAddition = () => {
        setShowConfirmModal(false);
        submitOwnerData();
    };

    return (
        <div className="register_owner_container mt-5">
            <img src={companyLogo} alt="Company Logo" style={{width: '100px', height: 'auto'}}
                 className="register_owner_company_logo mb-3"/>
            <h2 className="register_owner_heading">Registro de Nuevo Cliente</h2>
            <Form onSubmit={handleSubmit}>
                {/* Row 1: DNI, First Name, Last Name, Email */}
                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group controlId="owner_formDni">
                            <Form.Label>DNI</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="DNI"
                                name="dni"
                                value={ownerData.dni}
                                onChange={handleInputChange}
                                isInvalid={!!validationErrors.dni}
                                required
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
                                placeholder="Nombre"
                                name="first_name"
                                value={ownerData.first_name}
                                onChange={handleInputChange}
                                isInvalid={!!validationErrors.first_name}
                                required
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
                                placeholder="Apellidos"
                                name="last_name"
                                value={ownerData.last_name}
                                onChange={handleInputChange}
                                isInvalid={!!validationErrors.last_name}
                                required
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
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.bank_account_number}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="owner_formSageClientNumber">
                            <Form.Label>Nº Cliente de SAGE</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nº Cliente SAGE"
                                name="sage_client_number"
                                value={ownerData.sage_client_number}
                                onChange={handleInputChange}
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
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formReducedMobilityExpiration">
                            <Form.Label>Vencimiento Movilidad Reducida</Form.Label>
                            <Form.Control
                                type="date"
                                name="reduced_mobility_expiration"
                                value={ownerData.reduced_mobility_expiration}
                                onChange={handleInputChange}
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
                            placeholder="Observaciones"
                            name="observations"
                            value={ownerData.observations}
                            onChange={handleInputChange}
                        />
                    </Form.Group>
                </Row>

                {/* Document Upload Section */}
                <Row className="mb-3">
                    <Form.Group controlId="formDocuments">
                        <Form.Label>Adjuntar Documentos (Sólo PDF)</Form.Label>
                        <Form.Control
                            type="file"
                            accept="application/pdf"
                            onChange={handleDocumentChange}
                            multiple
                            ref={fileInputRef}
                        />
                    </Form.Group>
                </Row>

                {/* Document Preview */}
                {documentPreviews.length > 0 && (
                    <Row className="mb-3">
                        <Col>
                            <h5>Documentos Añadidos</h5>
                            <DocumentPreviewRow
                                documentPreviews={documentPreviews}
                                handleViewDocument={handleViewDocument}
                                handleRemoveDocument={handleRemoveDocument}
                                pdfIcon={pdfIcon}
                            />
                        </Col>
                    </Row>
                )}

                {error && <Alert variant="danger">{error}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                <Button variant="primary" type="submit" className="mb-3" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm"/> : 'Registrar Cliente'}
                </Button>
            </Form>
            
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Registro</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Este IBAN ya existe en otro abonado. Esta seguro que quiere añadirlo?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" className="mb-3" onClick={() => setShowConfirmModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" className= "mb-3"  onClick={handleConfirmAddition}>
                        Sí, registrarlo igualmente
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OwnerRegistration;
