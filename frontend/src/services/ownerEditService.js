import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Assuming you have this endpoint

export const updateOwner = async (dni, formData) => {
    try {
        console.log('Sending update request for DNI:', dni);
        console.log('FormData contents:');

        // Convert documents_to_remove to a proper format
        const documentsToRemove = formData.get('documents_to_remove');
        if (documentsToRemove) {
            const documentsArray = JSON.parse(documentsToRemove);
            formData.delete('documents_to_remove');
            documentsArray.forEach((doc, index) => {
                formData.append(`remove_documents`, doc);
            });
        }

        // Log FormData contents
        for (let [key, value] of formData.entries()) {
            if (key === 'existing_documents') {
                console.log(key, JSON.parse(value)); // Log as JSON
            } else if (value instanceof File) {
                console.log(key, `File: ${value.name} (${value.size} bytes)`);
            } else {
                console.log(key, value);
            }
        }

        const response = await axios.put(`${API_URL}/owner/${dni}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('Update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error occurred during update:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Response headers:', error.response.headers);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        throw error;
    }
};