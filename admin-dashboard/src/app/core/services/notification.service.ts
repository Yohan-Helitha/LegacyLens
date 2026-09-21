import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
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

  // Client-side Set of IDs the user has already dismissed.
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

  private saveReadIds(): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...this.readIds]));
    } catch { /* storage quota exceeded — ignore */ }
  }

  // Trim the stored set to the last 500 IDs to avoid unbounded growth.
  private pruneReadIds(allIds: string[]): void {
    const allIdSet = new Set(allIds);
    // Remove any locally-stored IDs that no longer exist on the server
    for (const id of this.readIds) {
      if (!allIdSet.has(id)) this.readIds.delete(id);
    }
    this.saveReadIds();
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
    return this.http.get<any>(
      `${environment.apiUrl}/admin/notifications`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => {
        if (res && res.data && Array.isArray(res.data)) return res.data as AdminNotificationResponse[];
        if (Array.isArray(res)) return res as AdminNotificationResponse[];
        return [] as AdminNotificationResponse[];
      }),
      tap((notifications) => {
        // Prune stale local IDs (notifications no longer returned by server)
        this.pruneReadIds(notifications.map(n => n.id));

        // Count: a notification is unread only if the server says so AND
        // the user hasn't locally dismissed it already.
        const unread = notifications.filter(n => !n.read && !this.readIds.has(n.id)).length;
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
    // Update the badge IMMEDIATELY — don't wait for the API.
    if (!this.readIds.has(id)) {
      this.readIds.add(id);
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
        // API failed — count is already decremented locally, which is fine;
        // the localStorage entry ensures it stays read on refresh too.
        console.warn(`[NotificationService] Failed to mark ${type} ${id} as read on server:`, err);
        return throwError(() => err);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    // ── Optimistic update ──────────────────────────────────────────────────
    this.unreadCount.set(0);

    return this.http.get<any>(
      `${environment.apiUrl}/admin/notifications`,
      { headers: this.getHeaders() }
    ).pipe(
      tap((res) => {
        // Collect all IDs returned and add them to the local read Set
        const notifications: AdminNotificationResponse[] =
          (res?.data ?? (Array.isArray(res) ? res : []));
        notifications.forEach(n => this.readIds.add(n.id));
        this.saveReadIds();
      }),
      map(() => void 0),
      catchError(() => {
        // Even if fetching IDs failed, proceed with the mark-all-read API call
        return this.http.put<any>(
          `${environment.apiUrl}/admin/notifications/read-all`,
          {},
          { headers: this.getHeaders() }
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
