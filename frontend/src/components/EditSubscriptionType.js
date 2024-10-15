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
        const confirmDelete = window.confirm("Are you sure you want to delete this subscription type?");
        if (confirmDelete) {
            try {
                await deleteSubscriptionType(id);
                setToastMessage("Subscription Type deleted successfully!");
                setToastVariant('success');
                setShowToast(true);
                setSuccessMessage('Subscription Type deleted successfully');
                setTimeout(() => {
                    navigate("/subscription-type-list");
                }, 2000);
            } catch (err) {
                console.error('Failed to delete vehicle:', err);
                setToastMessage(`Failed to delete subscription type: ${err.response?.data?.detail || err.message}`);
                setToastVariant('danger');
                setShowToast(true);
            }
        }
    };

    return (
        <Container className="mt-5">
            <h2 className="mb-4">Edit Subscription Type</h2>

            {loading ? (
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            ) : error ? (
                <Alert variant="danger">Error: {error.message}</Alert>
            ) : (
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formSubscriptionName" className="mb-3">
                        <Form.Label>Name:</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={subscriptionType.name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formSubscriptionPrice" className="mb-3">
                        <Form.Label>Price:</Form.Label>
                        <Form.Control
                            type="number"
                            name="price"
                            value={subscriptionType.price}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="formSubscriptionParkingCode" className="mb-3">
                        <Form.Label>Parking Code:</Form.Label>
                        <Form.Control
                            type="text"
                            name="parking_code"
                            value={subscriptionType.parking_code}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                     {successMessage && <Alert variant="success">{successMessage}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button variant="primary" type="submit">
                        Update Subscription Type
                    </Button>
                     <Button variant="danger" onClick={handleDeleteSubscriptionType} style={{ marginLeft: '10px' }}>
                        Delete Subscription Type
                    </Button>
                </Form>
            )}
        </Container>
    );
};

export default EditSubscriptionType;
