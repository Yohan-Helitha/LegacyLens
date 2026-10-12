import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  verifiedUsers: number;
  suspendedUsers: number;
  totalAdmins: number;
  activeAdmins: number;
  totalStories: number;
  pendingModeration: number;
  publishedStories: number;
  rejectedStories: number;
  archivedStories: number;
}

export interface ModerationItem {
  id: string;
  title: string;
  type: string;
  status: string;
  authorName?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface UserVerification {
  id: string;
  fullName: string;
  verificationStatus?: string;
  accountStatus?: string;
  roles?: string[];
}

export interface AdminUser {
  id: string;
  fullName: string;
  accountStatus?: string;
  roleStatus?: string;
  roleType?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentModeration: ModerationItem[];
  verifications: UserVerification[];
  admins: AdminUser[];
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  totalUsers: 128,
  pendingVerifications: 14,
  verifiedUsers: 94,
  suspendedUsers: 4,
  totalAdmins: 6,
  activeAdmins: 5,
  totalStories: 312,
  pendingModeration: 28,
  publishedStories: 241,
  rejectedStories: 31,
  archivedStories: 12
};

const MOCK_MODERATION: ModerationItem[] = [
  { id: '1', title: 'Kandyan Dance Ceremony', type: 'VIDEO', status: 'PENDING', authorName: 'Mudiyanse J.', createdAt: '2024-09-10T08:22:00Z' },
  { id: '2', title: 'Jaffna Temple Chants', type: 'AUDIO', status: 'PUBLISHED', authorName: 'Sivagnanam K.', createdAt: '2024-09-09T14:10:00Z' },
  { id: '3', title: 'Galle Fort Maritime Lore', type: 'BLOG', status: 'PENDING', authorName: 'Don Charles W.', createdAt: '2024-09-09T09:45:00Z' },
  { id: '4', title: 'Sigiriya Rock Inscriptions', type: 'BLOG', status: 'REJECTED', authorName: 'Priya R.', createdAt: '2024-09-08T11:30:00Z' },
  { id: '5', title: 'Uva Province Drumming', type: 'AUDIO', status: 'ARCHIVED', authorName: 'Nimal B.', createdAt: '2024-09-08T07:15:00Z' },
  { id: '6', title: 'Dambana Guild Ritual', type: 'VIDEO', status: 'PENDING', authorName: 'Wanniya U.', createdAt: '2024-09-07T16:00:00Z' },
  { id: '7', title: 'Colombo Folklore Songs', type: 'AUDIO', status: 'PUBLISHED', authorName: 'Thilaka M.', createdAt: '2024-09-07T10:20:00Z' },
  { id: '8', title: 'Batik Craft Heritage', type: 'BLOG', status: 'PUBLISHED', authorName: 'Karunaratne S.', createdAt: '2024-09-06T13:55:00Z' },
  { id: '9', title: 'Northern Sea Chants', type: 'AUDIO', status: 'PENDING', authorName: 'Raja S.', createdAt: '2024-09-06T09:00:00Z' },
  { id: '10', title: 'Anuradhapura Legends', type: 'BLOG', status: 'REJECTED', authorName: 'Dilani F.', createdAt: '2024-09-05T15:30:00Z' }
];

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

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

  /**
   * Fetches aggregated dashboard stats from the dedicated endpoint.
   * Falls back to computed stats from raw APIs, then mock data.
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http
      .get<any>(`${environment.apiUrl}/admin/dashboard/stats`, { headers: this.getHeaders() })
      .pipe(
        map(res => (res && res.data ? res.data : res) as DashboardStats),
        catchError(err => {
          console.warn('[DashboardService] /dashboard/stats unavailable, falling back to raw APIs:', err);
          return this.computeStatsFromRawApis();
        })
      );
  }

  /**
   * Fallback: Compute stats by calling moderation + verifications + admins APIs.
   */
  private computeStatsFromRawApis(): Observable<DashboardStats> {
    const moderation$ = this.getModerationSummary().pipe(catchError(() => of([])));
    const users$ = this.getUsersSummary().pipe(catchError(() => of([])));
    const admins$ = this.getAdminsSummary().pipe(catchError(() => of([])));

    return forkJoin([moderation$, users$, admins$]).pipe(
      map(([mItems, uItems, aItems]) => {
        const stories = mItems as ModerationItem[];
        const users = uItems as UserVerification[];
        const admins = aItems as AdminUser[];

        return {
          totalUsers: users.length,
          pendingVerifications: users.filter(u =>
            (u.verificationStatus || '').toUpperCase() === 'PENDING'
          ).length,
          verifiedUsers: users.filter(u =>
            (u.verificationStatus || '').toUpperCase() === 'VERIFIED' ||
            (u.accountStatus || '').toUpperCase() === 'ACTIVE'
          ).length,
          suspendedUsers: users.filter(u =>
            (u.accountStatus || '').toUpperCase() === 'SUSPENDED'
          ).length,
          totalAdmins: admins.length,
          activeAdmins: admins.filter(a =>
            (a.accountStatus || '').toUpperCase() === 'ACTIVE' ||
            (a.roleStatus || '').toUpperCase() === 'ACTIVE'
          ).length,
          totalStories: stories.length,
          pendingModeration: stories.filter(s => s.status === 'PENDING').length,
          publishedStories: stories.filter(s => s.status === 'PUBLISHED').length,
          rejectedStories: stories.filter(s => s.status === 'REJECTED').length,
          archivedStories: stories.filter(s => s.status === 'ARCHIVED').length
        } as DashboardStats;
      }),
      catchError(() => {
        console.warn('[DashboardService] Raw APIs also failed, using mock data');
        return of(MOCK_STATS);
      })
    );
  }

  /**
   * GET /api/admin/moderation/queue?status=ALL
   */
  getModerationSummary(): Observable<ModerationItem[]> {
    const params = new HttpParams().set('status', 'ALL');
    return this.http
      .get<any>(`${environment.apiUrl}/admin/moderation/queue`, {
        headers: this.getHeaders(),
        params
      })
      .pipe(
        map(res => {
          const arr = res?.data ?? (Array.isArray(res) ? res : []);
          return arr.map((item: any): ModerationItem => ({
            id: item.id,
            title: item.title || item.storyTitle || 'Untitled',
            type: item.type || item.contentType || 'UNKNOWN',
            status: item.status || 'PENDING',
            authorName: item.authorName || item.author?.fullName || item.submittedBy || 'Unknown',
            submittedAt: item.submittedAt || item.createdAt,
            createdAt: item.createdAt || item.submittedAt
          }));
        }),
        catchError(err => {
          console.warn('[DashboardService] Moderation queue unavailable:', err);
          return of(MOCK_MODERATION);
        })
      );
  }

  /**
   * GET /api/admin/verifications
   */
  getUsersSummary(): Observable<UserVerification[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/admin/verifications`, { headers: this.getHeaders() })
      .pipe(
        map(res => {
          const arr = res?.data ?? (Array.isArray(res) ? res : []);
          return arr.map((u: any): UserVerification => ({
            id: u.id,
            fullName: u.fullName || 'Unknown User',
            verificationStatus: u.verificationStatus,
            accountStatus: u.accountStatus,
            roles: u.roles || []
          }));
        }),
        catchError(err => {
          console.warn('[DashboardService] Verifications unavailable:', err);
          return of([]);
        })
      );
  }

  /**
   * GET /api/admin/management/admins
   */
  getAdminsSummary(): Observable<AdminUser[]> {
    return this.http
      .get<any>(`${environment.apiUrl}/admin/management/admins`, { headers: this.getHeaders() })
      .pipe(
        map(res => {
          const arr = res?.data ?? (Array.isArray(res) ? res : []);
          return arr.map((a: any): AdminUser => ({
            id: a.id,
            fullName: a.fullName || 'Admin',
            accountStatus: a.accountStatus,
            roleStatus: a.roleStatus,
            roleType: a.roleType
          }));
        }),
        catchError(err => {
          console.warn('[DashboardService] Admins list unavailable:', err);
          return of([]);
        })
      );
  }

  /**
   * Fetch all data in parallel using forkJoin.
   */
  loadAllDashboardData(): Observable<DashboardData> {
    return forkJoin({
      stats: this.getDashboardStats(),
      recentModeration: this.getModerationSummary(),
      verifications: this.getUsersSummary(),
      admins: this.getAdminsSummary()
    }).pipe(
      catchError(() => of({
        stats: MOCK_STATS,
        recentModeration: MOCK_MODERATION,
        verifications: [],
        admins: []
      }))
    );
  }
}
