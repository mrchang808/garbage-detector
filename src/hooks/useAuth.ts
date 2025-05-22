import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ENDPOINTS } from '../api/endpoints';

interface DecodedToken {
  sub: string;  // User ID as a string
  email: string;
  role: string;
  exp: number;
}

interface User {
  id: number;
  email: string;
  role: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

export const useAuth = () => {
  const navigate = useNavigate();

  // Helper function to check token validity
  const isTokenValid = (token: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  // Helper function to decode token and get user data
  const getUserFromToken = (token: string): User | null => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return {
        id: parseInt(decoded.sub, 10),  // Convert sub (user ID) to number
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  };

  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    return token ? getUserFromToken(token) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token && isTokenValid(token);
  });

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const response = await axios.post<LoginResponse>(ENDPOINTS.LOGIN, {
            email,
            password
        });

        const { access_token, user: userData } = response.data;
        
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Update user state immediately
        setUser(userData);
        setIsAuthenticated(true);
        
        // Use replace to prevent going back to login
        window.location.href = '/dashboard'; // Force page refresh
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login'; // Force page refresh
};

  // Add authorization header to all requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 422) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Token validation check
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        const token = localStorage.getItem('token');
        if (!token || !isTokenValid(token)) {
          logout();
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    login,
    logout
  };
};