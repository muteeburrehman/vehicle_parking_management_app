import React, { useEffect, useState } from 'react';
import { fetchSubscriptionHistoryById } from '../services/subscriptionHistoryService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Card, Row, Col, Table, Container } from 'react-bootstrap';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";

// Format Date and Time function
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
const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

const SubscriptionHistoryDetail = () => {
    const { historyId } = useParams();
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]); // State for subscription types
    const navigate = useNavigate();
    const backendURL = process.env.REACT_APP_BASE_URL;

    // Function to get the name of the subscription type by ID
    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown'; // Return subscription type name or 'Unknown' if not found
    };

    useEffect(() => {
        const getSubscriptionHistory = async () => {
            try {
                // Fetch subscription history by ID
                const historyData = await fetchSubscriptionHistoryById(historyId);
                setHistory(historyData);

                // Fetch subscription types
                const subscriptionTypesData = await getSubscriptionTypes();
                setSubscriptionTypes(subscriptionTypesData);

                if (historyData.documents) {
                    const previews = historyData.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `${backendURL}/subscription_files/${encodeURIComponent(doc.split('/').pop())}`,
                        isExisting: true,
                    }));
                    setDocumentPreviews(previews);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getSubscriptionHistory();
    }, [historyId,backendURL]);

    const handleViewDocument = (index) => {
        const document = documentPreviews[index];
        if (document) {
            window.open(document.src, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger" className="mt-4">Error: {error}</Alert>;
    }

    if (!history) {
        return <Alert variant="info" className="mt-4">No subscription history found.</Alert>;
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Subscription History Detail</h2>
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">Back</Button>
            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="text-center mb-4">Details for History ID: <strong>{history.history_id}</strong></Card.Title>
                    <Row>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>
                                    <tr>
                                        <td><strong>Cancellation ID:</strong></td>
                                        <td>{history.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>DNI:</strong></td>
                                        <td>{history.owner_id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Subscription Type:</strong></td>
                                        {/* Use getSubscriptionTypeName to resolve the subscription type name */}
                                        <td>{getSubscriptionTypeName(history.subscription_type_id)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Effective Date:</strong></td>
                                        <td>{formatDate(history.effective_date)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Access Card:</strong></td>
                                        <td>{history.access_card}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>License Plate 1:</strong></td>
                                        <td>{history.lisence_plate1}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>License Plate 2:</strong></td>
                                        <td>{history.lisence_plate2 || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>License Plate 3:</strong></td>
                                        <td>{history.lisence_plate3 || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Parking Lot:</strong></td>
                                        <td>{history.parking_lot}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tique X Park:</strong></td>
                                        <td>{history.tique_x_park}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>
                                <tr>
                                    <td><strong>Remote Control Number:</strong></td>
                                    <td>{history.remote_control_number}</td>
                                </tr>
                                <tr>
                                    <td><strong>Observations:</strong></td>
                                    <td>{history.observations}</td>
                                </tr>
                                <tr>
                                    <td><strong>Registration Date:</strong></td>
                                    <td>{formatDateTime(history.registration_date)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Parking Spot:</strong></td>
                                    <td>{history.parking_spot}</td>
                                </tr>
                                <tr>
                                    <td><strong>Created By:</strong></td>
                                    <td>{history.created_by}</td>
                                </tr>
                                <tr>
                                    <td><strong>Modified By:</strong></td>
                                    <td>{history.modified_by}</td>
                                </tr>
                                <tr>
                                    <td><strong>Modification Time:</strong></td>
                                    <td>{formatDateTime(history.modification_time)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Large Family Expiration:</strong></td>
                                    <td>{history.large_family_expiration ? history.large_family_expiration.split('T')[0]: ''}</td>
                                </tr>

                                </tbody>
                            </Table>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <h5 className="mb-3">Documents</h5>
                            <DocumentPreviewRow
                                documentPreviews={documentPreviews}
                                handleViewDocument={handleViewDocument}
                                handleRemoveDocument={() => {}} // No removal in history view
                                pdfIcon={pdfIcon}
                                readOnly={true}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SubscriptionHistoryDetail;
