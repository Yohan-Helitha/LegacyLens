// src/data/mockLearningData.ts
// Temporary fake data for building & testing Learning Engine screens
// before the backend API is ready. Replace with real API calls later.

import { Track, Lesson, Flashcard, QuizQuestion, LearnerProgress, Badge } from '../types/learning';

export const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Southern Fishing Dialect',
    description: 'Learn vocabulary used by fishing communities in the south.',
    region: 'Southern',
    occupation: 'Fishing',
    difficulty: 'Beginner',
    totalLessons: 8,
    completedLessons: 3,
  },
  {
    id: 'track-2',
    title: 'Kandyan Pottery Terms',
    description: 'Traditional pottery-making vocabulary from the Kandy region.',
    region: 'Kandyan',
    occupation: 'Pottery',
    difficulty: 'Intermediate',
    totalLessons: 6,
    completedLessons: 0,
  },
];

export const mockLessons: Lesson[] = [
  { id: 'lesson-1', trackId: 'track-1', order: 1, title: 'Lesson 1: Boat Parts Vocabulary', type: 'flashcards', status: 'completed' },
  { id: 'lesson-2', trackId: 'track-1', order: 2, title: 'Lesson 2: Boat Parts Quiz', type: 'quiz', status: 'completed' },
  { id: 'lesson-3', trackId: 'track-1', order: 3, title: 'Lesson 3: Fishing Tools', type: 'flashcards', status: 'in_progress' },
];

export const mockFlashcards: Flashcard[] = [
  { id: 'card-1', lessonId: 'lesson-1', word: 'Wallawa', meaning: 'Fishing net', culturalNote: 'Used mainly in shallow-water fishing.', recordedBy: 'Elder from Mirissa' },
  { id: 'card-2', lessonId: 'lesson-1', word: 'Oruwa', meaning: 'Traditional outrigger canoe', recordedBy: 'Elder from Mirissa' },
];

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    lessonId: 'lesson-2',
    prompt: 'What does this word mean?',
    word: 'Wallawa',
    options: [
      { id: 'A', text: 'Fishing net' },
      { id: 'B', text: 'Boat anchor' },
      { id: 'C', text: 'Fishing rod' },
      { id: 'D', text: 'Sail' },
    ],
    correctOptionId: 'A',
  },
];

export const mockProgress: LearnerProgress = {
  tracksStarted: 2,
  lessonsCompleted: 3,
  totalXp: 240,
  currentStreakDays: 5,
  last7Days: [true, true, false, true, true, true, true],
  trackProgress: [
    { trackId: 'track-1', trackTitle: 'Southern Fishing Dialect', completedLessons: 3, totalLessons: 8 },
    { trackId: 'track-2', trackTitle: 'Kandyan Pottery Terms', completedLessons: 0, totalLessons: 6 },
  ],
};

export const mockBadges: Badge[] = [
  { id: 'badge-1', name: 'First Track Started', description: 'Started your first learning track', earned: true, earnedDate: '2026-08-01' },
  { id: 'badge-2', name: '5 Day Streak', description: 'Learned 5 days in a row', earned: true, earnedDate: '2026-08-15' },
  { id: 'badge-3', name: 'Track Master', description: 'Complete 3 tracks', earned: false, unlockHint: 'Complete 3 tracks to unlock' },
];