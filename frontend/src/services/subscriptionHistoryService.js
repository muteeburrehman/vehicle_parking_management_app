// src/services/subscriptionService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;


// Ensure API_URL is set correctly
if (!API_URL) {
    console.error("Error: REACT_APP_BASE_URL is not defined");
}

export const fetchSubscriptionHistories = async () => {
    try {
        const response = await axios.get(`${API_URL}/subscription_histories/`);
        console.log("Fetched subscription histories:", response.data);

        if (!Array.isArray(response.data)) {
            throw new Error("Expected an array but got: " + JSON.stringify(response.data));
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching subscription histories:', error);
        throw new Error('Error fetching subscription histories: ' + error.message);
    }
};

// Fetch subscription history by ID
export const fetchSubscriptionHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}/subscription_histories/${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching subscription history ${historyId}: ` + error.message);
    }
};