import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      // First check localStorage
      const storedUser = localStorage.getItem('user_data');
      if (storedUser) {
        try {
          // Verify with backend
          const response = await axiosInstance.get('/auth/me');
          if (response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('user_data', JSON.stringify(response.data.user));
          } else {
            throw new Error('No user data in response');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          setUser(null);
          localStorage.removeItem('user_data');
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      localStorage.removeItem('user_data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await axiosInstance.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data && response.data.user) {
        console.log('Setting user data:', response.data.user);
        setUser(response.data.user);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        
        // Redirect to user's department main page
        const userDepartment = response.data.user.department;
        const redirectPath = getDepartmentMainPath(userDepartment);
        navigate(redirectPath);
        
        return response.data;
      } else {
        console.error('No user data in response:', response.data);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Login error:', error.response || error);
      throw error;
    }
  };

  const getDepartmentMainPath = (department) => {
    const departmentPaths = {
      'program': '/program',
      'store': '/store',
      'procurements': '/procurements',
      'accounts_and_finance': '/accounts_and_finance',
      'admin': '/admin'
    };
    
    return departmentPaths[department] || '/program'; // Default fallback
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      await axiosInstance.post('/auth/logout');
      console.log('Logout successful, clearing user data');
      setUser(null);
      localStorage.removeItem('user_data');
      // Force a page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, clear local state
      setUser(null);
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 