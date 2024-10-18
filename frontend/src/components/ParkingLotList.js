import React, { useState, useEffect } from 'react';
import { parkingLotService } from '../services/parkingLotService';
import { Container, Row, Col, Card } from 'react-bootstrap';

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
    return free <= min ? 'red' : 'green';
  };

  return (
    <Container>
      <h2 className="text-center my-4">Parking Lot List</h2>
      <Row>
        {parkingLots.map((lot) => {
          const stats = parkingLotStats[lot.name] || {};
          return (
            <Col md={6} lg={4} key={lot.id} className="mb-4">
              <Card>
                <Card.Body>
                  <Card.Title>{lot.name}</Card.Title>
                  <Card.Text>
                    <div style={{ color: getStatusColor(stats.free_car_spaces, lot.min_car_spaces) }}>
                      Free Car Spaces: {stats.free_car_spaces}/{lot.total_car_spaces}
                    </div>
                    <div style={{ color: getStatusColor(stats.free_motorcycle_spaces, lot.min_motorcycle_spaces) }}>
                      Free Motorcycle Spaces: {stats.free_motorcycle_spaces}/{lot.total_motorcycle_spaces}
                    </div>
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