import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { DomainItem } from '../types';

export async function fetchDomainsList(): Promise<DomainItem[]> {
  try {
    const response = await apiGet<{ items?: any[] } | any[]>('/domains');
    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
      ? response.items
      : [];

    return items.map((item: any) => {
      const expires = item.expiresAt ? new Date(item.expiresAt) : new Date(Date.now() + 365 * 86400000);
      const days = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000));
      const status: 'critical' | 'warning' | 'safe' =
        days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'safe';

      return {
        id: item.id || `dom-${Math.random()}`,
        name: item.name || item.domain || '',
        tld: item.tld || `.${(item.name || '').split('.').pop() || 'com'}`,
        registrar: item.registrar || 'Custom Registrar',
        autoRenew: Boolean(item.autoRenew),
        expiresAt: expires.toISOString(),
        daysRemaining: days,
        renewalPrice: Number(item.renewalPrice) || 0,
        currency: item.currency || '$',
        status,
        dnsProvider: item.dnsProvider,
        sslStatus: item.sslStatus,
        nameservers: item.nameservers,
        tags: item.tags || [],
        notes: item.notes,
      };
    });
  } catch {
    return [];
  }
}

export async function createDomain(data: {
  name: string;
  registrar?: string;
  autoRenew?: boolean;
}): Promise<DomainItem> {
  const response = await apiPost<any>('/domains', data);
  const expires = response.expiresAt ? new Date(response.expiresAt) : new Date(Date.now() + 365 * 86400000);
  const days = Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000));

  return {
    id: response.id,
    name: response.name || data.name,
    tld: response.tld || `.${data.name.split('.').pop() || 'com'}`,
    registrar: response.registrar || data.registrar || 'Default',
    autoRenew: Boolean(response.autoRenew ?? data.autoRenew),
    expiresAt: expires.toISOString(),
    daysRemaining: days,
    renewalPrice: Number(response.renewalPrice) || 0,
    currency: response.currency || '$',
    status: days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'safe',
  };
}

export async function deleteDomain(id: string): Promise<void> {
  await apiDelete(`/domains/${id}`);
}
