import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LearningService, Lesson, Flashcard, QuizQuestion } from '../../../core/services/learning.service';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lesson-form.component.html',
  styleUrl: './lesson-form.component.scss'
})
export class LessonFormComponent implements OnInit {
  lessonForm!: FormGroup;
  contentForm!: FormGroup; // For Flashcard or Quiz
  
  trackId!: number;
  lessonId?: number;
  lessonType: string = 'FLASHCARDS';
  
  isLessonSaved = false;
  
  flashcards: Flashcard[] = [];
  quizQuestions: QuizQuestion[] = [];

  constructor(
    private fb: FormBuilder,
    private learningService: LearningService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tId = this.route.snapshot.paramMap.get('id');
    if (tId) this.trackId = +tId;
    
    this.route.queryParams.subscribe(params => {
      if (params['type']) this.lessonType = params['type'];
      this.initForms();
    });

    const lId = this.route.snapshot.paramMap.get('lessonId');
    if (lId) {
      this.lessonId = +lId;
      this.isLessonSaved = true;
      this.loadContent();
    } else {
      this.initForms();
    }
  }

  initForms() {
    this.lessonForm = this.fb.group({
      title: ['', Validators.required],
      lessonOrder: [1, Validators.required],
      description: ['']
    });

    if (this.lessonType === 'FLASHCARDS') {
      this.contentForm = this.fb.group({
        term: ['', Validators.required],
        translation: ['', Validators.required],
        audioUrl: ['']
      });
    } else {
      this.contentForm = this.fb.group({
        questionText: ['', Validators.required],
        optionA: ['', Validators.required],
        optionB: ['', Validators.required],
        optionC: ['', Validators.required],
        optionD: ['', Validators.required],
        correctOption: ['A', Validators.required]
      });
    }
  }

  loadContent() {
    if (!this.lessonId) return;
    if (this.lessonType === 'FLASHCARDS') {
      this.learningService.getFlashcardsByLesson(this.lessonId).subscribe(data => this.flashcards = data);
    } else {
      this.learningService.getQuizQuestionsByLesson(this.lessonId).subscribe(data => this.quizQuestions = data);
    }
  }

  saveLesson() {
    if (this.lessonForm.invalid) return;
    
    const lesson: Lesson = {
      ...this.lessonForm.value,
      learningTrackId: this.trackId,
      type: this.lessonType
    };

    this.learningService.createLesson(lesson).subscribe({
      next: (saved) => {
        this.lessonId = saved.id;
        this.isLessonSaved = true;
      },
      error: (err) => {
        console.error('Error saving lesson:', err);
        const errorMsg = err.error?.message || err.message || 'An error occurred';
        alert('Failed to save lesson: ' + errorMsg + '\n\n(Tip: Make sure the Order Index is unique for this track!)');
      }
    });
  }

  addContent() {
    if (this.contentForm.invalid || !this.lessonId) return;

    if (this.lessonType === 'FLASHCARDS') {
      const fc: Flashcard = { ...this.contentForm.value, lessonId: this.lessonId };
      this.learningService.createFlashcard(fc).subscribe(() => {
        this.contentForm.reset();
        this.loadContent();
      });
    } else {
      const qq: QuizQuestion = { ...this.contentForm.value, lessonId: this.lessonId };
      this.learningService.createQuizQuestion(qq).subscribe(() => {
        this.contentForm.reset({ correctOption: 'A' });
        this.loadContent();
      });
    }
  }
}
