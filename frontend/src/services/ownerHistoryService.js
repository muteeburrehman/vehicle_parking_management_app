import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;

export const fetchOwnerHistories = async () => {
    try {
        const response = await axios.get(`${API_URL}/owner_histories`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching owner histories: ' + error.message);
    }
};

// Fetch owner history by ID
export const fetchOwnerHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}/owner_histories/${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching owner history ${historyId}: ` + error.message);
    }
};