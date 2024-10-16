import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const ParkingLotConfigForm = () => {
  const [config, setConfig] = useState({
    total_car_spaces: 0,
    total_motorcycle_spaces: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const currentConfig = await parkingLotService.getParkingLotConfig();
        if (currentConfig) {
          setConfig({
            total_car_spaces: currentConfig.total_car_spaces,
            total_motorcycle_spaces: currentConfig.total_motorcycle_spaces,
          });
        }
      } catch (error) {
        console.error('Error fetching parking lot config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

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
      await parkingLotService.createOrUpdateParkingLotConfig(config);
      alert('Parking lot configuration saved successfully!');
    } catch (error) {
      alert('Error saving parking lot configuration');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Parking Lot Configuration</h2>
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
              Save Configuration
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default ParkingLotConfigForm;