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
    const backendURL = process.env.REACT_APP_BASE_URL;

    const checkUrlExists = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    };

    const getDocumentUrl = useCallback(async (docName) => {
        const cancelledPath = `${backendURL}/cancelled_subscription_files/${encodeURIComponent(docName.trim())}`;
        const regularPath = `${backendURL}/subscription_files/${encodeURIComponent(docName.trim())}`;

        const isCancelledPathValid = await checkUrlExists(cancelledPath);
        if (isCancelledPathValid) {
            return cancelledPath;
        }

        const isRegularPathValid = await checkUrlExists(regularPath);
        if (isRegularPathValid) {
            return regularPath;
        }

        return cancelledPath;
    }, [backendURL]);

    const parseDocuments = (documentsData) => {
        if (!documentsData) return [];

        try {
            // If it's already an array, return it
            if (Array.isArray(documentsData)) return documentsData;

            // If it's a string, try different parsing strategies
            if (typeof documentsData === 'string') {
                // First, try parsing as JSON if it looks like JSON
                if (documentsData.trim().startsWith('[')) {
                    return JSON.parse(documentsData);
                }

                // If it's not JSON, split by comma and clean up
                return documentsData
                    .split(',')
                    .map(doc => doc.trim())
                    .filter(doc => doc); // Remove empty strings
            }

            // If it's neither array nor string, wrap it in array
            return [documentsData.toString()];
        } catch (error) {
            console.warn('Document parsing fallback:', documentsData);
            // If all parsing fails, treat as single item or split by comma
            return documentsData.includes(',')
                ? documentsData.split(',').map(doc => doc.trim()).filter(doc => doc)
                : [documentsData.toString().trim()];
        }
    };

    useEffect(() => {
        const fetchApprovedCancellationData = async () => {
            try {
                const response = await getApprovedCancellationById(id);
                setCancellation(response.approved_cancellation);

                const subscriptionTypesData = await getSubscriptionTypes();
                setSubscriptionTypes(subscriptionTypesData);

                if (response.approved_cancellation.documents) {
                    const documentsList = parseDocuments(response.approved_cancellation.documents);

                    const previews = await Promise.all(documentsList.map(async (doc) => {
                        const docName = typeof doc === 'string' ? doc : doc.toString();
                        const documentUrl = await getDocumentUrl(docName);
                        return {
                            name: docName.trim(),
                            src: documentUrl,
                            isExisting: true,
                        };
                    }));
                    setDocumentPreviews(previews);
                }
            } catch (error) {
                console.error('Original error:', error);
                setError(`Error fetching approved cancellation details: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovedCancellationData();
    }, [id, getDocumentUrl]);

    // Rest of your component remains the same...
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

    // Your existing JSX remains the same...
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
                <Link to="/approved-cancellation-list">
                    <Button variant="secondary">Back to Approved Cancellations List</Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Link to="/approved-cancellation-list">
                <Button variant="secondary" className="mb-3">
                    &larr; Volver a lista de bajas aprovadas
                </Button>
            </Link>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Header className="bg-success text-white">
                    <h4 className="mb-0">Baja aprovadas</h4>
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
                                    <Form.Label>Tipo de abono</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={getSubscriptionTypeName(cancellation.subscription_type_id)}
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nº de tarjeta</Form.Label>
                                    <Form.Control type="text" value={cancellation.access_card || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha de efecto</Form.Label>
                                    <Form.Control type="text" value={formatDate(cancellation.effective_date)} disabled />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 1</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate1 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 2</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate2 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 3</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate3 || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plaza de aparcamiento</Form.Label>
                                    <Form.Control type="text" value={cancellation.parking_spot || 'N/A'} disabled />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha de aprovación de la baja</Form.Label>
                                    <Form.Control type="text" value={formatDate(cancellation.modification_time)} disabled />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <h5>Documentos</h5>
                                {documentPreviews.length > 0 ? (
                                    <DocumentPreviewRow
                                        documentPreviews={documentPreviews}
                                        handleViewDocument={handleViewDocument}
                                        pdfIcon={pdfIcon}
                                        readOnly={true}
                                    />
                                ) : (
                                    <p>Sin documentos disponibles</p>
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