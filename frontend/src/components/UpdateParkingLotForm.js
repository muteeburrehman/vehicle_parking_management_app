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
        console.error('Error recopilando información de la configuración de aparcamientos:', error);
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
      alert('Configuración del aparcamiento actualizada con éxito!');
    } catch (error) {
      alert('Error actualizando la configuración del aparcamiento');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">Actualizar Aparcamiento</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="name">
              <Form.Label>Nombre del aparcamiento</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={config.name}
                onChange={handleChange}
                required
                placeholder="Introduzca nombre del aparcamiento"
              />
            </Form.Group>

            <Form.Group controlId="total_car_spaces" className="mt-3">
              <Form.Label>Plazas totales de coches</Form.Label>
              <Form.Control
                type="number"
                name="total_car_spaces"
                value={config.total_car_spaces}
                onChange={handleChange}
                required
                placeholder="Introduzca el nº total de plazas para coche"
              />
            </Form.Group>

            <Form.Group controlId="min_car_spaces" className="mt-3">
              <Form.Label>Mínimo de plazas libres de coche</Form.Label>
              <Form.Control
                type="number"
                name="min_car_spaces"
                value={config.min_car_spaces}
                onChange={handleChange}
                required
                placeholder="Introduzca el nº mínimo de plazas libres de coche deseadas"
              />
            </Form.Group>

            <Form.Group controlId="total_motorcycle_spaces" className="mt-3">
              <Form.Label>Plazas totales para moto</Form.Label>
              <Form.Control
                type="number"
                name="total_motorcycle_spaces"
                value={config.total_motorcycle_spaces}
                onChange={handleChange}
                required
                placeholder="Introduzca el nº total de plazas para coche"
              />
            </Form.Group>

            <Form.Group controlId="min_motorcycle_spaces" className="mt-3">
              <Form.Label>Mínimo de plazas libres de moto</Form.Label>
              <Form.Control
                type="number"
                name="min_motorcycle_spaces"
                value={config.min_motorcycle_spaces}
                onChange={handleChange}
                required
                placeholder="ntroduzca el nº mínimo de plazas libres de moto deseadas"
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="mt-4 w-100">
              Actualizar Aparcamiento
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default UpdateParkingLotForm;