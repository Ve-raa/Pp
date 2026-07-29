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
  try { if (token) await SecureStore.setItemAsync(BUYER_TOKEN_KEY, token); } catch {}
}
export async function saveProviderToken(token: string): Promise<void> {
  try { if (token) await SecureStore.setItemAsync(PROVIDER_TOKEN_KEY, token); } catch {}
}
export async function clearBuyerToken(): Promise<void> {
  try { await SecureStore.deleteItemAsync(BUYER_TOKEN_KEY); } catch {}
}
export async function clearProviderToken(): Promise<void> {
  try { await SecureStore.deleteItemAsync(PROVIDER_TOKEN_KEY); } catch {}
}

// ─── Separate Unauthorized Handlers (buyer vs provider) ──────────────────────
// Using separate handlers prevents cross-contamination: a 401 from the provider
// API should only clear the provider session, NOT the buyer session, and vice versa.
let _onBuyerUnauthorized: (() => void) | null = null;
let _onProviderUnauthorized: (() => void) | null = null;

export function setBuyerUnauthorizedHandler(handler: () => void) {
  _onBuyerUnauthorized = handler;
}
export function setProviderUnauthorizedHandler(handler: () => void) {
  _onProviderUnauthorized = handler;
}
/** @deprecated Use setBuyerUnauthorizedHandler / setProviderUnauthorizedHandler */
export function setUnauthorizedHandler(handler: () => void) {
  _onBuyerUnauthorized = handler;
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
  withCredentials: true,
};

// ─── Axios Client Factory ─────────────────────────────────────────────────────
// FIX: The server uses cookie-based auth ONLY — it rejects Bearer tokens.
// We must forward the stored JWT as a Cookie header on every authenticated request.
function createClient(
  tokenGetter: () => Promise<string | null>,
  cookieName: string,
  getUnauthorizedHandler: () => (() => void) | null
): AxiosInstance {
  const client = axios.create(baseConfig);

  client.interceptors.request.use(async (config) => {
    try {
      const token = await tokenGetter();
      // Only inject when we have a real JWT (starts with eyJ), not the sentinel 'via-cookie'
      if (token && token !== 'via-cookie' && token.startsWith('eyJ')) {
        config.headers['Cookie'] = `${cookieName}=${token}`;
      }
    } catch {
      // SecureStore access failure — proceed without token
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Only call THIS client's unauthorized handler — do NOT clear the other session
        const handler = getUnauthorizedHandler();
        handler?.();
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ─── Exported Clients ─────────────────────────────────────────────────────────
export const buyerClient    = createClient(getBuyerToken,    'buyer_token',    () => _onBuyerUnauthorized);
export const providerClient = createClient(getProviderToken, 'provider_token', () => _onProviderUnauthorized);

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
