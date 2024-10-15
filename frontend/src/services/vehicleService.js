import axios from "axios";

const API_URL = 'http://localhost:8000';

export const createVehicle = async (vehicleData, dni) => {
    try {
        const form = new FormData();

        // Append form fields based on the API requirements
        form.append('lisence_plate', vehicleData.lisence_plate);
        form.append('brand', vehicleData.brand);
        form.append('model', vehicleData.model);
        form.append('vehicle_type', vehicleData.vehicle_type);
        form.append('observations', vehicleData.observations || ''); // Optional field
        form.append('created_by', vehicleData.created_by)
        form.append('modified_by', vehicleData.modified_by)

        // Append owner DNI as owner_id directly
        form.append('owner_id', vehicleData.owner_id); // Use owner_id directly

        // Append documents if provided
        if (Array.isArray(vehicleData.documents)) {
            vehicleData.documents.forEach((file, index) => {
                if (file) {
                    console.log(`Appending file for documents[${index}]:`, file.name, file.type, file.size);
                    form.append('documents', file); // Append each document to the 'documents' field
                } else {
                    console.warn(`Empty file found for documents[${index}]`);
                }
            });
        } else {
            console.warn('No documents array provided or documents is not an array.');
        }

        console.log('Final FormData contents:');
        for (let [key, value] of form.entries()) {
            console.log(key, value instanceof File ? `File: ${value.name}` : value);
        }

        // Make the POST request with multipart/form-data
        const response = await axios.post(`${API_URL}/owner/${dni}/vehicle/`, form, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.log('Error occurred:', error);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
            console.log('Response headers:', error.response.headers);
        }
        throw error;
    }
};
