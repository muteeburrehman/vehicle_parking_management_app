import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCancellationById, updateCancellation, uploadDocument } from '../services/cancellationService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";

const CancellationDetailEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cancellation, setCancellation] = useState(null);
    const [error, setError] = useState('');
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [newDocument, setNewDocument] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

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
        const fetchCancellationData = async () => {
            try {
                const data = await getCancellationById(id);
                setCancellation(data);

                const subscriptionTypesData = await getSubscriptionTypes();
                setSubscriptionTypes(subscriptionTypesData);

                if (data.documents) {
                    const documentsList = Array.isArray(data.documents)
                        ? data.documents
                        : JSON.parse(data.documents.startsWith('[') ? data.documents : `[${data.documents}]`);

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
                setError(`Error fetching cancellation details: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchCancellationData();
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

    const handleDocumentChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload only PDF or Word documents');
                event.target.value = null;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('File size should not exceed 5MB');
                event.target.value = null;
                return;
            }
            setNewDocument(file);
            setError('');
        }
    };

    const handleDocumentUpload = async () => {
        if (!newDocument) return;

        setUploadLoading(true);
        setError('');
        try {
            const response = await uploadDocument(newDocument);
            const uploadedFileName = response.filename;
            const documentUrl = await getDocumentUrl(uploadedFileName);

            setDocumentPreviews(prev => [...prev, {
                name: uploadedFileName,
                src: documentUrl,
                isExisting: true,
            }]);
            setNewDocument(null);
            setSuccessMessage('Document uploaded successfully');

            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            setError(`Error uploading document: ${error.message}`);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleViewDocument = (index) => {
        const document = documentPreviews[index];
        window.open(document.src, '_blank');
    };

    const handleRemoveDocument = (index) => {
        setDocumentPreviews(prev => prev.filter((_, idx) => idx !== index));
        setSuccessMessage('Document removed successfully');
    };

    const handleSubmit = async () => {
        try {
            setError('');
            setSuccessMessage('');

            const documentNames = documentPreviews
                .filter(doc => doc.isExisting)
                .map(doc => doc.name);

            const updatedCancellation = {
                ...cancellation,
                documents: documentNames,
            };

            await updateCancellation(cancellation.id, updatedCancellation);
            setSuccessMessage('Changes saved successfully');
            setTimeout(() => {
                navigate('/subscriptions/cancellations/');
            }, 1500);
        } catch (error) {
            setError(`Error updating cancellation details: ${error.message}`);
        }
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
                <Alert variant="warning">Cancellation not found.</Alert>
                <Link to="/subscriptions/cancellations/">
                    <Button variant="secondary">Back to Cancellations List</Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Link to="/subscriptions/cancellations/">
                <Button variant="secondary" className="mb-3">
                    &larr; Back to Cancellations List
                </Button>
            </Link>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {successMessage && <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

            <Card>
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">Edit Cancellation</h4>
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
                                    <Form.Control type="text" value={getSubscriptionTypeName(cancellation.subscription_type_id)} disabled />
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
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <h5>Documents</h5>
                                {documentPreviews.length > 0 ? (
                                    <DocumentPreviewRow
                                        documentPreviews={documentPreviews}
                                        handleViewDocument={handleViewDocument}
                                        handleRemoveDocument={handleRemoveDocument}
                                        pdfIcon={pdfIcon}
                                        readOnly={false}
                                    />
                                ) : (
                                    <p>No documents available</p>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Upload New Document</Form.Label>
                                    <Form.Control
                                        type="file"
                                        onChange={handleDocumentChange}
                                        accept=".pdf,.doc,.docx"
                                        disabled={uploadLoading}
                                    />
                                    <Form.Text className="text-muted">
                                        Accepted file types: PDF, DOC, DOCX (Max size: 5MB)
                                    </Form.Text>
                                    <div className="mt-2">
                                        <Button
                                            variant="primary"
                                            onClick={handleDocumentUpload}
                                            disabled={!newDocument || uploadLoading}
                                        >
                                            {uploadLoading ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Upload Document'
                                            )}
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mt-4">
                            <Button variant="success" onClick={handleSubmit} className="me-2">
                                Save Changes
                            </Button>
                            <Link to="/subscriptions/cancellations/">
                                <Button variant="outline-secondary">Cancel</Button>
                            </Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CancellationDetailEdit;
