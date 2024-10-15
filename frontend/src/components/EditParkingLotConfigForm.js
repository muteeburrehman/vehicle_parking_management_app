import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const EditParkingLotConfigForm = ({ configId }) => {
  const [config, setConfig] = useState({
    total_car_spaces: 0,
    total_motorcycle_spaces: 0,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configs = await parkingLotService.getParkingLotConfigs();
        const currentConfig = configs.find(c => c.id === configId);
        if (currentConfig) {
          setConfig({
            total_car_spaces: currentConfig.total_car_spaces,
            total_motorcycle_spaces: currentConfig.total_motorcycle_spaces,
            modified_by: currentConfig.modified_by,
          });
        }
      } catch (error) {
        console.error('Error fetching parking lot config:', error);
      }
    };

    fetchConfig();
  }, [configId]);

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
      await parkingLotService.updateParkingLotConfig(configId, config);
      alert('Parking lot configuration updated successfully!');
    } catch (error) {
      alert('Error updating parking lot configuration');
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Edit Parking Lot Configuration</h2>
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
              Update Configuration
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default EditParkingLotConfigForm;
