import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors (Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it and redirect to login
      localStorage.removeItem('token');
      // Only redirect if we're not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * @typedef {Object} AnalyzeResponse
 * @property {string} status - Status of the analysis ("success")
 * @property {number} video_id - Database ID of the analyzed video
 * @property {string} username - Creator's username
 * @property {string} transcript_text - Full transcript of the video
 * @property {Array<{start: number, end: number, text: string}>} segments - Transcript segments with timestamps
 * @property {{video: string, audio: string, frames: string}} paths - File paths for video, audio, and frames
 * @property {Object.<string, any>} [style_passport] - Style analysis result (hook, pacing, visual style, etc.)
 * @property {Object.<string, any>} [meta_stats] - Video metadata (view_count, like_count, title, duration, etc.)
 */

/**
 * @typedef {Object} VideoResponse
 * @property {string} status - Status ("success")
 * @property {number} video_id - Database ID of the video
 * @property {string} username - Creator's username
 * @property {string} transcript_text - Transcript (empty if not stored in DB)
 * @property {Object.<string, any>} [style_passport] - Style analysis result
 * @property {Object.<string, any>} [meta_stats] - Video metadata
 * @property {string} youtube_url - Original video URL
 * @property {string} title - Video title
 */

/**
 * @typedef {Object} ProfileResponse
 * @property {string} username - Creator's username
 * @property {Object.<string, any>} master_profile - Master DNA profile
 * @property {number} videos_count - Total number of analyzed videos
 * @property {Array<{id: number, title: string, url: string, views: number, created_at: string}>} videos - List of analyzed videos
 */

/**
 * @typedef {Object} GenerateResponse
 * @property {string} status - Status ("success")
 * @property {Object.<string, any>} script_data - Generated script data (title, script array, viral_tips)
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} [status] - HTTP status code
 * @property {any} [response] - Full error response
 */

/**
 * Helper function to extract error message from API error
 * @param {Error} error - Axios error object
 * @returns {ApiError} Formatted error object
 */
const formatError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.detail || error.response.data?.message || error.message,
      status: error.response.status,
      response: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    console.error('Network error - no response from server:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });
    return {
      message: 'No response from server. Please check your connection and ensure the backend server is running.',
      status: null,
      response: null,
    };
  } else {
    // Error setting up the request
    console.error('Request setup error:', error.message);
    return {
      message: error.message || 'An unexpected error occurred',
      status: null,
      response: null,
    };
  }
};

export const api = {
  /**
   * Analyzes a video (Download -> Extract -> Transcribe -> AI Analyze -> Save to DB).
   * @param {string} url - Video URL (YouTube, TikTok, Reels, Shorts)
   * @returns {Promise<AnalyzeResponse>} Analysis result with transcript, style passport, and metadata
   * @throws {ApiError} If analysis fails
   */
  analyzeVideo: async (url) => {
    try {
      const response = await apiClient.post('/analyze', { url });
      return response.data;
    } catch (error) {
      console.error('API Error (analyzeVideo):', error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },

  /**
   * Gets full video analysis by video ID.
   * @param {number} id - Video database ID
   * @returns {Promise<VideoResponse>} Video analysis data (statistics, style passport, metadata)
   * @throws {ApiError} If video not found (404) or other error
   */
  getVideo: async (id) => {
    try {
      const response = await apiClient.get(`/video/${id}`);
      return response.data;
    } catch (error) {
      console.error(`API Error (getVideo) for ID ${id}:`, error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },

  /**
   * Fetches a creator's profile (Master DNA + Video History).
   * @param {string} username - Creator's username
   * @returns {Promise<ProfileResponse>} Profile with master DNA and list of analyzed videos
   * @throws {ApiError} If user not found (404) or other error
   */
  getProfile: async (username) => {
    try {
      const response = await apiClient.get(`/profile/${username}`);
      return response.data;
    } catch (error) {
      console.error(`API Error (getProfile) for username ${username}:`, error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },

  /**
   * Generates a new script based on the creator's Master DNA.
   * @param {string} username - Creator's username (must have analyzed videos first)
   * @param {string} topic - Topic for the new video
   * @returns {Promise<GenerateResponse>} Generated script with title, script blocks, and viral tips
   * @throws {ApiError} If user not found (404), no master profile (404), or generation fails
   */
  generateScript: async (username, topic) => {
    try {
      const response = await apiClient.post('/generate', { username, topic });
      return response.data;
    } catch (error) {
      console.error(`API Error (generateScript) for username ${username}:`, error);
      const formattedError = formatError(error);
      throw formattedError;
    }
  },
};

export default api;
