// src/apiService.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/subscriptions/cancel';
const Base_URL = 'http://localhost:8000'

export const cancelSubscription = async (data) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error) {
    throw error.response.data; // Throw the error response for handling in the component
  }
};

export const getCancellationById = async (cancellationId) => {
  try {
    const response = await axios.get(`${Base_URL}/cancellations/${cancellationId}`);
    return response.data;
  } catch (error) {
    // Handle error responses
    if (error.response && error.response.status === 404) {
      throw new Error('Cancellation not found.');
    } else {
      throw new Error('Failed to fetch cancellation details.');
    }
  }
};




export const getAllCancellations = async () => {
  try {
    const response = await axios.get(`${Base_URL}/subscriptions/cancellations`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data || 'Failed to fetch cancellations.');
  }
};



export const uploadDocument = async (file, cancellationId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cancellationId', cancellationId); // Assuming your backend requires an ID

    try {
        const response = await axios.post('http://localhost:8000/cancelled_subscription_files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};
