// src/types/learning.ts
// Shared TypeScript types for the Learning Engine module (Member D).

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type LessonType = 'flashcards' | 'quiz' | 'audio';

export type LessonStatus = 'locked' | 'in_progress' | 'completed';

/** A learning track, e.g. "Southern Fishing Dialect" */
export interface Track {
  id: number;
  title: string;
  description: string;
  region: string;
  occupation: string;
  difficulty: Difficulty;
  totalLessons: number;
  completedLessons?: number;
}

/** A single lesson inside a track (flashcard set, quiz, or audio lesson) */
export interface Lesson {
  id: number;
  trackId?: number;
  lessonOrder: number;
  title: string;
  description?: string;
  type: string;
  status?: LessonStatus;
}

/** A vocabulary flashcard belonging to a lesson */
export interface Flashcard {
  id: string;
  lessonId: string;
  word: string;
  meaning: string;
  audioUrl?: string;
  culturalNote?: string;
  recordedBy?: string;
}

export type QuestionOptionId = 'A' | 'B' | 'C' | 'D';

/** A single multiple-choice quiz question */
export interface QuizQuestion {
  id: string;
  lessonId: string;
  prompt: string;
  word?: string;
  audioUrl?: string;
  options: { id: QuestionOptionId; text: string }[];
  correctOptionId: QuestionOptionId;
}

/** Result of a single answered question */
export interface QuizAnswer {
  questionId: string;
  selectedOptionId: QuestionOptionId | null;
  isCorrect: boolean;
}

/** Aggregate result shown on the Quiz Result screen */
export interface QuizResult {
  lessonId: string;
  totalQuestions: number;
  correctCount: number;
  xpEarned: number;
  answers: QuizAnswer[];
}

/** Learner's overall progress snapshot */
export interface LearnerProgress {
  tracksStarted: number;
  lessonsCompleted: number;
  totalXp: number;
  currentStreakDays: number;
  last7Days: boolean[];
  trackProgress: {
    trackId: string;
    trackTitle: string;
    completedLessons: number;
    totalLessons: number;
  }[];
}

/** A badge/achievement, earned or locked */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earned: boolean;
  earnedDate?: string;
  unlockHint?: string;
}

/** A completion certificate for a finished track */
export interface Certificate {
  id: string;
  trackId: string;
  trackTitle: string;
  learnerName: string;
  completionDate: string;
}