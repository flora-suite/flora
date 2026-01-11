// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { createContext, useContext } from "react";

/**
 * Authenticated user information from flora-server
 */
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Authentication state
 */
export type AuthState = {
  /** Whether authentication is being checked */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current authenticated user */
  user: AuthUser | undefined;
  /** Authentication error message */
  error: string | undefined;
};

/**
 * Login credentials
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Registration data
 */
export type RegisterData = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Authentication context interface
 */
export interface IAuthContext extends AuthState {
  /** Sign in with email and password */
  signIn: (credentials: LoginCredentials) => Promise<void>;
  /** Register a new user */
  register: (data: RegisterData) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Refresh the current session */
  refreshSession: () => Promise<void>;
  /** Clear any authentication errors */
  clearError: () => void;
}

const defaultAuthContext: IAuthContext = {
  isLoading: true,
  isAuthenticated: false,
  user: undefined,
  error: undefined,
  signIn: async () => {
    throw new Error("AuthContext not initialized");
  },
  register: async () => {
    throw new Error("AuthContext not initialized");
  },
  signOut: async () => {
    throw new Error("AuthContext not initialized");
  },
  refreshSession: async () => {
    throw new Error("AuthContext not initialized");
  },
  clearError: () => {
    throw new Error("AuthContext not initialized");
  },
};

const AuthContext = createContext<IAuthContext>(defaultAuthContext);
AuthContext.displayName = "AuthContext";

/**
 * Hook to access authentication context
 */
export function useAuth(): IAuthContext {
  return useContext(AuthContext);
}

/**
 * Hook to get current authenticated user
 * Throws if user is not authenticated
 */
export function useRequireAuth(): AuthUser {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    throw new Error("Authentication is still loading");
  }

  if (!isAuthenticated || !user) {
    throw new Error("User is not authenticated");
  }

  return user;
}

export default AuthContext;
