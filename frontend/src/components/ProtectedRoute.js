import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Get user and loading state from auth context

    // If loading, don't render anything
    if (loading) {
        return null; // Or a loading spinner component
    }

    // If user is not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If user is authenticated, render the children
    return children;
};

export default ProtectedRoute;