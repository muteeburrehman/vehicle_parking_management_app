import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
    createSubscription,
    getSubscriptionTypes,
    getSubscriptionById,
    updateSubscription,
    updateSubscriptionType
} from '../services/subscriptionService';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSubscriptionTypes();
    }, []);

    const fetchSubscriptionTypes = async () => {
        setLoading(true);
        try {
            const types = await getSubscriptionTypes();
            setSubscriptionTypes(types);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const addSubscription = async (subscriptionData) => {
        setLoading(true);
        setError(null);
        try {
            const newSubscription = await createSubscription(subscriptionData);
            setSubscriptions((prevSubscriptions) => [...prevSubscriptions, newSubscription]);
            return newSubscription;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

   const fetchSubscriptionById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
            throw new Error('Invalid subscription ID');
        }
        const subscription = await getSubscriptionById(id);
        return subscription;
    } catch (err) {
        const errorMessage = err.response?.data?.detail?.[0] || err.message || 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error in fetchSubscriptionById:', errorMessage);
        throw new Error(errorMessage);
    } finally {
        setLoading(false);
    }
}, []);

    const modifySubscription = async (subscriptionData) => {
        setLoading(true);
        setError(null);
        try {
            const updatedSubscription = await updateSubscription(subscriptionData);
            setSubscriptions((prevSubscriptions) =>
                prevSubscriptions.map((sub) =>
                    sub.id === subscriptionData.id ? updatedSubscription : sub
                )
            );
            return updatedSubscription;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const modifySubscriptionType = async (subscriptionTypeId, updatedData) => {
        setLoading(true);
        setError(null);
        try {
            const updatedType = await updateSubscriptionType(subscriptionTypeId, updatedData);
            setSubscriptionTypes((prevTypes) =>
                prevTypes.map((type) => (type.id === subscriptionTypeId ? updatedType : type))
            );
            return updatedType;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <SubscriptionContext.Provider
            value={{
                subscriptions,
                subscriptionTypes,
                loading,
                error,
                addSubscription,
                fetchSubscriptionById,
                updateSubscription: modifySubscription,
                updateSubscriptionType: modifySubscriptionType,
                getSubscriptionTypes: fetchSubscriptionTypes,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export default SubscriptionContext;