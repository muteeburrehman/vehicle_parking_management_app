import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;

// Service to delete an owner by DNI
export const deleteOwner = async (dni, deletedBy = "system") => {
    try {
        const response = await axios.delete(`${API_URL}/owner/${dni}/`, {
            params: {
                deleted_by: deletedBy
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting owner:', error.response?.data || error.message);
        throw error;
    }
};
// Service to delete a vehicle by license plate
export const deleteVehicle = async (licensePlate) => {
    try {
        const response = await axios.delete(`${API_URL}/vehicle/${licensePlate}/`);
        return response.data; // Return success message
    } catch (error) {
        console.error('Error deleting vehicle:', error.response?.data || error.message);
        throw error; // Propagate the error for handling in the component
    }
};

// Service to delete a subscription by ID
export const deleteSubscription = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/subscription/${id}/`);
        return response.data; // Return success message
    } catch (error) {
        console.error('Error deleting subscription:', error.response?.data || error.message);
        throw error; // Propagate the error for handling in the component
    }
};

export const deleteSubscriptionType = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/subscription_types/${id}/`);
        return response.data; // Return success message
    } catch (error) {
        console.error('Error deleting subscription type:', error.response?.data || error.message);
        throw error; // Propagate the error for handling in the component
    }
};

// Service to delete a subscription history entry by ID
export const deleteSubscriptionHistory = async (historyId) => {
    try {
        const response = await axios.delete(`${API_URL}/subscription_histories/${historyId}/`);
        return response.data; // Return success message
    } catch (error) {
        console.error('Error deleting subscription history:', error.response?.data || error.message);
        throw error; // Propagate the error for handling in the component
    }
};

// Service to delete a cancellation by ID
export const deleteCancellation = async (cancellationId) => {
    try {
        const response = await axios.delete(`${API_URL}/cancellations/${cancellationId}/`);
        return response.data; // Return success message
    } catch (error) {
        console.error('Error deleting cancellation:', error.response?.data || error.message);
        throw error; // Propagate the error for handling in the component
    }
};
