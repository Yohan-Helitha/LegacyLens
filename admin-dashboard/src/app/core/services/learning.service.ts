import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface LearningTrack {
  id?: number;
  title: string;
  description: string;
  region?: string;
  occupation?: string;
  difficultyLevel: string;
  thumbnailUrl?: string;
  createdAt?: string;
}

export interface Lesson {
  id?: number;
  learningTrackId: number;
  title: string;
  type: string; // 'FLASHCARDS' or 'QUIZ'
  lessonOrder: number;
  description?: string;
}

export interface Flashcard {
  id?: number;
  lessonId: number;
  word: string;
  meaning: string;
  audioUrl?: string;
}

export interface QuizQuestion {
  id?: number;
  lessonId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string; // 'A', 'B', 'C', 'D'
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private apiUrl = `${environment.apiUrl}/learning`;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // --- Dashboard / Progress ---
  getUserDashboard(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/admin/users/${userId}`, { headers: this.getHeaders() });
  }

  // --- Tracks ---
  getTracks(): Observable<LearningTrack[]> {
    return this.http.get<LearningTrack[]>(`${this.apiUrl}/tracks`, { headers: this.getHeaders() });
  }

  getTrack(id: number): Observable<LearningTrack> {
    return this.http.get<LearningTrack>(`${this.apiUrl}/tracks/${id}`, { headers: this.getHeaders() });
  }

  createTrack(track: LearningTrack): Observable<LearningTrack> {
    return this.http.post<LearningTrack>(`${this.apiUrl}/tracks`, track, { headers: this.getHeaders() });
  }

  updateTrack(id: number, track: LearningTrack): Observable<LearningTrack> {
    return this.http.put<LearningTrack>(`${this.apiUrl}/tracks/${id}`, track, { headers: this.getHeaders() });
  }

  deleteTrack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tracks/${id}`, { headers: this.getHeaders() });
  }

  // --- Lessons ---
  getLessonsByTrack(trackId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/tracks/${trackId}/lessons`, { headers: this.getHeaders() });
  }

  createLesson(lesson: Lesson): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons?trackId=${lesson.learningTrackId}`, lesson, { headers: this.getHeaders() });
  }

  updateLesson(id: number, lesson: Lesson): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${id}`, lesson, { headers: this.getHeaders() });
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/lessons/${id}`, { headers: this.getHeaders() });
  }

  // --- Flashcards ---
  getFlashcardsByLesson(lessonId: number): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`, { headers: this.getHeaders() });
  }

  createFlashcard(flashcard: Flashcard): Observable<Flashcard> {
    return this.http.post<Flashcard>(`${this.apiUrl}/lessons/${flashcard.lessonId}/flashcards`, flashcard, { headers: this.getHeaders() });
  }

  updateFlashcard(id: number, flashcard: Flashcard): Observable<Flashcard> {
    return this.http.put<Flashcard>(`${this.apiUrl}/flashcards/${id}`, flashcard, { headers: this.getHeaders() });
  }

  deleteFlashcard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/flashcards/${id}`, { headers: this.getHeaders() });
  }

  // --- Quiz Questions ---
  getQuizQuestionsByLesson(lessonId: number): Observable<QuizQuestion[]> {
    return this.http.get<QuizQuestion[]>(`${this.apiUrl}/lessons/${lessonId}/questions`, { headers: this.getHeaders() });
  }

  createQuizQuestion(quizQuestion: QuizQuestion): Observable<QuizQuestion> {
    return this.http.post<QuizQuestion>(`${this.apiUrl}/lessons/${quizQuestion.lessonId}/questions`, quizQuestion, { headers: this.getHeaders() });
  }

  updateQuizQuestion(id: number, quizQuestion: QuizQuestion): Observable<QuizQuestion> {
    return this.http.put<QuizQuestion>(`${this.apiUrl}/questions/${id}`, quizQuestion, { headers: this.getHeaders() });
  }

  deleteQuizQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/questions/${id}`, { headers: this.getHeaders() });
  }
}
