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

    useEffect(() => {
        const getVehicleHistory = async () => {
            try {
                const historyData = await fetchVehicleHistoryById(historyId);
                setHistory(historyData);
                if (historyData.documents) {
                    const previews = historyData.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `http://localhost:8000/vehicle_uploads/${encodeURIComponent(doc.split('/').pop())}`,
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
    }, [historyId]);

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
        return <Alert variant="info" className="mt-4">No vehicle history found.</Alert>;
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Vehicle History Detail</h2>
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">Back</Button>
            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="text-center mb-4">Details for History ID: <strong>{history.history_id}</strong></Card.Title>
                    <Row>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>

                                <tr>
                                    <td><strong>Lisence Plate:</strong></td>
                                    <td>{history.lisence_plate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Brand:</strong></td>
                                    <td>{history.brand}</td>
                                </tr>
                                <tr>
                                    <td><strong>Model:</strong></td>
                                    <td>{history.model }</td>
                                </tr>
                                <tr>
                                    <td><strong>Vehicle Type</strong></td>
                                    <td>{history.vehicle_type}</td>
                                </tr>
                                <tr>
                                    <td><strong>OwnerID</strong></td>
                                    <td>{history.owner_id }</td>
                                </tr>
                                <tr>
                                    <td><strong>Observations</strong></td>
                                    <td>{history.observations }</td>
                                </tr>

                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <Table responsive striped hover>
                            <tbody>

                                <tr>
                                    <td><strong>Registration Date</strong></td>
                                    <td>{formatDateTime(history.registration_date) }</td>
                                </tr>
                                <tr>
                                    <td><strong>Created By:</strong></td>
                                    <td>{history.created_by }</td>
                                </tr>
                                <tr>
                                    <td><strong>Modified BY:</strong></td>
                                    <td>{history.modified_by}</td>
                                </tr>

                                <tr>
                                    <td><strong>Modification Time:</strong></td>
                                    <td>{formatDateTime(history.modification_time)}</td>
                                </tr>

                                <tr>
                                    <td><strong>Modified By:</strong></td>
                                    <td>{history.modified_by }</td>
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

export default VehicleHistoryDetail;
