export const API_CONFIG = {
  // Expo allows EXPO_PUBLIC_ prefix for client-accessible env variables
  DEFAULT_API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.53:3000/api/v1',
  FALLBACK_LOCALHOST: 'http://localhost:3000/api/v1',
  TIMEOUT_MS: 2500,
  APP_NAME: 'DomainPulse',
  VERSION: '1.0.0',
};

export const SUPPORTED_TLDS = [
  '.com',
  '.in',
  '.co.in',
  '.ai',
  '.io',
  '.org',
  '.net',
  '.co',
  '.tech',
  '.app',
  '.dev',
  '.xyz',
] as const;

export type SupportedTld = (typeof SUPPORTED_TLDS)[number];
