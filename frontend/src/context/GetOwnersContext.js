import React, { createContext, useState, useEffect, useCallback } from 'react';
import { fetchAllOwners, fetchOwnerByDNI } from '../services/getOwnerService';

const GetOwnersContext = createContext();

export const GetOwnersProvider = ({ children }) => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedOwner, setSelectedOwner] = useState(null);

    const getAllOwners = useCallback(async () => {
        setLoading(true);
        try {
            const ownersList = await fetchAllOwners();
            setOwners(ownersList);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const getOwnerByDNI = useCallback(async (dni) => {
        setLoading(true);
        try {
            const owner = await fetchOwnerByDNI(dni);
            setSelectedOwner(owner);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getAllOwners();
    }, [getAllOwners]);

    return (
        <GetOwnersContext.Provider value={{ owners, selectedOwner, loading, error, getOwnerByDNI, getAllOwners }}>
            {children}
        </GetOwnersContext.Provider>
    );
};

export default GetOwnersContext;
