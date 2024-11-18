import axios from "axios";

const API_URL = 'http://localhost:8000';

export const fetchAllVehicles = async () => {
    try {
        const response = await axios.get(`${API_URL}/vehicles/`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vehicles', error);
        throw error;
    }
}

export const fetchVehicleByLisencePlate = async (lisence_plate) => {
    try{
        const response = await axios.get(`${API_URL}/vehicle/${lisence_plate}`, {
            params: {lisence_plate: lisence_plate} // Ensure that lisence_plate in query parameter
        });
        console.log(response.data)
        return response.data
    } catch (error) {
        console.error('Error fetching vehicle data: ', error.response.data);
        throw new Error('Error fetching vehicle data: ' + error.response.data.detail)
    }

};

// Function to fetch vehicles by owner ID
export const fetchVehiclesByOwnerId = async (ownerId) => {
    try {
        // Step 1: Fetch all vehicles from the API
        const response = await axios.get(`${API_URL}/vehicles/`);

        // Step 2: Filter the vehicles by owner_id
        const filteredVehicles = response.data.filter(vehicle => vehicle.owner_id === ownerId);

        // Step 3: Return the filtered vehicles
        return filteredVehicles;
    } catch (error) {
        console.error('Error fetching vehicles by owner:', error);
        throw error;  // Throw the error to be handled by the calling component
    }
};

export const checkLicensePlateExists = async (lisence_plate) => {
    try {
        const vehicles = await fetchAllVehicles(); // Ensure you have imported this function
        return vehicles.some(vehicle => vehicle.lisence_plate === lisence_plate);
    } catch (error) {
        console.error('Error checking license plate:', error);
        throw new Error('Failed to validate license plate');
    }
};

// Function to check active subscription for a vehicle by license plate
export const checkActiveSubscription = async (licensePlate) => {
    try {
        const response = await axios.get(`${API_URL}/vehicle/${licensePlate}/check-subscription`);
        return response.data.active; // Returns true or false
    } catch (error) {
        console.error('Error checking subscription:', error);
        throw error; // Propagate error for error handling in the component
    }
};