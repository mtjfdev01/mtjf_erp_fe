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
    return response;
  },
  (error) => {
    // Handle session expiration and unauthorized errors
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.code || error.response.data?.error;
      
      // Handle 401 Unauthorized or 404 NOT_FOUND (session expired)
      if (status === 401 || status === 404 || errorCode === 'NOT_FOUND') {
        // Only handle auth-related endpoints to avoid interfering with legitimate 404s
        const authEndpoints = ['/auth/me', '/auth/logout', '/auth/refresh'];
        const isAuthEndpoint = authEndpoints.some(endpoint => 
          error.config?.url?.includes(endpoint)
        );
        
        // If it's an auth endpoint or we're getting a NOT_FOUND error, handle session expiration
        if (isAuthEndpoint || errorCode === 'NOT_FOUND' || status === 401) {
          console.warn('Session expired or unauthorized. Clearing auth data and redirecting to login.');
          
          // Clear authentication data
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_permissions');
          
          // Redirect to login page if not already there
          if (window.location.pathname !== '/') {
            // Use a small delay to ensure localStorage is cleared
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
          
          // Return a rejected promise with a clear error message
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      }
    }
    
    // Log other errors for debugging
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