import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LearningService, LearningTrack } from '../../../core/services/learning.service';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';


@Component({
  selector: 'app-track-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LearningSidebarComponent],
  templateUrl: './track-form.component.html',
  styleUrl: './track-form.component.scss'
})
export class TrackFormComponent implements OnInit {
  trackForm!: FormGroup;
  isEditMode = false;
  trackId?: number;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private learningService: LearningService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.trackForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      region: [''],
      occupation: [''],
      difficultyLevel: ['BEGINNER', Validators.required],
      thumbnailUrl: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.trackId = +id;
      this.learningService.getTrack(this.trackId).subscribe(track => {
        this.trackForm.patchValue(track);
      });
    }
  }

  onSubmit(): void {
    if (this.trackForm.invalid) return;

    this.isSubmitting = true;
    const trackData: LearningTrack = this.trackForm.value;

    if (this.isEditMode && this.trackId) {
      this.learningService.updateTrack(this.trackId, trackData).subscribe({
        next: () => {
          this.router.navigate(['/learning']);
        },
        error: (err) => {
          console.error(err);
          alert('Failed to update track');
          this.isSubmitting = false;
        }
      });
    } else {
      this.learningService.createTrack(trackData).subscribe({
        next: () => {
          this.router.navigate(['/learning']);
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting = false;
        }
      });
    }
  }
}
