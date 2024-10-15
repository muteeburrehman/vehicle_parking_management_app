// src/hooks/useVehicle.js
import { useContext } from 'react';
import VehicleContext from '../context/VehicleContext';  // Import the context

// Custom hook to access the Vehicle context
export const useVehicle = () => {
    const context = useContext(VehicleContext);

    if (!context) {
        throw new Error('useVehicle must be used within a VehicleProvider');
    }

    return context;  // Return the context value
};
