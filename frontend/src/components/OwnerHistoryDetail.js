import React, { useEffect, useState } from 'react';
import { fetchOwnerHistoryById } from '../services/ownerHistoryService';
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
const OwnerHistoryDetail = () => {
    const { historyId } = useParams();
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getOwnerHistory = async () => {
            try {
                const historyData = await fetchOwnerHistoryById(historyId);
                setHistory(historyData);
                if (historyData.documents) {
                    const previews = historyData.documents.map(doc => ({
                        name: doc.split('/').pop(),
                        src: `http://localhost:8000/uploads/${encodeURIComponent(doc.split('/').pop())}`,
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

        getOwnerHistory();
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
        return <Alert variant="info" className="mt-4">No owner history found.</Alert>;
    }

    return (
        <Container className="mt-4">
            <h2 className="mb-4 text-center">Owner History Detail</h2>
            <Button variant="secondary" onClick={() => navigate(-1)} className="mb-3">Back</Button>
            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="text-center mb-4">Details for History ID: <strong>{history.history_id}</strong></Card.Title>
                    <Row>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>

                                <tr>
                                    <td><strong>DNI:</strong></td>
                                    <td>{history.dni}</td>
                                </tr>
                                <tr>
                                    <td><strong>First Name:</strong></td>
                                    <td>{history.first_name}</td>
                                </tr>
                                <tr>
                                    <td><strong>Last Name:</strong></td>
                                    <td>{history.last_name}</td>
                                </tr>
                                <tr>
                                    <td><strong>Email</strong></td>
                                    <td>{history.email}</td>
                                </tr>
                                <tr>
                                    <td><strong>Phone Number</strong></td>
                                    <td>{history.phone_number}</td>
                                </tr>
                                <tr>
                                    <td><strong>Bank Account Number</strong></td>
                                    <td>{history.bank_account_number}</td>
                                </tr>

                                <tr>
                                    <td><strong>Reduced Mobility Expiration</strong></td>
                                    <td>{history.reduced_mobility_expiration.split('T')[0]}</td>
                                </tr>

                                </tbody>
                            </Table>
                        </Col>
                        <Col md={6}>
                            <Table responsive striped hover>
                                <tbody>
                                <tr>
                                    <td><strong>Sage Client Number</strong></td>
                                    <td>{history.sage_client_number}</td>
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
                                    <td><strong>Modification Time:</strong></td>
                                    <td>{formatDateTime(history.modification_time)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Created By:</strong></td>
                                    <td>{history.created_by}</td>
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

export default OwnerHistoryDetail;
