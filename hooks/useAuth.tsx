/**
 * Authentication Hook - SCAFFOLD FOR IMPLEMENTATION
 *
 * React hook for managing authentication state.
 * Uses the auth functions from convex-dev/auth.ts
 *
 * USAGE:
 * ```tsx
 * import { useAuth } from '@/hooks/useAuth';
 *
 * function MyComponent() {
 *   const { user, isLoading, login, signup, logout } = useAuth();
 *
 *   if (isLoading) return <Loading />;
 *   if (!user) return <LoginForm onSubmit={login} />;
 *
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { api } from '../convex-dev';
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

/**
 * Auth Provider - Wrap your app with this
 *
 * ```tsx
 * // In App.tsx or main.tsx
 * import { AuthProvider } from '@/hooks/useAuth';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourApp />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // Load token from storage and validate on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          const user = await api.auth.validateSession({ token: storedToken });
          if (user) {
            setState({
              user,
              token: storedToken,
              isLoading: false,
              error: null,
            });
            return;
          }
          // Token invalid, remove it
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Auth init error:', e);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    };

    initAuth();
  }, []);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = api.auth.subscribe(() => {
      // Re-validate session on auth changes
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        api.auth.validateSession({ token }).then(user => {
          setState(prev => ({
            ...prev,
            user: user || null,
            token: user ? token : null,
          }));
        });
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (data: LoginData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await api.auth.login(data);

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
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await api.auth.signup(data);

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
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const { token } = state;
    if (token) {
      await api.auth.logout({ token });
    }
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  }, [state.token]);

  const updateProfile = useCallback(async (data: { name?: string }): Promise<AuthResult> => {
    const { token } = state;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const result = await api.auth.updateProfile({ token, ...data });
      if (result.success && result.user) {
        setState(prev => ({ ...prev, user: result.user! }));
      }
      return result;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Update failed';
      return { success: false, error };
    }
  }, [state.token]);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    const { token } = state;
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      return await api.auth.changePassword({
        token,
        currentPassword,
        newPassword,
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Password change failed';
      return { success: false, error };
    }
  }, [state.token]);

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to require authentication
 * Redirects or shows error if not authenticated
 *
 * ```tsx
 * function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *
 *   if (isLoading) return <Loading />;
 *   // user is guaranteed to exist here
 *
 *   return <div>Protected content for {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const auth = useAuth();

  // TODO: Implement redirect logic
  // useEffect(() => {
  //   if (!auth.isLoading && !auth.user) {
  //     router.push('/login');
  //   }
  // }, [auth.isLoading, auth.user]);

  return auth;
}
