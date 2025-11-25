import React, { useState } from 'react';
import { useSubscriptionType } from '../hooks/useSubscriptionType';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import {useNavigate} from "react-router-dom";

const AddSubscriptionType = () => {
    const { addSubscriptionType, loading, error } = useSubscriptionType();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [parking_code, setParkingCode] = useState('')
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const subscriptionData = {
            name,
            price: parseFloat(price),
            parking_code
        };

        await addSubscriptionType(subscriptionData);
        setName('');
        setPrice('');
        setParkingCode('')
        navigate('/subscription-type-list');


    };

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Añadir tipo de abono</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formSubscriptionName">
                    <Form.Label>Nombre:</Form.Label>
                    <Form.Control
                        type="text"
                        className="mb-3"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Introduzca nombre de tipo de abono"
                    />
                </Form.Group>

                <Form.Group controlId="formSubscriptionPrice">
                    <Form.Label>Precio:</Form.Label>
                    <Form.Control
                        type="number"
                        className="mb-3"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        placeholder="Introduzca precio del abono"
                    />
                </Form.Group>

                 <Form.Group controlId="formSubscriptionParkingCode">
                    <Form.Label>Código de abono:</Form.Label>
                    <Form.Control
                        type="text"
                        className="mb-3"
                        value={parking_code}
                        onChange={(e) => setParkingCode(e.target.value)}
                        required
                        placeholder="Introduzca código de abono"
                    />
                </Form.Group>

                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Añádiendo tipo de abono'}
                </Button>
            </Form>
            {error && <Alert variant="danger" className="mt-3">Error: {error.message}</Alert>}
        </Container>
    );
};

export default AddSubscriptionType;
