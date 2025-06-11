import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Auth Context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Action types
const AUTH_TYPES = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_TYPES.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_TYPES.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_TYPES.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: AUTH_TYPES.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        dispatch({
          type: AUTH_TYPES.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: token,
          },
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: AUTH_TYPES.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_TYPES.SET_LOADING, payload: true });
      dispatch({ type: AUTH_TYPES.CLEAR_ERROR });

      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_TYPES.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_TYPES.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_TYPES.SET_LOADING, payload: true });
      dispatch({ type: AUTH_TYPES.CLEAR_ERROR });

      const response = await authAPI.register(userData);
      const { user, token } = response.data;

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_TYPES.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_TYPES.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      dispatch({ type: AUTH_TYPES.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API call fails
      dispatch({ type: AUTH_TYPES.LOGOUT });
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: AUTH_TYPES.UPDATE_USER, payload: userData });
    
    // Update localStorage
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_TYPES.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;