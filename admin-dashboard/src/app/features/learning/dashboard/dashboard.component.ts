import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../../core/services/learning.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';

@Component({
  selector: 'app-learning-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LearningSidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  
  private learningService = inject(LearningService);
  private dashboardService = inject(DashboardService);
  
  isSidebarOpen = false;

  // Statistics
  totalLearners = 0;
  totalBadgesEarned = 0; // Requires backend implementation
  
  // Individual Learner Progress
  learnerProgressList: any[] = [];
  
  // Detailed Completion Stats (Currently showing total available in DB)
  completedTracks = 0;
  completedQuizzes = 0;
  completedLessons = 0;
  completedFlashcards = 0;
  currentDate: Date = new Date();

  ngOnInit() {
    // Update time every minute
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);

    // Fetch actual users and build leaderboard
    this.dashboardService.getUsersSummary().subscribe({
      next: (users) => {
        this.totalLearners = users.length;
        
        // Limit to 10 users to prevent excessive API calls
        const topUsers = users.slice(0, 10);
        
        // Fetch actual progress from the database for each user
        // Note: The Learning engine in the backend uses the phone number (Long) as the userId
        const progressRequests = topUsers.map(u => 
          this.learningService.getUserDashboard(u.phoneNumber || '0').pipe(
            map(progress => ({
              id: u.id,
              name: u.fullName,
              status: u.accountStatus || 'ACTIVE',
              completionRate: progress.progressPercentage || 0,
              badges: 0, // Badges not yet implemented in backend
              completedTracks: progress.completedTracks || 0
            })),
            catchError((err) => {
              console.error('API Error fetching user progress for ID ' + u.id, err);
              return of({
              id: u.id,
              name: u.fullName,
              status: u.accountStatus || 'ACTIVE',
              completionRate: 0,
              badges: 0,
              completedTracks: 0
            })})
          )
        );

        if (progressRequests.length > 0) {
          forkJoin(progressRequests).subscribe({
            next: (results) => {
              this.learnerProgressList = results;
              // Sort by actual completion rate descending
              this.learnerProgressList.sort((a, b) => b.completionRate - a.completionRate);
            }
          });
        }
      },
      error: () => console.error('Failed to fetch user list')
    });

    // Fetch actual learning content counts from the database
    this.learningService.getTracks().subscribe({
      next: (tracks) => {
        this.completedTracks = tracks.length;
        
        tracks.forEach(track => {
          if (track.id) {
            this.learningService.getLessonsByTrack(track.id).subscribe({
              next: (lessons) => {
                this.completedLessons += lessons.length;
                
                lessons.forEach(lesson => {
                  if (lesson.id) {
                    if (lesson.type === 'FLASHCARDS') {
                      this.learningService.getFlashcardsByLesson(lesson.id).subscribe({
                        next: (cards) => this.completedFlashcards += cards.length
                      });
                    } else if (lesson.type === 'QUIZ') {
                      this.learningService.getQuizQuestionsByLesson(lesson.id).subscribe({
                        next: (questions) => this.completedQuizzes += questions.length
                      });
                    }
                  }
                });
              }
            });
          }
        });
      },
      error: () => console.error('Failed to fetch learning tracks')
    });
  }

  // Recent Badges Preview (Static until backend supports badges)
  recentBadges = [
    { id: 1, name: 'Cultural Explorer', icon: '🌍', color: 'bg-emerald-100 text-emerald-700' },
    { id: 2, name: 'Quiz Master', icon: '🏆', color: 'bg-amber-100 text-amber-700' },
    { id: 3, name: 'Flashcard Whiz', icon: '⚡', color: 'bg-purple-100 text-purple-700' }
  ];

}
