import axios from 'axios';


const API_URL = process.env.REACT_APP_BASE_URL;



export const fetchVehicleHistories = async () => {
    try {
        const response = await axios.get(`${API_URL}/vehicle_histories/`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching vehicle histories: ' + error.message);
    }
};

// Fetch vehicle history by ID
export const fetchVehicleHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}/vehicle_histories/${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching vehicle history ${historyId}: ` + error.message);
    }
};