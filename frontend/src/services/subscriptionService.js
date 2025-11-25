// subscriptionService.js

import axios from 'axios';

// Use environment variables for API URL
const API_URL = process.env.REACT_APP_BASE_URL;

// Utility function to convert object to FormData
const objectToFormData = (obj, form = new FormData(), namespace = '') => {
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach((value, index) => {
                    if (value instanceof File) {
                        // Append files with the same key
                        form.append(key, value);
                    } else if (typeof value === 'object') {
                        // Recursively handle nested objects
                        objectToFormData(value, form, `${namespace}${key}[${index}].`);
                    } else {
                        // Append non-file array items with indexed keys
                        form.append(`${namespace}${key}[${index}]`, value);
                    }
                });
            } else if (obj[key] instanceof File) {
                form.append(key, obj[key]);
            } else if (typeof obj[key] === 'object') {
                objectToFormData(obj[key], form, `${namespace}${key}.`);
            } else {
                form.append(`${namespace}${key}`, obj[key]);
            }
        }
    }
    return form;
};

// Helper function to handle Axios errors
const handleAxiosError = (error, context) => {
    if (error.response) {
        // Server responded with a status other than 2xx
        console.error(`Error ${context}:`, error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
    } else if (error.request) {
        // Request was made but no response received
        console.error(`No response received when ${context}:`, error.request);
    } else {
        // Something else caused the error
        console.error(`Error setting up request for ${context}:`, error.message);
    }
};

// Create a new subscription
export const createSubscription = async (subscriptionData) => {
    try {
        const formData = objectToFormData(subscriptionData);

        // Log FormData content (for debugging)
        for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
                console.log(`${pair[0]}: ${pair[1].name}`);
            } else {
                console.log(`${pair[0]}: ${pair[1]}`);
            }
        }

        const response = await axios.post(`${API_URL}/subscription/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        handleAxiosError(error, 'creating subscription');
        throw error;
    }
};


// Fetch all subscription types
export const getSubscriptionTypes = async () => {
    try {
        const response = await axios.get(`${API_URL}/subscription_types/`);
        return response.data; // Assume it returns an array of subscription types
    } catch (error) {
        handleAxiosError(error, 'fetching subscription types');
        throw error;
    }
};

// Fetch a subscription type by ID
export const getSubscriptionTypeById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/subscription_types/${id}`);
        return response.data;
    } catch (error) {
        handleAxiosError(error, `fetching subscription type with ID ${id}`);
        throw error;
    }
};

// Fetch all subscriptions
export const getSubscriptions = async () => {
    try {
        const response = await axios.get(`${API_URL}/subscriptions/`);
        return response.data;
    } catch (error) {
        handleAxiosError(error, 'fetching subscriptions');
        throw error;
    }
};


// Fetch a single subscription by ID
export const getSubscriptionById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/subscription/${id}`);
        return response.data;
    } catch (error) {
        handleAxiosError(error, `fetching subscription with ID ${id}`);
        throw error;
    }
};

export const fetchLargeFamilySubscriptions = async () => {
    try {
        const response = await axios.get(`${API_URL}/subscriptions/large-family`);
        return response.data;
    } catch (error) {
        handleAxiosError(error, 'Error fetching large family subscriptions');
        throw error;
    }
};
// Update an existing subscription
export const updateSubscription = async (subscriptionData) => {
    try {
        const formData = objectToFormData(subscriptionData);
        console.log("FORM DATA ", formData.keys)

        subscriptionData.existing_documents.forEach(doc => {
            formData.append('existing_documents', doc);
        });

        const response = await axios.put(`${API_URL}/subscription/${subscriptionData.id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        handleAxiosError(error, `updating subscription with ID ${subscriptionData.id}`);
        throw error;
    }
};

// Update a subscription type
export const updateSubscriptionType = async (subscriptionTypeId, updatedData) => {
    try {
        const formData = objectToFormData(updatedData);

        const response = await axios.put(`${API_URL}/subscription_types/${subscriptionTypeId}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Updated subscription type:', response.data);
        return response.data;
    } catch (error) {
        handleAxiosError(error, `updating subscription type with ID ${subscriptionTypeId}`);
        throw error;
    }
};

// New function: Export subscriptions
// New function: Export subscriptions
export const exportSubscriptions = async (ids, fields) => {
    try {
        // Validate inputs
        if (!ids || ids.length === 0) {
            throw new Error('No subscription IDs provided for export');
        }
        
        if (!fields || fields.length === 0) {
            throw new Error('No fields selected for export');
        }

        console.log('Exporting subscriptions:', { ids, fields }); // Debug log

        const params = new URLSearchParams({
            ids: ids.join(','),
            fields: fields.join(','),
            export_format: 'xlsx'
        });

        const response = await axios.get(`${API_URL}/subscriptions/export`, {
            params,
            responseType: 'blob',
            timeout: 60000, // 60 second timeout
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        // Validate response
        if (!response.data || response.data.size === 0) {
            throw new Error('Export file is empty or invalid');
        }

        // Check if response is actually a blob and not an error message
        if (response.data.type && response.data.type.includes('json')) {
            // If we got JSON back, it's probably an error
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.detail || 'Export failed');
        }

        console.log('Export successful, blob size:', response.data.size); // Debug log
        return response.data;

    } catch (error) {
        console.error('Export error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        });
        
        // Handle specific error cases
        if (error.code === 'ECONNABORTED') {
            throw new Error('Export request timed out. Please try with fewer records or fields.');
        }
        
        if (error.response?.status === 404) {
            throw new Error('Export endpoint not found. Please check your API configuration.');
        }
        
        if (error.response?.status === 400) {
            const errorMsg = error.response.data?.detail || 'Invalid export request';
            throw new Error(errorMsg);
        }
        
        if (error.response?.status >= 500) {
            throw new Error('Server error during export. Please try again later.');
        }
        
        // Re-throw with original message if it's already a meaningful error
        if (error.message && !error.message.includes('Network Error')) {
            throw error;
        }
        
        throw new Error('Export failed: ' + (error.message || 'Unknown error'));
    }
};
