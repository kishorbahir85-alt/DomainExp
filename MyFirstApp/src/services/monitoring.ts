import { apiGet, apiPost } from './api';
import type { AlertItem, InventorySummary } from '../types';

export async function fetchInventorySummary(): Promise<InventorySummary> {
  try {
    const summaryData = await apiGet<any>('/inventory/summary');
    if (summaryData) {
      const domainsCount = Number(summaryData.domains) || 0;
      return {
        domains: domainsCount,
        criticalExpirations: 0,
        warningExpirations: 0,
        safeDomains: domainsCount,
        upcomingRenewals: 0,
        estimatedRenewalCost: 0,
        currency: '$',
        servers: Number(summaryData.servers) || 0,
        cloudResources: Number(summaryData.cloudResources) || 0,
        applications: Number(summaryData.applications) || 0,
        alerts: Number(summaryData.alerts) || 0,
      };
    }
  } catch {
    // API unauthenticated or offline
  }

  return {
    domains: 0,
    criticalExpirations: 0,
    warningExpirations: 0,
    safeDomains: 0,
    upcomingRenewals: 0,
    estimatedRenewalCost: 0,
    currency: '$',
    servers: 0,
    cloudResources: 0,
    applications: 0,
    alerts: 0,
  };
}

export async function fetchAlertsList(): Promise<AlertItem[]> {
  try {
    const response = await apiGet<{ items?: any[] } | any[]>('/alerts');
    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
      ? response.items
      : [];

    return items.map((item: any) => ({
      id: item.id || `alt-${Math.random()}`,
      domainId: item.domainId,
      domainName: item.title || item.domainName || 'Domain Alert',
      title: item.title || 'Monitoring Notice',
      detail: item.detail || '',
      severity: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info',
      status: item.status === 'acknowledged' ? 'acknowledged' : item.status === 'resolved' ? 'resolved' : 'active',
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await apiPost(`/alerts/${alertId}/acknowledge`);
}
