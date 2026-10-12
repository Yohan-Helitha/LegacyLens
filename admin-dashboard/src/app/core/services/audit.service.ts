import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { AuditActivity } from '../../../pages/audit/audit.component';

export interface AuditLogBackendEntry {
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

/** Maps backend action type to the UI badge style */
function mapActionTypeBadge(actionType: string): { badge: string; badgeClass: string } {
  const map: Record<string, { badge: string; badgeClass: string }> = {
    CREATED:     { badge: 'Created',     badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' },
    UPDATED:     { badge: 'Updated',     badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' },
    DELETED:     { badge: 'Deleted',     badgeClass: 'bg-red-100 text-red-800 border-red-300' },
    APPROVED:    { badge: 'Approved',    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    REJECTED:    { badge: 'Rejected',    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' },
    SUSPENDED:   { badge: 'Suspended',   badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
    REACTIVATED: { badge: 'Reactivated', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300' },
    PUBLISHED:   { badge: 'Published',   badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    ARCHIVED:    { badge: 'Archived',    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' },
  };
  return map[actionType] ?? { badge: actionType, badgeClass: 'bg-gray-100 text-gray-700 border-gray-300' };
}

/** Maps backend action type to the audit activity action type union */
function toActionType(raw: string): AuditActivity['actionType'] {
  const approved = ['APPROVED', 'PUBLISHED', 'REACTIVATED', 'CREATED'];
  const archived  = ['DELETED', 'ARCHIVED'];
  const updated   = ['UPDATED'];
  const resolved  = ['REJECTED'];
  if (approved.includes(raw)) return 'Approved';
  if (archived.includes(raw))  return 'Archived';
  if (updated.includes(raw))   return 'Updated';
  if (resolved.includes(raw))  return 'Resolved';
  return 'Granted';
}

/** Human-readable action verb from actionType + entityType */
function buildActionTaken(actionType: string, entityType: string): string {
  const verbs: Record<string, string> = {
    CREATED:     'Created',
    UPDATED:     'Updated',
    DELETED:     'Deleted',
    APPROVED:    'Approved',
    REJECTED:    'Rejected',
    SUSPENDED:   'Suspended',
    REACTIVATED: 'Reactivated',
    PUBLISHED:   'Published',
    ARCHIVED:    'Archived',
  };
  return `${verbs[actionType] ?? actionType} ${entityType}`;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    // Inject current admin identity for all mutating requests (read-only here but kept for consistency)
    const user = this.authService.currentUser();
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  /**
   * Fetch all audit log entries from backend, mapped to AuditActivity[].
   * Falls back to empty array if backend is unreachable.
   */
  getAuditLogs(entityType?: string): Observable<AuditActivity[]> {
    let params = new HttpParams();
    if (entityType) params = params.set('entityType', entityType);

    return this.http.get<any>(
      `${environment.apiUrl}/admin/audit`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(res => {
        const list: AuditLogBackendEntry[] = (res?.data ?? (Array.isArray(res) ? res : []));
        return list.map((entry, idx) => this.mapToActivity(entry, idx));
      }),
      catchError(err => {
        console.warn('[AuditService] Could not fetch audit logs from backend:', err);
        return of([]);
      })
    );
  }

  /** Map a backend AuditLogResponse to the UI AuditActivity interface */
  private mapToActivity(entry: AuditLogBackendEntry, idx: number): AuditActivity {
    const { badge, badgeClass } = mapActionTypeBadge(entry.actionType);
    const initials = (entry.performedByName ?? 'A')
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const avatarColors = [
      'bg-[#004343]', 'bg-[#9b4600]', 'bg-[#363c42]',
      'bg-[#fe893e]', 'bg-indigo-700', 'bg-teal-700'
    ];
    const avatarBg = avatarColors[idx % avatarColors.length];

    return {
      id:            entry.id ?? `ACT-${idx}`,
      refCode:       `ID #${entry.id?.substring(0, 8).toUpperCase() ?? idx}`,
      date:          entry.date ?? 'Unknown',
      time:          entry.time ?? '',
      adminName:     entry.performedByName ?? entry.performedById ?? 'Admin',
      adminRole:     entry.entityType,
      adminEmail:    '',
      adminAvatar:   initials,
      adminAvatarBg: avatarBg,
      actionTaken:   buildActionTaken(entry.actionType, entry.entityType),
      actionType:    toActionType(entry.actionType),
      targetTitle:   entry.entityTitle ?? entry.entityId ?? '—',
      targetCategory: entry.entityType,
      statusBadge:    badge,
      statusBadgeClass: badgeClass,
      notes:         entry.notes ?? '',
      location:      '',
    };
  }
}

