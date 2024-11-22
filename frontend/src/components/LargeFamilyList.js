import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Form, InputGroup, Spinner, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchLargeFamilySubscriptions, getSubscriptionTypes } from "../services/subscriptionService";
import { fetchOwnerByDNI } from "../services/getOwnerService";

const LargeFamilyList = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [owners, setOwners] = useState({});
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchOwnerInfo = async (ownerId) => {
    try {
      const ownerData = await fetchOwnerByDNI(ownerId);
      setOwners(prevOwners => ({
        ...prevOwners,
        [ownerId]: ownerData
      }));
    } catch (err) {
      console.error('Failed to fetch owner info:', err.message);
    }
  };

  useEffect(() => {
    const fetchSubscriptionsAndTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const [subs, types] = await Promise.all([
          fetchLargeFamilySubscriptions(),
          getSubscriptionTypes()
        ]);
        setSubscriptions(subs);
        setSubscriptionTypes(types);

        // Fetch owner info for each subscription
        subs.forEach(sub => fetchOwnerInfo(sub.owner_id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionsAndTypes();
  }, []);

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

  const formatLicensePlates = (subscription) => {
    const plates = [
      subscription.lisence_plate1,
      subscription.lisence_plate2,
      subscription.lisence_plate3
    ].filter(Boolean);
    return plates.join(', ') || '-';
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(subscription =>
      subscription.lisence_plate1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.lisence_plate2?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.lisence_plate3?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subscriptions, searchTerm]);

  const handleRowClick = (id) => {
    navigate(`/subscription/edit/${id}`);
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
          <Card.Title as="h2" className="mb-0">Large Family Subscription Status</Card.Title>
        </Card.Header>

        <Card.Body>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Search by Access Card, License Plate, or Parking Spot"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {filteredSubscriptions.length === 0 ? (
            <Alert variant="info">
              No subscriptions found with large family expiration dates.
            </Alert>
          ) : (
            <Table responsive hover bordered>
              <thead>
                <tr>
                  <th>Owner ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Subscription Type</th>
                  <th>License Plates</th>
                  <th>Effective Date</th>
                  <th>Large Family Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((subscription) => {
                  const { status, bgClass } = getExpirationStatus(subscription.large_family_expiration);
                  const subType = subscriptionTypes.find((type) => type.id === subscription.subscription_type_id);
                  const owner = owners[subscription.owner_id] || {};

                  return (
                    <tr
                      key={subscription.id}
                      className={`${bgClass} cursor-pointer`}
                      onClick={() => handleRowClick(subscription.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{subscription.owner_id}</td>
                      <td>{owner.first_name || 'Loading...'}</td>
                      <td>{owner.last_name || 'Loading...'}</td>
                      <td>{subType ? subType.name : 'Unknown'}</td>
                      <td>{formatLicensePlates(subscription)}</td>
                      <td>{formatDate(subscription.effective_date)}</td>
                      <td>{formatDate(subscription.large_family_expiration)}</td>
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

export default LargeFamilyList;