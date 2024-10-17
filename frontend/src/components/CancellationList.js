import React, { useEffect, useState } from 'react';
import { getAllCancellations } from '../services/cancellationService';
import { Container, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionTypes } from '../services/subscriptionService';
import { fetchOwnerByDNI } from "../services/getOwnerService";

const CancellationList = () => {
    const [cancellations, setCancellations] = useState([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [owners, setOwners] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCancellations = async () => {
            try {
                const [cancellationData, types] = await Promise.all([
                    getAllCancellations(),
                    getSubscriptionTypes(),
                ]);
                setCancellations(cancellationData);
                setSubscriptionTypes(types);

                // Fetch owner data for each cancellation
                const ownerPromises = cancellationData.map(cancellation =>
                    fetchOwnerByDNI(cancellation.owner_id)
                );
                const ownerData = await Promise.all(ownerPromises);
                const ownersMap = ownerData.reduce((acc, owner, index) => {
                    acc[cancellationData[index].owner_id] = owner;
                    return acc;
                }, {});
                setOwners(ownersMap);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCancellations();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const handleRowClick = (id) => {
        navigate(`/cancellations/${id}`);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredCancellations = cancellations.filter(cancelled => {
        const ownerIdMatch = cancelled.owner_id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const licensePlateMatch = [cancelled.license_plate1, cancelled.license_plate2, cancelled.license_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchQuery.toLowerCase()));
        return ownerIdMatch || licensePlateMatch;
    });

    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown';
    };

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Cancelled Subscriptions</h2>
            <Form className="mb-4">
                <Form.Group controlId="search">
                    <Form.Control
                        type="text"
                        placeholder="Search by Owner ID or License Plate..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </Form.Group>
            </Form>
            {loading && <Spinner animation="border" variant="primary" />}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>DNI</th>
                            <th>Name</th>
                            <th>Last Name</th>
                            <th>Subscription Type</th>
                            <th>Email</th>
                            <th>Telephone</th>
                            <th>Observations</th>
                            <th>Registration Date</th>
                            <th>Cancellation Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCancellations.map((cancelled) => {
                            const owner = owners[cancelled.owner_id] || {};
                            return (
                                <tr key={cancelled.id} onClick={() => handleRowClick(cancelled.id)} style={{ cursor: 'pointer' }}>
                                    <td>{cancelled.owner_id}</td>
                                    <td>{owner.first_name || '-'}</td>
                                    <td>{owner.last_name || '-'}</td>
                                    <td>{getSubscriptionTypeName(cancelled.subscription_type_id)}</td>
                                    <td>{owner.email || '-'}</td>
                                    <td>{owner.phone_number || '-'}</td>
                                    <td>{cancelled.observations || 'N/A'}</td>
                                    <td>{formatDate(cancelled.registration_date)}</td>
                                    <td>{formatDate(cancelled.modification_time)}</td>
                                </tr>
                            );
                        })}
                        {filteredCancellations.length === 0 && (
                            <tr>
                                <td colSpan="9" className="text-center">
                                    No cancellations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default CancellationList;