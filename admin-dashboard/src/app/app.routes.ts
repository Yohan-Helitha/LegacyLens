import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'learning',
    children: [
      { path: '', loadComponent: () => import('./features/learning/track-list/track-list.component').then(m => m.TrackListComponent) },
      { path: 'track/new', loadComponent: () => import('./features/learning/track-form/track-form.component').then(m => m.TrackFormComponent) },
      { path: 'track/:id/edit', loadComponent: () => import('./features/learning/track-form/track-form.component').then(m => m.TrackFormComponent) },
      { path: 'track/:id/lessons', loadComponent: () => import('./features/learning/lesson-list/lesson-list.component').then(m => m.LessonListComponent) },
      { path: 'track/:id/lessons/new', loadComponent: () => import('./features/learning/lesson-form/lesson-form.component').then(m => m.LessonFormComponent) },
      { path: 'track/:id/lessons/:lessonId/edit', loadComponent: () => import('./features/learning/lesson-form/lesson-form.component').then(m => m.LessonFormComponent) }
    ]
  }
];
