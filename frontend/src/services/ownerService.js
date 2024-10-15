import axios from "axios";

const API_URL = 'http://localhost:8000';

export const createOwner = async (ownerData) => {
    try {
        const form = new FormData();

        // Append form fields
        form.append('dni', ownerData.dni);
        form.append('first_name', ownerData.first_name);
        form.append('last_name', ownerData.last_name);
        form.append('email', ownerData.email || ''); // Optional field
        form.append('observations', ownerData.observations || ''); // Optional field
        form.append('bank_account_number', ownerData.bank_account_number);
        form.append('sage_client_number', ownerData.sage_client_number || '');
        form.append('phone_number', ownerData.phone_number || ''); // Optional field
        form.append('created_by', ownerData.created_by);
        form.append('modified_by', ownerData.modified_by || '');
        // Ensure documents field exists and is an array
        if (Array.isArray(ownerData.documents)) {
            ownerData.documents.forEach((file, index) => {
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
        const response = await axios.post(`${API_URL}/owner/`, form, {
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
