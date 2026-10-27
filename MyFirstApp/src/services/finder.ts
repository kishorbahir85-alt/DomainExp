import { apiGet } from './api';
import type { DomainSearchResult } from '../types';

export async function searchDomainAvailability(domainQuery: string): Promise<DomainSearchResult> {
  const cleanName = domainQuery.trim().toLowerCase();
  const ext = cleanName.includes('.') ? `.${cleanName.split('.').pop()}` : '.com';

  try {
    const response = await apiGet<{
      domain: string;
      available: boolean;
      price?: number;
      currency?: string;
      premium?: boolean;
      whoisSummary?: {
        registrar?: string;
        creationDate?: string;
        expirationDate?: string;
      };
    }>(`/domain-search?domain=${encodeURIComponent(cleanName)}`);

    if (response) {
      return {
        domain: response.domain || cleanName,
        tld: ext,
        available: Boolean(response.available),
        price: response.price,
        currency: response.currency || '$',
        premium: Boolean(response.premium),
        whoisSummary: response.whoisSummary,
      };
    }
  } catch {
    // API not reachable or unauthenticated
  }

  return {
    domain: cleanName,
    tld: ext,
    available: false,
    currency: '$',
  };
}

export async function searchMultipleTlds(keyword: string, selectedTlds: string[]): Promise<DomainSearchResult[]> {
  const base = keyword.trim().toLowerCase().replace(/\.[a-z0-9.]+$/i, '');
  if (!base) return [];

  const promises = selectedTlds.map((tld) => {
    const fullDomain = `${base}${tld.startsWith('.') ? tld : `.${tld}`}`;
    return searchDomainAvailability(fullDomain);
  });

  return Promise.all(promises);
}
