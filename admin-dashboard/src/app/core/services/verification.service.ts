import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUserVerificationResponse,
  UpdateUserVerificationRequest
} from '../models/verification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Fetch all user verifications from backend
   * Endpoint: GET /api/admin/verifications?role=ALL|ELDER|YOUTH_CREATOR|...&status=ALL|PENDING|VERIFIED|...
   */
  getAllVerifications(role: string = 'ALL', status: string = 'ALL'): Observable<AdminUserVerificationResponse[]> {
    let params = new HttpParams();
    if (role && role !== 'ALL') {
      params = params.set('role', role);
    }
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<any>(
      `${environment.apiUrl}/admin/verifications`,
      { headers: this.getHeaders(), params }
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
        console.warn('[VerificationService] Could not fetch verifications from backend:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch single user verification profile by user ID
   * Endpoint: GET /api/admin/verifications/{userId}
   */
  getVerificationByUserId(userId: string): Observable<AdminUserVerificationResponse> {
    return this.http.get<any>(
      `${environment.apiUrl}/admin/verifications/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Could not fetch user verification ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update verification status (e.g. VERIFIED, REJECTED, SUSPENDED)
   * Endpoint: PATCH /api/admin/verifications/{userId}/status
   */
  updateVerificationStatus(userId: string, request: UpdateUserVerificationRequest): Observable<AdminUserVerificationResponse> {
    return this.http.patch<any>(
      `${environment.apiUrl}/admin/verifications/${userId}/status`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to update status for ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Approve user verification
   * Endpoint: POST /api/admin/verifications/{userId}/approve
   */
  approveUser(userId: string, note?: string): Observable<AdminUserVerificationResponse> {
    let params = new HttpParams();
    if (note) {
      params = params.set('note', note);
    }
    return this.http.post<any>(
      `${environment.apiUrl}/admin/verifications/${userId}/approve`,
      {},
      { headers: this.getHeaders(), params }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to approve user ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Reject user verification
   * Endpoint: POST /api/admin/verifications/{userId}/reject
   */
  rejectUser(userId: string, reason?: string): Observable<AdminUserVerificationResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.post<any>(
      `${environment.apiUrl}/admin/verifications/${userId}/reject`,
      {},
      { headers: this.getHeaders(), params }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to reject user ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Suspend user account
   * Endpoint: POST /api/admin/verifications/{userId}/suspend
   */
  suspendUser(userId: string, reason?: string): Observable<AdminUserVerificationResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.post<any>(
      `${environment.apiUrl}/admin/verifications/${userId}/suspend`,
      {},
      { headers: this.getHeaders(), params }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to suspend user ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Reactivate suspended user account
   * Endpoint: POST /api/admin/verifications/{userId}/reactivate
   */
  reactivateUser(userId: string): Observable<AdminUserVerificationResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/admin/verifications/${userId}/reactivate`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to reactivate user ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Delete user permanently
   * Endpoint: DELETE /api/admin/verifications/{userId}
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<any>(
      `${environment.apiUrl}/admin/verifications/${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[VerificationService] Failed to delete user ${userId}:`, err);
        return throwError(() => err);
      })
    );
  }
}


