import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Modal } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { cancelSubscription } from '../services/cancellationService';
import useAuth from "../hooks/useAuth";

const ApprovalModal = ({ showApproveModal, setShowApproveModal, cancellationDate, setCancellationDate, handleApprove, approvalLoading }) => {
  return (
    <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Validar Baja</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Fecha de baja</Form.Label>
            <Form.Control
              type="date"
              value={cancellationDate}
              onChange={(e) => setCancellationDate(e.target.value)}
              required
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
          Cerrar
        </Button>
        <Button
          variant="primary"
          onClick={handleApprove}
          disabled={approvalLoading}
        >
          {approvalLoading ? 'Validando...' : 'Validada'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const CancellationForm = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner_id: '',
    subscription_type_id: 0,
    parking_lot: '',
    access_card: '',
    lisence_plate1: '',
    lisence_plate2: '',
    lisence_plate3: '',
    observations: '',
    parking_spot: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [cancellationDate, setCancellationDate] = useState();
  const [approvalLoading, setApprovalLoading] = useState(false);

  useEffect(() => {
    // If there's pre-filled data from the edit form, use it
    if (location.state && location.state.formData) {
      setFormData(location.state.formData);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        subscription_type_id: parseInt(formData.subscription_type_id, 10),
        parking_lot: formData.parking_lot,
        lisence_plate1: formData.lisence_plate1 || null,
        lisence_plate2: formData.lisence_plate2 || null,
        lisence_plate3: formData.lisence_plate3 || null,
        modified_by: user.email,
        observations: formData.observations,
      };
      console.log(dataToSend);

      // Show the approval modal
      setShowApproveModal(true);
    } catch (err) {
      const errorMessage =
        err?.detail ||
        err?.message ||
        'Ha ocurrido un error mientras se cancelaba el abono';
      setError(errorMessage);
      setSuccess(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApprovalLoading(true);
      const dataToSend = {
        ...formData,
        cancellation_date: cancellationDate,
        effective_cancellation_date: cancellationDate,
        large_family_expiration: formData.large_family_expiration || null
      };
      console.log('Sending data to backend:', dataToSend);
      await cancelSubscription(dataToSend);

      setSuccess(true);
      setError(null);

      setFormData({
        owner_id: '',
        parking_lot: '',
        subscription_type_id: 0,
        access_card: '',
        lisence_plate1: '',
        lisence_plate2: '',
        lisence_plate3: '',
        observations: '',
        parking_spot: '',
      });

      setTimeout(() => {
        navigate('/subscription-list');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err?.detail ||
        err?.message ||
        'Ha ocurrido un error mientras se validaba la baja';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setApprovalLoading(false);
      setShowApproveModal(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>Cancelar abono</h2>
      {error && (
        <Alert variant="danger">
          {typeof error === 'object'
            ? (error.detail || error.message || JSON.stringify(error))
            : error}
        </Alert>
      )}
      {success && <Alert variant="success">Baja correcta! volviendo...</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="owner_id" className="mb-3">
          <Form.Label>DNI:</Form.Label>
          <Form.Control
            type="text"
            name="dni"
            value={formData.owner_id}
            onChange={handleChange}
            required
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="subscription_type_id" className="mb-3">
          <Form.Label>Código de abono:</Form.Label>
          <Form.Control
            type="number"
            name="subscription_type_id"
            value={formData.subscription_type_id}
            onChange={handleChange}
            required
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="access_card" className="mb-3">
          <Form.Label>Nº de tarjeta:</Form.Label>
          <Form.Control
            type="text"
            name="access_card"
            value={formData.access_card}
            onChange={handleChange}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="parking_lot" className="mb-3">
          <Form.Label>Aparcamiento:</Form.Label>
          <Form.Control
          type="text"
          name="parking_lot"
          value={formData.parking_lot}
          onChange={handleChange}
          readOnly
          />
        </Form.Group>
        {['lisence_plate1', 'lisence_plate2', 'lisence_plate3'].map((plate, index) => (
          <Form.Group controlId={plate} className="mb-3" key={plate}>
            <Form.Label>Matrícula {index + 1}:</Form.Label>
            <Form.Control
              type="text"
              name={plate}
              value={formData[plate]}
              onChange={handleChange}
              readOnly
            />
          </Form.Group>
        ))}
        <Form.Group controlId="observations" className="mb-3">
          <Form.Label>Observaciones:</Form.Label>
          <Form.Control
            as="textarea"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="parking_spot" className="mb-3">
          <Form.Label>Plaza de aparcamiento:</Form.Label>
          <Form.Control
            type="text"
            name="parking_spot"
            value={formData.parking_spot}
            onChange={handleChange}
            readOnly
          />
        </Form.Group>
        <Button variant="danger" type="submit">
          Corfirmar Baja
        </Button>
      </Form>
       <ApprovalModal
        showApproveModal={showApproveModal}
        setShowApproveModal={setShowApproveModal}
        cancellationDate={cancellationDate}
        setCancellationDate={setCancellationDate}
        handleApprove={handleApprove}
        approvalLoading={approvalLoading}
      />
    </Container>
  );
};

export default CancellationForm;