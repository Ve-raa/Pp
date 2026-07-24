import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://veraapp.app';

// ─── Token Storage Keys ───────────────────────────────────────────────────────
export const BUYER_TOKEN_KEY = 'vera_buyer_token';
export const PROVIDER_TOKEN_KEY = 'vera_provider_token';

// ─── Token Helpers ────────────────────────────────────────────────────────────
export async function getBuyerToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(BUYER_TOKEN_KEY); } catch { return null; }
}
export async function getProviderToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(PROVIDER_TOKEN_KEY); } catch { return null; }
}
export async function saveBuyerToken(token: string): Promise<void> {
  if (token) await SecureStore.setItemAsync(BUYER_TOKEN_KEY, token);
}
export async function saveProviderToken(token: string): Promise<void> {
  if (token) await SecureStore.setItemAsync(PROVIDER_TOKEN_KEY, token);
}
export async function clearBuyerToken(): Promise<void> {
  await SecureStore.deleteItemAsync(BUYER_TOKEN_KEY);
}
export async function clearProviderToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PROVIDER_TOKEN_KEY);
}

// ─── Unauthorized Handler ─────────────────────────────────────────────────────
// Called when a 401 is received — set via setUnauthorizedHandler in _layout.tsx
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

// ─── Shared base config ───────────────────────────────────────────────────────
const baseConfig = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'ar',
  },
  // Sends native cookie jar automatically on iOS & Android
  withCredentials: true,
};

// ─── Axios Client Factory ─────────────────────────────────────────────────────
function createClient(tokenGetter: () => Promise<string | null>): AxiosInstance {
  const client = axios.create(baseConfig);

  // Request interceptor: inject Bearer token only when it's a real JWT.
  // The backend is cookie-based; withCredentials handles auth automatically.
  // If the stored value is a sentinel like 'via-cookie', skip the header.
  client.interceptors.request.use(async (config) => {
    const token = await tokenGetter();
    if (token && token.startsWith('eyJ')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: on 401, clear session and redirect to login
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Clear stored tokens so hydrateFromStorage sees a logged-out state
        await clearBuyerToken().catch(() => {});
        await clearProviderToken().catch(() => {});
        // Notify root layout to redirect to login
        _onUnauthorized?.();
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ─── Exported Clients ─────────────────────────────────────────────────────────
export const buyerClient = createClient(getBuyerToken);
export const providerClient = createClient(getProviderToken);

// Public client — no auth token
export const publicClient = axios.create(baseConfig);

// ─── Generic request helpers ──────────────────────────────────────────────────
export async function publicGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await publicClient.get<T>(url, { params });
  return res.data;
}
export async function buyerGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await buyerClient.get<T>(url, { params });
  return res.data;
}
export async function buyerPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await buyerClient.post<T>(url, data);
  return res.data;
}
export async function buyerPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await buyerClient.put<T>(url, data);
  return res.data;
}
export async function buyerDelete<T>(url: string): Promise<T> {
  const res = await buyerClient.delete<T>(url);
  return res.data;
}
export async function providerGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await providerClient.get<T>(url, { params });
  return res.data;
}
export async function providerPost<T>(url: string, data?: unknown): Promise<T> {
  const res = await providerClient.post<T>(url, data);
  return res.data;
}
export async function providerPut<T>(url: string, data?: unknown): Promise<T> {
  const res = await providerClient.put<T>(url, data);
  return res.data;
}
export async function providerDelete<T>(url: string): Promise<T> {
  const res = await providerClient.delete<T>(url);
  return res.data;
}
