import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { environment } from '../../environments/environment';
import { WorkReviewService } from '../../app/core/services/work-review.service';
import { MAX_FEEDBACK_LENGTH, WorkMaterial, WorkSubmissionDetail } from '../../app/core/models/work-review.model';

const IMAGE = /\.(jpe?g|png|gif|webp|heic|heif|bmp)(\?|$)/i;
const VIDEO = /\.(mp4|mov|m4v|webm|3gp|mkv)(\?|$)/i;
const AUDIO = /\.(mp3|m4a|aac|wav|ogg|opus|amr)(\?|$)/i;

export type MaterialKind = 'image' | 'video' | 'audio' | 'other';

export function materialKind(material: Pick<WorkMaterial, 'fileName' | 'fileUrl'>): MaterialKind {
  const probe = (re: RegExp) => re.test(material.fileName) || re.test(material.fileUrl);
  if (probe(IMAGE)) return 'image';
  if (probe(VIDEO)) return 'video';
  if (probe(AUDIO)) return 'audio';
  return 'other';
}

/** The message the server sent with an error, or a plain default - never a crash. */
function errorMessage(err: unknown): string {
  const message = err instanceof HttpErrorResponse ? err.error?.message : null;
  return typeof message === 'string' && message ? message : "That didn't work. Please try again.";
}

/**
 * One piece of submitted work: the brief, what the creator wrote and attached, the knowledge holder's review
 * and the admin's own, with Approve, Decline (written reason required) and, once both have approved, Publish.
 */
@Component({
  selector: 'app-work-review-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
<div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
  <app-sidebar></app-sidebar>

  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <app-header pageTitle="Review Submitted Work" section="Console" [showSearch]="false"></app-header>

    <main class="flex-1 overflow-y-auto p-6">
      <a routerLink="/work-review" class="inline-flex items-center gap-1 text-sm font-bold text-[#004343] mb-4">
        <span class="material-symbols-outlined text-base">arrow_back</span> Submitted work
      </a>

      @if (isLoading()) {
        <div class="flex items-center justify-center py-16" role="status" aria-label="Loading">
          <div class="h-8 w-8 rounded-full border-4 border-[#004343]/20 border-t-[#004343] animate-spin"></div>
        </div>
      }

      @if (loadError() && !isLoading()) {
        <div class="bg-white rounded-2xl border border-[#dde3eb] p-8 text-center space-y-3" role="alert">
          <p class="text-sm text-[#3f4948]">{{ loadError() }}</p>
          <button type="button" (click)="load()" class="px-4 py-2 rounded-xl text-sm font-bold bg-[#004343] text-white cursor-pointer">Try again</button>
        </div>
      }

      @if (detail(); as d) {
        <div class="max-w-4xl mx-auto space-y-5 pb-28">
          <div class="flex items-start gap-4">
            <div class="h-14 w-14 shrink-0 rounded-full bg-[#d8e8e8] border border-[#a0c4c4] flex items-center justify-center text-xl text-[#0F5C5C] font-bold">
              {{ (d.summary.creatorName || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <h1 class="text-2xl font-bold text-[#004343] font-['Source_Serif_4',serif]">{{ d.summary.title }}</h1>
              <p class="text-sm text-[#3f4948]">
                By {{ d.summary.creatorName }}
                @if (d.summary.elderName) { · for {{ d.summary.elderName }} }
                @if (d.summary.category) { · {{ d.summary.category }} }
                · Submitted {{ d.summary.submittedAt | date:'medium' }}
              </p>
            </div>
          </div>

          @if (notice()) {
            <div class="bg-[#004343] text-white text-sm font-semibold rounded-xl px-4 py-3" role="status">{{ notice() }}</div>
          }
          @if (actionError()) {
            <div class="bg-[#ffdad6] text-[#93000a] text-sm font-semibold rounded-xl px-4 py-3" role="alert">{{ actionError() }}</div>
          }

          @if (d.summary.state === 'PUBLISHED') {
            <div class="text-sm font-bold text-[#004343]">Published to users{{ d.summary.publishedAt ? ' on ' + (d.summary.publishedAt | date:'mediumDate') : '' }}</div>
          }
          @if (d.summary.state === 'COMPLETED') {
            <div class="text-sm font-bold text-[#004343]">Both reviewers approved. Not published yet - publish it below.</div>
          }

          <!-- The knowledge holder's review -->
          <section class="bg-white rounded-2xl p-5 space-y-2 border-2"
                   [class.border-[#004343]]="d.summary.elderApproved"
                   [class.border-[#b4543c]]="!d.summary.elderApproved && !!d.elderFeedback"
                   [class.border-[#dde3eb]]="!d.summary.elderApproved && !d.elderFeedback">
            <h2 class="text-lg font-bold text-[#191c1c] font-['Source_Serif_4',serif]">Knowledge holder's review</h2>
            @if (d.summary.elderApproved) {
              <p class="inline-flex items-center gap-1 text-sm font-bold text-[#004343]">
                <span class="material-symbols-outlined text-base">check_circle</span> Approved by knowledge holder
              </p>
            } @else if (d.elderFeedback) {
              <p class="text-sm font-bold text-[#7a3626]">
                Knowledge holder asked for changes{{ d.elderFeedbackAt ? ' · ' + (d.elderFeedbackAt | date:'medium') : '' }}
              </p>
              <p class="text-sm whitespace-pre-line">{{ d.elderFeedback }}</p>
            } @else {
              <p class="text-sm text-[#3f4948]">Knowledge holder hasn't reviewed yet</p>
            }
          </section>

          <!-- The admin's own review -->
          <section class="bg-white rounded-2xl border border-[#dde3eb] p-5 space-y-2">
            <h2 class="text-lg font-bold text-[#191c1c] font-['Source_Serif_4',serif]">Your review</h2>
            @if (d.summary.adminApproved) {
              <p class="inline-flex items-center gap-1 text-sm font-bold text-[#004343]">
                <span class="material-symbols-outlined text-base">check_circle</span> You approved this work
              </p>
            } @else if (d.adminFeedback) {
              <p class="text-sm font-bold text-[#7a3626]">You asked for changes{{ d.adminFeedbackAt ? ' · ' + (d.adminFeedbackAt | date:'medium') : '' }}</p>
              <p class="text-sm whitespace-pre-line">{{ d.adminFeedback }}</p>
            } @else {
              <p class="text-sm text-[#3f4948]">You haven't reviewed this yet</p>
            }
          </section>

          @for (part of textParts(d); track part.title) {
            <section class="bg-white rounded-2xl border border-[#dde3eb] p-5 space-y-2">
              <h2 class="text-lg font-bold text-[#191c1c] font-['Source_Serif_4',serif]">{{ part.title }}</h2>
              <p class="text-sm leading-relaxed whitespace-pre-line">{{ part.text }}</p>
            </section>
          }

          <section class="bg-white rounded-2xl border border-[#dde3eb] p-5 space-y-3">
            <h2 class="text-lg font-bold text-[#191c1c] font-['Source_Serif_4',serif]">Photos, videos and recordings ({{ (d.materials || []).length }})</h2>
            @if (!(d.materials || []).length) {
              <p class="text-sm text-[#3f4948]">Nothing was attached.</p>
            }
            @for (m of d.materials || []; track m.id) {
              <div class="space-y-1">
                <p class="text-xs font-semibold text-[#3f4948] break-all">{{ m.fileName }}</p>
                @switch (kindOf(m)) {
                  @case ('image') {
                    <a [href]="urlOf(m)" target="_blank" rel="noopener"><img [src]="urlOf(m)" [alt]="m.fileName" class="max-h-72 rounded-xl border border-[#dde3eb]" /></a>
                  }
                  @case ('video') {
                    <video [src]="urlOf(m)" controls preload="metadata" class="max-h-80 w-full rounded-xl bg-black"></video>
                  }
                  @case ('audio') {
                    <audio [src]="urlOf(m)" controls preload="none" class="w-full"></audio>
                  }
                  @default {
                    <a [href]="urlOf(m)" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-sm font-bold text-[#004343] underline">
                      <span class="material-symbols-outlined text-base">open_in_new</span> Open file
                    </a>
                  }
                }
              </div>
            }
          </section>
        </div>

        <!-- Actions -->
        <div class="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-white border-t border-[#dde3eb] flex flex-wrap items-center justify-end gap-3">
          @if (d.summary.state === 'COMPLETED') {
            <button type="button" (click)="confirming.set('publish')" [disabled]="busy()"
                    class="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#004343] text-white disabled:opacity-50 cursor-pointer">Publish</button>
          }
          @if (d.summary.state === 'AWAITING_REVIEW' || d.summary.state === 'CHANGES_REQUESTED') {
            <button type="button" (click)="openDecline()" [disabled]="busy()"
                    class="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#004343] text-[#004343] disabled:opacity-50 cursor-pointer">Decline</button>
            @if (!d.summary.adminApproved) {
              <button type="button" (click)="confirming.set('approve')" [disabled]="busy()"
                      class="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#004343] text-white disabled:opacity-50 cursor-pointer">Approve</button>
            }
          }
        </div>
      }
    </main>
  </div>

  <!-- Approve / publish confirmation -->
  @if (confirming(); as which) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1c]/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div class="bg-white rounded-2xl shadow-xl border border-[#dde3eb] w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-bold text-[#004343] font-['Source_Serif_4',serif]">{{ which === 'publish' ? 'Publish this work?' : 'Approve this work?' }}</h2>
        <p class="text-sm text-[#3f4948]">
          {{ which === 'publish' ? 'The creator is told it has been published.' : 'It is published to users once the knowledge holder has approved it too.' }}
        </p>
        <div class="flex justify-end gap-3">
          <button type="button" (click)="confirming.set(null)" class="px-4 py-2 text-sm font-bold text-[#3f4948] hover:bg-[#e1e3e2] rounded-xl cursor-pointer">Cancel</button>
          <button type="button" (click)="confirm()" class="px-4 py-2 text-sm font-bold bg-[#004343] text-white rounded-xl cursor-pointer">{{ which === 'publish' ? 'Publish' : 'Approve' }}</button>
        </div>
      </div>
    </div>
  }

  <!-- Decline: a written reason is required -->
  @if (declineOpen()) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1c]/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div class="bg-white rounded-2xl shadow-xl border border-[#dde3eb] w-full max-w-lg p-6 space-y-3">
        <h2 class="text-lg font-bold text-[#004343] font-['Source_Serif_4',serif]">What needs to change?</h2>
        @if (detail()?.elderFeedback && !detail()?.summary?.elderApproved) {
          <div class="bg-[#b4543c]/10 rounded-xl p-3 space-y-1">
            <p class="text-xs font-bold text-[#7a3626]">Knowledge holder's reason</p>
            <p class="text-sm whitespace-pre-line">{{ detail()?.elderFeedback }}</p>
          </div>
        }
        <textarea [(ngModel)]="reason" [maxlength]="maxLength" rows="6" autofocus
                  placeholder="Write your feedback for the creator…" aria-label="What needs to change?"
                  class="w-full px-3 py-2 border border-[#6f7978] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004343]/30"></textarea>
        <div class="flex justify-between items-center text-xs text-[#3f4948]">
          <span>The creator reads this note.</span>
          <span>{{ reason.length }} / {{ maxLength }}</span>
        </div>
        @if (declineError()) {
          <p class="text-sm font-semibold text-[#93000a]" role="alert">{{ declineError() }}</p>
        }
        <div class="flex justify-end gap-3">
          <button type="button" (click)="declineOpen.set(false)" [disabled]="busy()" class="px-4 py-2 text-sm font-bold text-[#3f4948] hover:bg-[#e1e3e2] rounded-xl cursor-pointer">Cancel</button>
          <button type="button" (click)="sendDecline()" [disabled]="!canSend() || busy()"
                  class="px-4 py-2 text-sm font-bold bg-[#004343] text-white rounded-xl disabled:opacity-50 cursor-pointer">
            {{ busy() ? 'Sending…' : 'Send feedback' }}
          </button>
        </div>
      </div>
    </div>
  }
</div>
  `
})
export class WorkReviewDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private workReview = inject(WorkReviewService);

  readonly maxLength = MAX_FEEDBACK_LENGTH;

  jobId = '';
  detail = signal<WorkSubmissionDetail | null>(null);
  isLoading = signal(false);
  loadError = signal('');
  busy = signal(false);
  notice = signal('');
  actionError = signal('');
  confirming = signal<'approve' | 'publish' | null>(null);
  declineOpen = signal(false);
  declineError = signal('');
  reason = '';

  /** Send stays off until there is a reason - blank or spaces only does not count. */
  canSend(): boolean {
    return this.reason.trim().length > 0;
  }

  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('jobId') ?? '';
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.workReview.get(this.jobId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.loadError.set(errorMessage(err));
        this.isLoading.set(false);
      }
    });
  }

  textParts(d: WorkSubmissionDetail): { title: string; text: string }[] {
    const parts: { title: string; text: string | null | undefined }[] = [
      { title: 'What was asked', text: d.brief },
      { title: 'Introduction', text: d.introduction },
      { title: 'Story', text: d.story },
      { title: 'Search summary', text: d.seoSummary },
      { title: 'Keywords', text: (d.seoKeywords ?? []).join(', ') }
    ];
    return parts.filter((p): p is { title: string; text: string } => !!p.text && p.text.trim().length > 0);
  }

  kindOf(m: WorkMaterial): MaterialKind {
    return materialKind(m);
  }

  /** Shared-bucket files are full https links; a few old ones are local "/uploads/..." paths on the backend host. */
  urlOf(m: WorkMaterial): string {
    if (/^https?:\/\//i.test(m.fileUrl)) return m.fileUrl;
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    return origin + (m.fileUrl.startsWith('/') ? m.fileUrl : '/' + m.fileUrl);
  }

  openDecline(): void {
    this.declineError.set('');
    this.declineOpen.set(true);
  }

  confirm(): void {
    const which = this.confirming();
    this.confirming.set(null);
    if (!which) return;
    this.run(which === 'approve' ? this.workReview.approve(this.jobId) : this.workReview.publish(this.jobId),
      which === 'approve' ? 'Work approved' : 'Work published');
  }

  sendDecline(): void {
    const text = this.reason.trim();
    if (!text) return;
    this.busy.set(true);
    this.declineError.set('');
    this.workReview.decline(this.jobId, text).subscribe({
      next: () => {
        this.busy.set(false);
        this.declineOpen.set(false);
        this.reason = '';
        this.notice.set('Feedback sent to the creator');
        this.load();
      },
      error: (err) => {
        // Keep what was typed so nothing is lost.
        this.busy.set(false);
        this.declineError.set(errorMessage(err));
      }
    });
  }

  private run(call: ReturnType<WorkReviewService['approve']>, success: string): void {
    this.busy.set(true);
    this.actionError.set('');
    call.subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(success);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.actionError.set(errorMessage(err));
      }
    });
  }
}
