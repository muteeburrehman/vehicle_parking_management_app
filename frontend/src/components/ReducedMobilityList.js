import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Form, InputGroup, Spinner, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {fetchReducedMobilityOwners} from "../services/getOwnerService";


const ReducedMobilityList = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const data = await fetchReducedMobilityOwners();
      setOwners(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return { status: 'No Date', variant: 'secondary' };

    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { status: 'Expired', variant: 'danger', bgClass: 'table-danger' };
    } else if (daysUntilExpiration <= 30) {
      return { status: 'Expiring Soon', variant: 'warning', bgClass: 'table-warning' };
    } else {
      return { status: 'Valid', variant: 'success', bgClass: 'table-success' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const filteredOwners = useMemo(() => {
    return owners.filter(owner =>
      owner.dni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [owners, searchTerm]);

  const handleRowClick = (dni) => {
    navigate(`/owner/edit/${dni}`);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <Card.Title as="h2" className="mb-0">Reduced Mobility Expiration Status</Card.Title>
        </Card.Header>

        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search by DNI, First Name, or Last Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {filteredOwners.length === 0 ? (
            <Alert variant="info">
              No owners found with reduced mobility expiration dates.
            </Alert>
          ) : (
            <Table responsive hover bordered>
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Expiration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOwners.map((owner) => {
                  const { status, bgClass } = getExpirationStatus(owner.reduced_mobility_expiration);
                  return (
                    <tr
                      key={owner.dni}
                      className={`${bgClass} cursor-pointer`}
                      onClick={() => handleRowClick(owner.dni)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{owner.dni}</td>
                      <td>{owner.first_name}</td>
                      <td>{owner.last_name}</td>
                      <td>{owner.phone_number}</td>
                      <td>{owner.email}</td>
                      <td>{formatDate(owner.reduced_mobility_expiration)}</td>
                      <td>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ReducedMobilityList;