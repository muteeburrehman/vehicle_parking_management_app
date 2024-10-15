import React, { createContext, useState } from 'react';
import { createSubscriptionType } from '../services/subscriptionTypeService';

const SubscriptionContext = createContext();

export const SubscriptionTypeProvider = ({ children }) => {
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addSubscriptionType = async (subscriptionData) => {
        setLoading(true);
        setError(null);
        try {
            const newSubscriptionType = await createSubscriptionType(subscriptionData);
            setSubscriptionTypes((prevTypes) => [...prevTypes, newSubscriptionType]);
        } catch (err) {
            console.error('Error in addSubscriptionType:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SubscriptionContext.Provider value={{ subscriptionTypes, addSubscriptionType, loading, error }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext;
