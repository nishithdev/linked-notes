// API service for communicating with the backend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Same origin in production
  : 'http://localhost:3001'; // Development backend

class ThoughtsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Load thoughts from server
  async loadThoughts() {
    try {
      console.log('API: Making request to load thoughts...');
      const response = await this.request('/api/thoughts');
      console.log('API: Load thoughts response:', response);
      
      return {
        success: true,
        thoughts: response.thoughts || [],
        timestamp: response.timestamp
      };
    } catch (error) {
      console.error('API: Failed to load thoughts from server:', error);
      return {
        success: false,
        thoughts: [],
        error: error.message
      };
    }
  }

  // Save thoughts to server
  async saveThoughts(thoughts) {
    try {
      const response = await this.request('/api/thoughts', {
        method: 'POST',
        body: JSON.stringify({ thoughts }),
      });
      
      return {
        success: true,
        message: response.message,
        timestamp: response.timestamp,
        count: response.count
      };
    } catch (error) {
      console.error('Failed to save thoughts to server:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check server status
  async checkStatus() {
    try {
      console.log('API: Checking server status...');
      const response = await this.request('/api/status');
      console.log('API: Server status response:', response);
      
      return {
        success: true,
        online: true,
        ...response
      };
    } catch (error) {
      console.error('API: Server status check failed:', error);
      return {
        success: false,
        online: false,
        error: error.message
      };
    }
  }
}

export const thoughtsAPI = new ThoughtsAPI();
export default thoughtsAPI;
