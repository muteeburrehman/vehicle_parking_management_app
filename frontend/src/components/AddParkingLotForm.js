import React, { useState } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const AddParkingLotForm = () => {
  const [config, setConfig] = useState({
    name: '',
    total_car_spaces: 0,
    total_motorcycle_spaces: 0,
    min_car_spaces: 0,
    min_motorcycle_spaces: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: name === 'name' ? value : parseInt(value, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await parkingLotService.createParkingLotConfig(config);
      alert('Parking lot configuration added successfully!');
      // Reset form or redirect to list page
    } catch (error) {
      alert('Error adding parking lot configuration');
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Add New Parking Lot</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="name">
              <Form.Label>Parking Lot Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={config.name}
                onChange={handleChange}
                required
                placeholder="Enter parking lot name"
              />
            </Form.Group>

            <Form.Group controlId="total_car_spaces" className="mt-3">
              <Form.Label>Total Car Spaces</Form.Label>
              <Form.Control
                type="number"
                name="total_car_spaces"
                value={config.total_car_spaces}
                onChange={handleChange}
                required
                placeholder="Enter total car spaces"
              />
            </Form.Group>

            <Form.Group controlId="min_car_spaces" className="mt-3">
              <Form.Label>Minimum Car Spaces</Form.Label>
              <Form.Control
                type="number"
                name="min_car_spaces"
                value={config.min_car_spaces}
                onChange={handleChange}
                required
                placeholder="Enter minimum car spaces"
              />
            </Form.Group>

            <Form.Group controlId="total_motorcycle_spaces" className="mt-3">
              <Form.Label>Total Motorcycle Spaces</Form.Label>
              <Form.Control
                type="number"
                name="total_motorcycle_spaces"
                value={config.total_motorcycle_spaces}
                onChange={handleChange}
                required
                placeholder="Enter total motorcycle spaces"
              />
            </Form.Group>

            <Form.Group controlId="min_motorcycle_spaces" className="mt-3">
              <Form.Label>Minimum Motorcycle Spaces</Form.Label>
              <Form.Control
                type="number"
                name="min_motorcycle_spaces"
                value={config.min_motorcycle_spaces}
                onChange={handleChange}
                required
                placeholder="Enter minimum motorcycle spaces"
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="mt-4 w-100">
              Add Parking Lot
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AddParkingLotForm;