import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.model';
import {
  ModerationQueueItemResponse,
  UpdateModerationStatusRequest,
  StoryQuizDTO,
  AiGenerateQuizRequest,
  RegionDTO
} from '../models/moderation.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ModerationService {
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
   * Fetch all moderation queue items from backend
   * Endpoint: GET /api/admin/moderation/queue?status=ALL|PENDING|PUBLISHED|REJECTED|ARCHIVED
   */
  getQueueItems(status: string = 'ALL'): Observable<ModerationQueueItemResponse[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<any>(
      `${environment.apiUrl}/admin/moderation/queue`,
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
        console.warn('[ModerationService] Could not fetch queue items from backend:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch a single moderation queue item by ID
   * Endpoint: GET /api/admin/moderation/queue/{id}
   */
  getQueueItem(id: string): Observable<ModerationQueueItemResponse> {
    return this.http.get<any>(
      `${environment.apiUrl}/admin/moderation/queue/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[ModerationService] Could not fetch item ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update the status of a moderation item (e.g. approve, reject, archive, restore)
   * Endpoint: PATCH /api/admin/moderation/queue/{id}/status
   */
  updateItemStatus(id: string, request: UpdateModerationStatusRequest): Observable<ModerationQueueItemResponse> {
    return this.http.patch<any>(
      `${environment.apiUrl}/admin/moderation/queue/${id}/status`,
      request,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.warn(`[ModerationService] Failed to update status for ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Permanently delete a moderation queue item
   * Endpoint: DELETE /api/admin/moderation/queue/{id}
   */
  deleteItem(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${environment.apiUrl}/admin/moderation/queue/${id}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(() => void 0),
      catchError(err => {
        console.warn(`[ModerationService] Failed to delete item ${id}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Get Quiz associated with a story
   * Endpoint: GET /api/v1/moderation/stories/{storyId}/quiz
   */
  getStoryQuiz(storyId: string): Observable<StoryQuizDTO | null> {
    return this.http.get<StoryQuizDTO>(
      `${environment.apiUrl}/v1/moderation/stories/${storyId}/quiz`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Save or Update Quiz for a story
   * Endpoint: POST /api/v1/moderation/stories/{storyId}/quiz
   */
  saveStoryQuiz(storyId: string, quizDto: StoryQuizDTO): Observable<StoryQuizDTO> {
    return this.http.post<StoryQuizDTO>(
      `${environment.apiUrl}/v1/moderation/stories/${storyId}/quiz`,
      quizDto,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => {
        console.warn(`[ModerationService] Failed to save quiz for story ${storyId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * AI-Generate Quiz for a story
   * Endpoint: POST /api/v1/moderation/stories/{storyId}/quiz/ai-generate
   */
  generateAiQuiz(storyId: string, request?: AiGenerateQuizRequest): Observable<StoryQuizDTO> {
    return this.http.post<StoryQuizDTO>(
      `${environment.apiUrl}/v1/moderation/stories/${storyId}/quiz/ai-generate`,
      request || {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(err => {
        console.warn(`[ModerationService] AI quiz generation failed for ${storyId}:`, err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch all cultural regions and their districts from database
   * Endpoint: GET /api/map/regions
   */
  getRegions(): Observable<RegionDTO[]> {
    return this.http.get<ApiResponse<RegionDTO[]>>(
      `${environment.apiUrl}/map/regions`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => (res && res.data ? res.data : [])),
      catchError(err => {
        console.warn('[ModerationService] Could not fetch regions from database:', err);
        return of([]);
      })
    );
  }
}

