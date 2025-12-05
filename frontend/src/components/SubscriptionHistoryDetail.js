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

  const checkUrlExists = async (url) => {
        try {
            const response = await fetch(url, {method: 'HEAD'});
            return response.ok;
        } catch {
            return false;
        }
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
                const previews = await Promise.all(
                    historyData.documents.map(async (doc) => {
                        const fileName = doc.split('/').pop();

                        // Define paths for cancelled and regular documents
                        const cancelledPath = `${backendURL}/cancelled_subscription_files/${encodeURIComponent(fileName.trim())}`;
                        const regularPath = `${backendURL}/subscription_files/${encodeURIComponent(fileName.trim())}`;

                        // Check if cancelledPath is valid
                        const isCancelledPathValid = await checkUrlExists(cancelledPath);
                        if (isCancelledPathValid) {
                            return {
                                name: fileName,
                                src: cancelledPath,
                                isExisting: true,
                            };
                        }

                        // Check if regularPath is valid
                        const isRegularPathValid = await checkUrlExists(regularPath);
                        if (isRegularPathValid) {
                            return {
                                name: fileName,
                                src: regularPath,
                                isExisting: true,
                            };
                        }

                        // Return default invalid document if neither path is valid
                        return {
                            name: fileName,
                            src: "",
                            isExisting: false,
                        };
                    })
                );

                // Filter out invalid documents
                setDocumentPreviews(previews.filter(preview => preview.isExisting));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    getSubscriptionHistory();
}, [historyId, backendURL]); // Add dependencies to useEffect




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
        return <Alert variant="info" className="mt-4">No se encuentra Historial de Abonos.</Alert>;
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Volver al Historial de Abonos</h2>
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">atrás</Button>
            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="text-center mb-4">DVolver al Historial de Abonos con ID: <strong>{history.history_id}</strong></Card.Title>
                    <Row>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>
                                    <tr>
                                        <td><strong>ID de Baja:</strong></td>
                                        <td>{history.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>DNI:</strong></td>
                                        <td>{history.owner_id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tipo de Abono:</strong></td>
                                        {/* Use getSubscriptionTypeName to resolve the subscription type name */}
                                        <td>{getSubscriptionTypeName(history.subscription_type_id)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Fecha de Efecto:</strong></td>
                                        <td>{formatDate(history.effective_date)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Nº de tarjeta:</strong></td>
                                        <td>{history.access_card}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Matrícula 1:</strong></td>
                                        <td>{history.lisence_plate1}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Matrícula 2:</strong></td>
                                        <td>{history.lisence_plate2 || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Matrícula 3:</strong></td>
                                        <td>{history.lisence_plate3 || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Aparcamiento:</strong></td>
                                        <td>{history.parking_lot}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tique XPark:</strong></td>
                                        <td>{history.tique_x_park}</td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>
                                <tr>
                                    <td><strong>Nº de Mando:</strong></td>
                                    <td>{history.remote_control_number}</td>
                                </tr>
                                <tr>
                                    <td><strong>Observaciones:</strong></td>
                                    <td>{history.observations}</td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha de Registro:</strong></td>
                                    <td>{formatDateTime(history.registration_date)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Plaza de Aparcamiento:</strong></td>
                                    <td>{history.parking_spot}</td>
                                </tr>
                                <tr>
                                    <td><strong>Creado por:</strong></td>
                                    <td>{history.created_by}</td>
                                </tr>
                                <tr>
                                    <td><strong>Modificado por:</strong></td>
                                    <td>{history.modified_by}</td>
                                </tr>
                                <tr>
                                    <td><strong>Fecha de Modificación:</strong></td>
                                    <td>{formatDateTime(history.modification_time)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Vencimiento Familia Numerosa:</strong></td>
                                    <td>{history.large_family_expiration ? history.large_family_expiration.split('T')[0]: ''}</td>
                                </tr>

                                </tbody>
                            </Table>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <h5 className="mb-3">Documentos</h5>
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
