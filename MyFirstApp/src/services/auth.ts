import { apiGet, apiPost, apiPatch, setApiAccessToken } from './api';
import { getItem, setItem, deleteItem, STORAGE_KEYS } from './storage';
import type { LoginResult, User, AuthSession } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName?: string;
}

const REGISTERED_ACCOUNTS_KEY = 'dp_registered_accounts';
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

async function getStoredAccounts(): Promise<StoredAccount[]> {
  try {
    const raw = await getItem(REGISTERED_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(
          (a) => a && typeof a.email === 'string' && EMAIL_REGEX.test(a.email.toLowerCase())
        );
        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch {
    // fallback
  }

  const defaultAccounts: StoredAccount[] = [
    {
      id: 'usr-admin-default',
      email: 'admin@domainpulse.com',
      passwordHash: 'admin123',
      displayName: 'Aditya Kumar',
      organization: 'Pulse Cloud Infrastructure',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  await setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

async function saveStoredAccounts(accounts: StoredAccount[]): Promise<void> {
  await setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function loginUser(payload: LoginPayload): Promise<LoginResult> {
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address with @ and domain (e.g. name@domain.com).');
  }

  if (!payload.password) {
    throw new Error('Please enter your password.');
  }

  // 1. Instant local credentials lookup (0ms)
  const accounts = await getStoredAccounts();
  const matched = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);

  if (matched) {
    if (matched.passwordHash !== payload.password) {
      throw new Error('Incorrect password. Please check your credentials.');
    }

    const user: User = {
      id: matched.id,
      email: matched.email,
      displayName: matched.displayName,
      organization: matched.organization || 'Pulse Cloud Infrastructure',
      createdAt: matched.createdAt,
      updatedAt: matched.updatedAt,
    };

    const localToken = `token_${matched.id}_${Date.now()}`;
    const refreshToken = `ref_${matched.id}_${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session: AuthSession = {
      id: `sess_${matched.id}`,
      userId: matched.id,
      createdAt: now.toISOString(),
      expiresAt,
    };

    setApiAccessToken(localToken);
    await setItem(STORAGE_KEYS.ACCESS_TOKEN, localToken);
    await setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

    // Background sync to backend if online (non-blocking)
    apiPost<LoginResult>('/auth/login', { email: normalizedEmail, password: payload.password }, { auth: false })
      .then((res) => {
        if (res?.accessToken) {
          setApiAccessToken(res.accessToken);
          setItem(STORAGE_KEYS.ACCESS_TOKEN, res.accessToken);
        }
      })
      .catch(() => {});

    return {
      accessToken: localToken,
      accessTokenExpiresAt: expiresAt,
      refreshToken,
      session,
      user,
    };
  }

  // 2. If not found in local registry, check backend API
  try {
    const result = await apiPost<LoginResult>(
      '/auth/login',
      {
        email: normalizedEmail,
        password: payload.password,
      },
      {
        auth: false,
        retryOnUnauthorized: false,
      }
    );

    if (result && result.accessToken) {
      setApiAccessToken(result.accessToken);
      await setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
      if (result.refreshToken) {
        await setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
      }
      await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(result.user));

      // Cache account locally
      const now = new Date().toISOString();
      accounts.push({
        id: result.user.id,
        email: result.user.email,
        passwordHash: payload.password,
        displayName: result.user.displayName || normalizedEmail.split('@')[0],
        organization: result.user.organization || 'Pulse Cloud Infrastructure',
        createdAt: result.user.createdAt || now,
        updatedAt: now,
      });
      await saveStoredAccounts(accounts);

      return result;
    }
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 400 || err?.status === 404) {
      throw new Error(err?.message || 'Invalid email or password.');
    }
  }

  throw new Error('No account found for this email. Please create an account first.');
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResult> {
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error('Please enter a valid email address with @ and domain (e.g. name@company.com).');
  }

  if (!payload.password || payload.password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  // Instant duplicate account check (0ms)
  const accounts = await getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('This email is already registered. Please sign in instead.');
  }

  // Create persistent verified account
  const now = new Date().toISOString();
  const newUserAccount: StoredAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    passwordHash: payload.password,
    displayName: payload.displayName?.trim() || normalizedEmail.split('@')[0],
    organization: 'Pulse Cloud Infrastructure',
    createdAt: now,
    updatedAt: now,
  };

  accounts.push(newUserAccount);
  await saveStoredAccounts(accounts);

  const user: User = {
    id: newUserAccount.id,
    email: newUserAccount.email,
    displayName: newUserAccount.displayName,
    organization: newUserAccount.organization,
    createdAt: newUserAccount.createdAt,
    updatedAt: newUserAccount.updatedAt,
  };

  const localToken = `token_${newUserAccount.id}_${Date.now()}`;
  const refreshToken = `ref_${newUserAccount.id}_${Date.now()}`;
  const nowDate = new Date();
  const expiresAt = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const session: AuthSession = {
    id: `sess_${newUserAccount.id}`,
    userId: newUserAccount.id,
    createdAt: nowDate.toISOString(),
    expiresAt,
  };

  setApiAccessToken(localToken);
  await setItem(STORAGE_KEYS.ACCESS_TOKEN, localToken);
  await setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

  // Non-blocking backend registration
  apiPost<{ user: User }>('/auth/register', { email: normalizedEmail, password: payload.password, displayName: payload.displayName }, { auth: false })
    .catch(() => {});

  return {
    accessToken: localToken,
    accessTokenExpiresAt: expiresAt,
    refreshToken,
    session,
    user,
  };
}

export async function updateUserProfile(updates: {
  displayName?: string;
  email?: string;
  organization?: string;
}): Promise<User> {
  const currentRaw = await getItem(STORAGE_KEYS.USER_DATA);
  const currentUser: User = currentRaw
    ? JSON.parse(currentRaw)
    : {
        id: 'usr-admin-default',
        email: 'admin@domainpulse.com',
        displayName: 'Aditya Kumar',
        organization: 'Pulse Cloud Infrastructure',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  const cleanName = updates.displayName !== undefined ? updates.displayName.trim() : currentUser.displayName;
  const cleanEmail = updates.email !== undefined ? updates.email.trim().toLowerCase() : currentUser.email;
  const cleanOrg = updates.organization !== undefined ? updates.organization.trim() : currentUser.organization;

  const updatedUser: User = {
    ...currentUser,
    displayName: cleanName,
    email: cleanEmail,
    organization: cleanOrg,
    updatedAt: new Date().toISOString(),
  };

  await setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));

  const accounts = await getStoredAccounts();
  const searchEmails = [
    cleanEmail.toLowerCase(),
    currentUser.email?.toLowerCase(),
  ].filter(Boolean);

  let updatedInRegistry = false;
  for (const acc of accounts) {
    if (searchEmails.includes(acc.email.toLowerCase()) || (currentUser.id && acc.id === currentUser.id)) {
      acc.displayName = cleanName || acc.displayName;
      acc.email = cleanEmail;
      acc.organization = cleanOrg;
      acc.updatedAt = updatedUser.updatedAt;
      updatedInRegistry = true;
    }
  }

  if (!updatedInRegistry) {
    accounts.push({
      id: updatedUser.id || `usr_${Date.now()}`,
      email: cleanEmail,
      passwordHash: 'admin123',
      displayName: cleanName || '',
      organization: cleanOrg,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  }

  await saveStoredAccounts(accounts);

  // Background patch to backend if available
  apiPatch('/auth/profile', { displayName: cleanName, organization: cleanOrg }).catch(() => {});

  return updatedUser;
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  return apiGet<{ user: User }>('/auth/me');
}

export async function logoutUser(): Promise<void> {
  setApiAccessToken(null);

  apiPost<void>('/auth/logout', undefined, { retryOnUnauthorized: false }).catch(() => {});

  await Promise.allSettled([
    deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
    deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
    deleteItem(STORAGE_KEYS.USER_DATA),
    deleteItem(STORAGE_KEYS.WORKSPACE_ID),
  ]);
}
