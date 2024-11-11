
import React, {useEffect, useRef, useState} from 'react';
import {Col, Row} from 'react-bootstrap';
import {useParams, useNavigate} from 'react-router-dom';
import {useSubscription} from '../hooks/useSubscription';
import {Form, Button, Container, Spinner, Alert} from 'react-bootstrap';
import {fetchVehiclesByOwnerId} from '../services/getVehicleService';
import useAuth from "../hooks/useAuth";
import DocumentPreviewRow from "./DocumentPreviewRow";
import pdfIcon from "../assets/icons/pdf_icon.svg";
import {updateSubscription} from "../services/subscriptionService";
import {fetchOwnerByDNI} from "../services/getOwnerService";
import {parkingLotService} from "../services/parkingLotService";

const EditSubscription = () => {
    const {id} = useParams();
    const {user} = useAuth();
    const navigate = useNavigate();
    const {
        fetchSubscriptionById,
        loading,
        error,
        subscriptionTypes
    } = useSubscription();

    const formatModificationTime = (time) => {
        return new Date(time).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const [formData, setFormData] = useState({
        owner_id: '',
        subscription_type_id: '',
        access_card: '',
        lisence_plate1: '',
        lisence_plate2: '',
        lisence_plate3: '',
        tique_x_park: '',
        remote_control_number: '',
        effective_date: '',
        observations: '',
        parking_spot: '',
        created_by: '',
    });

    const [ownerInfo, setOwnerInfo] = useState({
        first_name: '',
        last_name: '',
        email: '',
        bank_account_number: '',
    });


    const [vehicles, setVehicles] = useState([]);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [documents, setDocuments] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [, setInitialDocuments] = useState([]);
    const [modifiedBy, setModifiedBy] = useState('');
    const [modificationTime, setModificationTime] = useState('');
    const [isModified, setIsModified] = useState(false);
    const isUser = user.role === 'user';
    const isAdmin = user.role === 'admin';
    const isSuperuser = user.role === 'superuser';
    const fileInputRef = useRef(null);
    const [isFormChanged, setIsFormChanged] = useState(false);

    const [parkingLots, setParkingLots] = useState([]);
    const [selectedParkingLot, setSelectedParkingLot] = useState('');
    const [filteredSubscriptionTypes, setFilteredSubscriptionTypes] = useState([]);


    const backendURL = 'http://localhost:8000'; // Update this based on your backend configuration

    // Add new useEffect to fetch parking lots
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


useEffect(() => {
    const fetchSubscription = async () => {
        if (id) {
            try {
                const data = await fetchSubscriptionById(id);

                // Format the effective date if present
                const formattedDate = data.effective_date
                    ? data.effective_date.split('T')[0]
                    : '';

                const formattedData = {
                    ...data,
                    effective_date: formattedDate
                };

                // Set initial data and selectedParkingLot
                setFormData(formattedData);
                setSelectedParkingLot(data.parking_lot || '');

                // Initial filtered subscription types based on the loaded parking lot
                const initialFilteredTypes = subscriptionTypes.filter(
                    type => type.parking_lot_name === data.parking_lot
                );
                setFilteredSubscriptionTypes(initialFilteredTypes);

                if (data.modification_time) {
                    const formattedModTime = formatModificationTime(data.modification_time);
                    setModificationTime(formattedModTime);
                } else {
                    setModificationTime('');
                }

                setModifiedBy(data.modified_by || '');

                if (data.owner_id) {
                    fetchVehicles(data.owner_id);
                    fetchOwnerInfo(data.owner_id);
                }

                if (data.documents) {
                    const previews = data.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `${backendURL}/subscription_files/${encodeURIComponent(doc.split('/').pop())}`,
                        isExisting: true,
                    }));
                    setDocumentPreviews(previews);
                    setInitialDocuments(data.documents);
                }
            } catch (err) {
                console.error('Failed to fetch subscription:', err.response?.detail || err.message);
            }
        }
    };

    fetchSubscription();
}, [id, fetchSubscriptionById, subscriptionTypes]);


    // Add new useEffect to filter subscription types based on parking lot
    useEffect(() => {
        if (selectedParkingLot && subscriptionTypes) {
            const filtered = subscriptionTypes.filter(type =>
                type.name.toLowerCase().includes(selectedParkingLot.toLowerCase())
            );
            setFilteredSubscriptionTypes(filtered);
        }
    }, [selectedParkingLot, subscriptionTypes]);


    useEffect(() => {
        if (formData.owner_id) {
            fetchVehicles(formData.owner_id);
        } else {
            setVehicles([]);
            setFormData(prev => ({
                ...prev,
                lisence_plate1: '',
                lisence_plate2: '',
                lisence_plate3: '',
            }));
        }
    }, [formData.owner_id]);

    const fetchOwnerInfo = async (ownerId) => {
        try {
            const ownerData = await fetchOwnerByDNI(ownerId);
            setOwnerInfo(ownerData);
        } catch (err) {
            console.error('Failed to fetch owner info:', err.message);
        }
    };

    const fetchVehicles = async (ownerId) => {
        try {
            const fetchedVehicles = await fetchVehiclesByOwnerId(ownerId);
            setVehicles(fetchedVehicles);
        } catch (err) {
            console.error('Failed to fetch vehicles:', err.message);
            setVehicles([]);
        }
    };

useEffect(() => {
    const updatedFilteredTypes = selectedParkingLot
        ? subscriptionTypes.filter(type =>
            type.name.includes(selectedParkingLot)
        )
        : subscriptionTypes; // Show all if no parking lot is selected

    console.log("Selected Parking Lot:", selectedParkingLot);
    console.log("Filtered Subscription Types:", updatedFilteredTypes);

    setFilteredSubscriptionTypes(updatedFilteredTypes);

    // Keep the selected subscription type if still valid, otherwise clear
    setFormData(prev => ({
        ...prev,
        subscription_type_id: updatedFilteredTypes.some(type => type.id === prev.subscription_type_id)
            ? prev.subscription_type_id
            : '' // Clear if no longer valid
    }));
}, [selectedParkingLot, subscriptionTypes]);




// Handle input changes
const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'parkingLot') {
        setSelectedParkingLot(value);

        // Clear subscription type if parking lot changes
        setFormData(prev => ({
            ...prev,
            subscription_type_id: ''
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }
};

    const handleLicensePlateChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => {
            const otherPlates = ['lisence_plate1', 'lisence_plate2', 'lisence_plate3'].filter(plate => plate !== name);
            const updatedData = {...prev, [name]: value};
            otherPlates.forEach(plate => {
                if (updatedData[plate] === value) {
                    updatedData[plate] = '';
                }
            });
            return updatedData;
        });
        setIsModified(true);
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
        setIsFormChanged(true);
        setIsModified(true)

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

    const validateForm = () => {
        const errors = {};
        if (!formData.owner_id) errors.owner_id = 'Owner ID is required.';
        if (!formData.subscription_type_id) errors.subscription_type_id = 'Subscription Type is required.';
        if (!formData.lisence_plate1) errors.lisence_plate1 = 'At least one License Plate is required.';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
        }
    };

    const handleRemoveDocument = (index) => {
        const documentToRemove = documentPreviews[index];
        if (!documentToRemove.isExisting) {
            URL.revokeObjectURL(documentToRemove.src);
        }
        setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
        setDocuments(prev => prev.filter((_, i) => i !== index));
        setIsModified(true);
    };

    const navigateToList = () => {
        navigate('/subscription-list')
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const existingDocuments = documentPreviews.filter(doc => doc.isExisting).map(doc => doc.name);
            const newDocuments = documents.filter(doc => doc instanceof File);
            const removedDocuments = existingDocuments.filter(doc =>
                !documentPreviews.some(preview => preview.name === doc.split('/').pop() && preview.isExisting)
            );

            const subscriptionData = {
                ...formData,
                id: id,  // Make sure to include the subscription ID
                subscription_type_id: parseInt(formData.subscription_type_id, 10),
                modified_by: user.email,
                modification_time: new Date().toISOString(),
                parking_lot: selectedParkingLot,
                lisence_plate1: formData.lisence_plate1 || '',
                lisence_plate2: formData.lisence_plate2 || '',
                lisence_plate3: formData.lisence_plate3 || '',
                effective_date: formData.effective_date || '',
                new_documents: newDocuments,
                remove_documents: removedDocuments,
                existing_documents: existingDocuments,
                generate_work_order: isFormChanged,  // Include the work order generation flag
            };

            console.log('Form data before submitting:', subscriptionData);

            const response = await updateSubscription(subscriptionData);
            console.log('Form data after update:', response);

            setUpdateSuccess(true);
            setModifiedBy(user.email);
            setModificationTime(formatModificationTime(new Date()));
            setIsModified(false);
            setIsFormChanged(false);

            // If a new work order was generated, add it to the document previews

            if (response.documents) {
                const newWorkOrder = response.documents.find(doc => doc.startsWith('work_order_'));
                if (newWorkOrder) {
                    setDocumentPreviews(prev => [...prev, {
                        name: newWorkOrder,
                        src: `${backendURL}/subscription_files/${newWorkOrder}`,
                        isExisting: true,
                    }]);
                }
            }


        } catch (err) {
            console.error('Failed to update subscription:', err);
        }
    };

    const handleCancelSubscription = () => {
        navigate('/cancel-subscription', {state: {formData}});
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">Error: {error.message}</Alert>
            </Container>
        );
    }

    if (!id) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">No subscription ID provided</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <h2>Edit Subscription</h2>
            {updateSuccess && (
                <Alert variant="success">
                    Subscription updated successfully.
                </Alert>
            )}
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md={3}>
                        <Form.Group controlId="owner_id" className="mb-3">
                            <Form.Label>DNI:</Form.Label>
                            <Form.Control
                                type="text"
                                name="owner_id"
                                value={formData.owner_id}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.owner_id}
                                required
                                readOnly
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.owner_id}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="first_name" className="mb-3">
                            <Form.Label>First Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo.first_name}
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="last_name" className="mb-3">
                            <Form.Label>Last Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo.last_name}
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="email" className="mb-3">
                            <Form.Label>Email:</Form.Label>
                            <Form.Control
                                type="email"
                                value={ownerInfo.email}
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <Form.Group controlId="bank_account_number" className="mb-3">
                            <Form.Label>Bank Account:</Form.Label>
                            <Form.Control
                                type="text"
                                value={ownerInfo.bank_account_number}
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                </Row>
<Row>
    <Col md={4}>
        <Form.Group controlId="parkingLot" className="mb-3">
            <Form.Label>Parking Lot:</Form.Label>
            <Form.Select
                name="parkingLot"
                value={selectedParkingLot}
                onChange={handleChange}
                required
                disabled={isUser}
            >
                <option value="">Select Parking Lot</option>
                {parkingLots.map((lot) => (
                    <option key={lot.id} value={lot.name}>
                        {lot.name}
                    </option>
                ))}
            </Form.Select>
        </Form.Group>
    </Col>

    <Col md={4}>
        <Form.Group controlId="subscription_type_id" className="mb-3">
            <Form.Label>Subscription Type:</Form.Label>
            <Form.Select
                name="subscription_type_id"
                value={formData.subscription_type_id || ''}
                onChange={handleChange}
                isInvalid={!!validationErrors.subscription_type_id}
                required
                disabled={isUser || !selectedParkingLot}
            >
                <option value="">Select Subscription Type</option>
                {filteredSubscriptionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                        {type.name} - ${type.price}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
                {validationErrors.subscription_type_id}
            </Form.Control.Feedback>
        </Form.Group>
    </Col>
</Row>
                <Row>
                    <Col md={3}>
                        <Form.Group controlId="effective_date" className="mb-3">
                            <Form.Label>Effective Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="effective_date"
                                value={formData.effective_date || ''}
                                onChange={handleChange}
                                readOnly={isUser}
                                onFocus={(e) => console.log('Effective date field value:', e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group controlId="access_card" className="mb-3">

                            <Form.Label>Access Card:</Form.Label>
                            <Form.Control
                                type="text"
                                name="access_card"
                                value={formData.access_card || ''}
                                onChange={handleChange}
                                readOnly={isUser}
                            />

                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    {['lisence_plate1', 'lisence_plate2', 'lisence_plate3'].map((plate, index) => (
                        <Col md={4} key={plate}>
                            <Form.Group controlId={plate} className="mb-3">
                                <Form.Label>License Plate {index + 1}:</Form.Label>
                                <Form.Select
                                    name={plate}
                                    value={formData[plate] || ''}
                                    onChange={handleLicensePlateChange}
                                    isInvalid={index === 0 && !!validationErrors.lisence_plate1}
                                    required={index === 0}
                                    disabled={isUser}
                                >
                                    <option value="">Select License Plate</option>
                                    {vehicles.map((vehicle) => (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.lisence_plate}
                                            disabled={
                                                formData.lisence_plate1 === vehicle.lisence_plate ||
                                                formData.lisence_plate2 === vehicle.lisence_plate ||
                                                formData.lisence_plate3 === vehicle.lisence_plate
                                            }
                                        >
                                            {vehicle.lisence_plate}
                                        </option>
                                    ))}
                                </Form.Select>
                                {index === 0 && validationErrors.lisence_plate1 && (
                                    <Form.Control.Feedback type="invalid">
                                        {validationErrors.lisence_plate1}
                                    </Form.Control.Feedback>
                                )}
                            </Form.Group>
                        </Col>
                    ))}
                </Row>

                <Row>
                    <Col md={4}>
                        <Form.Group controlId="tique_x_park" className="mb-3">
                            <Form.Label>TiqueXPark:</Form.Label>
                            <Form.Control
                                type="text"
                                name="tique_x_park"
                                value={formData.tique_x_park || ''}
                                onChange={handleChange}
                                readOnly={isUser && !(isAdmin || isSuperuser)} // Editable for admin and superuser
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="remote_control_park" className="mb-3">
                            <Form.Label>Remote Control Park:</Form.Label>
                            <Form.Control
                                type="text"
                                name="remote_control_number"
                                value={formData.remote_control_number || ''}
                                onChange={handleChange}
                                readOnly={isUser && !(isAdmin || isSuperuser)} // Editable for admin and superuser
                            />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group controlId="parking_spot" className="mb-3">
                            <Form.Label>Parking Spot:</Form.Label>
                            <Form.Control
                                type="text"
                                name="parking_spot"
                                value={formData.parking_spot || ''}
                                onChange={handleChange}
                                readOnly={isUser}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Form.Group controlId="observations" className="mb-3">
                    <Form.Label>Observations:</Form.Label>
                    <Form.Control
                        as="textarea"
                        name="observations"
                        value={formData.observations || ''}
                        onChange={handleChange}
                        rows={3}
                        readOnly={isUser && !(isAdmin || isSuperuser)} // Editable for admin and superuser
                    />
                </Form.Group>


                <Form.Group controlId="subscription_formDocuments">
                    <Form.Label>Upload Documents (PDF only)</Form.Label>
                    <Form.Control
                        type="file"
                        multiple
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={handleDocumentChange}
                        disabled={isUser}
                    />
                    <DocumentPreviewRow
                        documentPreviews={documentPreviews}
                        handleViewDocument={handleViewDocument}
                        handleRemoveDocument={handleRemoveDocument}
                        pdfIcon={pdfIcon}
                        readOnly={isUser}
                    />
                </Form.Group>


                <Row>
                    <Col md={4}>
                        <Form.Group controlId="created_by" className="mb-3">
                            <Form.Label>Created By:</Form.Label>
                            <Form.Control
                                type="text"
                                name="created_by"
                                value={formData.created_by || ''}
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="modified_by" className="mb-3">
                            <Form.Label>Modified By:</Form.Label>
                            <Form.Control
                                type="text"
                                name="modified_by"
                                value={isModified ? user.email : modifiedBy} // Display current user's email if modified
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group controlId="modification_time" className="mb-3">
                            <Form.Label>Modification Time:</Form.Label>
                            <Form.Control
                                type="text"
                                name="modification_time"
                                value={isModified
                                    ? formatModificationTime(new Date())
                                    : modificationTime
                                }
                                readOnly
                            />
                        </Form.Group>
                    </Col>
                </Row>
                {(isSuperuser || isAdmin) && (
                    <Button variant="primary" type="submit" disabled={loading} className="me-2">
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                /> Updating...
                            </>
                        ) : (
                            'Update Subscription'
                        )}
                    </Button>
                )
                }
                {isSuperuser && (
                    <Button variant="danger" onClick={handleCancelSubscription} className="me-2">
                        Cancel Subscription
                    </Button>
                )
                }
                {(isSuperuser || isAdmin) && (
                    <Button variant={"secondary"} onClick={navigateToList}>
                        Subscription List
                    </Button>
                )}
            </Form>
        </Container>
    );
};

export default EditSubscription;
