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

                console.log('Cancellation data received:', cancellationData);

                // Your backend returns an array directly, so use it as-is
                const cancellationArray = Array.isArray(cancellationData) ? cancellationData : [];
                const typesArray = Array.isArray(types) ? types : [];

                setCancellations(cancellationArray);
                setSubscriptionTypes(typesArray);

                // Only fetch owner data if we have cancellations
                if (cancellationArray.length > 0) {
                    const ownerPromises = cancellationArray.map(cancellation =>
                        fetchOwnerByDNI(cancellation.owner_id)
                    );
                    const ownerData = await Promise.all(ownerPromises);
                    const ownersMap = ownerData.reduce((acc, owner, index) => {
                        acc[cancellationArray[index].owner_id] = owner;
                        return acc;
                    }, {});
                    setOwners(ownersMap);
                }
            } catch (err) {
                console.error('Error fetching cancellations:', err);
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

    // Ensure cancellations is always an array before filtering
    const filteredCancellations = Array.isArray(cancellations) ? cancellations.filter(cancelled => {
        const ownerIdMatch = cancelled.owner_id?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        const licensePlateMatch = [cancelled.license_plate1, cancelled.license_plate2, cancelled.license_plate3]
            .some(plate => plate && plate.toLowerCase().includes(searchQuery.toLowerCase()));
        return ownerIdMatch || licensePlateMatch;
    }) : [];

    const getSubscriptionTypeName = (typeId) => {
        const subType = subscriptionTypes.find(type => type.id === typeId);
        return subType ? subType.name : 'Unknown';
    };

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Cancelaciones pendientes de firma</h2>
            <Form className="mb-4">
                <Form.Group controlId="search">
                    <Form.Control
                        type="text"
                        placeholder="Busca por DNI o Matrícula..."
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
                            <th>Nombre</th>
                            <th>Apellidos</th>
                            <th>Tipo de abono</th>
                            <th>Email</th>
                            <th>Telefono</th>
                            <th>Observaciones</th>
                            <th>Fecha de Registro</th>
                            <th>Fecha de Baja</th>
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
                                    No se encuentran abonos pendientes de baja.
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