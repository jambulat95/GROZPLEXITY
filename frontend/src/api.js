import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Analyzes a YouTube video (Extract -> Transcribe -> AI Analyze -> Save to DB).
   * @param {string} url - YouTube video URL
   */
  analyzeVideo: async (url) => {
    try {
      const response = await apiClient.post('/analyze', { url });
      return response.data;
    } catch (error) {
      console.error('API Error (analyzeVideo):', error);
      throw error;
    }
  },

  /**
   * Fetches a creator's profile (Master DNA + Video History).
   * @param {string} username - Creator's username
   */
  getProfile: async (username) => {
    try {
      const response = await apiClient.get(`/profile/${username}`);
      return response.data;
    } catch (error) {
      console.error('API Error (getProfile):', error);
      throw error;
    }
  },

  /**
   * Generates a new script based on the creator's Master DNA.
   * @param {string} username - Creator's username (must be analyzed first)
   * @param {string} topic - Topic for the new video
   */
  generateScript: async (username, topic) => {
    try {
      const response = await apiClient.post('/generate', { username, topic });
      return response.data;
    } catch (error) {
      console.error('API Error (generateScript):', error);
      throw error;
    }
  },
};

export default api;

