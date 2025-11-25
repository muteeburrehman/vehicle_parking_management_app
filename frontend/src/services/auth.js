import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;

export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

export const registerUser = async (email, password, confirmPassword, role) => {
    try {
        const response = await axios.post(`${API_URL}/users/`, {
            email,
            password,
            confirm_password: confirmPassword,
            role
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to get all users (superuser only)
export const getAllUsers = async () => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to get user by ID
export const getUserById = async (userId) => {
    try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to update user
export const updateUser = async (userId, userData) => {
    try {
        const token = getToken();
        const response = await axios.put(`${API_URL}/users/${userId}`, userData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

// New function to delete user
export const deleteUser = async (userId) => {
    try {
        const token = getToken();
        const response = await axios.delete(`${API_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error);
    }
};

const handleApiError = (error) => {
    if (error.response) {
        if (error.response.status === 422) {
            if (Array.isArray(error.response.data.detail)) {
                throw new Error(error.response.data.detail.map(err => err.msg).join(', '));
            } else {
                throw new Error(error.response.data.detail || 'Validation error');
            }
        } else if (error.response.status === 400) {
            throw new Error(error.response.data.detail || 'Bad request');
        } else if (error.response.status === 401) {
            throw new Error('Unauthorized access');
        } else if (error.response.status === 403) {
            throw new Error('Forbidden: You do not have permission to perform this action');
        } else if (error.response.status === 404) {
            throw new Error('User not found');
        }
    }
    if (error.code === 'ERR_NETWORK') {
        throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
    }
    throw error;
};

export const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getToken = () => {
    return localStorage.getItem('token');
};
