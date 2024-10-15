import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import logo from "../assets/icons/Logo.png";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false); // Loading state
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        if (!email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
        if (!password) newErrors.password = "Password is required";
        else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
        return newErrors;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
        } else {
            setErrors({});
            setLoading(true); // Set loading to true
            try {
                await login(email, password);
                navigate("/");
            } catch (error) {
                setErrors({ form: error.message });
            } finally {
                setLoading(false); // Reset loading state
            }
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-form-container">
                <img src={logo} alt="Company Logo" className="logo" />
                <h2 className="login-title">Login</h2>
                <Form onSubmit={handleSubmit} className="login-form">
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            isInvalid={!!errors.email}
                            aria-describedby="emailError" // Accessibility
                        />
                        <Form.Control.Feedback type="invalid" id="emailError">
                            {errors.email}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            isInvalid={!!errors.password}
                            aria-describedby="passwordError" // Accessibility
                        />
                        <Form.Control.Feedback type="invalid" id="passwordError">
                            {errors.password}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {errors.form && <div className="text-danger">{errors.form}</div>}
                    <Button variant="primary" className="mt-4 w-100" type="submit" disabled={loading}>
                        {loading ? (
                            <Spinner animation="border" size="sm" />
                        ) : (
                            "Login"
                        )}
                    </Button>
                    <p className="forgot-password text-right">
                        Don't have an account? <Link to="/signup">Sign up</Link>
                    </p>
                </Form>
            </div>
        </div>
    );
}

export default Login;