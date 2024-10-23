import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Spinner, Alert, Button, Row, Col } from 'react-bootstrap';
import { getCancellationById } from '../services/cancellationService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";

const CancellationDetail = () => {
    const { id } = useParams();
    const [cancellation, setCancellation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
     const [subscriptionTypes, setSubscriptionTypes] = useState([]); // State for subscription types
    const [documentPreviews, setDocumentPreviews] = useState([]);


    // Function to get the name of the subscription type by ID
    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown'; // Return subscription type name or 'Unknown' if not found
    };


    useEffect(() => {
        const fetchCancellation = async () => {
            try {
                const data = await getCancellationById(id);
                setCancellation(data);
                const subscriptionTypesData = await getSubscriptionTypes();
                setSubscriptionTypes(subscriptionTypesData);

                if (data.documents && data.documents.length > 0) {
                    const previews = data.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `http://localhost:8000/subscription_files/${encodeURIComponent(doc)}`,
                        isExisting: true,
                    }));
                    setDocumentPreviews(previews);
                }
            } catch (error) {
                setError(`Error fetching cancellation details: ${error}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCancellation();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatdate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

    const handleViewDocument = (index) => {
        const document = documentPreviews[index];
        if (document) {
            window.open(document.src, '_blank');
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error}</Alert>
                <Link to="/subscriptions/cancellations/">
                    <Button variant="secondary">Back to Cancellations List</Button>
                </Link>
            </Container>
        );
    }

    if (!cancellation) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Cancellation not found.</Alert>
                <Link to="/cancel-subscription-list">
                    <Button variant="secondary">Back to Cancellations List</Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Link to="/cancel-subscription-list">
                <Button variant="secondary" className="mb-3">
                    &larr; Back to Cancellations List
                </Button>
            </Link>
            <Card>
                <Card.Header className="bg-primary text-white">Cancellation Details</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Card.Text><strong>ID:</strong> {cancellation.id}</Card.Text>
                            <Card.Text><strong>DNI:</strong> {cancellation.owner_id}</Card.Text>
                            <Card.Text><strong>Subscription Type:</strong> {getSubscriptionTypeName(cancellation.subscription_type_id)}</Card.Text>
                            <Card.Text><strong>Access Card:</strong> {cancellation.access_card || 'N/A'}</Card.Text>
                            <Card.Text><strong>Effective Date:</strong> {formatdate(cancellation.effective_date) || 'N/A'}</Card.Text>
                            <Card.Text><strong>License Plate 1:</strong> {cancellation.lisence_plate1 || 'N/A'}</Card.Text>
                            <Card.Text><strong>License Plate 2:</strong> {cancellation.lisence_plate2 || 'N/A'}</Card.Text>
                            <Card.Text><strong>License Plate 3:</strong> {cancellation.lisence_plate3 || 'N/A'}</Card.Text>
                        </Col>
                        <Col md={6}>
                            <Card.Text><strong>Tique X Park:</strong> {cancellation.tique_x_park || 'N/A'}</Card.Text>
                            <Card.Text><strong>Remote Control Number:</strong> {cancellation.remote_control_number || 'N/A'}</Card.Text>
                            <Card.Text><strong>Observations:</strong> {cancellation.observations || 'N/A'}</Card.Text>
                            <Card.Text><strong>Registration Date:</strong> {formatDate(cancellation.registration_date)}</Card.Text>
                            <Card.Text><strong>Parking Spot:</strong> {cancellation.parking_spot || 'N/A'}</Card.Text>
                            <Card.Text><strong>Cancellation Date:</strong> {formatDate(cancellation.modification_time)}</Card.Text>
                            <Card.Text><strong>Created By:</strong> {cancellation.created_by}</Card.Text>
                            <Card.Text><strong>Modified By:</strong> {cancellation.modified_by || 'N/A'}</Card.Text>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <h5>Documents</h5>
                            {documentPreviews.length > 0 ? (
                                <DocumentPreviewRow
                                    documentPreviews={documentPreviews}
                                    handleViewDocument={handleViewDocument}
                                    handleRemoveDocument={() => {}}
                                    pdfIcon={pdfIcon}
                                    readOnly={true}
                                />
                            ) : (
                                <p>No documents available</p>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CancellationDetail;