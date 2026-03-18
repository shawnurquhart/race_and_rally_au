import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { devAdminAuth } from './devAdminAuth';

interface AdminAuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(devAdminAuth.isAuthenticated());
  }, []);

  const login = useCallback((username: string, password: string) => {
    const didLogin = devAdminAuth.login(username, password);
    setIsAuthenticated(didLogin);
    return didLogin;
  }, []);

  const logout = useCallback(() => {
    devAdminAuth.logout();
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
