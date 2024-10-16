// src/components/CancellationList.js

import React, {useEffect, useState} from 'react';
import {getAllCancellations} from '../services/cancellationService';
import {Container, Table, Alert, Spinner, Form} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import {getSubscriptionTypes} from '../services/subscriptionService'; // Fetch subscription types

const CancellationList = () => {
    const [cancellations, setCancellations] = useState([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]); // State for subscription types

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCancellations = async () => {
               try {
                // Fetch both cancellations and subscription types in parallel
                const [cancellationData, types] = await Promise.all([
                    getAllCancellations(),
                    getSubscriptionTypes(),
                ]);
                setCancellations(cancellationData);
                setSubscriptionTypes(types);
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
        setSearchQuery(event.target.value); // Update search query state
    };

    // Filter cancellations based on search query
    const filteredCancellations = cancellations.filter(cancelled => {
        const ownerIdMatch = cancelled.owner_id.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const licensePlateMatch = [cancelled.lisence_plate1, cancelled.lisence_plate2, cancelled.lisence_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchQuery.toLowerCase()));
        return ownerIdMatch || licensePlateMatch; // Filter by owner ID or license plates
    });

   const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown'; // Return subscription type name or 'Unknown'
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
                        onChange={handleSearchChange} // Handle input change
                    />
                </Form.Group>
            </Form>
            {loading && <Spinner animation="border" variant="primary"/>}
            {error && <Alert variant="danger">{error}</Alert>}
            {!loading && !error && (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>Owner ID</th>
                        <th>Subscription Name</th>
                        <th>Access Card</th>
                        <th>License Plate 1</th>
                        <th>License Plate 2</th>
                        <th>License Plate 3</th>
                        <th>Observations</th>
                        <th>Parking Spot</th>
                        <th>Registration Date</th>
                        <th>Cancellation Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredCancellations.map((cancelled) => (
                        <tr key={cancelled.id} onClick={() => handleRowClick(cancelled.id)} style={{cursor: 'pointer'}}>
                            <td>{cancelled.owner_id}</td>
  <td>{getSubscriptionTypeName(cancelled.subscription_type_id)}</td> {/* Display subscription type name */}                            <td>{cancelled.access_card || 'N/A'}</td>
                            <td>{cancelled.lisence_plate1 || 'N/A'}</td>
                            <td>{cancelled.lisence_plate2 || 'N/A'}</td>
                            <td>{cancelled.lisence_plate3 || 'N/A'}</td>
                            <td>{cancelled.observations || 'N/A'}</td>
                            <td>{cancelled.parking_spot || 'N/A'}</td>
                            <td>{formatDate(cancelled.registration_date)}</td>
                            <td>{formatDate(cancelled.modification_time)}</td>
                        </tr>
                    ))}
                    {filteredCancellations.length === 0 && (
                        <tr>
                            <td colSpan="10" className="text-center">
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
