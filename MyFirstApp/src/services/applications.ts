import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { ApplicationItem } from '../types';

export async function fetchApplicationsList(): Promise<ApplicationItem[]> {
  try {
    const response = await apiGet<{ items?: any[] } | any[]>('/applications');
    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
      ? response.items
      : [];

    return items.map((item: any) => ({
      id: item.id || `app-${Math.random()}`,
      name: item.name || 'Application',
      environment: item.environment || 'Production',
      status: item.status === 'warning' ? 'warning' : item.status === 'error' ? 'error' : 'healthy',
      url: item.url,
      serverName: item.serverName,
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createApplication(data: Partial<ApplicationItem>): Promise<ApplicationItem> {
  const response = await apiPost<any>('/applications', data);
  return {
    id: response.id,
    name: response.name || data.name || '',
    environment: response.environment || 'Production',
    status: 'healthy',
    url: response.url,
    serverName: response.serverName,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteApplication(id: string): Promise<void> {
  await apiDelete(`/applications/${id}`);
}
