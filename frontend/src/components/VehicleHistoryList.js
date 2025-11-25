import React, { useEffect, useState } from 'react';
import { fetchVehicleHistories } from '../services/vehicleHistoryService';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchOwnerByDNI } from "../services/getOwnerService";

const VehicleHistoryList = () => {
    const [vehicleHistories, setVehicleHistories] = useState([]);
    const [owners, setOwners] = useState({});
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
        const getVehicleHistories = async () => {
            try {
                const histories = await fetchVehicleHistories();
                
                // Sort by modification_time in descending order (most recent first)
                const sortedHistories = histories.sort((a, b) => {
                    const dateA = new Date(a.modification_time || a.registration_date);
                    const dateB = new Date(b.modification_time || b.registration_date);
                    return dateB - dateA;
                });
                
                setVehicleHistories(sortedHistories);

                // Fetch owner data for each vehicle history
                const ownerIds = sortedHistories.map(history => history.owner_id);
                await Promise.all(ownerIds.map(fetchOwnerInfo)); // Fetch all owner data in parallel

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
        navigate(`/vehicle-history/${historyId}`);
    };

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
            <h2 className="mb-4">Histórico de Vehículos</h2>
            <Form className="mb-4">
                <Form.Group controlId="search">
                    <Form.Control
                        type="text"
                        placeholder="Busca por DNI o matrícula."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Form.Group>
            </Form>
            {filteredHistories.length === 0 ? (
                <Alert variant="info">No se han encontrado histórico de vehiculos.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Telefono</th>
                        <th>Email</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Fecha de registro</th>
                        <th style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>Fecha de Modificación</th>
                    </tr>
                    </thead>
                    <tbody>
                        {filteredHistories.map((history) => {
                            const owner = owners[history.owner_id] || {}; // Retrieve owner data from state
                            return (
                                <tr key={history.history_id} onClick={() => handleRowClick(history.history_id)}
                                    style={{cursor: 'pointer'}}>
                                    <td>{history.lisence_plate}</td>
                                    <td>{history.owner_id}</td>
                                    <td>{owner.first_name || 'N/A'} </td>
                                    <td>{owner.last_name || ''}</td>
                                    <td>{owner.phone_number || 'N/A'}</td>
                                    <td>{owner.email || 'N/A'}</td>
                                    <td>{history.brand}</td>
                                    <td>{history.model || 'N/A'}</td>
                                    <td>{formatDate(history.registration_date)}</td>
                                    <td style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
                                        {formatDate(history.modification_time)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default VehicleHistoryList;
