import axios from 'axios';

const API_URL = 'http://localhost:8000/owner_histories/';

export const fetchOwnerHistories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching owner histories: ' + error.message);
    }
};

// Fetch owner history by ID
export const fetchOwnerHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching owner history ${historyId}: ` + error.message);
    }
};