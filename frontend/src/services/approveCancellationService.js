import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

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
