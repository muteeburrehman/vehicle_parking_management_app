import React, {useEffect, useState, useCallback} from 'react';
import {Container, Card, Form, Button, Row, Col, Spinner, Alert} from 'react-bootstrap';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {getCancellationById, updateCancellation, uploadDocument} from '../services/cancellationService';
import {getSubscriptionTypes} from '../services/subscriptionService';
import DocumentPreviewRow from './DocumentPreviewRow';
import pdfIcon from "../assets/icons/pdf_icon.svg";
import useAuth from "../hooks/useAuth";
import {approveCancellation} from "../services/approveCancellationService";

const CancellationDetailEdit = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [loading, setLoading] = useState(true);
    const [cancellation, setCancellation] = useState(null);
    const [error, setError] = useState('');
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState([]);
    const [newDocument, setNewDocument] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [approveLoading, setApproveLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
    const backendURL = process.env.REACT_APP_BASE_URL;
    const backendURL2 = process.env.REACT_APP_BASE_URL;

    const checkUrlExists = async (url) => {
        try {
            const response = await fetch(url, {method: 'HEAD'});
            return response.ok;
        } catch {
            return false;
        }
    };

    const getDocumentUrl = useCallback(async (docName) => {
        const cancelledPath = `${backendURL}/cancelled_subscription_files/${encodeURIComponent(docName.trim())}`;
        const regularPath = `${backendURL2}/subscription_files/${encodeURIComponent(docName.trim())}`;

        const isCancelledPathValid = await checkUrlExists(cancelledPath);
        if (isCancelledPathValid) {
            return cancelledPath;
        }

        const isRegularPathValid = await checkUrlExists(regularPath);
        if (isRegularPathValid) {
            return regularPath;
        }

        return cancelledPath;
    }, [backendURL, backendURL2]);

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
                setError(`Error recopilando detalles de bajas: ${error.message}`);
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


    const handleDocumentChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setError('Por favor suba solo archivos .PDF o Word');
                event.target.value = null;
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError('El archivo no puede pesar mas de 5MB');
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
            setSuccessMessage('Documento añadido correctamente');
            setHasUploadedDocument(true); // Enable approve button after successful upload

            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            setError(`Error añadiendo documento: ${error.message}`);
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
        setSuccessMessage('Documento quitado correctamente');
    };
    const handleApprove = async () => {
        if (!user?.email) {
            setError('Requiere autentificación de usuario');
            return;
        }

        setApproveLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            // First update the cancellation with latest changes
            const documentNames = documentPreviews
                .filter(doc => doc.isExisting)
                .map(doc => doc.name);

            const updatedCancellation = {
                ...cancellation,
                documents: documentNames,
                modified_by: user.email,
                modification_time: new Date().toISOString()
            };

            await updateCancellation(cancellation.id, updatedCancellation);

            // Then approve the cancellation
            await approveCancellation(cancellation.id, updatedCancellation);

            setSuccessMessage('Baja aprovada correctamente');
            setTimeout(() => {
                navigate('/approved-cancellation-list');
            }, 1500);
        } catch (error) {
            setError(`Error confirmando baja: ${error.message || 'Ha ocurrido un error desconocido'}`);
        } finally {
            setApproveLoading(false);
        }
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
            setSuccessMessage('Cambios guardados correctamente');
        } catch (error) {
            setError(`Error actualizando detalles de baja: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary"/>
            </Container>
        );
    }

    if (!cancellation) {
        return (
            <Container className="mt-5">
                <Alert variant="warning">Baja no encontrada.</Alert>
                <Link to="/cancel-subscription-list/">
                    <Button variant="secondary">Volver a lista de bajas</Button>
                </Link>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Link to="/cancel-subscription-list/">
                <Button variant="secondary" className="mb-3">
                    &larr; Volver a lista de bajas
                </Button>
            </Link>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            {successMessage &&
                <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>{successMessage}</Alert>}

            <Card>
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">Bajas pendientes</h4>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>ID</Form.Label>
                                    <Form.Control type="text" value={cancellation.id} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>DNI</Form.Label>
                                    <Form.Control type="text" value={cancellation.owner_id} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tipo de abono</Form.Label>
                                    <Form.Control type="text"
                                                  value={getSubscriptionTypeName(cancellation.subscription_type_id)}
                                                  disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nº de tarjeta</Form.Label>
                                    <Form.Control type="text" value={cancellation.access_card || 'N/A'} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha de efecto</Form.Label>
                                    <Form.Control type="text" value={cancellation.effective_date ? cancellation.effective_date.split('T')[0] : 'N/A'}
/>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Vencimiento de Familia numerosa</Form.Label>
                                    <Form.Control type="text" value={cancellation.large_family_expiration ? cancellation.large_family_expiration.split('T')[0] : 'N/A'}
/>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fecha efectiva de baja</Form.Label>
                                    <Form.Control type="text" value={cancellation.effective_cancellation_date ? cancellation.effective_cancellation_date.split('T')[0] : 'N/A'}

/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 1</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate1 || 'N/A'} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 2</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate2 || 'N/A'} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Matrícula 3 3</Form.Label>
                                    <Form.Control type="text" value={cancellation.lisence_plate3 || 'N/A'} disabled/>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Plaza de aparcamiento</Form.Label>
                                    <Form.Control type="text" value={cancellation.parking_spot || 'N/A'} disabled/>
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
                                        handleRemoveDocument={handleRemoveDocument}
                                        pdfIcon={pdfIcon}
                                        readOnly={false}
                                    />
                                ) : (
                                    <p>No hay documentos disponibles</p>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Añadir nuevo documento</Form.Label>
                                    <Form.Control
                                        type="file"
                                        onChange={handleDocumentChange}
                                        accept=".pdf,.doc,.docx"
                                        disabled={uploadLoading}
                                    />
                                    <Form.Text className="text-muted">
                                        Accepted file types: PDF, DOC, DOCX (Max size: 5MB)
                                    </Form.Text>
                                    <div className="mt-2 mb-3">
                                        <Button
                                            variant="primary"
                                            className="mb-3"
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
                                                'Añadiendo documento'
                                            )}
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

<div className="mt-4 mb-3">
  <Button 
    variant="success" 
    onClick={handleSubmit} 
    className="me-2 mb-3"
  >
    Guardar cambios
  </Button>

  <Button
    variant="primary"
    onClick={handleApprove}
    className="me-2 mb-3"
    disabled={approveLoading || !hasUploadedDocument}
  >
    {approveLoading ? (
      <>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          className="me-2"
        />
        Validando...
      </>
    ) : (
      'Valida Baja'
    )}
  </Button>
</div>


                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CancellationDetailEdit;
