import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { parkingLotService } from '../services/parkingLotService';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';

const UpdateParkingLotForm = () => {
  const { id } = useParams();
  const [config, setConfig] = useState({
    name: '',
    total_car_spaces: 0,
    total_motorcycle_spaces: 0,
    min_car_spaces: 0,
    min_motorcycle_spaces: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const currentConfig = await parkingLotService.getParkingLotConfig(id);
        setConfig(currentConfig);
      } catch (error) {
        console.error('Error fetching parking lot config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [id]);

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
      await parkingLotService.updateParkingLotConfig(id, config);
      alert('Parking lot configuration updated successfully!');
    } catch (error) {
      alert('Error updating parking lot configuration');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Update Parking Lot</h2>
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
              Update Parking Lot
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateParkingLotForm;