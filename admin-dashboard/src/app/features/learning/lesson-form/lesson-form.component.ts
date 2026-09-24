import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LearningService, Lesson, Flashcard, QuizQuestion } from '../../../core/services/learning.service';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';


@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LearningSidebarComponent],
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
  editingContentId?: number;
  
  flashcards: Flashcard[] = [];
  quizQuestions: QuizQuestion[] = [];

  constructor(
    private fb: FormBuilder,
    private learningService: LearningService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const tId = this.route.snapshot.paramMap.get('trackId');
    if (tId) {
      this.trackId = +tId;
    }
    
    this.route.queryParams.subscribe(params => {
      if (params['type']) this.lessonType = params['type'];
      this.initForms();
      this.autoSetNextLessonOrder();
    });

    const lId = this.route.snapshot.paramMap.get('lessonId');
    if (lId) {
      this.lessonId = +lId;
      this.isLessonSaved = true;
      this.learningService.getLessonsByTrack(this.trackId).subscribe(lessons => {
        const existing = lessons.find(l => l.id === this.lessonId);
        if (existing) {
          this.lessonForm.patchValue({
            title: existing.title,
            description: existing.description,
            lessonOrder: existing.lessonOrder
          });
        }
      });
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
        word: ['', Validators.required],
        meaning: ['', Validators.required],
        audioUrl: ['']
      });
    } else {
      this.contentForm = this.fb.group({
        question: ['', Validators.required],
        optionA: ['', Validators.required],
        optionB: ['', Validators.required],
        optionC: ['', Validators.required],
        optionD: ['', Validators.required],
        correctOption: ['A', Validators.required]
      });
    }
  }

  autoSetNextLessonOrder() {
    if (!this.lessonId && this.trackId) {
      this.learningService.getLessonsByTrack(this.trackId).subscribe({
        next: (lessons) => {
          if (lessons && lessons.length > 0) {
            const nextOrder = Math.max(...lessons.map(l => l.lessonOrder || 0)) + 1;
            this.lessonForm.patchValue({ lessonOrder: nextOrder });
          }
        },
        error: (err) => console.error('Could not fetch existing lessons for auto-ordering', err)
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

    if (this.isLessonSaved && this.lessonId) {
      this.learningService.updateLesson(this.lessonId, lesson).subscribe({
        next: () => alert('Lesson updated successfully!'),
        error: (err) => alert('Failed to update lesson: ' + (err.error?.message || err.message))
      });
    } else {
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
  }

  addContent() {
    if (this.contentForm.invalid || !this.lessonId) return;

    if (this.lessonType === 'FLASHCARDS') {
      const fc: Flashcard = { ...this.contentForm.value, lessonId: this.lessonId };
      if (this.editingContentId) {
        this.learningService.updateFlashcard(this.editingContentId, fc).subscribe(() => {
          this.cancelEdit();
          this.loadContent();
        });
      } else {
        this.learningService.createFlashcard(fc).subscribe(() => {
          this.contentForm.reset();
          this.loadContent();
        });
      }
    } else {
      const qq: QuizQuestion = { ...this.contentForm.value, lessonId: this.lessonId };
      if (this.editingContentId) {
        this.learningService.updateQuizQuestion(this.editingContentId, qq).subscribe(() => {
          this.cancelEdit();
          this.loadContent();
        });
      } else {
        this.learningService.createQuizQuestion(qq).subscribe(() => {
          this.contentForm.reset({ correctOption: 'A' });
          this.loadContent();
        });
      }
    }
  }

  editFlashcard(fc: Flashcard) {
    this.editingContentId = fc.id;
    this.contentForm.patchValue({
      word: fc.word,
      meaning: fc.meaning,
      audioUrl: fc.audioUrl
    });
  }

  deleteFlashcard(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this flashcard?')) {
      this.learningService.deleteFlashcard(id).subscribe(() => this.loadContent());
    }
  }

  editQuizQuestion(q: QuizQuestion) {
    this.editingContentId = q.id;
    this.contentForm.patchValue({
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption
    });
  }

  deleteQuizQuestion(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this quiz question?')) {
      this.learningService.deleteQuizQuestion(id).subscribe(() => this.loadContent());
    }
  }

  cancelEdit() {
    this.editingContentId = undefined;
    if (this.lessonType === 'FLASHCARDS') {
      this.contentForm.reset();
    } else {
      this.contentForm.reset({ correctOption: 'A' });
    }
  }
}
