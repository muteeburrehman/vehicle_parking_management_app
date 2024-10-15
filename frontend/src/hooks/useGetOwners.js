import { useContext } from 'react';
import GetOwnersContext from '../context/GetOwnersContext'; // Import the context

// Custom hook to access the GetOwners context
export const useGetOwners = () => {
    const context = useContext(GetOwnersContext);

    if (!context) {
        throw new Error('useGetOwners must be used within a GetOwnersProvider');
    }

    return context; // Return the context value
};
