import { useContext } from 'react';
import SubscriptionContext from '../context/SubscriptionContext';

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);

    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }

    return context;
};
