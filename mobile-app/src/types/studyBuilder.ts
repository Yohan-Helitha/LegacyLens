// mobile-app/src/types/studyBuilder.ts
// TypeScript interfaces for the AI Study Builder module.

export interface SourceContentSummary {
  id: string;
  title: string;
  snippet?: string;
  region?: string;
  occupation?: string;
  language?: string;
  contributorDisplayName?: string;
  hasAudio?: boolean;
}

export interface CreateStudyJobRequest {
  sourceIds: string[];
  includeQuiz: boolean;
  includeFlashcards: boolean;
  includeMiniCourse: boolean;
  includeCertificate: boolean;
  quizQuestionCount?: number;
  flashcardCount?: number;
  courseLessonCount?: number;
}

export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface GeneratedLesson {
  title: string;
  description?: string;
  type: string;
}

export interface GeneratedFlashcard {
  word: string;
  meaning: string;
  culturalNote?: string;
  sourceContentId?: string;
  evidence?: string;
}

export interface GeneratedQuizQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  flashcardWord?: string;
  sourceContentId?: string;
  evidence?: string;
}

export interface GeneratedStudySet {
  courseTitle: string;
  courseDescription?: string;
  region?: string;
  occupation?: string;
  lessons: GeneratedLesson[];
  flashcards: GeneratedFlashcard[];
  quizQuestions: GeneratedQuizQuestion[];
}

export interface StudyJobResponse {
  jobId: number;
  status: JobStatus;
  failureReason?: string;
  resultTrackId?: number;
  sourceContentIds: string[];
  requestedArtifacts?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  createdAt: string;
  completedAt?: string;
  preview?: GeneratedStudySet;
}

export interface StudySetSummary {
  id: number;
  title: string;
  description?: string;
  region?: string;
  occupation?: string;
  totalLessons: number;
  origin: string;
  sourceContentIds: string[];
  createdAt: string;
  attemptCount: number;
  bestScore?: number;
}

export interface LessonSummaryDto {
  id: number;
  lessonOrder: number;
  title: string;
  description?: string;
  type: string;
}

export interface FlashcardDetailDto {
  id: number;
  lessonId: number;
  word: string;
  meaning: string;
  culturalNote?: string;
  audioUrl?: string;
  recordedBy?: string;
  sourceContentId?: string;
  evidence?: string;
}

export interface QuizQuestionDetailDto {
  id: number;
  lessonId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  flashcardId?: number;
  sourceContentId?: string;
  evidence?: string;
}

export interface AttemptHistoryDto {
  id: number;
  lessonId?: number;
  score: number;
  total: number;
  xpAwarded: number;
  takenAt: string;
}

export interface StudySetDetail {
  id: number;
  title: string;
  description?: string;
  region?: string;
  occupation?: string;
  totalLessons: number;
  sourceContentIds: string[];
  createdAt: string;
  lessons: LessonSummaryDto[];
  flashcards: FlashcardDetailDto[];
  quizQuestions: QuizQuestionDetailDto[];
  attempts: AttemptHistoryDto[];
}

export interface QuizAnswerSubmission {
  questionId: number;
  selectedOption: string;
}

export interface SubmitStudyAttemptRequest {
  lessonId: number;
  answers: QuizAnswerSubmission[];
}

export interface StudyAttemptResult {
  attemptId: number;
  trackId: number;
  lessonId: number;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  xpAwarded: number;
  firstAttempt: boolean;
  takenAt: string;
}
