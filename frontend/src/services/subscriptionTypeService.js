import axios from "axios";

const API_URL = process.env.REACT_APP_BASE_URL;

export const createSubscriptionType = async (subscriptionData) => {
    try {
        // Use FormData to send data as form-urlencoded
        const formData = new FormData();
        formData.append('name', subscriptionData.name);
        formData.append('price', subscriptionData.price);
        formData.append('parking_code', subscriptionData.parking_code)

        const response = await axios.post(`${API_URL}/subscription_types/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Changed to multipart/form-data
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error occurred:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        }
        throw error;
    }
};