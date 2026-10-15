import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { WorkFeedbackState, WorkSubmissionDetail, WorkSubmissionSummary } from '../models/work-review.model';

/** The backend wraps every response in { success, message, data }. */
interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

/**
 * Reviewing work content creators submit: the queue, one submission, and the admin's approve / decline
 * (with a written reason) / publish. Admin-only endpoints; the elder-recorded story queue is Moderation.
 */
@Injectable({ providedIn: 'root' })
export class WorkReviewService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly reviewUrl = `${environment.apiUrl}/admin/work-review`;
  private readonly feedbackUrl = `${environment.apiUrl}/admin/work-feedback/jobs`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  /** Every job with submitted work, newest first. */
  list(): Observable<WorkSubmissionSummary[]> {
    return this.http
      .get<ApiEnvelope<WorkSubmissionSummary[]>>(this.reviewUrl, { headers: this.getHeaders() })
      .pipe(map((res) => res.data ?? []));
  }

  get(jobId: string): Observable<WorkSubmissionDetail> {
    return this.http
      .get<ApiEnvelope<WorkSubmissionDetail>>(`${this.reviewUrl}/jobs/${jobId}`, { headers: this.getHeaders() })
      .pipe(map((res) => res.data as WorkSubmissionDetail));
  }

  approve(jobId: string): Observable<WorkFeedbackState> {
    return this.http
      .post<ApiEnvelope<WorkFeedbackState>>(`${this.feedbackUrl}/${jobId}/approve`, {}, { headers: this.getHeaders() })
      .pipe(map((res) => res.data as WorkFeedbackState));
  }

  /** Declines with a written reason - the backend has no separate "decline"; leaving feedback is the decline. */
  decline(jobId: string, message: string): Observable<WorkFeedbackState> {
    return this.http
      .post<ApiEnvelope<WorkFeedbackState>>(`${this.feedbackUrl}/${jobId}`, { message: message.trim() }, { headers: this.getHeaders() })
      .pipe(map((res) => res.data as WorkFeedbackState));
  }

  /** Only allowed once both reviewers have approved. */
  publish(jobId: string): Observable<WorkFeedbackState> {
    return this.http
      .post<ApiEnvelope<WorkFeedbackState>>(`${this.feedbackUrl}/${jobId}/publish`, {}, { headers: this.getHeaders() })
      .pipe(map((res) => res.data as WorkFeedbackState));
  }
}
