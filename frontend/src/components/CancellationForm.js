import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { cancelSubscription } from '../services/cancellationService';
import useAuth from "../hooks/useAuth";
const CancellationForm = () => {
  const {user} = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner_id: '',
    subscription_type_id: 0,
    parking_lot:'',
    access_card: '',
    lisence_plate1: '',
    lisence_plate2: '',
    lisence_plate3: '',
    observations: '',
    parking_spot: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      observations: formData.observations
    };
console.log(dataToSend)
    // Call the cancelSubscription service
    await cancelSubscription(dataToSend);

    // Set success and reset error
    setSuccess(true);
    setError(null);

    // Reset the form fields
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

    // Redirect to subscription list after a brief delay
    setTimeout(() => {
      navigate('/subscription-list');
    }, 2000);

  } catch (err) {
    setError(err.detail || "An error occurred while cancelling the subscription.");
    setSuccess(false);
  }
};

  return (
    <Container className="mt-4">
      <h2>Cancel Subscription</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">Cancellation successful! Redirecting...</Alert>}
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
          <Form.Label>Subscription Type ID:</Form.Label>
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
          <Form.Label>Access Card:</Form.Label>
          <Form.Control
            type="text"
            name="access_card"
            value={formData.access_card}
            onChange={handleChange}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="parking_lot" className="mb-3">
          <Form.Label>Parking Lot:</Form.Label>
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
            <Form.Label>License Plate {index + 1}:</Form.Label>
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
          <Form.Label>Observations:</Form.Label>
          <Form.Control
            as="textarea"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="parking_spot" className="mb-3">
          <Form.Label>Parking Spot:</Form.Label>
          <Form.Control
            type="text"
            name="parking_spot"
            value={formData.parking_spot}
            onChange={handleChange}
            readOnly
          />
        </Form.Group>
        <Button variant="danger" type="submit">
          Confirm Cancellation
        </Button>
      </Form>
    </Container>
  );
};

export default CancellationForm;