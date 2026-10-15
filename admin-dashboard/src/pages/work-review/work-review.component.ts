import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { WorkReviewService } from '../../app/core/services/work-review.service';
import { WorkReviewState, WorkSubmissionSummary } from '../../app/core/models/work-review.model';

type QueueTab = WorkReviewState;

/** "5 minutes ago" / "3 days ago" - plain words for how long ago work was submitted. */
export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  const units: [string, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n === 1 ? '' : 's'} ago`;
    }
  }
  return 'just now';
}

/**
 * Submitted Work: work content creators have finished, for the admin to approve, send back or publish.
 * Separate from Moderation, which is the queue for stories elders record.
 */
@Component({
  selector: 'app-work-review',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
<div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
  <app-sidebar></app-sidebar>

  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <app-header pageTitle="Submitted Work" section="Console" [showSearch]="false"></app-header>

    <!-- Tabs by review state -->
    <div class="bg-white border-b border-[#dde3eb] px-6 py-2.5 flex items-center gap-1 sm:gap-2 shrink-0 overflow-x-auto">
      @for (tab of tabs; track tab.key) {
        <button
          type="button"
          (click)="activeTab.set(tab.key)"
          [attr.aria-pressed]="activeTab() === tab.key"
          [class]="activeTab() === tab.key ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap">
          <span class="material-symbols-outlined text-base">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span
            [class]="activeTab() === tab.key ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'"
            class="px-1.5 rounded-full text-[10px] font-bold">{{ countFor(tab.key) }}</span>
        </button>
      }
    </div>

    <main class="flex-1 overflow-y-auto p-6 space-y-4">
      <p class="text-sm text-[#3f4948]">
        Work content creators have finished. Stories recorded by elders are reviewed under Moderation.
      </p>

      @if (isLoading()) {
        <div class="flex items-center justify-center py-16" role="status" aria-label="Loading">
          <div class="h-8 w-8 rounded-full border-4 border-[#004343]/20 border-t-[#004343] animate-spin"></div>
        </div>
      }

      @if (hasError() && !isLoading()) {
        <div class="bg-white rounded-2xl border border-[#dde3eb] p-8 text-center space-y-3" role="alert">
          <span class="material-symbols-outlined text-3xl text-[#6f7978]">error</span>
          <p class="text-sm text-[#3f4948]">Couldn't load the submitted work. Check your connection and try again.</p>
          <button type="button" (click)="load()" class="px-4 py-2 rounded-xl text-sm font-bold bg-[#004343] text-white cursor-pointer">Try again</button>
        </div>
      }

      @if (!isLoading() && !hasError() && items().length === 0) {
        <div class="bg-white rounded-2xl border border-[#dde3eb] p-10 text-center space-y-2">
          <span class="material-symbols-outlined text-4xl text-[#004343]">assignment_turned_in</span>
          <h2 class="text-lg font-bold text-[#004343] font-['Source_Serif_4',serif]">Nothing submitted yet</h2>
          <p class="text-sm text-[#3f4948]">When a creator submits finished work it will appear here.</p>
        </div>
      }

      @if (!isLoading() && !hasError() && items().length > 0 && visible().length === 0) {
        <div class="bg-white rounded-2xl border border-[#dde3eb] p-8 text-center text-sm text-[#3f4948]">
          Nothing in this section right now.
        </div>
      }

      @for (item of visible(); track item.jobId) {
        <a [routerLink]="['/work-review', item.jobId]"
           class="block bg-white rounded-2xl border border-[#dde3eb] p-5 hover:border-[#004343]/40 hover:shadow-sm transition-all">
          <div class="flex items-start gap-4">
            <div class="h-11 w-11 shrink-0 rounded-full bg-[#d8e8e8] border border-[#a0c4c4] flex items-center justify-center text-[#0F5C5C] font-bold"
                 [attr.aria-label]="item.creatorName + ' has no profile photo yet'">
              {{ (item.creatorName || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <h3 class="text-base font-bold text-[#191c1c] truncate">{{ item.title }}</h3>
              <p class="text-xs text-[#3f4948]">
                By {{ item.creatorName }}
                @if (item.elderName) { · for {{ item.elderName }} }
                @if (item.category) { · {{ item.category }} }
                · Submitted {{ ago(item.submittedAt) }}
              </p>
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      [class]="item.elderApproved ? 'bg-[#004343] text-white' : 'bg-[#e1e3e2] text-[#3f4948]'">
                  <span class="material-symbols-outlined text-[14px]">{{ item.elderApproved ? 'check_circle' : 'schedule' }}</span>
                  Knowledge holder: {{ item.elderApproved ? 'Approved' : 'Waiting' }}
                </span>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      [class]="item.adminApproved ? 'bg-[#004343] text-white' : 'bg-[#e1e3e2] text-[#3f4948]'">
                  <span class="material-symbols-outlined text-[14px]">{{ item.adminApproved ? 'check_circle' : 'schedule' }}</span>
                  Admin: {{ item.adminApproved ? 'Approved' : 'Waiting' }}
                </span>
                @if (item.state === 'CHANGES_REQUESTED' && item.sentBackBy) {
                  <span class="text-[11px] font-bold text-[#9b4600]">Sent back by {{ sentBackLabel(item.sentBackBy) }}</span>
                }
              </div>
            </div>
            <span class="material-symbols-outlined text-[#6f7978]">chevron_right</span>
          </div>
        </a>
      }
    </main>
  </div>
</div>
  `
})
export class WorkReviewComponent implements OnInit {
  private workReview = inject(WorkReviewService);

  readonly tabs: { key: QueueTab; label: string; icon: string }[] = [
    { key: 'AWAITING_REVIEW', label: 'Awaiting review', icon: 'hourglass_top' },
    { key: 'CHANGES_REQUESTED', label: 'Sent back', icon: 'undo' },
    { key: 'COMPLETED', label: 'Ready to publish', icon: 'task_alt' },
    { key: 'PUBLISHED', label: 'Published', icon: 'public' }
  ];

  activeTab = signal<QueueTab>('AWAITING_REVIEW');
  items = signal<WorkSubmissionSummary[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  visible = computed(() => this.items().filter((item) => item.state === this.activeTab()));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.workReview.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  countFor(state: QueueTab): number {
    return this.items().filter((item) => item.state === state).length;
  }

  ago(iso: string): string {
    return timeAgo(iso);
  }

  sentBackLabel(by: 'KNOWLEDGE_HOLDER' | 'ADMIN' | 'BOTH'): string {
    return by === 'KNOWLEDGE_HOLDER' ? 'the knowledge holder' : by === 'ADMIN' ? 'an admin' : 'the knowledge holder and an admin';
  }
}
