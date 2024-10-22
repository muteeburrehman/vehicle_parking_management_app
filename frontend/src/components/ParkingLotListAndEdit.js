import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Container, Row, Col, ListGroup, Form, Button, Alert, Card } from 'react-bootstrap';
import './ParkingLotListAndEdit.css'; // Custom CSS for additional styling

const ParkingLotListAndEdit = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      const lots = await parkingLotService.getAllParkingLots();
      setParkingLots(lots);
    } catch (error) {
      setError('Failed to fetch parking lots');
    }
  };

  const handleLotSelect = (lot) => {
    setSelectedLot(lot);
    setEditForm(lot);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseInt(value, 10)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await parkingLotService.updateParkingLotConfig(selectedLot.id, editForm);
      setSuccess('Parking lot updated successfully');
      fetchParkingLots(); // Refresh the list
    } catch (error) {
      setError('Failed to update parking lot');
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col md={4}>
          <h2 className="text-center mb-4">Parking Lots</h2>
          <ListGroup className="lot-list">
            {parkingLots.map(lot => (
              <ListGroup.Item
                key={lot.id}
                action
                onClick={() => handleLotSelect(lot)}
                active={selectedLot && selectedLot.id === lot.id}
                className={`lot-item ${selectedLot && selectedLot.id === lot.id ? 'active-lot' : ''}`}
              >
                {lot.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={8}>
          {selectedLot ? (
            <Card className="p-4 shadow-lg">
              <Form onSubmit={handleSubmit}>
                <h2 className="mb-4">Edit Parking Lot: {selectedLot.name}</h2>
                {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                {success && <Alert variant="success" className="text-center">{success}</Alert>}
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editForm.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="total_car_spaces" className="mt-3">
                  <Form.Label>Total Car Spaces</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_car_spaces"
                    value={editForm.total_car_spaces || 0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="total_motorcycle_spaces" className="mt-3">
                  <Form.Label>Total Motorcycle Spaces</Form.Label>
                  <Form.Control
                    type="number"
                    name="total_motorcycle_spaces"
                    value={editForm.total_motorcycle_spaces || 0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="min_car_spaces" className="mt-3">
                  <Form.Label>Minimum Car Spaces</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_car_spaces"
                    value={editForm.min_car_spaces || 0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="min_motorcycle_spaces" className="mt-3">
                  <Form.Label>Minimum Motorcycle Spaces</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_motorcycle_spaces"
                    value={editForm.min_motorcycle_spaces || 0}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-4 w-100">
                  Update Parking Lot
                </Button>
              </Form>
            </Card>
          ) : (
            <div className="text-center">
              <p className="fs-4">Select a parking lot to edit</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ParkingLotListAndEdit;
