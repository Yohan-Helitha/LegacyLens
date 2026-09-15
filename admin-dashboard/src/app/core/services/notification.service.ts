import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  getNotifications(): Observable<AdminNotificationResponse[]> {
    return this.http.get<any>(
      `${environment.apiUrl}/admin/notifications`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => {
        if (res && res.data && Array.isArray(res.data)) {
          return res.data;
        }
        if (Array.isArray(res)) {
          return res;
        }
        return [];
      }),
      catchError(err => {
        console.warn('[NotificationService] Could not fetch notifications:', err);
        return throwError(() => err);
      })
    );
  }

  markAsRead(type: string, id: string): Observable<void> {
    return this.http.put<any>(
      `${environment.apiUrl}/admin/notifications/${type}/${id}/read`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.warn(`[NotificationService] Failed to mark ${type} ${id} as read:`, err);
        return throwError(() => err);
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<any>(
      `${environment.apiUrl}/admin/notifications/read-all`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.warn('[NotificationService] Failed to mark all as read:', err);
        return throwError(() => err);
      })
    );
  }
}
