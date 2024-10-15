import {useContext} from 'react';
import GetVehiclesContext from '../context/GetVehiclesContext'

export const useGetVehicles = () => {
    const context = useContext(GetVehiclesContext);

    if (!context) {
        throw new Error('useGetVehicles must be used within a GetVehiclesProvider');
    }

    return context;
};