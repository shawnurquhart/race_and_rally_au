export const DEV_ADMIN_USERNAME = 'urquhartdigital@gmail.com';
export const DEV_ADMIN_PASSWORD = 'testing1234';
const ADMIN_SESSION_KEY = 'rra_dev_admin_authenticated';

export const devAdminAuth = {
  isAuthenticated(): boolean {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  },

  login(username: string, password: string): boolean {
    const isValid =
      username.trim() === DEV_ADMIN_USERNAME && password === DEV_ADMIN_PASSWORD;

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
