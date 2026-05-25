import { create } from 'zustand';
import { authStorage } from '../utils/storage';
import { isTokenExpired } from '../utils/token';
import { User } from '../../integrations/auth/auth.types';

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  bootstrap: () => void;
  signIn: (user: User, token: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  bootstrap: () => {
    const token = authStorage.getAccessToken();
    const user = authStorage.getUser() as User | null;

    if (!token || !user || isTokenExpired(token)) {
      authStorage.clearAccessToken();
      authStorage.clearUser();
      set({ user: null, token: null, isAuthenticated: false });
      return;
    }
    console.log('bootstrap auth store', { user, token });
    set({ user, token, isAuthenticated: true });
  },
  signIn: (user, token) => {
    authStorage.setAccessToken(token);
    authStorage.setUser(user);
    console.log('signIn auth store', { user, token });
    set({ user, token, isAuthenticated: true });
  },
  signOut: () => {
    authStorage.clearAccessToken();
    authStorage.clearUser();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
