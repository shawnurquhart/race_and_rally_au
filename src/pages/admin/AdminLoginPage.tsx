import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { DEV_ADMIN_PASSWORD, DEV_ADMIN_USERNAME } from '@/auth/devAdminAuth';

interface LoginLocationState {
  from?: string;
}

const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LoginLocationState | null;

  const [username, setUsername] = useState(DEV_ADMIN_USERNAME);
  const [password, setPassword] = useState(DEV_ADMIN_PASSWORD);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const didLogin = login(username, password);

    if (!didLogin) {
      setError('Invalid development admin credentials.');
      return;
    }

    navigate(state?.from ?? '/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-gray-800 bg-gray-950 p-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Admin Login</h1>
        <p className="text-gray-400 text-sm mb-6">
          Development-only authentication. This will be replaced by Supabase Auth.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              className="w-full bg-black border border-gray-700 px-3 py-2 text-white"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              className="w-full bg-black border border-gray-700 px-3 py-2 text-white"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="mt-2 text-xs text-motorsport-yellow hover:underline"
              onClick={() => setShowPassword((previous) => !previous)}
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
