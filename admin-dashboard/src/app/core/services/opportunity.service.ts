import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminOpportunityResponse,
  OpportunityAudioResponse,
  CreateOpportunityRequest,
  UpdateOpportunityStatusRequest
} from '../models/opportunity.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {
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
   * Fetch all opportunities from backend
   * Endpoint: GET /api/admin/opportunities?status=ALL|PUBLISHED|DRAFT|CLOSED
   */
  getAllOpportunities(status: string = 'ALL'): Observable<AdminOpportunityResponse[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<any>(
      `${environment.apiUrl}/admin/opportunities`,
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
        console.warn('[OpportunityService] Could not fetch opportunities from backend:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch single opportunity by ID
   * Endpoint: GET /api/admin/opportunities/{id}
   */
  getOpportunity(id: string): Observable<AdminOpportunityResponse> {
    return this.http.get<any>(
      `${environment.apiUrl}/admin/opportunities/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[OpportunityService] Could not fetch opportunity ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Create new opportunity
   * Endpoint: POST /api/admin/opportunities
   */
  createOpportunity(request: CreateOpportunityRequest): Observable<AdminOpportunityResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/admin/opportunities`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn('[OpportunityService] Failed to create opportunity:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update opportunity status (e.g. DRAFT -> PUBLISHED, CLOSED)
   * Endpoint: PATCH /api/admin/opportunities/{id}/status
   */
  updateOpportunityStatus(id: string, request: UpdateOpportunityStatusRequest): Observable<AdminOpportunityResponse> {
    return this.http.patch<any>(
      `${environment.apiUrl}/admin/opportunities/${id}/status`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[OpportunityService] Failed to update status for ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch all audio submissions
   * Endpoint: GET /api/admin/opportunities/audios?status=ALL|FULLY_LISTENED|PARTIALLY_LISTENED|UNLISTENED|NEEDS_REVIEW
   */
  getAudioSubmissions(status: string = 'ALL'): Observable<OpportunityAudioResponse[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<any>(
      `${environment.apiUrl}/admin/opportunities/audios`,
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
        console.warn('[OpportunityService] Could not fetch audio submissions:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch single audio submission
   * Endpoint: GET /api/admin/opportunities/audios/{id}
   */
  getAudioSubmission(id: string): Observable<OpportunityAudioResponse> {
    return this.http.get<any>(
      `${environment.apiUrl}/admin/opportunities/audios/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[OpportunityService] Could not fetch audio submission ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Publish opportunity directly from reviewed audio intake
   * Endpoint: POST /api/admin/opportunities/audios/{audioId}/publish
   */
  publishFromAudio(audioId: string, request: CreateOpportunityRequest): Observable<AdminOpportunityResponse> {
    return this.http.post<any>(
      `${environment.apiUrl}/admin/opportunities/audios/${audioId}/publish`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[OpportunityService] Failed to publish from audio ${audioId}:`, err);
        return throwError(() => err);
      })
    );
  }
}
