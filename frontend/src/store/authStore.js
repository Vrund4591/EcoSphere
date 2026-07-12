import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await authAPI.login({ email, password });
          const { user, token } = data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (e) {
          const message = e.response?.data?.message || 'Login failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      signup: async (payload) => {
        set({ loading: true, error: null });
        try {
          const { data } = await authAPI.signup(payload);
          const { user, token } = data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true };
        } catch (e) {
          const message = e.response?.data?.message || 'Signup failed';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
      hasRole: (...roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'ecosphere-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
