/**
 * Authentication Hook
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useMutation } from '../lib/convex';
import { api } from '../convex/_generated/api';
import { User, AuthResult, SignupData, LoginData } from '../types';

// ============================================
// AUTH STATE
// ============================================

interface AuthState {
  user: Omit<User, 'passwordHash'> | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (data: LoginData) => Promise<AuthResult>;
  signup: (data: SignupData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string }) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  clearError: () => void;
}

type AuthContextValue = AuthState & AuthActions;

// ============================================
// STORAGE KEYS
// ============================================

const TOKEN_STORAGE_KEY = 'christmas_tree_auth_token';

// ============================================
// AUTH CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  const validateSessionMutation = useMutation(api.auth.validateSession);
  const loginMutation = useMutation(api.auth.login);
  const signupMutation = useMutation(api.auth.signup);
  const logoutMutation = useMutation(api.auth.logout);
  const updateProfileMutation = useMutation(api.auth.updateProfile);
  const changePasswordMutation = useMutation(api.auth.changePassword);

  // Load token from storage and validate on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          const user = await validateSessionMutation({ token: storedToken });
          if (user) {
            setState({
              user,
              token: storedToken,
              isLoading: false,
              error: null,
            });
            return;
          }
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };

    initAuth();
  }, [validateSessionMutation]);

  const login = useCallback(async (data: LoginData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await loginMutation(data);
      if (result.success && result.token && result.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
        setState({
          user: result.user,
          token: result.token,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Login failed',
        }));
      }
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, error }));
      return { success: false, error };
    }
  }, [loginMutation]);

  const signup = useCallback(async (data: SignupData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await signupMutation(data);
      if (result.success && result.token && result.user) {
        localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
        setState({
          user: result.user,
          token: result.token,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Signup failed',
        }));
      }
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Signup failed';
      setState(prev => ({ ...prev, isLoading: false, error }));
      return { success: false, error };
    }
  }, [signupMutation]);

  const logout = useCallback(async (): Promise<void> => {
    const { token } = state;
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  }, [state.token, logoutMutation]);

  const updateProfile = useCallback(async (data: { name?: string }): Promise<AuthResult> => {
    const { token } = state;
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const result = await updateProfileMutation({ token, ...data });
      if (result.success && result.user) {
        setState(prev => ({ ...prev, user: result.user }));
      }
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Update failed';
      return { success: false, error };
    }
  }, [state.token, updateProfileMutation]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    const { token } = state;
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      return await changePasswordMutation({
        token,
        currentPassword,
        newPassword,
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Password change failed';
      return { success: false, error };
    }
  }, [state.token, changePasswordMutation]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}