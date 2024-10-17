import React, { useEffect, useState } from 'react';
import { fetchSubscriptionHistories } from '../services/subscriptionHistoryService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchOwnerByDNI } from "../services/getOwnerService";

const SubscriptionHistoryList = () => {
    const [subscriptionHistories, setSubscriptionHistories] = useState([]);
    const [owners, setOwners] = useState({});
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchOwnerInfo = async (ownerId) => {
        try {
            const ownerData = await fetchOwnerByDNI(ownerId);
            setOwners(prevOwners => ({
                ...prevOwners,
                [ownerId]: ownerData // Store owner data by ID
            }));
        } catch (err) {
            console.error('Failed to fetch owner info:', err.message);
        }
    };

    useEffect(() => {
        const getSubscriptionData = async () => {
            try {
                const [histories, types] = await Promise.all([
                    fetchSubscriptionHistories(),
                    getSubscriptionTypes(),
                ]);

                histories.forEach(history => fetchOwnerInfo(history.owner_id));
                setSubscriptionHistories(histories);
                setSubscriptionTypes(types);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getSubscriptionData();
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredHistories = subscriptionHistories.filter(history => {
        const ownerIdMatch = history.owner_id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const licensePlateMatch = [history.lisence_plate1, history.lisence_plate2, history.lisence_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchQuery.toLowerCase()));
        return ownerIdMatch || licensePlateMatch;
    });

    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown';
    };

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

    const handleRowClick = (historyId) => {
        navigate(`/subscription-history/${historyId}`);
    };

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error: {error}</Alert>;
    }

    return (
        <div>
            <h2 className="mb-4">Subscription History</h2>
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
            {filteredHistories.length === 0 ? (
                <Alert variant="info">No subscription histories found.</Alert>
            ) : (
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
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistories.map(history => {
                            const owner = owners[history.owner_id] || {}; // Fetch owner info
                            return (
                                <tr key={history.history_id} onClick={() => handleRowClick(history.history_id)} style={{ cursor: 'pointer' }}>
                                    <td>{history.owner_id}</td>
                                    <td>{owner.first_name}</td> {/* Display full name */}
                                    <td>{owner.last_name}</td>
                                    <td>{getSubscriptionTypeName(history.subscription_type_id)}</td>
                                   <td>{owner.email}</td>
                                    <td>{owner.phone_number}</td>
                                    <td>{history.observations}</td>
                                    <td>{formatDate(history.registration_date)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default SubscriptionHistoryList;
