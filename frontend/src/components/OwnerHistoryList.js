import React, { useEffect, useState } from 'react';
import { fetchOwnerHistories } from '../services/ownerHistoryService';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const OwnerHistoryList = () => {
    const [ownerHistories, setOwnerHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const navigate = useNavigate();

    useEffect(() => {
        const getOwnerHistories = async () => {
            try {
                const histories = await fetchOwnerHistories();
                setOwnerHistories(histories);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getOwnerHistories();
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

    // Function to format dates
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

    // Function to handle row click
    const handleRowClick = (historyId) => {
        navigate(`/owner-history/${historyId}`); // Redirect to details page
    };

    // Filtered owner histories based on search query
    const filteredHistories = ownerHistories.filter(history => {
        const { history_id, dni, first_name, last_name } = history;
        return (
            String(history_id).includes(searchQuery) ||
                String(dni).includes(searchQuery) ||
            first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (last_name && last_name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });

    return (
        <div>
            <h2 className="mb-4">Owner History</h2>
            <Form.Control
                type="text"
                placeholder="Search by DNI, First Name or Last Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
            />
            {filteredHistories.length === 0 ? (
                <Alert variant="info">No owner histories found.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>History ID</th>
                            <th>DNI</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Email</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistories.map((history) => (
                            <tr key={history.history_id} onClick={() => handleRowClick(history.history_id)} style={{ cursor: 'pointer' }}>
                                <td>{history.history_id}</td>
                                <td>{history.dni}</td>
                                <td>{history.first_name}</td>
                                <td>{history.last_name || 'N/A'}</td>
                                <td>{history.email}</td>
                                <td>{formatDate(history.registration_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default OwnerHistoryList;
