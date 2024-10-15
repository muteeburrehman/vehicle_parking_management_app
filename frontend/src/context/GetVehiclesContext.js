// src/context/GetVehiclesContext.js

import React, { createContext, useState, useEffect, useCallback } from "react";
import { fetchAllVehicles, fetchVehicleByLisencePlate } from "../services/getVehicleService";

const GetVehiclesContext = createContext();

export const GetVehiclesProvider = ({ children }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const getAllVehicles = useCallback(async () => {
        setLoading(true);
        try {
            const vehiclesList = await fetchAllVehicles();
            setVehicles(vehiclesList);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const getVehicleByLisencePlate = useCallback(async (lisence_plate) => {
        setLoading(true);
        try {
            const vehicle = await fetchVehicleByLisencePlate(lisence_plate);
            console.log(vehicle);
            setSelectedVehicle(vehicle);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getAllVehicles();
    }, [getAllVehicles]);

    return (
        <GetVehiclesContext.Provider value={{ 
            vehicles, 
            selectedVehicle, 
            loading, 
            error, 
            getVehicleByLisencePlate, 
            getAllVehicles // Expose getAllVehicles here
        }}>
            {children}
        </GetVehiclesContext.Provider>
    );
};

export default GetVehiclesContext;
