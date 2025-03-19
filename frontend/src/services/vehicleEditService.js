import axios from 'axios'

const API_URL = process.env.REACT_APP_BASE_URL;

export const updateVehicle = async (lisence_plate, formData) => {
    try {
        console.log("Sending update request with lisence_plate:", lisence_plate);
        console.log('FormData contents:');

        const documentsToRemove = formData.get('documents_to_remove');
        if (documentsToRemove) {
            const documentsArray = JSON.parse(documentsToRemove);
            formData.delete('documents_to_remove');
            documentsArray.forEach((doc, index)=>{
               formData.append('remove_documents', doc);
            });
        }
    //     Log FormData contents
        for (let [key, value] of formData.entries()) {
            if (key === 'existing_documents') {
                console.log(key, JSON.parse(value)); // Log as JSON
            } else if (value instanceof File) {
                console.log(key, `File: ${value.name} (${value.size} bytes)`);
            } else {
                console.log(key, value);
            }
        }

        const response = await axios.put(`${API_URL}/vehicle/${lisence_plate}`, formData,{
            headers: {
                'Content-Type': "multipart/form-data"
            }
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