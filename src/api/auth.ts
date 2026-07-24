import { publicClient } from './client';
import type {
  LoginRequest,
  RegisterBuyerRequest,
  RegisterProviderRequest,
  AuthResponse,
} from '../types';

// ─── Helper: extract JWT value from Set-Cookie response header ────────────────
// React Native exposes Set-Cookie in Axios response headers (unlike browsers).
// If extraction fails (some iOS builds filter HttpOnly cookies), we fall back
// to 'via-cookie' so the auth store records a logged-in state and native cookie
// jar handles subsequent requests via withCredentials: true.
function extractCookieToken(headers: Record<string, any>, cookieName: string): string | null {
  const raw = headers?.['set-cookie'] ?? headers?.['Set-Cookie'];
  if (!raw) return null;
  const joined = Array.isArray(raw) ? raw.join('; ') : String(raw);
  const match = joined.match(new RegExp(cookieName + '=([^;,\\s]+)'));
  return match ? match[1] : null;
}

// ─── Buyer Auth ───────────────────────────────────────────────────────────────
export async function buyerLogin(data: LoginRequest): Promise<AuthResponse> {
  const res = await publicClient.post('/api/buyer-auth/login', data);
  // Try to read token from Set-Cookie header; fall back to 'via-cookie' so the
  // auth store knows the session is active (cookie jar handles actual auth).
  const token = extractCookieToken(res.headers, 'buyer_token') ?? 'via-cookie';
  const user = res.data?.buyer ?? res.data?.user ?? res.data;
  return { token, user };
}

export async function buyerRegister(data: RegisterBuyerRequest): Promise<AuthResponse> {
  const res = await publicClient.post('/api/buyer-auth/register', data);
  const token = extractCookieToken(res.headers, 'buyer_token') ?? 'via-cookie';
  const user = res.data?.buyer ?? res.data?.user ?? res.data;
  return { token, user };
}

export async function buyerForgotPassword(email: string): Promise<{ message: string }> {
  const res = await publicClient.post('/api/buyer-auth/forgot-password', { email });
  return res.data;
}

export async function buyerResetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await publicClient.post('/api/buyer-auth/reset-password', { token, password });
  return res.data;
}

// ─── Provider Auth ────────────────────────────────────────────────────────────
export async function providerLogin(data: LoginRequest): Promise<AuthResponse> {
  const res = await publicClient.post('/api/provider-auth/login', data);
  const token = extractCookieToken(res.headers, 'provider_token') ?? 'via-cookie';
  const user = res.data?.provider ?? res.data?.user ?? res.data;
  return { token, user };
}

export async function providerRegister(data: RegisterProviderRequest): Promise<AuthResponse> {
  const res = await publicClient.post('/api/provider-auth/register', data);
  const token = extractCookieToken(res.headers, 'provider_token') ?? 'via-cookie';
  const user = res.data?.provider ?? res.data?.user ?? res.data;
  return { token, user };
}

export async function providerForgotPassword(email: string): Promise<{ message: string }> {
  const res = await publicClient.post('/api/provider-auth/forgot-password', { email });
  return res.data;
}
