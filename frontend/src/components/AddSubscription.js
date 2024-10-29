import React, {useState, useEffect, useRef} from 'react';
import {useSubscription} from '../hooks/useSubscription';
import {Form, Button, Container, Row, Col, Alert} from 'react-bootstrap';
import {useNavigate} from "react-router-dom";
import {fetchVehiclesByOwnerId} from '../services/getVehicleService'; // Adjust the import
import {getSubscriptions} from "../services/subscriptionService";
import {checkDniExists, fetchOwnerByDNI} from "../services/getOwnerService";
import useAuth from "../hooks/useAuth";
import DocumentPreviewRow from "./DocumentPreviewRow";
import pdfIcon from "../assets/icons/pdf_icon.svg";
import {parkingLotService} from "../services/parkingLotService";

const AddSubscription = () => {
    const {user} = useAuth();
    const {addSubscription, loading, subscriptionTypes} = useSubscription();
    const [ownerId, setOwnerId] = useState('');
    const [subscriptionTypeId, setSubscriptionTypeId] = useState('');
    const [accessCard, setAccessCard] = useState('');
    const [lisencePlate1, setLisencePlate1] = useState('');
    const [lisencePlate2, setLisencePlate2] = useState('');
    const [lisencePlate3, setLisencePlate3] = useState('');
    const [tiqueXPark, setTiqueXPark] = useState('');
    const [remoteControlNumber, setRemoteControlNumber] = useState('');
    const [observations, setObservations] = useState('');
    const [parkingSpot, setParkingSpot] = useState('');
    const [documents, setDocuments] = useState([]);
    const [availablePlates, setAvailablePlates] = useState([]);
    const [effectiveDate, setEffectiveDate] = useState(''); // New state for effective date

    const [parkingLots, setParkingLots] = useState([]);
    const [selectedParkingLot, setSelectedParkingLot] = useState('');
    const [filteredSubscriptionTypes, setFilteredSubscriptionTypes] = useState([]);


    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [subscriptionError, setSubscriptionError] = useState(null); // For validation error
    const [ownerError, setOwnerError] = useState(''); // Owner validation error
    const [ownerInfo, setOwnerInfo] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch vehicles when ownerId changes
    useEffect(() => {
        const getVehicles = async () => {
            if (ownerId) {
                try {
                    const fetchedVehicles = await fetchVehiclesByOwnerId(ownerId);
                    setAvailablePlates(fetchedVehicles.map(v => v.lisence_plate));
                } catch (error) {
                    console.error("Error fetching vehicles:", error);
                }
            } else {
                setAvailablePlates([]);
            }
        };

        getVehicles();
    }, [ownerId]);

      // Filter subscription types when parking lot changes
    useEffect(() => {
        if (selectedParkingLot && subscriptionTypes) {
            const filtered = subscriptionTypes.filter(type =>
                type.name.toLowerCase().includes(selectedParkingLot.toLowerCase())
            );
            setFilteredSubscriptionTypes(filtered);
            // Clear subscription type selection when parking lot changes
            setSubscriptionTypeId('');
        }
    }, [selectedParkingLot, subscriptionTypes]);

    useEffect(() => {
        const fetchParkingLots = async () => {
            try {
                const response = await parkingLotService.getAllParkingLots();
                setParkingLots(response);
            } catch (error) {
                console.error("Error fetching parking lots:", error);
            }
        };
        fetchParkingLots();
    }, []);


    const fetchOwnerInfo = async (dni) => {
        try {
            const ownerData = await fetchOwnerByDNI(dni);
            setOwnerInfo(ownerData);
            setOwnerError('');
        } catch (error) {
            console.error("Error fetching owner info:", error);
            setOwnerError("Error fetching owner information.");
            setOwnerInfo(null);
        }
    };

    const handleOwnerIdChange = async (e) => {
        const newOwnerId = e.target.value;
        setOwnerId(newOwnerId);
        if (newOwnerId) {
            await fetchOwnerInfo(newOwnerId);
        } else {
            setOwnerInfo(null);
        }
    };

    // Validate owner ID
    const validateForm = async () => {
        let isValid = true;

        // Validate owner ID
        try {
            const ownerExists = await checkDniExists(ownerId);
            if (!ownerExists) {
                setOwnerError("Owner ID does not exist.");
                isValid = false;
            } else {
                setOwnerError(''); // Clear error if the owner exists
            }
        } catch (error) {
            setOwnerError("Error validating Owner ID.");
            console.error("Error validating owner ID:", error);
            isValid = false;
        }

        return isValid;
    };

    // Check for duplicate license plates before submitting
    const validateLicensePlates = async () => {
        try {
            const existingSubscriptions = await getSubscriptions();
            const duplicateSubscription = existingSubscriptions.find(subscription =>
                subscription.subscription_type_id === parseInt(subscriptionTypeId) &&
                (subscription.lisence_plate1 === lisencePlate1 ||
                    subscription.lisence_plate2 === lisencePlate1 ||
                    subscription.lisence_plate3 === lisencePlate1 ||
                    (lisencePlate2 &&
                        (subscription.lisence_plate1 === lisencePlate2 ||
                            subscription.lisence_plate2 === lisencePlate2 ||
                            subscription.lisence_plate3 === lisencePlate2)) ||
                    (lisencePlate3 &&
                        (subscription.lisence_plate1 === lisencePlate3 ||
                            subscription.lisence_plate2 === lisencePlate3 ||
                            subscription.lisence_plate3 === lisencePlate3)))
            );

            if (duplicateSubscription) {
                setSubscriptionError("License plate already registered for this subscription type.");
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error validating license plates:", error);
            return false;
        }
    };

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
        setSubscriptionError(null); // Reset error state

        // Validate form fields (including owner ID)
        const isFormValid = await validateForm();
        if (!isFormValid) return;

        // Validate the license plates
        const isLicensePlatesValid = await validateLicensePlates();
        if (!isLicensePlatesValid) return;

        // If validation passes, create the subscription
        const subscriptionData = {
            owner_id: ownerId,
            subscription_type_id: parseInt(subscriptionTypeId),
            access_card: accessCard || null,
            lisence_plate1: lisencePlate1,
            lisence_plate2: lisencePlate2 || null,
            lisence_plate3: lisencePlate3 || null,
            documents: documents, // This should be an array of File objects
            tique_x_park: tiqueXPark || null,
            remote_control_number: remoteControlNumber || null,
            observations: observations || null,
            parking_spot: parkingSpot || null,
            parking_lot: selectedParkingLot, // Add selectedParkingLot here
            effective_date: effectiveDate, // Add effective date to the payload
            created_by: user.email,
            modified_by: ''
        };

        try {
            console.log('data before sending', subscriptionData)
            await addSubscription(subscriptionData);
            console.log('data after sending', subscriptionData)

            // Clear input fields
            setOwnerId('');
            setSubscriptionTypeId('');
            setAccessCard('');
            setLisencePlate1('');
            setLisencePlate2('');
            setLisencePlate3('');
            setDocuments([]);
            setDocumentPreviews([]);
            setTiqueXPark('');
            setRemoteControlNumber('');
            setObservations('');
            setParkingSpot('');
            setEffectiveDate('');
            // Navigate back to the subscription list
            navigate('/subscription-list');
        } catch (error) {
            console.error("Error adding subscription:", error);
            setSubscriptionError("Failed to add subscription. Please try again.");
        }
    };

    // Compute available options for each license plate dropdown
    const getAvailableOptions = (currentPlate, otherPlates) => {
        return availablePlates.filter(plate => plate === currentPlate || !otherPlates.includes(plate));
    };

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Add Subscription</h2>
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={3}>
                        <Form.Group controlId="formOwnerId" className="mb-3">
                            <Form.Label>DNI:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerId}
                                onChange={handleOwnerIdChange}
                                required
                                placeholder="Enter DNI"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formOwnerFirstName" className="mb-3">
                            <Form.Label>First Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo?.first_name || ''}
                                readOnly
                                placeholder="First Name"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formOwnerLastName" className="mb-3">
                            <Form.Label>Last Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo?.last_name || ''}
                                readOnly
                                placeholder="Last Name"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="formOwnerEmail" className="mb-3">
                            <Form.Label>Email:</Form.Label>
                            <Form.Control
                                type="email"
                                value={ownerInfo?.email || ''}
                                readOnly
                                placeholder="Email"
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group controlId="formOwnerBankAccount" className="mb-3">
                            <Form.Label>Bank Account:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo?.bank_account_number || ''}
                                readOnly
                                placeholder="Bank Account"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={3}>
                        <Form.Group controlId="formEffectiveDate" className="mb-3">
                            <Form.Label>Effective Date:</Form.Label>
                            <Form.Control
                                type="date"
                                value={effectiveDate}
                                onChange={(e) => setEffectiveDate(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group controlId="AccessCard" className="mb-3">
                            <Form.Label>Access Card:</Form.Label>
                            <Form.Control
                                type="text"
                                value={accessCard}
                                onChange={(e) => setAccessCard(e.target.value)}
                                placeholder="Enter Access Card (optional)"
                            />
                        </Form.Group>
                    </Col>
                </Row>
                {ownerError && <Alert variant="danger" className="mt-2">{ownerError}</Alert>}

                {/* Subscription Type Selection */}
                   <Row>
                    <Col md={6}>
                        <Form.Group controlId="formParkingLot" className="mb-3">
                            <Form.Label>Parking Lot:</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedParkingLot}
                                onChange={(e) => setSelectedParkingLot(e.target.value)}
                                required
                            >
                                <option value="">Select Parking Lot</option>
                                {parkingLots.map((lot) => (
                                    <option key={lot.id} value={lot.name}>
                                        {lot.name}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group controlId="formSubscriptionType" className="mb-3">
                            <Form.Label>Subscription Type:</Form.Label>
                            <Form.Control
                                as="select"
                                value={subscriptionTypeId}
                                onChange={(e) => setSubscriptionTypeId(e.target.value)}
                                required
                                disabled={!selectedParkingLot}
                            >
                                <option value="">Select Subscription Type</option>
                                {filteredSubscriptionTypes
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name} - ${type.price}
                                        </option>
                                    ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>

                {/* License Plates Selection */}
                <Row>
                    <Col md={4}>
                        <Form.Group controlId="formLisencePlate1" className="mb-3">
                            <Form.Label>License Plate 1:</Form.Label>
                            <Form.Control
                                as="select"
                                value={lisencePlate1}
                                onChange={(e) => setLisencePlate1(e.target.value)}
                                required
                            >
                                <option value="">Select License Plate 1</option>
                                {getAvailableOptions(lisencePlate1, [lisencePlate2, lisencePlate3]).map((plate) => (
                                    <option key={plate} value={plate}>
                                        {plate}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group controlId="formLisencePlate2" className="mb-3">
                            <Form.Label>License Plate 2:</Form.Label>
                            <Form.Control
                                as="select"
                                value={lisencePlate2}
                                onChange={(e) => setLisencePlate2(e.target.value)}
                            >
                                <option value="">Select License Plate 2 (optional)</option>
                                {getAvailableOptions(lisencePlate2, [lisencePlate1, lisencePlate3]).map((plate) => (
                                    <option key={plate} value={plate}>
                                        {plate}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group controlId="formLisencePlate3" className="mb-3">
                            <Form.Label>License Plate 3:</Form.Label>
                            <Form.Control
                                as="select"
                                value={lisencePlate3}
                                onChange={(e) => setLisencePlate3(e.target.value)}
                            >
                                <option value="">Select License Plate 3 (optional)</option>
                                {getAvailableOptions(lisencePlate3, [lisencePlate1, lisencePlate2]).map((plate) => (
                                    <option key={plate} value={plate}>
                                        {plate}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group controlId="formTiqueXPark" className="mb-3">
                            <Form.Label>TiqueXPark:</Form.Label>
                            <Form.Control
                                type="text"
                                value={tiqueXPark}
                                onChange={(e) => setTiqueXPark(e.target.value)}
                                placeholder="Enter TiqueXPark (optional)"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={6}>
                        <Form.Group controlId="formRemoteControlNumber" className="mb-3">
                            <Form.Label>Remote Control Number:</Form.Label>
                            <Form.Control
                                type="text"
                                value={remoteControlNumber}
                                onChange={(e) => setRemoteControlNumber(e.target.value)}
                                placeholder="Enter Remote Control Number (optional)"
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Observations and Parking Spot */}
                <Form.Group controlId="formObservations" className="mb-3">
                    <Form.Label>Observations:</Form.Label>
                    <Form.Control
                        type="text"
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Enter any observations (optional)"
                    />
                </Form.Group>

                <Form.Group controlId="formParkingSpot" className="mb-3">
                    <Form.Label>Parking Spot:</Form.Label>
                    <Form.Control
                        type="text"
                        value={parkingSpot}
                        onChange={(e) => setParkingSpot(e.target.value)}
                        placeholder="Enter parking spot (optional)"
                    />
                </Form.Group>

                <Row className="mb-3">
                    <Form.Group controlId="formSubscriptionDocuments">
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

                {subscriptionError && (
                    <Alert variant="danger" className="mt-2">{subscriptionError}</Alert>
                )}

                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Adding Subscription...' : 'Add Subscription'}
                </Button>
            </Form>
        </Container>
    );
};

export default AddSubscription;
