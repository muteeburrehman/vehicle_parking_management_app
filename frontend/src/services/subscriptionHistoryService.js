// src/services/subscriptionService.js

import axios from 'axios';

const API_URL = 'http://localhost:8000/subscription_histories/'; // Adjust this to your backend URL

export const fetchSubscriptionHistories = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; // Return the list of subscription histories
    } catch (error) {
        throw new Error('Error fetching subscription histories: ' + error.message);
    }
};

// Fetch subscription history by ID
export const fetchSubscriptionHistoryById = async (historyId) => {
    try {
        const response = await axios.get(`${API_URL}${historyId}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching subscription history ${historyId}: ` + error.message);
    }
};