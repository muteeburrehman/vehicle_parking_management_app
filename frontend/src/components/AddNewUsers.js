import React, { useState } from 'react';
import { Card, Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import logo from "../assets/icons/Logo.png";
import { useNavigate } from "react-router-dom";

const AddNewUsers = () => {
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');  // Default role
    const [errors, setErrors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);

        if (password !== confirmPassword) {
            setErrors(['Passwords do not match']);
            return;
        }

        try {
            setIsLoading(true);
            await register(email, password, confirmPassword, role);
            navigate("/");
        } catch (err) {
            console.error(err);
            setErrors(err.message.split(', '));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <img src={logo} alt="Company Logo" className="logo" style={{ maxWidth: '150px' }} />
                            </div>
                            <Card.Title className="text-center mb-4">Add New User</Card.Title>
                            {errors.length > 0 && (
                                <Alert variant="danger">
                                    <ul className="mb-0">
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="formEmail">
                                    <Form.Label>Email address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group controlId="formPassword" className="mt-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group controlId="formConfirmPassword" className="mt-3">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group controlId="formRole" className="mt-3">
                                    <Form.Label>Select Role</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        required
                                    >
                                        <option value="user">USER</option>
                                        <option value="admin">ADMIN</option>
                                        <option value="superuser">SUPERUSER</option>
                                    </Form.Control>
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="mt-4 w-100"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Adding User...' : 'Add User'}
                                </Button>

                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AddNewUsers;
