import React, { useState } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const ParkingLotConfigForm = () => {
  const [config, setConfig] = useState({
    total_car_spaces: 0,
    total_motorcycle_spaces: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: parseInt(value, 10),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await parkingLotService.createParkingLotConfig(config);
      alert('Parking lot configuration created successfully!');
      setConfig({ total_car_spaces: 0, total_motorcycle_spaces: 0, created_by: '' });
    } catch (error) {
      alert('Error creating parking lot configuration');
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Add Parking Lot Configuration</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="total_car_spaces">
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

            <Button variant="primary" type="submit" className="mt-4 w-100">
              Create Configuration
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ParkingLotConfigForm;
