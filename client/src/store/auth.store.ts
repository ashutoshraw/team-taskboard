import { create } from "zustand";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  setAuth: (user, token) => {
    localStorage.setItem("accessToken", token);
    set({ user, accessToken: token });
  },
  clearAuth: () => {
    localStorage.removeItem("accessToken");
    set({ user: null, accessToken: null });
  },
}));