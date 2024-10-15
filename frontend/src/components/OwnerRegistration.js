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
    // Basic IBAN validation regex
    const validateIBAN = (iban) => {
        // eslint-disable-next-line no-useless-escape

        const ibanRegex = /^([A-Z]{2}[ -]?[0-9]{2})(?=(?:[ -]?[A-Z0-9]){9,30}$)((?:[ -]?[A-Z0-9]{3,5}){2,7})([ -]?[A-Z0-9]{1,3})?$/;
        return ibanRegex.test(iban.replace(/\s/g, ''));
    };


    // Validate the form before submission
    const validateForm = async () => {
        let errors = {};

        // Validate DNI
        if (!ownerData.dni) {
            errors.dni = 'DNI is required';
        } else {
            try {
                const dniExists = await checkDniExists(ownerData.dni);
                if (dniExists) {
                    errors.dni = 'This DNI is already registered';
                }
            } catch (error) {
                console.error('Error checking DNI:', error);
                errors.dni = 'Error checking DNI. Please try again.';
            }
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

        // Validate bank account number
        if (!ownerData.bank_account_number) {
            errors.bank_account_number = 'Bank account number is required';
        } else if (!validateIBAN(ownerData.bank_account_number)) {
            errors.bank_account_number = 'Invalid IBAN format';
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
            const bankAccountExists = await checkBankAccountExists(ownerData.bank_account_number);
            if (bankAccountExists) {
                setShowConfirmModal(true);
            } else {
                await submitOwnerData();
            }
        } catch (error) {
            console.error('Error checking bank account:', error);
            setValidationErrors(prev => ({
                ...prev,
                bank_account_number: 'Error checking bank account. Please try again.'
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

            setSuccessMessage('Owner successfully registered!');
            setOwnerData({
                dni: '',
                first_name: '',
                last_name: '',
                email: '',
                bank_account_number: '',
                sage_client_number: '',
                phone_number: '',
                observations: '',
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
                submit: typeof error === 'string' ? error : 'An unexpected error occurred'
            }));
        }
    };

    const handleConfirmAddition = () => {
        setShowConfirmModal(false);
        submitOwnerData();
    };

    return (
        <div className="register_owner_container mt-5">
            <img src={companyLogo} alt="Company Logo" className="register_owner_company_logo mb-3"/>
            <h2 className="register_owner_heading">Owner Registration</h2>
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
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.bank_account_number}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="owner_formSageClientNumber">
                            <Form.Label>Sage Client Number</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Sage Client Number"
                                name="sage_client_number"
                                value={ownerData.sage_client_number}
                                onChange={handleInputChange}
                            />
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
                        />
                    </Form.Group>
                </Row>

                {/* Document Upload Section */}
                <Row className="mb-3">
                    <Form.Group controlId="formDocuments">
                        <Form.Label>Upload Documents (PDF only)</Form.Label>
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
                            <h5>Document Previews</h5>

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
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm"/> : 'Register Owner'}
                </Button>

            </Form>
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Registration</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    This bank account number already exists. Do you still want to add it?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleConfirmAddition}>
                        Yes, Add Anyway
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OwnerRegistration;
