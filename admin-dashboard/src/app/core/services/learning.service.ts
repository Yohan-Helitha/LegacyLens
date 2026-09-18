import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LearningTrack {
  id?: number;
  title: string;
  description: string;
  region?: string;
  occupation?: string;
  difficultyLevel: string;
  thumbnailUrl?: string;
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
  term: string;
  translation: string;
  audioUrl?: string;
}

export interface QuizQuestion {
  id?: number;
  lessonId: number;
  questionText: string;
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
  private apiUrl = 'http://localhost:8081/api/learning';

  constructor(private http: HttpClient) { }

  // --- Tracks ---
  getTracks(): Observable<LearningTrack[]> {
    return this.http.get<LearningTrack[]>(`${this.apiUrl}/tracks`);
  }

  getTrack(id: number): Observable<LearningTrack> {
    return this.http.get<LearningTrack>(`${this.apiUrl}/tracks/${id}`);
  }

  createTrack(track: LearningTrack): Observable<LearningTrack> {
    return this.http.post<LearningTrack>(`${this.apiUrl}/tracks`, track);
  }

  // --- Lessons ---
  getLessonsByTrack(trackId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/tracks/${trackId}/lessons`);
  }

  createLesson(lesson: Lesson): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/lessons?trackId=${lesson.learningTrackId}`, lesson);
  }

  // --- Flashcards ---
  getFlashcardsByLesson(lessonId: number): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.apiUrl}/lessons/${lessonId}/flashcards`);
  }

  createFlashcard(flashcard: Flashcard): Observable<Flashcard> {
    return this.http.post<Flashcard>(`${this.apiUrl}/flashcards`, flashcard);
  }

  // --- Quiz Questions ---
  getQuizQuestionsByLesson(lessonId: number): Observable<QuizQuestion[]> {
    return this.http.get<QuizQuestion[]>(`${this.apiUrl}/lessons/${lessonId}/questions`);
  }

  createQuizQuestion(quizQuestion: QuizQuestion): Observable<QuizQuestion> {
    return this.http.post<QuizQuestion>(`${this.apiUrl}/lessons/${quizQuestion.lessonId}/questions`, quizQuestion);
  }
}
