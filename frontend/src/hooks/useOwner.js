import { useContext } from 'react';
import OwnerContext from '../context/OwnerContext';  // Import the context

// Custom hook to access the Owner context
export const useOwner = () => {
    const context = useContext(OwnerContext);

    if (!context) {
        throw new Error('useOwner must be used within an OwnerProvider');
    }

    return context;  // Return the context value
};
