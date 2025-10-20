import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add a request interceptor to handle CORS preflight
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure credentials are included
    config.withCredentials = true;
    
    // Add CORS headers for preflight requests
    if (config.method === 'options') {
      config.headers['Access-Control-Allow-Origin'] = window.location.origin;
      config.headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // // Log the request details
    // console.log('Making request:', {
    //   url: config.url,
    //   method: config.method,
    //   baseURL: config.baseURL,
    //   headers: config.headers,
    //   withCredentials: config.withCredentials,
    //   origin: window.location.origin
    // });
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      message: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : 'No response',
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials,
        origin: window.location.origin
      }
    });
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 