import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance, { setAuthContextHandlingInitialLoad } from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isCheckingRef = useRef(false);
  const lastAuthCheckRef = useRef(null); // Track last successful auth check time

  const checkAuth = async () => {
    // Mark that AuthContext is handling initial load to prevent axios interceptor from redirecting
    setAuthContextHandlingInitialLoad(true);
    
    try {
      // First check localStorage
      const storedUser = localStorage.getItem('user_data');
      const storedPermissions = localStorage.getItem('user_permissions');
      
      if (storedUser) {
        try {
          // Verify with backend
          const response = await axiosInstance.get('/auth/me');
          if (response.data.user) {
            setUser(response.data.user);
            localStorage.setItem('user_data', JSON.stringify(response.data.user));
            lastAuthCheckRef.current = Date.now(); // Update last check time
            
            // Handle permissions if available
            if (response.data.permissions) {
              setPermissions(response.data.permissions);
              localStorage.setItem('user_permissions', JSON.stringify(response.data.permissions));
            } else if (storedPermissions) {
              // Fallback to stored permissions if backend doesn't return them
              setPermissions(JSON.parse(storedPermissions));
            }
          } else {
            throw new Error('No user data in response');
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          // Only clear and redirect if it's an auth error (401, 404, NOT_FOUND)
          // Don't redirect if it's a network error or other issue
          const isAuthError = error.response?.status === 401 || 
                            error.response?.status === 404 || 
                            error.response?.data?.code === 'NOT_FOUND';
          
          setUser(null);
          setPermissions(null);
          localStorage.removeItem('user_data');
          localStorage.removeItem('user_permissions');
          
          // Only redirect if it's an auth error and we're not already on login page
          if (isAuthError && window.location.pathname !== '/') {
            // Use a small delay to allow state to settle
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 100);
          }
        }
      } else {
        setUser(null);
        setPermissions(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setPermissions(null);
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
    } finally {
      setLoading(false);
      // Mark that initial load is complete - allow axios interceptor to handle future errors
      setTimeout(() => {
        setAuthContextHandlingInitialLoad(false);
      }, 500);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []); // Only run once on mount

  // Separate effect for visibility/focus handlers - using refs to avoid re-creating handlers
  useEffect(() => {
    let timeoutId = null;
    
    // Handle visibility change - re-check auth when user returns to tab
    const handleVisibilityChange = async () => {
      // Get current user from localStorage to avoid dependency on state
      const currentUser = localStorage.getItem('user_data');
      
      if (!document.hidden && currentUser && !isCheckingRef.current) {
        // Only check if enough time has passed since last check (12 hours)
        // This prevents excessive API calls while still catching expired sessions
        const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        const timeSinceLastCheck = lastAuthCheckRef.current 
          ? Date.now() - lastAuthCheckRef.current 
          : Infinity;
        
        // Skip check if we checked recently (within 12 hours)
        if (timeSinceLastCheck < twelveHours) {
          return;
        }
        
        // Clear any pending timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Debounce the check - wait 2 seconds after visibility change
        timeoutId = setTimeout(async () => {
          if (isCheckingRef.current) return;
          
          isCheckingRef.current = true;
          try {
            // User has returned to the tab and we have a user, verify session is still valid
            const response = await axiosInstance.get('/auth/me');
            if (response.data.user) {
              // Session is valid, update user data
              setUser(response.data.user);
              localStorage.setItem('user_data', JSON.stringify(response.data.user));
              lastAuthCheckRef.current = Date.now(); // Update last check time
              
              if (response.data.permissions) {
                setPermissions(response.data.permissions);
                localStorage.setItem('user_permissions', JSON.stringify(response.data.permissions));
              }
            } else {
              // Session expired, clear and redirect
              setUser(null);
              setPermissions(null);
              localStorage.removeItem('user_data');
              localStorage.removeItem('user_permissions');
              lastAuthCheckRef.current = null;
              navigate('/');
            }
          } catch (error) {
            // Session expired or error occurred - the axios interceptor will handle redirect
            // Just clear local state here to prevent showing stale data
            console.warn('Session verification failed on visibility change:', error);
            setUser(null);
            setPermissions(null);
            localStorage.removeItem('user_data');
            localStorage.removeItem('user_permissions');
            lastAuthCheckRef.current = null;
            // Don't navigate here - axios interceptor will handle it
          } finally {
            // Reset flag after a delay to allow for debouncing
            setTimeout(() => {
              isCheckingRef.current = false;
            }, 1000);
          }
        }, 2000); // Wait 2 seconds before checking
      }
    };
    
    // Handle focus event - check auth when window regains focus
    // Note: We're disabling this as it can conflict with visibility change
    // The visibility change handler is sufficient
    const handleFocus = () => {
      // Disabled to prevent excessive calls - visibility change is enough
      // Focus events fire too frequently
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Cleanup event listeners on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]); // Only depend on navigate, not user

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await axiosInstance.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data && response.data.user) {
        console.log('Setting user data:', response.data.user);
        setUser(response.data.user);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        lastAuthCheckRef.current = Date.now(); // Track login time
        
        // Store permissions if available
        if (response.data.permissions) {
          console.log('Setting permissions:', response.data.permissions);
          setPermissions(response.data.permissions);
          localStorage.setItem('user_permissions', JSON.stringify(response.data.permissions));
        }
        
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
      setPermissions(null);
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      lastAuthCheckRef.current = null; // Clear last check time
      // Force a page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, clear local state
      setUser(null);
      setPermissions(null);
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_permissions');
      lastAuthCheckRef.current = null; // Clear last check time
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout, checkAuth }}>
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