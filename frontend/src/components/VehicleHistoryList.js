import React, { useEffect, useState } from 'react';
import { fetchVehicleHistories } from '../services/vehicleHistoryService';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const VehicleHistoryList = () => {
    const [vehicleHistories, setVehicleHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const navigate = useNavigate(); // Hook to navigate to the detail page

    useEffect(() => {
        const getVehicleHistories = async () => {
            try {
                const histories = await fetchVehicleHistories();
                setVehicleHistories(histories);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getVehicleHistories();
    }, []);

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
        navigate(`/vehicle-history/${historyId}`); // Redirect to details page
    };

    // Filter vehicle histories based on the search query
    const filteredHistories = vehicleHistories.filter((history) => {
        const { owner_id, lisence_plate } = history;
        const lowerSearchQuery = searchQuery.toLowerCase();
        return (
            owner_id.toString().includes(lowerSearchQuery) ||
            lisence_plate.toLowerCase().includes(lowerSearchQuery)
        );
    });

    return (
        <div>
            <h2 className="mb-4">Owner History</h2>
            <Form className="mb-4">
                <Form.Group controlId="search">
                    <Form.Control
                        type="text"
                        placeholder="Search by Owner ID or License Plate"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Form.Group>
            </Form>
            {filteredHistories.length === 0 ? (
                <Alert variant="info">No vehicle histories found.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>History ID</th>
                            <th>License Plate</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Vehicle Type</th>
                            <th>Owner ID</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistories.map((history) => (
                            <tr key={history.history_id} onClick={() => handleRowClick(history.history_id)}
                                style={{ cursor: 'pointer' }}>
                                <td>{history.history_id}</td>
                                <td>{history.lisence_plate}</td>
                                <td>{history.brand}</td>
                                <td>{history.model || 'N/A'}</td>
                                <td>{history.vehicle_type}</td>
                                <td>{history.owner_id}</td>
                                <td>{formatDate(history.registration_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default VehicleHistoryList;
