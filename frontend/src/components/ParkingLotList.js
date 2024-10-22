import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaCar, FaMotorcycle } from 'react-icons/fa'; // Icons for cars and motorcycles
import './ParkingLotList.css'; // Import custom CSS

const ParkingLotList = () => {
  const [parkingLots, setParkingLots] = useState([]);
  const [parkingLotStats, setParkingLotStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lots = await parkingLotService.getAllParkingLots();
        setParkingLots(lots);
        const stats = await parkingLotService.getParkingLotStats();
        setParkingLotStats(stats);
      } catch (error) {
        console.error('Error fetching parking lots:', error);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (free, min) => {
    return free <= min ? 'danger' : 'success'; // Bootstrap classes for color
  };

  return (
    <Container>
      <h2 className="text-center my-4 text-primary">Available Parking Lots</h2>
      <Row>
        {parkingLots.map((lot) => {
          const stats = parkingLotStats[lot.name] || {};
          const carSpaceStatus = getStatusColor(stats.free_car_spaces, lot.min_car_spaces);
          const motorcycleSpaceStatus = getStatusColor(stats.free_motorcycle_spaces, lot.min_motorcycle_spaces);

          return (
            <Col md={6} lg={4} key={lot.id} className="mb-4">
              <Card className={`parking-card shadow-lg border-${carSpaceStatus}`}>
                <Card.Body>
                  <Card.Title className="text-center mb-3">{lot.name}</Card.Title>
                  <Card.Text className="text-center">
                    <Badge bg={carSpaceStatus} className="mb-2">
                      <FaCar /> Car Spaces: {stats.free_car_spaces}/{lot.total_car_spaces}
                    </Badge>
                    <br />
                    <Badge bg={motorcycleSpaceStatus}>
                      <FaMotorcycle /> Motorcycle Spaces: {stats.free_motorcycle_spaces}/{lot.total_motorcycle_spaces}
                    </Badge>
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default ParkingLotList;
