import axios from 'axios';


const BASE_URL = process.env.REACT_APP_BASE_URL;

/**
 * Approve a cancellation by ID.
 * @param {number} cancellationId - The ID of the cancellation to approve.
 * @param {object} data - The data to send with the approval request.
 * @returns {Promise<object>} - The response data from the server.
 */
export const approveCancellation = async (cancellationId, data) => {
    try {
        const response = await axios.post(
            `${BASE_URL}/api/cancellations/${cancellationId}/approve`,
            {
                modified_by: data.modified_by,
                modification_time: data.modification_time,
                documents: Array.isArray(data.documents) ? data.documents : JSON.parse(data.documents)
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

/**
 * Get all approved cancellations.
 * @returns {Promise<Array>} - A list of all approved cancellations.
 */
export const getApprovedCancellations = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/approved-cancellations`);
        console.log('API Response in service:', response.data);
        return response.data; // Should contain { approved_cancellations: [...] }
    } catch (error) {
        console.error('Error in service:', error);
        throw error.response?.data || error.message;
    }
};

/**
 * Get a specific approved cancellation by ID.
 * @param {number} approvedCancellationId - The ID of the approved cancellation to retrieve.
 * @returns {Promise<object>} - The approved cancellation data.
 */
export const getApprovedCancellationById = async (approvedCancellationId) => {
    try {
        const response = await axios.get(`${BASE_URL}/api/approved-cancellations/${approvedCancellationId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};