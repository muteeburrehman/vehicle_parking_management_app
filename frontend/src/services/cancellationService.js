// src/apiService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;


export const cancelSubscription = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/subscriptions/cancel`, data);
    return response.data;
  } catch (error) {
    throw error.response.data; // Throw the error response for handling in the component
  }
};

export const getCancellationById = async (cancellationId) => {
  try {
    const response = await axios.get(`${API_URL}/cancellations/${cancellationId}`);
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
    const response = await axios.get(`${API_URL}/subscriptions/cancellations`);
    return response.data;
  } catch (error) {
    throw new Error(error.response.data || 'Failed to fetch cancellations.');
  }
};



export const updateCancellation = async (cancellationId, data) => {
  try {
    const response = await axios.put(`${API_URL}/subscriptions/cancel/${cancellationId}`, data);

    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const uploadDocument = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/api/upload-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};