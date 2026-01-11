// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useCallback, useEffect, useState } from "react";

import Logger from "@lichtblick/log";
import { useShallowMemo } from "@lichtblick/hooks";
import AuthContext, {
  AuthState,
  IAuthContext,
  LoginCredentials,
  RegisterData,
} from "@lichtblick/suite-base/context/AuthContext";
import { ApiError } from "@lichtblick/suite-base/services/ApiClient";
import { IAuthService } from "@lichtblick/suite-base/services/AuthService";

const log = Logger.getLogger(__filename);

type AuthProviderProps = React.PropsWithChildren<{
  authService: IAuthService;
}>;

/**
 * Provider component for authentication context
 */
export default function AuthProvider({ authService, children }: AuthProviderProps): JSX.Element {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: undefined,
    error: undefined,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!authService.hasValidSession()) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: undefined,
          error: undefined,
        });
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          error: undefined,
        });
      } catch (error) {
        log.warn("Session check failed:", error);
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: undefined,
          error: undefined,
        });
      }
    };

    checkSession().catch((error: unknown) => {
      log.error("Session check error:", error);
    });
  }, [authService]);

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const user = await authService.login(credentials);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          error: undefined,
        });
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Sign in failed. Please try again.";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [authService],
  );

  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      try {
        const user = await authService.register(data);
        setState({
          isLoading: false,
          isAuthenticated: true,
          user,
          error: undefined,
        });
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Registration failed. Please try again.";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [authService],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      log.warn("Logout error:", error);
    } finally {
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: undefined,
        error: undefined,
      });
    }
  }, [authService]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      await authService.refreshTokens();
      const user = await authService.getCurrentUser();
      setState((prev) => ({
        ...prev,
        user,
        error: undefined,
      }));
    } catch (error) {
      log.warn("Session refresh failed:", error);
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: undefined,
        error: undefined,
      });
    }
  }, [authService]);

  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  const contextValue = useShallowMemo<IAuthContext>({
    ...state,
    signIn,
    register,
    signOut,
    refreshSession,
    clearError,
  });

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}
