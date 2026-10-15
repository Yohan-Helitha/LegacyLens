import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface AdminNotificationResponse {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  createdAt: string;
  type: 'opportunity' | 'moderation' | 'system' | 'dispute' | 'credential' | 'other';
  read: boolean;
}

const LS_KEY = 'll_read_notifs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Global unread count signal — used by the header badge
  public unreadCount = signal<number>(0);

  // Client-side Set of IDs the user has already dismissed/read.
  // Persisted in localStorage so it survives page refreshes.
  private readIds = new Set<string>(this.loadReadIds());

  // ─── Persistence helpers ─────────────────────────────────────────────────

  private loadReadIds(): string[] {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private refreshReadIds(): void {
    const stored = this.loadReadIds();
    for (const id of stored) {
      if (id) this.readIds.add(id);
    }
  }

  private saveReadIds(): void {
    try {
      if (this.readIds.size > 500) {
        const arr = [...this.readIds].slice(-500);
        this.readIds = new Set(arr);
      }
      localStorage.setItem(LS_KEY, JSON.stringify([...this.readIds]));
    } catch { /* storage quota exceeded — ignore */ }
  }

  isRead(id: string, type?: string): boolean {
    if (!id) return false;
    this.refreshReadIds();
    if (this.readIds.has(id)) return true;
    if (type && this.readIds.has(`${type}-${id}`)) return true;
    const parts = id.split('-');
    if (parts.length > 1 && this.readIds.has(parts.slice(1).join('-'))) return true;
    return false;
  }

  // ─── Auth headers ────────────────────────────────────────────────────────

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  // ─── API methods ─────────────────────────────────────────────────────────

  getNotifications(): Observable<AdminNotificationResponse[]> {
    this.refreshReadIds();
    return this.http.get<any>(
      `${environment.apiUrl}/admin/notifications`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => {
        let list: AdminNotificationResponse[] = [];
        if (res && res.data && Array.isArray(res.data)) list = res.data as AdminNotificationResponse[];
        else if (Array.isArray(res)) list = res as AdminNotificationResponse[];

        return list.map(item => {
          const isRead = Boolean(
            item.read ||
            (item as any).isRead ||
            this.isRead(item.id, item.type)
          );
          return {
            ...item,
            read: isRead
          };
        });
      }),
      tap((notifications) => {
        // Count: a notification is unread only if it is not marked read
        const unread = notifications.filter(n => !n.read).length;
        this.unreadCount.set(unread);
      }),
      catchError(err => {
        console.warn('[NotificationService] Could not fetch notifications:', err);
        return throwError(() => err);
      })
    );
  }

  markAsRead(type: string, id: string): Observable<void> {
    // ── Optimistic update ──────────────────────────────────────────────────
    if (id) {
      this.readIds.add(id);
      if (type) {
        this.readIds.add(`${type}-${id}`);
      }
      this.saveReadIds();
      this.unreadCount.update(count => Math.max(0, count - 1));
    }

    return this.http.put<any>(
      `${environment.apiUrl}/admin/notifications/${type}/${id}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.warn(`[NotificationService] Failed to mark ${type} ${id} as read on server:`, err);
        return of(void 0);
      })
    );
  }

  markAllAsRead(providedIds?: string[]): Observable<void> {
    // ── Optimistic update ──────────────────────────────────────────────────
    this.refreshReadIds();
    if (providedIds && providedIds.length > 0) {
      providedIds.forEach(id => {
        this.readIds.add(id);
        const parts = id.split('-');
        if (parts.length > 1) {
          this.readIds.add(parts.slice(1).join('-'));
        }
      });
      this.saveReadIds();
    }
    this.unreadCount.set(0);

    return this.http.put<any>(
      `${environment.apiUrl}/admin/notifications/read-all`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(() => of(null)),
      switchMap(() => {
        return this.http.get<any>(
          `${environment.apiUrl}/admin/notifications`,
          { headers: this.getHeaders() }
        ).pipe(
          tap((res) => {
            const list: any[] = res?.data ?? (Array.isArray(res) ? res : []);
            list.forEach(item => {
              if (item?.id) {
                this.readIds.add(item.id);
                if (item?.type) this.readIds.add(`${item.type}-${item.id}`);
              }
            });
            this.saveReadIds();
          }),
          map(() => void 0),
          catchError(() => of(void 0))
        );
      })
    );
  }

  /** Call this on logout to clear the persisted read state. */
  clearReadState(): void {
    this.readIds.clear();
    localStorage.removeItem(LS_KEY);
    this.unreadCount.set(0);
  }
}
