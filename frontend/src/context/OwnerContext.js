import React, { createContext, useState } from 'react';
import { createOwner } from '../services/ownerService';
import { updateOwner } from "../services/ownerEditService";

const OwnerContext = createContext();

export const OwnerProvider = ({ children }) => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addOwner = async (ownerData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Sending owner data:', ownerData);
            const newOwner = await createOwner(ownerData);
            console.log('Received new owner:', newOwner);
            setOwners((prevOwners) => [...prevOwners, newOwner]);
        } catch (err) {
            console.error('Error in addOwner:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const updateOwnerById = async (dni, formData) => {
        setLoading(true);
        setError(null);
        try {
            const updatedOwner = await updateOwner(dni, formData);
            setOwners((prevOwners) =>
                prevOwners.map((owner) =>
                    owner.dni === dni ? { ...owner, ...updatedOwner } : owner
                )
            );
            return updatedOwner;
        } catch (err) {
            console.error('Error in updateOwnerById:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <OwnerContext.Provider value={{ owners, addOwner, updateOwnerById, loading, error }}>
            {children}
        </OwnerContext.Provider>
    );
};

export default OwnerContext;