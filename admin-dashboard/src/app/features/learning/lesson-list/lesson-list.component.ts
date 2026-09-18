import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LearningService, Lesson, LearningTrack } from '../../../core/services/learning.service';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lesson-list.component.html',
  styleUrl: './lesson-list.component.scss'
})
export class LessonListComponent implements OnInit {
  lessons: Lesson[] = [];
  trackId!: number;
  track?: LearningTrack;

  constructor(
    private learningService: LearningService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.trackId = +id;
      this.loadData();
    }
  }

  loadData(): void {
    this.learningService.getTrack(this.trackId).subscribe(t => this.track = t);
    this.learningService.getLessonsByTrack(this.trackId).subscribe(data => {
      this.lessons = data;
    });
  }
}
