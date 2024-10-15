import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Replace with your actual API URL

export const parkingLotService = {
  createParkingLotConfig: async (config) => {
    try {
      const response = await axios.post(`${API_URL}/parking-lot-config/`, config);
      return response.data;
    } catch (error) {
      console.error('Error creating parking lot config:', error);
      throw error;
    }
  },

  getParkingLotConfigs: async () => {
    try {
      const response = await axios.get(`${API_URL}/parking-lot-config/`);
      return response.data;
    } catch (error) {
      console.error('Error getting parking lot configs:', error);
      throw error;
    }
  },

 getParkingLotStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/parking-lot-stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting parking lot stats:', error);
      throw error;
    }
  },

  updateParkingLotConfig: async (id, config) => {
    try {
      const response = await axios.put(`${API_URL}/parking-lot-config/${id}`, config);
      return response.data;
    } catch (error) {
      console.error('Error updating parking lot config:', error);
      throw error;
    }
  },
};