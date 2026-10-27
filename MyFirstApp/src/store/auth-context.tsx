import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getItem, STORAGE_KEYS } from '../services/storage';
import { initApiClient } from '../services/api';
import {
  loginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  type LoginPayload,
  type RegisterPayload,
} from '../services/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: { displayName?: string; email?: string; organization?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        await initApiClient();
        const storedUserData = await getItem(STORAGE_KEYS.USER_DATA);
        const accessToken = await getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (storedUserData && accessToken) {
          setUser(JSON.parse(storedUserData) as User);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const result = await loginUser(payload);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const result = await registerUser(payload);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (updates: { displayName?: string; email?: string; organization?: string }) => {
    try {
      const updated = await updateUserProfile(updates);
      setUser(updated);
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
