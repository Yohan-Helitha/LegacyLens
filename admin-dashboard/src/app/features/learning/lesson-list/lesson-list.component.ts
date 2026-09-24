import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LearningService, Lesson, LearningTrack } from '../../../core/services/learning.service';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';


@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LearningSidebarComponent],
  templateUrl: './lesson-list.component.html',
  styleUrl: './lesson-list.component.scss'
})
export class LessonListComponent implements OnInit {
  lessons: Lesson[] = [];
  trackId!: number;
  track?: LearningTrack;
  loading = true;

  constructor(
    private learningService: LearningService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('trackId');
    if (id) {
      this.trackId = +id;
      this.loadData();
    }
  }

  loadData(): void {
    this.loading = true;
    this.learningService.getTrack(this.trackId).subscribe(t => this.track = t);
    this.learningService.getLessonsByTrack(this.trackId).subscribe({
      next: (data) => {
        this.lessons = data.sort((a, b) => a.lessonOrder - b.lessonOrder);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  deleteLesson(id: number | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this lesson? All its content will be lost.')) {
      this.learningService.deleteLesson(id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert('Failed to delete lesson: ' + (err.error?.message || 'Something went wrong.'))
      });
    }
  }
}
