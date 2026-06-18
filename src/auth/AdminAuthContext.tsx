import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { devAdminAuth } from './devAdminAuth';
import { adminAuthService } from '@/services/adminAuthService';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (devAdminAuth.isLocalDevEnabled()) {
      setIsAuthenticated(devAdminAuth.isAuthenticated());
      return;
    }

    void adminAuthService.status().then((authenticated) => {
      setIsAuthenticated(authenticated);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const didLogin = devAdminAuth.isLocalDevEnabled()
      ? devAdminAuth.login(username, password)
      : await adminAuthService.login(username, password);
    setIsAuthenticated(didLogin);
    return didLogin;
  }, []);

  const logout = useCallback(async () => {
    if (devAdminAuth.isLocalDevEnabled()) {
      devAdminAuth.logout();
    } else {
      await adminAuthService.logout();
    }
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthContextValue => {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }

  return context;
};
