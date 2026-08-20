// src/store/learningStore.ts
import { create } from 'zustand';
import { QuestionOptionId } from '../types/learning';

interface QuizState {
  currentLessonId: string | null;
  questionIndex: number;
  selectedOption: QuestionOptionId | null;
  score: number;
  totalQuestions: number;
}

interface LearningStore {
  // Which track/lesson the learner is currently viewing
  currentTrackId: string | null;
  currentLessonId: string | null;

  // Active quiz session state
  quiz: QuizState;

  // Actions
  setCurrentTrack: (trackId: string) => void;
  setCurrentLesson: (lessonId: string) => void;

  startQuiz: (lessonId: string, totalQuestions: number) => void;
  selectOption: (optionId: QuestionOptionId) => void;
  submitAnswer: (isCorrect: boolean) => void;
  nextQuestion: () => void;
  resetQuiz: () => void;
}

const initialQuizState: QuizState = {
  currentLessonId: null,
  questionIndex: 0,
  selectedOption: null,
  score: 0,
  totalQuestions: 0,
};

export const useLearningStore = create<LearningStore>((set) => ({
  currentTrackId: null,
  currentLessonId: null,
  quiz: initialQuizState,

  setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
  setCurrentLesson: (lessonId) => set({ currentLessonId: lessonId }),

  startQuiz: (lessonId, totalQuestions) =>
    set({
      quiz: { ...initialQuizState, currentLessonId: lessonId, totalQuestions },
    }),

  selectOption: (optionId) =>
    set((state) => ({ quiz: { ...state.quiz, selectedOption: optionId } })),

  submitAnswer: (isCorrect) =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        score: isCorrect ? state.quiz.score + 1 : state.quiz.score,
      },
    })),

  nextQuestion: () =>
    set((state) => ({
      quiz: {
        ...state.quiz,
        questionIndex: state.quiz.questionIndex + 1,
        selectedOption: null,
      },
    })),

  resetQuiz: () => set({ quiz: initialQuizState }),
}));