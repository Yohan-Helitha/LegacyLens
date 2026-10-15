import { Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LearningService,
  AdminTrackGenerationRequest,
  AdminGeneratedTrackPreviewDto,
  AdminGeneratedLessonDto,
  AdminGeneratedFlashcardDto,
  AdminPublishTrackRequest,
  CommunityStorySummary,
  ApiResponse
} from '../../../core/services/learning.service';
import { environment } from '../../../../environments/environment';
import { LearningSidebarComponent } from '../components/learning-sidebar/learning-sidebar.component';

@Component({
  selector: 'app-track-ai-generate',
  standalone: true,
  imports: [FormsModule, RouterLink, LearningSidebarComponent],
  templateUrl: './track-ai-generate.component.html',
  styleUrl: './track-ai-generate.component.scss'
})
export class TrackAiGenerateComponent implements OnInit {
  private learningService: LearningService = inject(LearningService);
  private router = inject(Router);

  isSidebarOpen = false;

  // Step state: 'INPUT' or 'PREVIEW'
  currentStep: 'INPUT' | 'PREVIEW' = 'INPUT';

  // Input model
  inputType: 'STORY' | 'TEXT' = 'STORY';
  selectedStoryId = '';
  customText = '';
  region = 'Southern Province';
  occupation = 'Traditional Mask Carving';
  difficultyLevel = 'BEGINNER';
  lessonCount = 2;
  flashcardCount = 3;
  quizQuestionCount = 3;

  // Available community stories
  communityStories: CommunityStorySummary[] = [];
  isLoadingStories = false;

  // Loading states
  isGenerating = false;
  isPublishing = false;
  errorMessage = '';
  successMessage = '';

  // Generated Preview
  preview: AdminGeneratedTrackPreviewDto | null = null;
  activePreviewTab: 'TRACK' | 'LESSONS' | 'FLASHCARDS' | 'QUIZ' = 'TRACK';

  regionsList: string[] = [
    'Western Province',
    'Central Province',
    'Southern Province',
    'Northern Province',
    'Eastern Province',
    'North Western Province',
    'North Central Province',
    'Uva Province',
    'Sabaragamuwa Province'
  ];

  occupationsList: string[] = [
    'Traditional Mask Carving',
    'Beeralu Lace Making',
    'Brass & Metal Casting',
    'Traditional Pottery & Clay',
    'Batik Textile Art',
    'Paddy Cultivation & Kamatha Rituals',
    'Cinnamon Peeling & Spice Craft',
    'Dumbara Mat Weaving',
    'Ayurvedic Medicine & Herbology',
    'Traditional Puppetry (Rukada)'
  ];

  ngOnInit() {
    this.fetchStories();
  }

  fetchStories() {
    this.isLoadingStories = true;
    this.learningService.getCommunityStories().subscribe({
      next: (res: ApiResponse<CommunityStorySummary[]>) => {
        this.isLoadingStories = false;
        if (res && res.data) {
          this.communityStories = res.data;
          if (this.communityStories.length > 0) {
            this.selectedStoryId = this.communityStories[0].id;
          }
        }
      },
      error: () => {
        this.isLoadingStories = false;
        // Fallback to text mode if stories unavailable
        this.inputType = 'TEXT';
      }
    });
  }

  onStorySelected() {
    const selected = this.communityStories.find(s => s.id === this.selectedStoryId);
    if (selected) {
      if (selected.region) this.region = selected.region;
      if (selected.occupation) this.occupation = selected.occupation;
    }
  }

  generateCurriculum() {
    this.errorMessage = '';
    this.successMessage = '';

    const req: AdminTrackGenerationRequest = {
      region: this.region,
      occupation: this.occupation,
      difficultyLevel: this.difficultyLevel,
      lessonCount: Number(this.lessonCount),
      flashcardCount: Number(this.flashcardCount),
      quizQuestionCount: Number(this.quizQuestionCount)
    };

    if (this.inputType === 'STORY') {
      if (!this.selectedStoryId) {
        this.errorMessage = 'Please select a community story to generate curriculum from.';
        return;
      }
      req.storyId = this.selectedStoryId;
      if (this.customText && this.customText.trim().length > 0) {
        req.sourceText = this.customText.trim();
      }
    } else {
      if (!this.customText || this.customText.trim().length < 5) {
        this.errorMessage = 'Please enter at least 5 characters of folklore or heritage text.';
        return;
      }
      req.sourceText = this.customText.trim();
    }

    this.isGenerating = true;
    this.learningService.generateTrackPreview(req).subscribe({
      next: (res: ApiResponse<AdminGeneratedTrackPreviewDto>) => {
        this.isGenerating = false;
        if (res && res.data) {
          this.preview = res.data;
          this.currentStep = 'PREVIEW';
          this.activePreviewTab = 'TRACK';
        } else {
          this.errorMessage = 'Unexpected response format from AI generator.';
        }
      },
      error: (err: any) => {
        this.isGenerating = false;
        this.errorMessage = err?.error?.message || 'Failed to generate curriculum with AI. Please try again.';
      }
    });
  }

  backToInput() {
    this.currentStep = 'INPUT';
    this.errorMessage = '';
  }

  publishCurriculum() {
    if (!this.preview) return;

    if (!this.preview.title || !this.preview.title.trim()) {
      this.errorMessage = 'Track title cannot be empty.';
      return;
    }

    const missingAudio = this.getFlashcardsWithoutAudioCount();
    if (missingAudio > 0) {
      this.errorMessage = `Add audio to every flashcard before publishing (${missingAudio} still missing). Open the Flashcards tab to upload an MP3 or MP4.`;
      this.activePreviewTab = 'FLASHCARDS';
      return;
    }

    this.isPublishing = true;
    this.errorMessage = '';

    const publishReq: AdminPublishTrackRequest = {
      preview: this.preview
    };

    this.learningService.publishGeneratedTrack(publishReq).subscribe({
      next: (_res: any) => {
        this.isPublishing = false;
        this.successMessage = 'Track and entire curriculum published successfully to learners!';
        setTimeout(() => {
          this.router.navigate(['/learning/tracks']);
        }, 1500);
      },
      error: (err: any) => {
        this.isPublishing = false;
        this.errorMessage = err?.error?.message || 'Failed to publish track. Please try again.';
      }
    });
  }

  removeFlashcard(lesson: AdminGeneratedLessonDto, index: number) {
    if (lesson.flashcards) {
      lesson.flashcards.splice(index, 1);
    }
  }

  removeQuizQuestion(lesson: AdminGeneratedLessonDto, index: number) {
    if (lesson.quizQuestions) {
      lesson.quizQuestions.splice(index, 1);
    }
  }

  getTotalFlashcardsCount(): number {
    if (!this.preview || !this.preview.lessons) return 0;
    return this.preview.lessons.reduce((acc: number, l: AdminGeneratedLessonDto) => acc + (l.flashcards?.length || 0), 0);
  }

  getTotalQuestionsCount(): number {
    if (!this.preview || !this.preview.lessons) return 0;
    return this.preview.lessons.reduce((acc: number, l: AdminGeneratedLessonDto) => acc + (l.quizQuestions?.length || 0), 0);
  }

  // --- Flashcard audio ---

  /** Cards with an upload in flight, and the last upload error per card. */
  private uploadingAudio = new Set<AdminGeneratedFlashcardDto>();
  audioErrors = new Map<AdminGeneratedFlashcardDto, string>();

  /** Accepted by the audio picker; the backend checks the type and the 10 MB limit again. */
  readonly audioAccept = 'audio/mpeg,audio/mp4,video/mp4,.mp3,.mp4,.m4a';

  isAudioUploading(card: AdminGeneratedFlashcardDto): boolean {
    return this.uploadingAudio.has(card);
  }

  getFlashcardsWithoutAudioCount(): number {
    if (!this.preview || !this.preview.lessons) return 0;
    return this.preview.lessons.reduce(
      (acc: number, l: AdminGeneratedLessonDto) => acc + (l.flashcards?.filter(c => !c.audioUrl).length || 0), 0);
  }

  /** The audio URL as the browser can play it: full URLs (Supabase) as-is, "/uploads/..." paths via the backend host. */
  getAudioPreviewUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    return origin + (path.startsWith('/') ? path : '/' + path);
  }

  onFlashcardAudioSelected(card: AdminGeneratedFlashcardDto, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // lets the same file be picked again after an error
    if (!file) return;

    this.audioErrors.delete(card);
    this.uploadingAudio.add(card);
    this.learningService.uploadAudio(file).subscribe({
      next: (res) => {
        card.audioUrl = res.audioUrl;
        this.uploadingAudio.delete(card);
      },
      error: (err: any) => {
        this.uploadingAudio.delete(card);
        this.audioErrors.set(card, err?.error?.message || 'Audio upload failed. Please try again.');
      }
    });
  }

  removeFlashcardAudio(card: AdminGeneratedFlashcardDto) {
    card.audioUrl = undefined;
    this.audioErrors.delete(card);
  }
}
