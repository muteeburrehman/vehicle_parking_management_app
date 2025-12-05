import axios from "axios";

const API_URL = process.env.REACT_APP_BASE_URL;

// Function to fetch all owners
export const fetchAllOwners = async () => {
    try {
        const response = await axios.get(`${API_URL}/owners/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching owners:', error);
        throw error;
    }
};

// Function to fetch owner by DNI
export const fetchOwnerByDNI = async (owner_dni) => {
    try {
        // Trim the DNI
        const trimmedDni = owner_dni.trim();

        // Use query parameter instead of path parameter
        const response = await axios.get(`${API_URL}/api/owner/${trimmedDni}`, {
            params: {
                owner_dni: trimmedDni
            }
        });

        console.log(response.data);
        return response.data;
    } catch (error) {
        // If direct fetch fails, try fetching all owners and filtering
        console.warn(`Direct fetch failed for DNI ${owner_dni}, trying alternative method...`);
        try {
            const allOwners = await fetchAllOwners();
            const owner = allOwners.find(o => o.dni === trimmedDni);
            if (owner) {
                return owner;
            }
            throw new Error(`Owner with DNI ${trimmedDni} not found`);
        } catch (fallbackError) {
            console.error('Error fetching owner data:', error.response?.data || error.message);
            throw new Error('Error fetching owner data: ' + (error.response?.data?.detail || error.message));
        }
    }
};


export const fetchReducedMobilityOwners = async () => {
    try {
        const response = await axios.get(`${API_URL}/owners/reduced-mobility`);
        return response.data;
    } catch (error) {
        console.error('Error fetching reduced mobility owners:', error);
        throw new Error(error.response?.data?.detail || 'Error fetching owners');
    }
};
// Function to check if DNI exists
export const checkDniExists = async (dni) => {
    try {
        // Attempt to fetch the owner by DNI
        await fetchOwnerByDNI(dni);
        // If the request is successful, it means the DNI exists
        return true;
    } catch (error) {
        // If the error response indicates the owner is not found, return false
        if (error.message.includes('not found')) {
            return false;
        }
        // If there's another kind of error, rethrow it
        throw error;
    }
};

// Function to check if bank account number exists
export const checkBankAccountExists = async (bankAccountNumber) => {
    try {
        // Fetch all owners
        const owners = await fetchAllOwners();

        // Check if any owner has the given bank account number
        const ownerWithBankAccount = owners.find(owner => owner.bank_account_number === bankAccountNumber);

        // If an owner with the bank account number is found, return true
        if (ownerWithBankAccount) {
            return true;
        }

        // If no such owner is found, return false
        return false;
    } catch (error) {
        console.error('Error checking bank account number:', error);
        throw error;
    }
};