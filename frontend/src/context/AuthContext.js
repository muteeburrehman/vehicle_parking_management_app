import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/auth';
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

const decodeToken = (token) => {
    try {
        return jwtDecode(token);
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null; // Return null if decoding fails
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Set initial loading to true
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = decodeToken(storedToken);
            if (decodedToken) {
                const userData = {
                    id: decodedToken.sub,
                    email: decodedToken.email,
                    role: decodedToken.role,
                };
                setUser(userData); // Set the user state
            } else {
                // Clear invalid token if decoding fails
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }
        setLoading(false); // Set loading to false after checking token
    }, []);

    const login = async (email, password) => {
        setLoading(true); // Start loading
        try {
            const response = await loginUser(email, password);
            const { access_token } = response;
            const decodedToken = decodeToken(access_token);
            if (decodedToken) {
                const userData = {
                    id: decodedToken.sub,
                    email: decodedToken.email,
                    role: decodedToken.role,
                };
                localStorage.setItem("user", JSON.stringify(userData));
                localStorage.setItem("token", access_token);
                setUser(userData); // Set user state after login
                return userData;
            } else {
                throw new Error("Failed to decode token");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setLoading(false); // End loading
        }
    };

    const register = async (email, password, confirmPassword, role) => {
        try {
            const response = await registerUser(email, password, confirmPassword, role);
            const { access_token, ...userData } = response;

            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", access_token);

            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};