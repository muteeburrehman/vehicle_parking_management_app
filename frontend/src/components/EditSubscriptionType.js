import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubscriptionTypeById, updateSubscriptionType } from '../services/subscriptionService';
import { Form, Button, Container, Spinner, Alert } from 'react-bootstrap';
import {deleteSubscriptionType} from "../services/deleteServices";

const EditSubscriptionType = () => {
    const { id } = useParams();
    const [subscriptionType, setSubscriptionType] = useState({ name: '', price: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
         const [, setShowToast] = useState(false);
    const [, setToastMessage] = useState('');
    const [, setToastVariant] = useState('success');
     const [successMessage, setSuccessMessage] = useState('');


    useEffect(() => {
        const fetchSubscriptionType = async () => {
            try {
                const data = await getSubscriptionTypeById(id);
                setSubscriptionType(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionType();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubscriptionType({ ...subscriptionType, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateSubscriptionType(id, {
                name: subscriptionType.name,
                price: parseFloat(subscriptionType.price),
                parking_code: subscriptionType.parking_code
            });
            navigate('/subscription-type-list');
        } catch (err) {
            setError(err);
        }
    };

const handleDeleteSubscriptionType = async () => {
        const confirmDelete = window.confirm("Esta seguro que quiere borrar este tipo de abono?");
        if (confirmDelete) {
            try {
                await deleteSubscriptionType(id);
                setToastMessage("Tipo de abono borrado correctamente!");
                setToastVariant('Éxito');
                setShowToast(true);
                setSuccessMessage('Tipo de abono borrado con éxito');
                setTimeout(() => {
                    navigate("/subscription-type-list");
                }, 2000);
            } catch (err) {
                console.error('Fallo al borrar el vehículo:', err);
                setToastMessage(`Fallo al borrar tipo de abono: ${err.response?.data?.detail || err.message}`);
                setToastVariant('Peligro');
                setShowToast(true);
            }
        }
    };

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Editar tipo de abono</h2>

            {loading ? (
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            ) : error ? (
                <Alert variant="danger">Error: {error.message}</Alert>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formSubscriptionName" className="mb-3">
                        <Form.Label>Nombre:</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={subscriptionType.name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formSubscriptionPrice" className="mb-3">
                        <Form.Label>Precio:</Form.Label>
                        <Form.Control
                            type="number"
                            name="price"
                            value={subscriptionType.price}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formSubscriptionParkingCode" className="mb-3">
                        <Form.Label>Código:</Form.Label>
                        <Form.Control
                            type="text"
                            name="parking_code"
                            value={subscriptionType.parking_code}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                     {successMessage && <Alert variant="Éxito">{successMessage}</Alert>}
                    {error && <Alert variant="peligro">{error}</Alert>}

                    <Button variant="primary" type="submit">
                        Editar tipo de abono
                    </Button>
                     <Button variant="danger" onClick={handleDeleteSubscriptionType} style={{ marginLeft: '10px' }}>
                        Borrar tipo de abono
                    </Button>
                </Form>
            )}
        </Container>
    );
};

export default EditSubscriptionType;
