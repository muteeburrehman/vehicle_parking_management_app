import React, { useEffect, useState } from 'react';
import { getApprovedCancellations } from '../services/approveCancellationService';
import { getSubscriptionTypes } from '../services/subscriptionService';
import { fetchOwnerByDNI } from "../services/getOwnerService";
import { Container, Table, Alert, Spinner, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ApproveCancellationList = () => {
    const [approvedCancellations, setApprovedCancellations] = useState([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [owners, setOwners] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Log the response to see its structure
                const cancellationResponse = await getApprovedCancellations();
                console.log('API Response:', cancellationResponse);

                // Extract the array from the response
                const cancellations = cancellationResponse.approved_cancellations || [];
                console.log('Extracted cancellations:', cancellations);

                const types = await getSubscriptionTypes();

                setApprovedCancellations(cancellations);
                setSubscriptionTypes(types);

                // Fetch owner data for each cancellation
                const ownerPromises = cancellations.map(cancellation =>
                    fetchOwnerByDNI(cancellation.owner_id)
                );
                const ownerData = await Promise.all(ownerPromises);
                const ownersMap = ownerData.reduce((acc, owner, index) => {
                    acc[cancellations[index].owner_id] = owner;
                    return acc;
                }, {});
                setOwners(ownersMap);
                setError('');
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to fetch approved cancellations');
                setApprovedCancellations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
    navigate(`/approved-cancellation-detail/${id}`);
};

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredCancellations = approvedCancellations.filter(approved => {
        if (!approved) return false;

        const searchLower = searchQuery.toLowerCase();
        const ownerIdMatch = approved.owner_id?.toString().toLowerCase().includes(searchLower);
        const licensePlateMatch = [approved.lisence_plate1, approved.lisence_plate2, approved.lisence_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchLower));
        return ownerIdMatch || licensePlateMatch;
    });

    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown';
    };

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Approved Cancellations</h2>

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

            {loading && (
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                </div>
            )}

            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

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
                        {filteredCancellations.length > 0 ? (
                            filteredCancellations.map((approved) => {
                                const owner = owners[approved.owner_id] || {};
                                return (
                                    <tr
                                        key={approved.id}
                                        onClick={() => handleRowClick(approved.id)}
                                        style={{ cursor: 'pointer' }}
                                        className="hover:bg-gray-100"
                                    >
                                        <td>{approved.owner_id}</td>
                                        <td>{owner.first_name || '-'}</td>
                                        <td>{owner.last_name || '-'}</td>
                                        <td>{getSubscriptionTypeName(approved.subscription_type_id)}</td>
                                        <td>{owner.email || '-'}</td>
                                        <td>{owner.phone_number || '-'}</td>
                                        <td>{approved.observations || 'N/A'}</td>
                                        <td>{formatDate(approved.registration_date)}</td>
                                        <td>{formatDate(approved.modification_time)}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" className="text-center">
                                    {searchQuery ? 'No matching cancellations found.' : 'No approved cancellations available.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default ApproveCancellationList;