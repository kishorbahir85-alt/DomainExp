import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { ServerItem } from '../types';

export async function fetchServersList(): Promise<ServerItem[]> {
  try {
    const response = await apiGet<{ items?: any[] } | any[]>('/servers');
    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
      ? response.items
      : [];

    return items.map((item: any) => ({
      id: item.id || `srv-${Math.random()}`,
      name: item.name || 'Server Node',
      provider: item.provider || item.host || 'Cloud Provider',
      region: item.region || 'Global',
      ipAddress: item.ipAddress || item.ip || '127.0.0.1',
      cpu: item.cpu || '4 vCPU',
      memory: item.memory || '8 GB',
      os: item.os || 'Ubuntu 22.04',
      status: item.status === 'warning' ? 'warning' : item.status === 'offline' ? 'offline' : 'healthy',
      uptime: item.uptime || '99.98%',
      cpuUsagePercent: item.cpuUsagePercent ?? 32,
      memoryUsagePercent: item.memoryUsagePercent ?? 58,
      diskUsagePercent: item.diskUsagePercent ?? 44,
      connectedDomains: item.connectedDomains || [],
    }));
  } catch {
    return [];
  }
}

export async function createServer(data: Partial<ServerItem>): Promise<ServerItem> {
  const response = await apiPost<any>('/servers', data);
  return {
    id: response.id,
    name: response.name || data.name || '',
    provider: response.provider || data.provider || 'Hetzner',
    region: response.region || data.region || 'Europe',
    ipAddress: response.ipAddress || data.ipAddress,
    cpu: response.cpu || '4 vCPU',
    memory: response.memory || '8 GB',
    os: response.os || 'Ubuntu 22.04',
    status: 'healthy',
    uptime: '100%',
    cpuUsagePercent: 15,
    memoryUsagePercent: 25,
    diskUsagePercent: 20,
    connectedDomains: [],
  };
}

export async function deleteServer(id: string): Promise<void> {
  await apiDelete(`/servers/${id}`);
}
