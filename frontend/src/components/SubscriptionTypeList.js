import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionTypes } from '../services/subscriptionService';
import { Table, Button, Spinner, Alert, Container, InputGroup, FormControl } from 'react-bootstrap';

const SubscriptionTypeList = () => {
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubscriptionTypes = async () => {
            setLoading(true);
            setError(null);
            try {
                const types = await getSubscriptionTypes();
                setSubscriptionTypes(types);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionTypes();
    }, []);

    const handleEdit = (id) => {
        navigate(`/subscription_types/edit/${id}`);
    };

    const handleAddNew = () => {
        navigate('/add-subscription-type');
    };

    // Filter subscription types based on the search term (name or code)
    const filteredSubscriptionTypes = useMemo(() => {
        return subscriptionTypes.filter(type =>
            type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            type.parking_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [subscriptionTypes, searchTerm]);

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Listado de Tipos de Abono</h2>
            <Button className="mb-3" variant="primary" onClick={handleAddNew}>
                +Añadir Nuevo Tipo de Abono
            </Button>

            {/* Search bar */}
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Buscar por Nombre o Código"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            {loading && (
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            )}

            {error && <Alert variant="danger">Error: {error.message}</Alert>}

            {filteredSubscriptionTypes.length === 0 ? (
                <Alert variant="info">No subscription types available.</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            {/*<th>ID</th> */}
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Código SAGE</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSubscriptionTypes.map((type) => (
                            <tr key={type.id}>
                                {/*<td>{type.id}</td> */}
                                <td>{type.name}</td>
                                <td>€{type.price.toFixed(2)}</td>
                                <td>{type.parking_code}</td>
                                <td>
                                    <Button
                                        variant="warning"
                                        onClick={() => handleEdit(type.id)}
                                    >
                                        Editar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default SubscriptionTypeList;
