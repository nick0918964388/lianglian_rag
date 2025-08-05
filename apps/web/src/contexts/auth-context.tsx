'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { create } from 'zustand';
import { 
  storeToken, 
  clearToken, 
  getCurrentUser, 
  isAuthenticated as checkIsAuthenticated 
} from '../lib/auth/token-storage';

// User interface matching the backend User model (without password)
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication state interface
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

// Authentication actions interface
interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
  initialize: () => void;
  setLoading: (loading: boolean) => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Create Zustand store for authentication state
const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  isLoading: true,

  // Actions
  login: (token: string, user: User) => {
    try {
      // Store token with simplified user data for token storage
      storeToken(token, { userId: user.id, email: user.email });
      
      // Update store state
      set({
        isAuthenticated: true,
        user: user,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    clearToken();
    set({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  },

  initialize: () => {
    try {
      const currentUser = getCurrentUser();
      const authenticated = checkIsAuthenticated();
      
      if (authenticated && currentUser) {
        // Create full user object from stored data
        // Note: We only have userId and email from token storage
        // In production, you might want to fetch full user data from API
        const user: User = {
          id: currentUser.userId,
          email: currentUser.email,
          createdAt: new Date(), // Placeholder - would be fetched from API in production
          updatedAt: new Date(), // Placeholder - would be fetched from API in production
        };

        set({
          isAuthenticated: true,
          user: user,
          isLoading: false,
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear any corrupted tokens on initialization failure
      clearToken();
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

// Context for accessing auth store (optional - Zustand can be used directly)
const AuthContext = createContext<AuthStore | null>(null);

// Hook to use auth context (optional alternative to direct store access)
export const useAuthContext = (): AuthStore => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback to direct store access if context is not available
    return useAuthStore();
  }
  return context;
};

// Main auth hook - use this in components
export const useAuth = (): AuthStore => {
  return useAuthStore();
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authStore = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    authStore.initialize();
  }, [authStore]);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for auth actions only (cleaner API for components that only need actions)
export const useAuthActions = () => {
  const { login, logout, setLoading } = useAuth();
  return { login, logout, setLoading };
};