import React, {useState, useRef,} from "react";
import {Form, Button, Alert, Row, Col, Spinner} from "react-bootstrap";
import {useVehicle} from "../hooks/useVehicle";
import DocumentPreviewRow from "./DocumentPreviewRow"; // Reuse the DocumentPreviewRow
import pdfIcon from '../assets/icons/pdf_icon.svg';
import companyLogo from '../assets/icons/Logo.png';
import {useNavigate, useParams} from "react-router-dom";
import {checkLicensePlateExists} from "../services/getVehicleService";
import useAuth from "../hooks/useAuth";

const VehicleRegistration = () => {
    const {user} = useAuth();
    const {dni} = useParams(); // Get DNI from the URL
    const {addVehicle, loading, error} = useVehicle();
    const [vehicleData, setVehicleData] = useState({
        lisence_plate: '',
        brand: '',
        model: '',
        vehicle_type: '',
        owner_id: dni || '', // Set the owner_id to the DNI from URL
        observations: '',
    });
    const [documents, setDocuments] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [licensePlateError, setLicensePlateError] = useState('');

    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Handle changes in input fields
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setVehicleData({
            ...vehicleData,
            [name]: value,
        });
    };

    // Handle document (file) input changes
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
    const validateField = async () => {
        const licensePlateExists = await checkLicensePlateExists(vehicleData.lisence_plate);
        if (licensePlateExists) {
            setLicensePlateError('This license plate is already registered. Please enter a different license plate.');
            return false; // Validation failed
        }
        // Clear error if valid
        setLicensePlateError('');
        return true; // Validation succeeded
    };

    // Remove a selected document
    const handleRemoveDocument = (index) => {
        setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    // Submit the form data to register a vehicle
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Vehicle Data before submission:', vehicleData); // Log to verify owner_id
        // Step 1: Validate the fields before submitting
        const isValid = await validateField();
        if (!isValid) {
            return; // Stop the form submission if validation fails
        }
        try {
            await addVehicle({
                ...vehicleData,
                documents, // Attach the document files
                registration_date: new Date().toLocaleString([], {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                }),
                created_by: user.email,
                modified_by: ''

            }, dni);

            setSuccessMessage('Vehicle successfully registered!');

            // Reset form and document previews after successful registration
            setVehicleData({
                lisence_plate: '',
                brand: '',
                model: '',
                vehicle_type: '',
                owner_id: dni || '', // Retain the owner_id for future submissions if needed
                observations: '',
            });
            setDocumentPreviews([]);
            setDocuments([]);

            // Redirect after showing the success message
            setTimeout(() => {
                navigate("/vehicles");
            }, 2000);
        } catch (error) {
            console.error('Failed to register vehicle:', error);
        }
    };

    return (
        <div className="register_vehicle_container mt-5">
            <img src={companyLogo} alt="Company Logo" className="register_owner_company_logo mb-3"/>
            <h2 className="register_vehicle_heading">Vehicle Registration</h2>
            <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formLicensePlate">
                            <Form.Label>License Plate</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter License Plate"
                                name="lisence_plate"
                                value={vehicleData.lisence_plate}
                                onChange={handleInputChange}
                                required
                            />
                            {licensePlateError && <Form.Text className="text-danger">{licensePlateError}</Form.Text>}

                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formBrand">
                            <Form.Label>Brand</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Brand"
                                name="brand"
                                value={vehicleData.brand}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formModel">
                            <Form.Label>Model</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Model"
                                name="model"
                                value={vehicleData.model}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formType">
                            <Form.Label>Vehicle Type</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Vehicle Type"
                                name="vehicle_type"
                                value={vehicleData.vehicle_type}
                                onChange={handleInputChange}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formOwnerId">
                            <Form.Label>Owner ID (DNI)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Owner ID"
                                name="owner_id"
                                value={vehicleData.owner_id} // This will now reflect the DNI from URL
                                onChange={handleInputChange}
                                required
                                readOnly // Optional: make it read-only if you don't want the user to change it
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="vehicle_formObservations">
                            <Form.Label>Observations</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Any observations..."
                                name="observations"
                                value={vehicleData.observations}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col md={12}>
                        <Form.Group controlId="vehicle_formDocuments">
                            <Form.Label>Documents (PDF)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="application/pdf"
                                onChange={handleDocumentChange}
                                multiple
                                ref={fileInputRef}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={12}>
                        <h5>Document Previews:</h5>
                        <DocumentPreviewRow
                            documentPreviews={documentPreviews}
                            handleViewDocument={handleViewDocument}
                            handleRemoveDocument={handleRemoveDocument}
                            pdfIcon={pdfIcon}
                        />
                    </Col>
                </Row>
                {successMessage && <Alert variant="success">{successMessage}</Alert>}
                {error && <Alert variant="danger">Error: {error.message}</Alert>}
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" role="status"
                                        aria-hidden="true"/> : 'Register Vehicle'}
                </Button>
            </Form>
        </div>
    );
};

export default VehicleRegistration;
