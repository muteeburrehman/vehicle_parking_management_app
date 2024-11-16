import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { getApprovedCancellationById } from '../services/approveCancellationService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";

const ApprovedCancellationDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [cancellation, setCancellation] = useState(null);
    const [error, setError] = useState('');
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);

    const checkUrlExists = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    };

    const getDocumentUrl = useCallback(async (docName) => {
        const cancelledPath = `http://localhost:8000/cancelled_subscription_files/${encodeURIComponent(docName.trim())}`;
        const regularPath = `http://localhost:8000/subscription_files/${encodeURIComponent(docName.trim())}`;

        const isCancelledPathValid = await checkUrlExists(cancelledPath);
        if (isCancelledPathValid) {
            return cancelledPath;
        }

        const isRegularPathValid = await checkUrlExists(regularPath);
        if (isRegularPathValid) {
            return regularPath;
        }

        return cancelledPath;
    }, []);

    useEffect(() => {
        const fetchApprovedCancellationData = async () => {
            try {
                const response = await getApprovedCancellationById(id);
                setCancellation(response.approved_cancellation);

                const subscriptionTypesData = await getSubscriptionTypes();
                setSubscriptionTypes(subscriptionTypesData);

                if (response.approved_cancellation.documents) {
                    const documentsList = Array.isArray(response.approved_cancellation.documents)
                        ? response.approved_cancellation.documents
                        : JSON.parse(response.approved_cancellation.documents.startsWith('[')
                            ? response.approved_cancellation.documents
                            : `[${response.approved_cancellation.documents}]`);

                    const previews = await Promise.all(documentsList.map(async (doc) => {
                        const documentUrl = await getDocumentUrl(doc);
                        return {
                            name: doc.trim(),
                            src: documentUrl,
                            isExisting: true,
                        };
                    }));
                    setDocumentPreviews(previews);
                }
            } catch (error) {
                setError(`Error fetching approved cancellation details: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedCancellationData();
    }, [id, getDocumentUrl]);

    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown';
    };

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

    const handleViewDocument = (index) => {
        const document = documentPreviews[index];
        window.open(document.src, '_blank');
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    if (!cancellation) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Approved cancellation not found.</Alert>
                <Link to="/subscriptions/approved-cancellations/">
                    <Button variant="secondary">Back to Approved Cancellations List</Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Link to="/subscriptions/approved-cancellations/">
                <Button variant="secondary" className="mb-3">
                    &larr; Back to Approved Cancellations List
                </Button>
            </Link>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Header className="bg-success text-white">
                    <h4 className="mb-0">Approved Cancellation</h4>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ID</Form.Label>
                                    <Form.Control type="text" value={cancellation.id} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>DNI</Form.Label>
                                    <Form.Control type="text" value={cancellation.owner_id} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Subscription Type</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={getSubscriptionTypeName(cancellation.subscription_type_id)}
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Access Card</Form.Label>
                                    <Form.Control type="text" value={cancellation.access_card || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Effective Date</Form.Label>
                                    <Form.Control type="text" value={formatDate(cancellation.effective_date)} disabled />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>License Plate 1</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate1 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>License Plate 2</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate2 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>License Plate 3</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate3 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Parking Spot</Form.Label>
                                    <Form.Control type="text" value={cancellation.parking_spot || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Approval Date</Form.Label>
                                    <Form.Control type="text" value={formatDate(cancellation.modification_time)} disabled />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <h5>Documents</h5>
                                {documentPreviews.length > 0 ? (
                                    <DocumentPreviewRow
                                        documentPreviews={documentPreviews}
                                        handleViewDocument={handleViewDocument}
                                        pdfIcon={pdfIcon}
                                        readOnly={true}
                                    />
                                ) : (
                                    <p>No documents available</p>
                                )}
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ApprovedCancellationDetail;