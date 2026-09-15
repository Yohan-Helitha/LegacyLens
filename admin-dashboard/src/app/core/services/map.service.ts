import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegionDTO,
  LandmarkDTO,
  BadgeDTO,
  QuestDTO,
  QuestionDTO,
  CreateLandmarkRequest,
  SaveBadgeRequest,
  SaveQuestRequest
} from '../models/map.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
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

  private getAuthHeadersOnly(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Fetch all landmarks with attached badges and quests
   */
  getLandmarks(): Observable<LandmarkDTO[]> {
    return this.http.get<any>(`${environment.apiUrl}/admin/cultural-map/landmarks`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : (Array.isArray(res) ? res : []))),
      catchError(err => {
        console.warn('[MapService] Could not fetch landmarks:', err);
        return of([]);
      })
    );
  }

  /**
   * Fetch all 8 Cultural Regions with their constituent districts using GET /api/map/regions
   */
  getRegions(): Observable<RegionDTO[]> {
    return this.http.get<any>(`${environment.apiUrl}/map/regions`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : (Array.isArray(res) ? res : []))),
      catchError(err => {
        console.warn('[MapService] Could not fetch regions:', err);
        return of([]);
      })
    );
  }

  /**
   * Create a new landmark
   */
  createLandmark(data: CreateLandmarkRequest): Observable<LandmarkDTO> {
    return this.http.post<any>(`${environment.apiUrl}/admin/cultural-map/landmarks`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.error('[MapService] Failed to create landmark:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Update an existing landmark
   */
  updateLandmark(id: number, data: CreateLandmarkRequest): Observable<LandmarkDTO> {
    return this.http.put<any>(`${environment.apiUrl}/admin/cultural-map/landmarks/${id}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.error('[MapService] Failed to update landmark:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Delete a landmark by ID
   */
  deleteLandmark(id: number): Observable<void> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/cultural-map/landmarks/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : null)),
      catchError(err => {
        console.error('[MapService] Failed to delete landmark:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Upload a badge image file to uploads/badges directory
   */
  uploadBadgeImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/admin/cultural-map/badges/upload`, formData, {
      headers: this.getAuthHeadersOnly()
    }).pipe(
      map(res => {
        if (res && res.data && res.data.imageUrl) {
          const imgUrl = res.data.imageUrl;
          return imgUrl.startsWith('http') ? imgUrl : `${environment.apiUrl.replace('/api', '')}${imgUrl}`;
        }
        return '';
      }),
      catchError(err => {
        console.error('[MapService] Failed to upload badge image:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Save or update badge configuration
   */
  saveBadge(data: SaveBadgeRequest): Observable<BadgeDTO> {
    return this.http.post<any>(`${environment.apiUrl}/admin/cultural-map/badges`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.error('[MapService] Failed to save badge:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Save or update quest with questions & choices
   */
  saveQuest(data: SaveQuestRequest): Observable<QuestDTO> {
    return this.http.post<any>(`${environment.apiUrl}/admin/cultural-map/quests`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : res)),
      catchError(err => {
        console.error('[MapService] Failed to save quest:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Delete a quest by ID
   */
  deleteQuest(id: number): Observable<void> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/cultural-map/quests/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : null)),
      catchError(err => {
        console.error('[MapService] Failed to delete quest:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch questions for a quest
   */
  getQuestQuestions(questId: number): Observable<QuestionDTO[]> {
    return this.http.get<any>(`${environment.apiUrl}/admin/cultural-map/quests/${questId}/questions`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => (res && res.data ? res.data : (Array.isArray(res) ? res : []))),
      catchError(err => {
        console.warn('[MapService] Failed to get quest questions:', err);
        return of([]);
      })
    );
  }

  /**
   * Fetch dynamic Mapbox Public Token securely from backend
   */
  getMapboxToken(): Observable<string> {
    return this.http.get<any>(`${environment.apiUrl}/map/token`).pipe(
      map(res => (res && res.data && res.data.mapboxToken ? res.data.mapboxToken : '')),
      catchError(err => {
        console.warn('[MapService] Could not fetch dynamic Mapbox token from backend:', err);
        return of('');
      })
    );
  }
}
