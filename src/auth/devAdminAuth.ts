const ADMIN_SESSION_KEY = 'rra_dev_admin_authenticated';

const isLocalDev = (): boolean => {
  const isDevMode = Boolean(import.meta.env.DEV);
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  return isDevMode && isLocalHost;
};

const DEV_ADMIN_USERNAME = String(import.meta.env.VITE_DEV_ADMIN_USERNAME ?? 'admin');
const DEV_ADMIN_PASSWORD = String(import.meta.env.VITE_DEV_ADMIN_PASSWORD ?? 'admin123');

export const devAdminAuth = {
  getLocalDevCredentials(): { username: string; password: string } {
    return {
      username: DEV_ADMIN_USERNAME,
      password: DEV_ADMIN_PASSWORD,
    };
  },

  isLocalDevEnabled(): boolean {
    return isLocalDev();
  },

  isAuthenticated(): boolean {
    if (!isLocalDev()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  },

  login(username: string, password: string): boolean {
    if (!isLocalDev()) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    const isValid =
      DEV_ADMIN_USERNAME.length > 0 && DEV_ADMIN_PASSWORD.length > 0 && username.trim() === DEV_ADMIN_USERNAME && password === DEV_ADMIN_PASSWORD;

    if (isValid) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return true;
    }

    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  },

  logout(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  },
};
