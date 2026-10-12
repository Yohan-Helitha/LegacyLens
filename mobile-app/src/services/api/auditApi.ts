import { apiGet } from './client';

export interface AuditLogItem {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  performedById: string;
  performedByName: string;
  notes: string;
  date: string;
  time: string;
  createdAt: string;
}

export const auditApi = {
  getLogs: (entityType?: string) =>
    apiGet<AuditLogItem[]>(entityType ? `/admin/audit?entityType=${encodeURIComponent(entityType)}` : '/admin/audit'),
};

