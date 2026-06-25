import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const ctx = useAuthContext();
  return {
    user: ctx.user,
    token: ctx.token,
    refreshToken: ctx.refreshToken,
    loading: ctx.loading,
    login: ctx.login,
    logout: ctx.logout,
    refreshSession: ctx.refreshSession,
    isAuthenticated: ctx.isAuthenticated,
  };
}



