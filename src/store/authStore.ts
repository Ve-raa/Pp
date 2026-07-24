import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveBuyerToken,
  saveProviderToken,
  clearBuyerToken,
  clearProviderToken,
  getBuyerToken,
  getProviderToken,
} from '../api/client';
import type { BuyerUser, ProviderUser } from '../types';

interface AuthState {
  // Buyer
  buyerToken: string | null;
  buyerUser: BuyerUser | null;
  // Provider
  providerToken: string | null;
  providerUser: ProviderUser | null;
  // App mode
  mode: 'buyer' | 'provider' | null;
  isLoading: boolean;

  // Actions
  loginAsBuyer: (token: string, user: BuyerUser) => Promise<void>;
  loginAsProvider: (token: string, user: ProviderUser) => Promise<void>;
  logoutBuyer: () => Promise<void>;
  logoutProvider: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchMode: (mode: 'buyer' | 'provider') => void;
  updateBuyerUser: (user: Partial<BuyerUser>) => void;
  updateProviderUser: (user: Partial<ProviderUser>) => void;
  hydrateFromStorage: () => Promise<void>;
}

const BUYER_USER_KEY = 'vera_buyer_user';
const PROVIDER_USER_KEY = 'vera_provider_user';
const MODE_KEY = 'vera_mode';

export const useAuthStore = create<AuthState>((set, get) => ({
  buyerToken: null,
  buyerUser: null,
  providerToken: null,
  providerUser: null,
  mode: null,
  isLoading: true,

  loginAsBuyer: async (token, user) => {
    await saveBuyerToken(token);
    await AsyncStorage.setItem(BUYER_USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(MODE_KEY, 'buyer');
    set({ buyerToken: token, buyerUser: user, mode: 'buyer' });
  },

  loginAsProvider: async (token, user) => {
    await saveProviderToken(token);
    await AsyncStorage.setItem(PROVIDER_USER_KEY, JSON.stringify(user));
    await AsyncStorage.setItem(MODE_KEY, 'provider');
    set({ providerToken: token, providerUser: user, mode: 'provider' });
  },

  logoutBuyer: async () => {
    await clearBuyerToken();
    await AsyncStorage.removeItem(BUYER_USER_KEY);
    const currentMode = get().mode;
    const newMode = currentMode === 'buyer' ? (get().providerToken ? 'provider' : null) : currentMode;
    if (newMode) await AsyncStorage.setItem(MODE_KEY, newMode);
    else await AsyncStorage.removeItem(MODE_KEY);
    set({ buyerToken: null, buyerUser: null, mode: newMode });
  },

  logoutProvider: async () => {
    await clearProviderToken();
    await AsyncStorage.removeItem(PROVIDER_USER_KEY);
    const currentMode = get().mode;
    const newMode = currentMode === 'provider' ? (get().buyerToken ? 'buyer' : null) : currentMode;
    if (newMode) await AsyncStorage.setItem(MODE_KEY, newMode);
    else await AsyncStorage.removeItem(MODE_KEY);
    set({ providerToken: null, providerUser: null, mode: newMode });
  },

  logoutAll: async () => {
    await clearBuyerToken();
    await clearProviderToken();
    await AsyncStorage.multiRemove([BUYER_USER_KEY, PROVIDER_USER_KEY, MODE_KEY]);
    set({ buyerToken: null, buyerUser: null, providerToken: null, providerUser: null, mode: null });
  },

  switchMode: (mode) => {
    AsyncStorage.setItem(MODE_KEY, mode);
    set({ mode });
  },

  updateBuyerUser: (user) => {
    const current = get().buyerUser;
    if (!current) return;
    const updated = { ...current, ...user };
    AsyncStorage.setItem(BUYER_USER_KEY, JSON.stringify(updated));
    set({ buyerUser: updated });
  },

  updateProviderUser: (user) => {
    const current = get().providerUser;
    if (!current) return;
    const updated = { ...current, ...user };
    AsyncStorage.setItem(PROVIDER_USER_KEY, JSON.stringify(updated));
    set({ providerUser: updated });
  },

  hydrateFromStorage: async () => {
    try {
      const [buyerToken, providerToken, buyerUserStr, providerUserStr, mode] = await Promise.all([
        getBuyerToken(),
        getProviderToken(),
        AsyncStorage.getItem(BUYER_USER_KEY),
        AsyncStorage.getItem(PROVIDER_USER_KEY),
        AsyncStorage.getItem(MODE_KEY),
      ]);

      const buyerUser = buyerUserStr ? JSON.parse(buyerUserStr) : null;
      const providerUser = providerUserStr ? JSON.parse(providerUserStr) : null;
      const resolvedMode = (mode as 'buyer' | 'provider' | null) ||
        (buyerToken ? 'buyer' : providerToken ? 'provider' : null);

      set({ buyerToken, buyerUser, providerToken, providerUser, mode: resolvedMode, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
