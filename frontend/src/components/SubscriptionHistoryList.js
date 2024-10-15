import React, { useEffect, useState } from 'react';
import { fetchSubscriptionHistories } from '../services/subscriptionHistoryService';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SubscriptionHistoryList = () => {
    const [subscriptionHistories, setSubscriptionHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const navigate = useNavigate(); // Hook to navigate to the detail page

    useEffect(() => {
        const getSubscriptionHistories = async () => {
            try {
                const histories = await fetchSubscriptionHistories();
                setSubscriptionHistories(histories);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getSubscriptionHistories();
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value); // Update search query state
    };

    const filteredHistories = subscriptionHistories.filter(history => {
        const ownerIdMatch = history.owner_id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const licensePlateMatch = [history.lisence_plate1, history.lisence_plate2, history.lisence_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchQuery.toLowerCase()));
        return ownerIdMatch || licensePlateMatch; // Filter by owner ID or license plates
    });

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
        navigate(`/subscription-history/${historyId}`); // Redirect to details page
    };

    return (
        <div>
            <h2 className="mb-4">Subscription History</h2>
            <Form className="mb-4">
                <Form.Group controlId="search">
                    <Form.Control
                        type="text"
                        placeholder="Search by Owner ID or License Plate..."
                        value={searchQuery}
                        onChange={handleSearchChange} // Handle input change
                    />
                </Form.Group>
            </Form>
            {filteredHistories.length === 0 ? (
                <Alert variant="info">No subscription histories found.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>History ID</th>
                            <th>Owner ID</th>
                            <th>Subscription Type ID</th>
                            <th>Access Card</th>
                            <th>License Plate 1</th>
                            <th>License Plate 2</th>
                            <th>License Plate 3</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistories.map((history) => (
                            <tr key={history.history_id} onClick={() => handleRowClick(history.history_id)} style={{ cursor: 'pointer' }}>
                                <td>{history.history_id}</td>
                                <td>{history.owner_id}</td>
                                <td>{history.subscription_type_id}</td>
                                <td>{history.access_card}</td>
                                <td>{history.lisence_plate1}</td>
                                <td>{history.lisence_plate2 || 'N/A'}</td>
                                <td>{history.lisence_plate3 || 'N/A'}</td>
                                <td>{formatDate(history.registration_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default SubscriptionHistoryList;
