import { create } from 'zustand';

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('radio_user')) || null,
  login: (userData) => {
    localStorage.setItem('radio_user', JSON.stringify(userData));
    set({ user: userData });
  },
  logout: () => {
    localStorage.removeItem('radio_user');
    set({ user: null });
  }
}));
