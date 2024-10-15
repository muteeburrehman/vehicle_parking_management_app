import React, { createContext, useState } from 'react';
import { createVehicle, } from '../services/vehicleService';
import {updateVehicle} from "../services/vehicleEditService";

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addVehicle = async (vehicleData, dni) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending vehicle data:', vehicleData);
            const newVehicle = await createVehicle(vehicleData, dni); // Pass ownerDni here
            console.log('Received new vehicle:', newVehicle);
            setVehicles((prevVehicles) => [...prevVehicles, newVehicle]);
        } catch (err) {
            console.error('Error in addVehicle:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const updateVehicleByLisencePlate = async (lisence_plate, formData) => {
        setLoading(true);
        setError(null);
        try {
            const updatedVehicle = await updateVehicle(lisence_plate, formData);
            setVehicles((prevVehicles) =>
                prevVehicles.map((vehicle) =>
                   vehicle.lisence_plate === lisence_plate ? {...vehicle, ...updatedVehicle} : vehicle
                )
            );
            return updatedVehicle
        } catch (err) {
            console.error('Error in updateVehicleByLisencePlate: ', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false)
        }
    }

    return (
        <VehicleContext.Provider value={{ vehicles, addVehicle, updateVehicleByLisencePlate, loading, error }}>
            {children}
        </VehicleContext.Provider>
    );
};

export default VehicleContext;
