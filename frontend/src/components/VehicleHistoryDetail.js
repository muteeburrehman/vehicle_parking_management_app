import React, { useEffect, useState } from 'react';
import { fetchVehicleHistoryById } from '../services/vehicleHistoryService';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Alert, Button, Card, Row, Col, Table, Container } from 'react-bootstrap';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";


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
const VehicleHistoryDetail = () => {
    const { historyId } = useParams();
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const navigate = useNavigate();
    const backendURL = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        const getVehicleHistory = async () => {
            try {
                const historyData = await fetchVehicleHistoryById(historyId);
                setHistory(historyData);
                if (historyData.documents) {
                    const previews = historyData.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `${backendURL}/vehicle_uploads/${encodeURIComponent(doc.split('/').pop())}`,
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

        getVehicleHistory();
    }, [historyId, backendURL]);

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
        return <Alert variant="info" className="mt-4">No se encontró historial del vehículo.</Alert>;
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Detalle del historial del vehículo</h2>
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">Back</Button>
            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="text-center mb-4">Detalles del historial con ID: <strong>{history.history_id}</strong></Card.Title>
                    <Row>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>

                                <tr>
                                    <td><strong>Matrícula:</strong></td>
                                    <td>{history.lisence_plate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Marca:</strong></td>
                                    <td>{history.brand}</td>
                                </tr>
                                <tr>
                                    <td><strong>Modelo:</strong></td>
                                    <td>{history.model }</td>
                                </tr>
                                <tr>
                                    <td><strong>Tipo de Vehículo</strong></td>
                                    <td>{history.vehicle_type}</td>
                                </tr>
                                <tr>
                                    <td><strong>DNI Cliente</strong></td>
                                    <td>{history.owner_id }</td>
                                </tr>
                                <tr>
                                    <td><strong>Observaciones</strong></td>
                                    <td>{history.observations }</td>
                                </tr>

                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <Table responsive striped hover>
                            <tbody>

                                <tr>
                                    <td><strong>Fecha de Registro</strong></td>
                                    <td>{formatDateTime(history.registration_date) }</td>
                                </tr>
                                <tr>
                                    <td><strong>Creado por:</strong></td>
                                    <td>{history.created_by }</td>
                                </tr>
                                <tr>
                                    <td><strong>Modificado por:</strong></td>
                                    <td>{history.modified_by}</td>
                                </tr>

                                <tr>
                                    <td><strong>Fecha de modificación:</strong></td>
                                    <td>{formatDateTime(history.modification_time)}</td>
                                </tr>

                                <tr>
                                    <td><strong>Modificado por:</strong></td>
                                    <td>{history.modified_by }</td>
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

export default VehicleHistoryDetail;
