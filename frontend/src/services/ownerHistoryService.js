import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;

export const fetchOwnerHistories = async () => {
    try {
        // Add the trailing slash to match your backend endpoint
        const response = await axios.get(`${API_URL}/owner_histories/`);
        console.log('Owner histories API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching owner histories:', error);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url
        });
        throw new Error('Error fetching owner histories: ' + error.message);
    }
};

// Fetch owner history by ID
export const fetchOwnerHistoryById = async (historyId) => {
    try {
        // Assuming your backend has a similar endpoint for individual records
        const response = await axios.get(`${API_URL}/owner_histories/${historyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching owner history by ID:', error);
        throw new Error(`Error fetching owner history ${historyId}: ` + error.message);
    }
};
