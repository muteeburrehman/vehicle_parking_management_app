import axios from 'axios';

const API_URL = process.env.REACT_APP_BASE_URL;

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

  updateParkingLotConfig: async (id, config) => {
    try {
      const response = await axios.put(`${API_URL}/parking-lot-config/${id}`, config);
      return response.data;
    } catch (error) {
      console.error('Error updating parking lot config:', error);
      throw error;
    }
  },

  deleteParkingLot: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/parking-lot-config/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting parking lot:', error);
      throw error;
    }
  },

  getAllParkingLots: async () => {
    try {
      const response = await axios.get(`${API_URL}/parking-lot-config`);
      return response.data;
    } catch (error) {
      console.error('Error getting all parking lots:', error);
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

  getParkingLotStatistics: async () => {
    try{
      const response = await axios.get(`${API_URL}/parking-lot-statistics`);
      return response.data;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  },

  getSubscriptionTypes: async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription-types`);
      return response.data;
    } catch (error) {
      console.error('Error getting subscription types:', error);
      throw error;
    }
  },
};
