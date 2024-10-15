import axios from 'axios';

const API_URL = 'http://localhost:8000/vehicle_histories/';

export const fetchVehicleHistories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching vehicle histories: ' + error.message);
    }
};

// Fetch vehicle history by ID
export const fetchVehicleHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching vehicle history ${historyId}: ` + error.message);
    }
};