// mobile-app/src/types/weakWord.ts

export interface WeakWordSummary {
  id: number;
  flashcardId: number;
  word: string;
  meaning: string;
  culturalNote?: string;
  audioUrl?: string;
  errorCount: number;
  consecutiveCorrect: number;
  mastered: boolean;
  lastFailedAt: string;
  nextReviewAt?: string;
  box?: number;
}

export interface ReviewQuestion {
  questionId: string;
  flashcardId: number;
  word: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface ReviewSession {
  sessionId: string;
  totalQuestions: number;
  strategyUsed: string;
  questions: ReviewQuestion[];
}

export interface ReviewAnswerItem {
  questionId: string;
  flashcardId: number;
  selectedOption: string;
}

export interface SubmitReviewAnswersRequest {
  sessionId: string;
  answers: ReviewAnswerItem[];
}

export interface ReviewAnswerResult {
  questionId: string;
  flashcardId: number;
  word: string;
  correct: boolean;
  selectedOption: string;
  correctOption: string;
  meaning: string;
  consecutiveCorrect: number;
  mastered: boolean;
}

export interface ReviewResult {
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  xpEarned: number;
  masteredCount: number;
  masteredWords: string[];
  results: ReviewAnswerResult[];
}
