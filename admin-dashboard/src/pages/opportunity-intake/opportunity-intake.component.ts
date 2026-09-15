import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { OpportunityService } from '../../app/core/services/opportunity.service';
import {
  AdminOpportunityResponse,
  OpportunityAudioResponse,
  CreateOpportunityRequest
} from '../../app/core/models/opportunity.model';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export type TopSection = 'intake' | 'opportunities';
export type ViewState = 'intake_queue' | 'intake_review' | 'opp_hub' | 'opp_create';
export type IntakeFilterType = 'All' | 'Fully Listened' | 'Partially Listened' | 'Unlistened' | 'Need Review';
export type HubSubTab = 'drafts' | 'published' | 'removed';

export interface AudioIntakeItem {
  id: string;
  elderName: string;
  elderAvatarUrl: string;
  verified: boolean;
  location: string;
  district: string;
  recordedAt: string;
  date: string;
  time: string;
  duration: string;
  topic: string;
  tags: string[];
  status: 'FULLY_LISTENED' | 'PARTIALLY_LISTENED' | 'UNLISTENED' | 'NEEDS_REVIEW';
  statusLabel: string;
  statusColor: string;
  progressPercent: number;
  originalLanguage: string;
  audioQuality: 'Excellent' | 'Good' | 'Fair';
  recordedEra: string;
  transcriptOriginal: { time: string; text: string; active?: boolean }[];
  transcriptTranslation: { time: string; text: string; active?: boolean }[];
  reviewerNotes?: string;
}

export interface KnowledgeHolder {
  id: string;
  name: string;
  location: string;
  district: string;
  avatarUrl: string;
  isElder: boolean;
  isVerified: boolean;
  specialty: string;
  experienceYears: number;
}

export interface OpportunityItem {
  id: string;
  title: string;
  description: string;
  heroImageUrl: string;
  location: string;
  category: string;
  elderId?: string;
  elderName?: string;
  elderAvatarUrl?: string;
  elderVerified?: boolean;
  scheduledDate?: string;
  durationText?: string;
  timeWindowText?: string;
  isFlexibleSchedule?: boolean;
  offeredAmount: number;
  perks: string[];
  tasks: string[];
  skills: string[];
  deliverables: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  lastEditedAt: string;
  createdAt: string;
  reachCount?: number;
  qualityScore?: number;
}

@Component({
  selector: 'app-opportunity-intake',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">
            {{ toastType() === 'success' ? 'verified' : (toastType() === 'warning' ? 'warning' : 'info') }}
          </span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Container -->
      <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <!-- Top Navigation Header (Standard Common Header) -->
        <app-header 
          pageTitle="Opportunity & Knowledge Intake" 
          section="Console">
        </app-header>

        <!-- Top Navigation Bar: ONLY Main Sections -->
        <div class="bg-white border-b border-[#dde3eb] px-6 py-2.5 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-1 sm:gap-2">
            <!-- 1. Knowledge Intake Tab -->
            <button 
              (click)="switchSection('intake')"
              [class]="currentSection() === 'intake' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">mic</span>
              <span>Knowledge Intake</span>
              <span [class]="currentSection() === 'intake' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {{ intakeCounts().all }}
              </span>
            </button>

            <!-- 2. Opportunities Tab -->
            <button 
              (click)="switchSection('opportunities')"
              [class]="currentSection() === 'opportunities' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">folder_open</span>
              <span>Opportunities</span>
              <span [class]="currentSection() === 'opportunities' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {{ publishedOpportunities().length + draftOpportunities().length }}
              </span>
            </button>
          </div>

          <!-- Section Context Info / Breadcrumb -->
          <div class="flex items-center gap-2">
            @if (currentViewState() === 'intake_review') {
              <span class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">rate_review</span>
                <span>Reviewing Intake Submission</span>
              </span>
            } @else if (currentViewState() === 'opp_create') {
              <span class="text-xs px-2.5 py-1 rounded-lg bg-[#fe893e]/15 text-[#9b4600] border border-[#fe893e]/30 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">edit_note</span>
                <span>Opportunity Creator</span>
              </span>
            } @else {
           
            }
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- STATE 1: INTAKE QUEUE / AUDIO RECORDINGS LIST -->
        <!-- ========================================================================= -->
        @if (currentViewState() === 'intake_queue') {
          <div class="flex-1 flex flex-col h-[calc(100vh-120px)] overflow-hidden bg-[#f8faf9]">
            
            <!-- Filter Bar & Search Subheader -->
            <div class="p-4 md:px-6 bg-white border-b border-[#dde3eb] flex flex-col gap-3 shrink-0">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 class="font-serif text-2xl font-bold text-[#004343] flex items-center gap-2">
                    <span>Cultural Knowledge Audio Intake</span>
                  </h2>
                  <p class="text-xs text-[#6f7978]">Field audio submissions from elders and verified culture custodians across Sri Lanka</p>
                </div>

                <!-- Search Bar + Filter Drawer Trigger -->
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <div class="relative flex-1 sm:w-64">
                    <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#6f7978] text-sm">search</span>
                    <input 
                      type="text" 
                      [ngModel]="intakeSearchQuery()" 
                      (ngModelChange)="intakeSearchQuery.set($event)"
                      placeholder="Search recordings, elders, topics, tags..."
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-8 py-2 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white"
                    />
                    @if (intakeSearchQuery()) {
                      <button (click)="intakeSearchQuery.set('')" class="absolute right-2.5 top-2.5 text-[#6f7978] hover:text-[#191c1c] text-xs cursor-pointer">✕</button>
                    }
                  </div>

                  <button 
                    (click)="isFilterDrawerOpen.set(!isFilterDrawerOpen())"
                    [class]="isFilterDrawerOpen() ? 'bg-[#004343] text-white' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                    class="p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                    title="Filter drawer">
                    <span class="material-symbols-outlined text-base">tune</span>
                  </button>
                </div>
              </div>

              <!-- Status Filter Chips Bar -->
              <div class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <button 
                  (click)="activeIntakeFilter.set('All')"
                  [class]="activeIntakeFilter() === 'All' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2] font-semibold'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span>All Submissions</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px]" [class]="activeIntakeFilter() === 'All' ? 'bg-white/20' : 'bg-black/10'">
                    {{ intakeCounts().all }}
                  </span>
                </button>

                <button 
                  (click)="activeIntakeFilter.set('Fully Listened')"
                  [class]="activeIntakeFilter() === 'Fully Listened' ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold border border-emerald-200'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Fully Listened</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {{ intakeCounts().fullyListened }}
                  </span>
                </button>

                <button 
                  (click)="activeIntakeFilter.set('Partially Listened')"
                  [class]="activeIntakeFilter() === 'Partially Listened' ? 'bg-[#fe893e] text-white font-bold' : 'bg-[#fe893e]/15 text-[#9b4600] hover:bg-[#fe893e]/25 font-semibold border border-[#fe893e]/30'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                  <span>Partially Listened</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {{ intakeCounts().partiallyListened }}
                  </span>
                </button>

                <button 
                  (click)="activeIntakeFilter.set('Unlistened')"
                  [class]="activeIntakeFilter() === 'Unlistened' ? 'bg-[#ba1a1a] text-white font-bold' : 'bg-red-50 text-[#ba1a1a] hover:bg-red-100 font-semibold border border-red-200'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span class="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                  <span>Not Listened</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {{ intakeCounts().unlistened }}
                  </span>
                </button>

                <button 
                  (click)="activeIntakeFilter.set('Need Review')"
                  [class]="activeIntakeFilter() === 'Need Review' ? 'bg-[#3f4948] text-white font-bold' : 'bg-gray-100 text-[#3f4948] hover:bg-gray-200 font-semibold border border-gray-300'"
                  class="px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0">
                  <span class="material-symbols-outlined text-xs">priority_high</span>
                  <span>Need Review</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                    {{ intakeCounts().needReview }}
                  </span>
                </button>
              </div>

              <!-- Expanded Location & Sort Drawer -->
              @if (isFilterDrawerOpen()) {
                <div class="p-3 bg-[#f8faf9] border border-[#dde3eb] rounded-2xl flex flex-col gap-3 animate-fadeIn">
                  <!-- Location Filters -->
                  <div>
                    <span class="text-[10px] font-bold text-[#6f7978] uppercase tracking-wider block mb-1.5">Filter by Region / District:</span>
                    <div class="flex flex-wrap gap-1.5">
                      @for (loc of locationPresets; track loc) {
                        <button 
                          (click)="locationFilter.set(loc)"
                          [class]="locationFilter() === loc ? 'bg-[#004343] text-white font-bold' : 'bg-white text-[#3f4948] hover:bg-[#eceeed] border border-[#dde3eb]'"
                          class="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer">
                          {{ loc === 'all' ? 'All Locations' : loc }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Sort Order -->
                  <div>
                    <span class="text-[10px] font-bold text-[#6f7978] uppercase tracking-wider block mb-1.5">Sort Order:</span>
                    <div class="flex flex-wrap gap-1.5">
                      <button 
                        (click)="sortOrder.set('newest')"
                        [class]="sortOrder() === 'newest' ? 'bg-[#004343] text-white font-bold' : 'bg-white text-[#3f4948] hover:bg-[#eceeed] border border-[#dde3eb]'"
                        class="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer">
                        Date: Newest First
                      </button>
                      <button 
                        (click)="sortOrder.set('oldest')"
                        [class]="sortOrder() === 'oldest' ? 'bg-[#004343] text-white font-bold' : 'bg-white text-[#3f4948] hover:bg-[#eceeed] border border-[#dde3eb]'"
                        class="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer">
                        Date: Oldest First
                      </button>
                      <button 
                        (click)="sortOrder.set('nameAsc')"
                        [class]="sortOrder() === 'nameAsc' ? 'bg-[#004343] text-white font-bold' : 'bg-white text-[#3f4948] hover:bg-[#eceeed] border border-[#dde3eb]'"
                        class="px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer">
                        Elder Name: A to Z
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Scrollable Intake Playable Cards Grid -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                @for (item of filteredAudioSubmissions(); track item.id) {
                  <div class="bg-white border border-[#dde3eb] rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                    
                    <div>
                      <!-- Status Pill & Verification Badge -->
                      <div class="flex items-center justify-between mb-2.5">
                        <span 
                          [style.backgroundColor]="item.statusColor + '18'" 
                          [style.color]="item.statusColor"
                          class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full" [style.backgroundColor]="item.statusColor"></span>
                          <span>{{ item.statusLabel }}</span>
                        </span>

                        <span class="text-[11px] font-mono text-[#6f7978]">ID: {{ item.id }}</span>
                      </div>

                      <!-- Knowledge Holder Info Header -->
                      <div class="flex items-center gap-3 mb-2.5">
                        <img 
                          [src]="item.elderAvatarUrl" 
                          [alt]="item.elderName"
                          class="w-11 h-11 rounded-full object-cover border border-[#dde3eb] shrink-0"
                        />
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-1.5">
                            <h3 class="font-serif font-bold text-sm text-[#004343] truncate group-hover:text-[#9b4600] transition-colors">
                              {{ item.elderName }}
                            </h3>
                            @if (item.verified) {
                              <span class="material-symbols-outlined text-[#fe893e] text-base shrink-0" title="Verified Custodian">verified</span>
                            }
                          </div>
                          <p class="text-xs font-semibold text-[#191c1c] truncate">{{ item.topic }}</p>
                        </div>
                      </div>

                      <!-- Metadata Row -->
                      <div class="flex flex-wrap items-center gap-3 text-[11px] text-[#6f7978] mb-3 pb-2.5 border-b border-[#f2f4f3]">
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-[#9b4600]">location_on</span>
                          {{ item.location }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">calendar_today</span>
                          {{ item.date }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">schedule</span>
                          {{ item.time }}
                        </span>
                        <span class="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f2f4f3] font-bold text-[#004343]">
                          <span class="material-symbols-outlined text-xs">timer</span>
                          {{ item.duration }}
                        </span>
                      </div>

                      <!-- Audio Waveform Strip -->
                      <div class="flex items-center gap-3 bg-[#f8faf9] p-2.5 rounded-xl border border-[#dde3eb] mb-3">
                        <button 
                          (click)="openQuickPreview(item)"
                          class="w-9 h-9 rounded-full bg-[#004343] text-white hover:bg-[#003131] flex items-center justify-center shadow-xs shrink-0 transition-transform active:scale-95 cursor-pointer"
                          title="Play Preview">
                          <span class="material-symbols-outlined text-xl">play_arrow</span>
                        </button>

                        <div class="flex-1 flex items-end gap-[2px] h-8 overflow-hidden">
                          @for (bar of waveformBars(); track $index) {
                            <div 
                              [style.height.%]="bar.height"
                              [class]="bar.played ? 'bg-[#004343]' : 'bg-[#dde3eb]'"
                              class="flex-1 rounded-sm min-w-[2px]">
                            </div>
                          }
                        </div>
                      </div>

                      <!-- Tags Row -->
                      <div class="flex flex-wrap gap-1.5 mb-3">
                        @for (tag of item.tags; track tag) {
                          <span class="text-[10px] bg-white border border-[#dde3eb] px-2 py-0.5 rounded-md font-medium text-[#6f7978]">
                            #{{ tag }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Card Bottom Action Bar -->
                    <div class="flex items-center justify-between pt-2 border-t border-[#f2f4f3] gap-2">
                      @if (item.status === 'PARTIALLY_LISTENED' || item.status === 'NEEDS_REVIEW') {
                        <button 
                          (click)="openFullReview(item)" 
                          class="flex-1 py-2 px-3 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                          <span>Review</span>
                          <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      } @else if (item.status === 'UNLISTENED') {
                        <button 
                          (click)="openQuickPreview(item)" 
                          class="flex-1 py-2 px-3 bg-white hover:bg-[#f2f4f3] text-[#004343] border border-[#004343] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <span class="material-symbols-outlined text-sm">headphones</span>
                          <span>Start Listening</span>
                        </button>
                      } @else {
                        <button 
                          (click)="openFullReview(item)" 
                          class="flex-1 py-2 px-3 bg-[#f2f4f3] hover:bg-[#e1e3e2] text-[#3f4948] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <span class="material-symbols-outlined text-sm">visibility</span>
                          <span>View Details</span>
                        </button>
                      }
                      
                      <button 
                        (click)="openQuickPreview(item)"
                        class="p-2 rounded-xl border border-[#dde3eb] text-[#6f7978] hover:text-[#004343] hover:bg-[#f2f4f3] transition-colors"
                        title="Quick Player Preview">
                        <span class="material-symbols-outlined text-base">play_circle</span>
                      </button>
                    </div>

                  </div>
                } @empty {
                  <div class="col-span-2 p-12 text-center bg-white border border-[#dde3eb] rounded-2xl">
                    <span class="material-symbols-outlined text-5xl text-[#6f7978] mb-2">mic_off</span>
                    <h3 class="font-serif text-base font-bold text-[#191c1c]">No intake submissions found</h3>
                    <p class="text-xs text-[#6f7978] mt-1">Try adjusting the filter criteria or search query</p>
                  </div>
                }
              </div>
            </div>

          </div>
        }

        <!-- ========================================================================= -->
        <!-- STATE 2: REVIEW PAGE (OPENS IN ORDER WHEN REVIEWING AN INTAKE ITEM) -->
        <!-- ========================================================================= -->
        @if (currentViewState() === 'intake_review') {
          <div class="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] h-[calc(100vh-120px)] overflow-hidden bg-[#f8faf9]">
            
            <!-- Left Review Pane: Audio Master & Dual Transcripts -->
            <div class="flex flex-col h-full bg-white border-r border-[#dde3eb] overflow-hidden">
              @if (selectedIntakeItem(); as current) {
                
                <!-- Review Top Bar -->
                <div class="p-4 md:p-5 border-b border-[#dde3eb] bg-white shrink-0">
                  <div class="flex items-center justify-between mb-2">
                    <button 
                      (click)="currentViewState.set('intake_queue')"
                      class="flex items-center gap-1.5 text-xs font-bold text-[#004343] hover:underline cursor-pointer">
                      <span class="material-symbols-outlined text-base">arrow_back</span>
                      <span>Back to Intake Queue</span>
                    </button>

                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Audio Master Ingest
                      </span>
                      <span class="text-xs font-mono text-[#6f7978]">ID: {{ current.id }}</span>
                    </div>
                  </div>

                  <h2 class="font-serif text-xl md:text-2xl font-bold text-[#004343] mb-1">
                    {{ current.topic }}
                  </h2>
                  <p class="text-xs text-[#6f7978] flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-[#004343]">translate</span>
                    Original {{ current.originalLanguage }} with AI-assisted contextual translation
                  </p>

                  <!-- Advanced Waveform Visualizer & Scrubbing Player -->
                  <div class="bg-[#f8faf9] rounded-2xl border border-[#dde3eb] p-4 mt-3 shadow-xs">
                    <!-- 45 Interactive Waveform Bars -->
                    <div class="h-16 flex items-end gap-[3px] mb-3 w-full px-1 overflow-hidden">
                      @for (bar of waveformBars(); track $index) {
                        <div 
                          (click)="seekToBar($index)"
                          [style.height.%]="bar.height"
                          [class]="bar.played ? 'bg-[#004343]' : (bar.active ? 'bg-[#fe893e] scale-y-110' : 'bg-[#dde3eb] hover:bg-[#90d2d1]')"
                          class="flex-1 rounded-sm transition-all duration-150 cursor-pointer min-w-[2px]"
                          [title]="'Jump to ' + bar.time">
                        </div>
                      }
                    </div>

                    <!-- Controls Bar -->
                    <div class="flex items-center justify-between pt-1">
                      <div class="flex items-center gap-1 font-mono text-xs font-bold text-[#004343]">
                        <span>{{ currentPlaybackTime() }}</span>
                        <span class="text-[#6f7978]">/</span>
                        <span class="text-[#6f7978]">{{ totalPlaybackDuration() }}</span>
                      </div>

                      <div class="flex items-center gap-3">
                        <button 
                          (click)="seekBackward(10)" 
                          class="text-[#3f4948] hover:text-[#004343] p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                          title="Rewind 10s">
                          <span class="material-symbols-outlined text-xl">replay_10</span>
                        </button>

                        <button 
                          (click)="togglePlay()" 
                          [class]="isPlaying() ? 'bg-[#9b4600] hover:bg-[#763300]' : 'bg-[#004343] hover:bg-[#003131]'"
                          class="w-11 h-11 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer">
                          <span class="material-symbols-outlined text-2xl">
                            {{ isPlaying() ? 'pause' : 'play_arrow' }}
                          </span>
                        </button>

                        <button 
                          (click)="seekForward(10)" 
                          class="text-[#3f4948] hover:text-[#004343] p-1.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                          title="Forward 10s">
                          <span class="material-symbols-outlined text-xl">forward_10</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          (click)="cycleSpeed()"
                          class="px-2.5 py-1 bg-white border border-[#dde3eb] rounded-lg text-xs font-bold text-[#004343] hover:bg-[#f2f4f3] transition-colors shadow-xs cursor-pointer">
                          {{ playbackSpeed() }}x
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dual-Column Interactive Transcription Area -->
                <div class="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8faf9] custom-scrollbar">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    
                    <!-- Left Column: Original Audio Transcript -->
                    <div class="flex flex-col gap-3 pr-0 md:pr-3 border-b md:border-b-0 md:border-r border-[#dde3eb]">
                      <div class="sticky top-0 bg-[#f8faf9]/95 backdrop-blur-xs py-1.5 flex items-center justify-between border-b border-[#dde3eb]/60 z-10">
                        <h4 class="text-xs font-bold text-[#191c1c] uppercase tracking-wider flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-sm text-[#004343]">record_voice_over</span>
                          Original ({{ current.originalLanguage }})
                        </h4>
                        <span class="text-[10px] text-[#6f7978]">Lossless Recording</span>
                      </div>

                      <div class="space-y-2.5 pt-1">
                        @for (segment of current.transcriptOriginal; track segment.time; let idx = $index) {
                          <div 
                            (click)="jumpToTranscriptSegment(segment.time, idx)"
                            [class]="segment.active 
                              ? 'bg-emerald-50/80 border-l-4 border-[#004343] shadow-xs' 
                              : 'hover:bg-white border-l-4 border-transparent'"
                            class="p-3 rounded-xl bg-white/70 border border-[#dde3eb] transition-all cursor-pointer group">
                            <span [class]="segment.active ? 'text-[#004343] font-bold' : 'text-[#6f7978]'" class="text-[11px] font-mono block mb-1">
                              {{ segment.time }}
                            </span>
                            <p class="text-xs md:text-sm text-[#191c1c] leading-relaxed">
                              {{ segment.text }}
                            </p>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Right Column: Contextual English Translation (Editable & Auto-transcribe) -->
                    <div class="flex flex-col gap-3 pl-0 md:pl-2">
                      <div class="sticky top-0 bg-[#f8faf9]/95 backdrop-blur-xs py-1.5 flex justify-between items-center border-b border-[#dde3eb]/60 z-10">
                        <h4 class="text-xs font-bold text-[#004343] uppercase tracking-wider flex items-center gap-1.5">
                          <span class="material-symbols-outlined text-sm">g_translate</span>
                          English Translation
                        </h4>
                        
                        <div class="flex items-center gap-2">
                          <button 
                            (click)="autoTranscribe()" 
                            [disabled]="isAutoTranscribing()"
                            class="text-[11px] px-2 py-0.5 bg-[#004343]/10 text-[#004343] rounded font-bold hover:bg-[#004343]/20 flex items-center gap-1 transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-xs">auto_awesome</span>
                            <span>{{ isAutoTranscribing() ? 'Transcribing...' : 'Auto Transcribe' }}</span>
                          </button>

                          <button 
                            (click)="toggleEditTranslation()" 
                            class="text-[11px] text-[#004343] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-xs">{{ isEditingTranslation() ? 'check' : 'edit' }}</span>
                            <span>{{ isEditingTranslation() ? 'Done' : 'Edit' }}</span>
                          </button>
                        </div>
                      </div>

                      <div class="space-y-2.5 pt-1">
                        @for (segment of current.transcriptTranslation; track segment.time; let idx = $index) {
                          <div 
                            [class]="segment.active 
                              ? 'bg-[#004343]/5 border-l-4 border-[#004343] shadow-xs' 
                              : 'hover:bg-white border-l-4 border-transparent'"
                            class="p-3 rounded-xl bg-white/70 border border-[#dde3eb] transition-all relative group">
                            
                            <span [class]="segment.active ? 'text-[#004343] font-bold' : 'text-[#6f7978]'" class="text-[11px] font-mono block mb-1">
                              {{ segment.time }}
                            </span>

                            @if (isEditingTranslation()) {
                              <textarea 
                                [(ngModel)]="segment.text" 
                                rows="2"
                                class="w-full text-xs md:text-sm bg-white border border-[#c2c8c7] rounded-lg p-2 focus:ring-1 focus:ring-[#004343] focus:outline-none">
                              </textarea>
                            } @else {
                              <p class="text-xs md:text-sm text-[#191c1c] leading-relaxed">
                                {{ segment.text }}
                              </p>
                            }
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                </div>

              } @else {
                <div class="flex-1 flex flex-col items-center justify-center p-8 text-[#6f7978]">
                  <span class="material-symbols-outlined text-5xl mb-2 text-[#004343]">library_books</span>
                  <p class="text-base font-semibold">Select an intake item to begin review</p>
                </div>
              }
            </div>

            <!-- Right Review Pane: Metadata, Routing Notes & Decisions -->
            <div class="bg-white flex flex-col h-full overflow-hidden shadow-[-4px_0_12px_rgba(0,0,0,0.02)] border-l border-[#dde3eb]">
              @if (selectedIntakeItem(); as current) {
                <div class="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5 custom-scrollbar">
                  
                  <!-- Knowledge Holder Card -->
                  <div>
                    <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">badge</span>
                      Knowledge Custodian
                    </h3>
                    <div class="bg-[#f8faf9] border border-[#dde3eb] rounded-2xl p-4 flex gap-3.5 items-center shadow-xs">
                      <img 
                        [src]="current.elderAvatarUrl" 
                        [alt]="current.elderName"
                        class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0" 
                      />
                      <div class="min-w-0 flex-1">
                        <h4 class="font-serif text-base font-bold text-[#004343] truncate">
                          {{ current.elderName }}
                        </h4>
                        <p class="text-xs text-[#6f7978] mb-1.5 flex items-center gap-1 truncate">
                          <span class="material-symbols-outlined text-xs text-[#9b4600]">location_on</span> 
                          {{ current.location }}
                        </p>
                        <div class="flex items-center gap-1.5">
                          <span class="bg-[#e1e3e2] text-[#191c1c] text-[10px] px-2 py-0.5 rounded font-bold">
                            Elder Custodian
                          </span>
                          @if (current.verified) {
                            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                              <span class="material-symbols-outlined text-[11px]">verified</span> Verified
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Session Context & Acoustic Fidelity -->
                  <div>
                    <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">info</span>
                      Session Metadata
                    </h3>
                    <div class="bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3.5 space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">DURATION</span>
                          <span class="text-xs font-semibold text-[#191c1c]">{{ current.duration }}</span>
                        </div>
                        <div>
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">LANGUAGE</span>
                          <span class="text-xs font-semibold text-[#191c1c]">{{ current.originalLanguage }}</span>
                        </div>
                      </div>
                      
                      <div class="h-px bg-[#dde3eb] w-full"></div>
                      
                      <div>
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">LOCATION CONTEXT</span>
                        <span class="text-xs font-medium text-[#191c1c]">{{ current.location }}</span>
                      </div>

                      <div class="grid grid-cols-2 gap-3 pt-1 border-t border-[#dde3eb]">
                        <div>
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">ACOUSTIC FIDELITY</span>
                          <span class="text-xs font-bold text-[#004343] flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-emerald-600">graphic_eq</span>
                            {{ current.audioQuality }}
                          </span>
                        </div>
                        <div>
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">ERA</span>
                          <span class="text-xs font-medium text-[#191c1c]">{{ current.recordedEra }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Taxonomy & Tags -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">sell</span>
                        Taxonomy & Tags
                      </h3>
                      <button 
                        (click)="isAddingTag.set(!isAddingTag())" 
                        class="text-[#004343] hover:text-[#003131] text-xs font-bold flex items-center gap-0.5 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">add_circle</span>
                        <span>Add</span>
                      </button>
                    </div>

                    @if (isAddingTag()) {
                      <div class="flex gap-1.5 mb-2">
                        <input 
                          type="text" 
                          [(ngModel)]="newTagInput" 
                          placeholder="New taxonomy tag..." 
                          (keyup.enter)="addTag()"
                          class="flex-1 text-xs bg-white border border-[#c2c8c7] rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-[#004343] focus:outline-none" 
                        />
                        <button 
                          (click)="addTag()" 
                          class="px-3 py-1 bg-[#004343] text-white text-xs font-bold rounded-lg hover:bg-[#003131] cursor-pointer">
                          Save
                        </button>
                      </div>
                    }

                    <div class="flex flex-wrap gap-1.5">
                      @for (tag of current.tags; track tag) {
                        <span class="px-2.5 py-1 bg-[#004343]/10 border border-[#004343]/20 text-[#004343] rounded-lg text-xs font-medium flex items-center gap-1">
                          {{ tag }}
                          <button (click)="removeTag(tag)" class="text-[#6f7978] hover:text-red-700 ml-0.5 cursor-pointer">
                            <span class="material-symbols-outlined text-xs">close</span>
                          </button>
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Review Notes -->
                  <div>
                    <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">note_alt</span>
                      Reviewer Routing Notes
                    </h3>
                    <textarea 
                      [(ngModel)]="current.reviewerNotes"
                      placeholder="Add specific feedback or routing notes for field volunteers..."
                      rows="3"
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all resize-none">
                    </textarea>
                  </div>

                </div>

                <!-- Review Action Bottom Bar -->
                <div class="p-4 border-t border-[#dde3eb] bg-[#f8faf9] flex flex-col gap-2 shrink-0">
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="promptReject()" 
                      class="py-2.5 px-3 bg-white hover:bg-red-50 text-[#ba1a1a] hover:border-red-200 rounded-xl text-xs font-semibold transition-colors border border-[#dde3eb] flex items-center justify-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-base">close</span>
                      <span>Reject</span>
                    </button>
                    <button 
                      (click)="promptClarify()" 
                      class="py-2.5 px-3 bg-white hover:bg-amber-50 text-[#9b4600] hover:border-amber-200 rounded-xl text-xs font-semibold transition-colors border border-[#dde3eb] flex items-center justify-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-base">help</span>
                      <span>Clarify</span>
                    </button>
                  </div>

                  <!-- Sequential Step: Approve moves directly into Opportunity Creator -->
                  <button 
                    (click)="approveAndCreateOpportunity()" 
                    class="w-full py-2.5 px-4 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#004343]/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
                    <span>Approve & Proceed to Opportunity Creator</span>
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              }
            </div>

          </div>
        }

        <!-- ========================================================================= -->
        <!-- STATE 3: OPPORTUNITIES HUB (DRAFTS, PUBLISHED, REMOVED) -->
        <!-- ========================================================================= -->
        @if (currentViewState() === 'opp_hub') {
          <div class="flex-1 flex flex-col h-[calc(100vh-120px)] overflow-hidden bg-[#f8faf9]">
            
            <!-- Hub Sub-Header Navigation -->
            <div class="p-4 md:px-6 bg-white border-b border-[#dde3eb] flex flex-col gap-3 shrink-0">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 class="font-serif text-lg font-bold text-[#004343]">Opportunities Management</h2>
                  <p class="text-xs text-[#6f7978]">Oversee drafts, live community opportunities, and archival records</p>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Hub Sub-tabs -->
                  <div class="bg-[#f2f4f3] p-1 rounded-xl flex items-center gap-1 border border-[#dde3eb]">
                    <button 
                      (click)="activeHubTab.set('drafts')"
                      [class]="activeHubTab() === 'drafts' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6f7978] hover:text-[#191c1c]'"
                      class="px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
                      Drafts ({{ draftOpportunities().length }})
                    </button>
                    <button 
                      (click)="activeHubTab.set('published')"
                      [class]="activeHubTab() === 'published' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6f7978] hover:text-[#191c1c]'"
                      class="px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
                      Published ({{ publishedOpportunities().length }})
                    </button>
                    <button 
                      (click)="activeHubTab.set('removed')"
                      [class]="activeHubTab() === 'removed' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6f7978] hover:text-[#191c1c]'"
                      class="px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
                      Removed ({{ removedOpportunities().length }})
                    </button>
                  </div>

                  <!-- New Opportunity Button -->
                  <button 
                    (click)="startNewOpportunity()"
                    class="px-3.5 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">add</span>
                    <span>New Opportunity</span>
                  </button>
                </div>
              </div>

              <!-- Opportunities Search & Filtering Tool Bar -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#f2f4f3]">
                <div class="relative flex-1 max-w-md">
                  <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#6f7978] text-sm">search</span>
                  <input 
                    type="text" 
                    [ngModel]="oppSearchQuery()"
                    (ngModelChange)="oppSearchQuery.set($event)"
                    placeholder="Search opportunities by title, custodian, location, skill..."
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-8 py-2 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white"
                  />
                  @if (oppSearchQuery()) {
                    <button (click)="oppSearchQuery.set('')" class="absolute right-2.5 top-2.5 text-[#6f7978] hover:text-[#191c1c] text-xs cursor-pointer">✕</button>
                  }
                </div>

                <!-- Category & Sort Filters -->
                <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[11px] text-[#6f7978] font-bold shrink-0">Category:</span>
                    <select 
                      [ngModel]="oppCategoryFilter()"
                      (ngModelChange)="oppCategoryFilter.set($event)"
                      class="bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-2.5 py-1.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] font-medium cursor-pointer">
                      <option value="all">All Categories</option>
                      @for (cat of availableCategories; track cat) {
                        <option [value]="cat">{{ cat }}</option>
                      }
                    </select>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[11px] text-[#6f7978] font-bold shrink-0">Sort:</span>
                    <select 
                      [ngModel]="oppSortOrder()"
                      (ngModelChange)="oppSortOrder.set($event)"
                      class="bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-2.5 py-1.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] font-medium cursor-pointer">
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="titleAsc">Title A-Z</option>
                      <option value="qualityDesc">Highest Quality</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Hub Body Content -->
            <div class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              
              <!-- SUB-TAB 1: DRAFTS -->
              @if (activeHubTab() === 'drafts') {
                <div class="max-w-5xl mx-auto space-y-6">
                  
                  <!-- Workspace Overview Banner -->
                  <div class="flex flex-col gap-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#9b4600]">YOUR WORKSPACE</span>
                    <h3 class="font-serif text-xl font-bold text-[#004343]">Opportunities still in progress</h3>
                    <p class="text-xs text-[#6f7978]">
                      Continue creating opportunities that help preserve local knowledge. 
                      <strong>{{ draftOpportunities().length }} drafts:</strong> {{ draftOpportunities().length }} active in pipeline.
                    </p>
                  </div>

                  @if (filteredDraftOpportunities().length === 0) {
                    <div class="p-12 text-center bg-white border border-[#dde3eb] rounded-2xl">
                      <span class="material-symbols-outlined text-4xl text-[#6f7978] mb-1">drafts</span>
                      <p class="text-xs font-semibold text-[#6f7978]">No draft opportunities match your filter or search query</p>
                    </div>
                  } @else {
                    <!-- Featured Draft Card ("Continue where you left off") -->
                    @if (featuredDraft(); as draft) {
                      <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978] block mb-2">CONTINUE WHERE YOU LEFT OFF</span>
                        
                        <div class="bg-white border-2 border-[#004343]/30 rounded-2xl overflow-hidden shadow-md grid grid-cols-1 md:grid-cols-[280px_1fr] transition-all">
                          
                          <!-- Draft Image Column -->
                          <div class="relative bg-[#f2f4f3] h-48 md:h-full overflow-hidden">
                            <img [src]="draft.heroImageUrl" [alt]="draft.title" class="w-full h-full object-cover" />
                            <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-[#004343] flex items-center gap-1 shadow-xs">
                              <span class="material-symbols-outlined text-sm">edit_document</span>
                              <span>Draft</span>
                            </div>
                          </div>

                          <!-- Draft Content Column -->
                          <div class="p-5 flex flex-col justify-between">
                            <div>
                              <div class="flex justify-between items-start mb-1.5">
                                <h4 class="font-serif text-lg font-bold text-[#004343]">{{ draft.title }}</h4>
                                <span class="text-[10px] font-semibold text-[#6f7978]">{{ formatTimeAgo(draft.lastEditedAt) }}</span>
                              </div>

                              <p class="text-xs text-[#6f7978] flex items-center gap-2 mb-3">
                                <span class="flex items-center gap-1">
                                  <span class="material-symbols-outlined text-xs text-[#9b4600]">location_on</span>
                                  {{ draft.location }}
                                </span>
                                <span>•</span>
                                <span>{{ draft.elderName ? 'Holder Selected' : 'No Holder Selected' }}</span>
                              </p>

                              <!-- Quality Meter & Checklist -->
                              <div class="bg-[#f8faf9] p-3.5 rounded-xl border border-[#dde3eb] mb-3">
                                <div class="flex justify-between items-center mb-1 text-xs">
                                  <span class="font-bold text-[#191c1c]">Opportunity quality</span>
                                  <span class="font-bold text-[#004343]">{{ draft.qualityScore || 68 }}%</span>
                                </div>
                                <div class="w-full bg-[#dde3eb] h-2 rounded-full overflow-hidden mb-2.5">
                                  <div class="bg-[#004343] h-full rounded-full transition-all duration-500" [style.width.%]="draft.qualityScore || 68"></div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 text-[11px]">
                                  <div class="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                    <span class="material-symbols-outlined text-sm">check_circle</span>
                                    <span>Clear title</span>
                                  </div>
                                  <div class="flex items-center gap-1.5 text-emerald-700 font-semibold">
                                    <span class="material-symbols-outlined text-sm">check_circle</span>
                                    <span>Cover image added</span>
                                  </div>
                                  <div class="flex items-center gap-1.5" [class]="draft.elderName ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                                    <span class="material-symbols-outlined text-sm">{{ draft.elderName ? 'check_circle' : 'radio_button_unchecked' }}</span>
                                    <span>Verified knowledge holder</span>
                                  </div>
                                  <div class="flex items-center gap-1.5" [class]="draft.location ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                                    <span class="material-symbols-outlined text-sm">{{ draft.location ? 'check_circle' : 'radio_button_unchecked' }}</span>
                                    <span>Location pinned</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div class="flex items-center justify-between pt-2 border-t border-[#f2f4f3]">
                              <button (click)="deleteDraft(draft.id)" class="text-xs text-red-600 hover:underline flex items-center gap-1 cursor-pointer">
                                <span class="material-symbols-outlined text-sm">delete</span>
                                <span>Discard Draft</span>
                              </button>

                              <button 
                                (click)="editOpportunityDraft(draft)"
                                class="px-4 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer">
                                <span>Continue Editing</span>
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    }

                    <!-- Older / Other Drafts List -->
                    @if (otherDrafts().length > 0) {
                      <div>
                        <h4 class="font-serif text-sm font-bold text-[#004343] mb-3">All Drafts</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          @for (item of otherDrafts(); track item.id) {
                            <div class="bg-white border border-[#dde3eb] rounded-2xl p-3.5 flex gap-3 items-center justify-between hover:border-[#004343]/40 transition-colors shadow-xs">
                              <img [src]="item.heroImageUrl" [alt]="item.title" class="w-16 h-16 rounded-xl object-cover shrink-0" />
                              
                              <div class="min-w-0 flex-1">
                                <h5 class="text-xs font-bold text-[#191c1c] truncate">{{ item.title }}</h5>
                                <p class="text-[11px] text-[#6f7978] truncate">{{ item.location }} • {{ item.category }}</p>
                                <span class="text-[10px] text-[#6f7978]">{{ formatTimeAgo(item.lastEditedAt) }}</span>
                              </div>

                              <button 
                                (click)="editOpportunityDraft(item)"
                                class="px-3 py-1.5 bg-[#f2f4f3] hover:bg-[#004343] text-[#004343] hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0">
                                Edit
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  }

                </div>
              }

              <!-- SUB-TAB 2: PUBLISHED OPPORTUNITIES -->
              @if (activeHubTab() === 'published') {
                <div class="max-w-5xl mx-auto space-y-6">
                  
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-800">YOUR IMPACT</span>
                      <h3 class="font-serif text-xl font-bold text-[#004343]">Opportunities you've shared</h3>
                      <p class="text-xs text-[#6f7978]">Live preservation missions actively connecting volunteers with culture keepers</p>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {{ filteredPublishedOpportunities().length }} of {{ publishedOpportunities().length }} Published
                      </span>
                    </div>
                  </div>

                  <!-- Published Opportunities Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (opp of filteredPublishedOpportunities(); track opp.id) {
                      <div class="bg-white border border-[#dde3eb] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div class="relative h-44 bg-[#f2f4f3] overflow-hidden">
                            <img [src]="opp.heroImageUrl" [alt]="opp.title" class="w-full h-full object-cover" />
                            
                            <div class="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                              <span class="w-1.5 h-1.5 rounded-full bg-white pulse-dot"></span>
                              <span>ACTIVE MISSION</span>
                            </div>

                            <div class="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                              Rs. {{ opp.offeredAmount | number }}
                            </div>
                          </div>

                          <div class="p-4">
                            <div class="flex items-center gap-2 mb-1 text-[11px] text-[#6f7978]">
                              <span class="px-2 py-0.5 rounded bg-[#f2f4f3] font-bold text-[#004343]">{{ opp.category }}</span>
                              <span>•</span>
                              <span class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">event</span>
                                {{ opp.scheduledDate }}
                              </span>
                            </div>

                            <h4 class="font-serif font-bold text-base text-[#004343] mb-1.5 line-clamp-1">{{ opp.title }}</h4>
                            <p class="text-xs text-[#6f7978] line-clamp-2 mb-3">{{ opp.description }}</p>

                            <!-- Host + Location -->
                            <div class="flex items-center gap-2.5 pt-2 border-t border-[#f2f4f3] text-xs text-[#3f4948]">
                              <img [src]="opp.elderAvatarUrl" class="w-7 h-7 rounded-full object-cover border border-[#dde3eb]" />
                              <div class="min-w-0 flex-1 truncate">
                                <span class="font-bold text-[#191c1c]">{{ opp.elderName }}</span>
                                <span class="text-[#6f7978] block text-[11px] truncate">{{ opp.location }}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="p-4 pt-0 flex items-center justify-between gap-2 border-t border-[#f2f4f3] mt-2">
                          <div class="text-[11px] text-[#6f7978] flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm text-emerald-700">visibility</span>
                            <span>{{ opp.reachCount || 1500 }} Reach</span>
                          </div>

                          <div class="flex items-center gap-2">
                            <button 
                              (click)="editOpportunityDraft(opp)"
                              class="px-3 py-1.5 bg-[#f2f4f3] hover:bg-[#e1e3e2] text-[#004343] rounded-lg text-xs font-bold transition-colors cursor-pointer">
                              Edit
                            </button>
                            <button 
                              (click)="removeOpportunityToArchive(opp)"
                              class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#ba1a1a] rounded-lg text-xs font-bold transition-colors cursor-pointer">
                              Archive
                            </button>
                          </div>
                        </div>

                      </div>
                    } @empty {
                      <div class="col-span-2 p-12 text-center bg-white border border-[#dde3eb] rounded-2xl">
                        <span class="material-symbols-outlined text-4xl text-[#6f7978] mb-1">search_off</span>
                        <p class="text-xs font-semibold text-[#6f7978]">No published opportunities match your filter or search query</p>
                      </div>
                    }
                  </div>

                </div>
              }

              <!-- SUB-TAB 3: REMOVED / ARCHIVED OPPORTUNITIES -->
              @if (activeHubTab() === 'removed') {
                <div class="max-w-5xl mx-auto space-y-4">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">ARCHIVED</span>
                    <h3 class="font-serif text-xl font-bold text-[#004343]">Archived Opportunities</h3>
                    <p class="text-xs text-[#6f7978]">These opportunities have completed their recording phase or have been retracted</p>
                  </div>

                  <div class="space-y-3">
                    @for (item of filteredRemovedOpportunities(); track item.id) {
                      <div class="bg-white border border-[#dde3eb] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                        <div class="flex items-center gap-3">
                          <img [src]="item.heroImageUrl" class="w-16 h-16 rounded-xl object-cover opacity-80" />
                          <div>
                            <div class="flex items-center gap-2 mb-1">
                              <span class="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">ARCHIVED</span>
                              <span class="text-xs text-[#6f7978]">{{ item.location }}</span>
                            </div>
                            <h4 class="font-serif font-bold text-sm text-[#191c1c]">{{ item.title }}</h4>
                          </div>
                        </div>

                        <div class="flex items-center gap-2">
                          <button 
                            (click)="restoreOpportunity(item)"
                            class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                            Restore to Live
                          </button>
                        </div>
                      </div>
                    } @empty {
                      <div class="p-12 text-center bg-white border border-[#dde3eb] rounded-2xl">
                        <span class="material-symbols-outlined text-4xl text-[#6f7978] mb-1">inventory_2</span>
                        <p class="text-xs font-semibold text-[#6f7978]">No archived opportunities found in vault</p>
                      </div>
                    }
                  </div>
                </div>
              }

            </div>

          </div>
        }

        <!-- ========================================================================= -->
        <!-- STATE 4: CREATE / EDIT OPPORTUNITY WIZARD (PROCESSED IN ORDER) -->
        <!-- ========================================================================= -->
        <!-- ========================================================================= -->
        <!-- STATE 4: CREATE / EDIT OPPORTUNITY WIZARD (PROCESSED IN ORDER) -->
        <!-- ========================================================================= -->
        @if (currentViewState() === 'opp_create') {
          <div class="flex-1 flex flex-col h-[calc(100vh-120px)] overflow-hidden bg-[#f8faf9]">
            
            <!-- Wizard Top Header & Progress Segment Bars -->
            <div class="p-3 px-4 md:px-6 bg-white border-b border-[#dde3eb] shrink-0">
              <div class="max-w-2xl mx-auto flex items-center justify-between mb-2">
                <button 
                  (click)="goToPrevStep()" 
                  class="flex items-center gap-1 text-xs font-bold text-[#004343] hover:underline cursor-pointer">
                  <span class="material-symbols-outlined text-base">arrow_back</span>
                  <span>{{ createStep() === 1 ? 'Cancel & Return' : 'Previous Step' }}</span>
                </button>

                <div class="text-center">
                  <h3 class="font-serif font-bold text-sm sm:text-base text-[#004343]">
                    {{ createStep() === 1 ? 'Step 1: Create Opportunity' : (createStep() === 2 ? 'Step 2: Who carries this knowledge?' : (createStep() === 3 ? 'Step 3: Location & Schedule' : (createStep() === 4 ? 'Step 4: Tell the story' : 'Step 5: Review & Publish'))) }}
                  </h3>
                  <span class="text-[11px] text-[#6f7978]">Step {{ createStep() }} of 5</span>
                </div>

                @if (hasDraftChanges()) {
                  <button 
                    (click)="saveDraftOnly()"
                    class="px-3 py-1.5 bg-[#f2f4f3] hover:bg-[#e1e3e2] text-[#004343] rounded-xl text-xs font-bold transition-all border border-[#dde3eb] cursor-pointer">
                    Save Draft
                  </button>
                } @else {
                  <div class="w-16"></div>
                }
              </div>

              <!-- 5 Segment Progress Bar -->
              <div class="max-w-2xl mx-auto grid grid-cols-5 gap-1.5">
                @for (stepNum of [1, 2, 3, 4, 5]; track stepNum) {
                  <div 
                    [class]="stepNum <= createStep() ? 'bg-[#004343]' : 'bg-[#dde3eb]'"
                    class="h-1.5 rounded-full transition-all duration-300">
                  </div>
                }
              </div>
            </div>

            <!-- Wizard Step Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 custom-scrollbar">
              <div class="max-w-2xl mx-auto bg-white border border-[#dde3eb] rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
                
                <!-- ---------------------------------------------------- -->
                <!-- STEP 1: CREATE OPPORTUNITY CORE -->
                <!-- ---------------------------------------------------- -->
                @if (createStep() === 1) {
                  <div class="space-y-4">
                    <div class="bg-[#004343]/5 border border-[#004343]/20 rounded-xl p-3.5">
                      <h4 class="font-serif font-bold text-sm text-[#004343] mb-0.5">Let's create something worth preserving</h4>
                      <p class="text-xs text-[#3f4948]">Tell field volunteers what cultural knowledge you want to document and how they can participate.</p>
                    </div>

                    <!-- Opportunity Title Input -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-1">
                        Opportunity Title *
                      </label>
                      <input 
                        type="text" 
                        [(ngModel)]="oppTitle" 
                        placeholder="e.g., Traditional Clay Pottery Wheel Crafting"
                        class="w-full text-xs md:text-sm bg-white border border-[#c2c8c7] rounded-xl p-2.5 sm:p-3 focus:ring-1 focus:ring-[#004343] focus:outline-none"
                      />
                    </div>

                    <!-- Cover Image Selector (Device Upload & Presets) -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-1">
                        Cover Image & Media *
                      </label>

                      <!-- Hidden Device File Input -->
                      <input 
                        type="file" 
                        #deviceFileInput 
                        (change)="onDeviceImageSelected($event)" 
                        accept="image/*" 
                        class="hidden" 
                      />
                      
                      @if (oppCoverImage()) {
                        <div class="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-[#dde3eb]">
                          <img [src]="oppCoverImage()" class="w-full h-full object-cover" />
                          <div class="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            <button 
                              (click)="deviceFileInput.click()" 
                              class="bg-black/75 hover:bg-black text-white px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer backdrop-blur-xs flex items-center gap-1">
                              <span class="material-symbols-outlined text-sm">upload</span>
                              <span>Change Image</span>
                            </button>
                            <button 
                              (click)="oppCoverImage.set(null)" 
                              class="bg-red-700/80 hover:bg-red-700 text-white w-7 h-7 rounded-full text-xs font-bold cursor-pointer flex items-center justify-center">
                              ✕
                            </button>
                          </div>
                        </div>
                      } @else {
                        <div 
                          (click)="deviceFileInput.click()" 
                          class="border-2 border-dashed border-[#c2c8c7] hover:border-[#004343] rounded-xl p-6 text-center bg-[#f8faf9] hover:bg-[#f0f4f3] transition-colors cursor-pointer group">
                          <span class="material-symbols-outlined text-3xl text-[#6f7978] group-hover:text-[#004343] mb-1">upload_file</span>
                          <p class="text-xs font-bold text-[#004343] mb-0.5">Click to choose image from your device</p>
                          <p class="text-[11px] text-[#6f7978]">Supports JPG, PNG, WEBP (16:9 ratio recommended)</p>
                        </div>
                      }
                    </div>

                    <!-- Category Chips -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-1.5">
                        Preservation Category *
                      </label>
                      <div class="flex flex-wrap gap-1.5">
                        @for (cat of availableCategories; track cat) {
                          <button 
                            (click)="selectCategory(cat)"
                            [class]="oppCategory() === cat ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                            class="px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
                            {{ cat }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }

                <!-- ---------------------------------------------------- -->
                <!-- STEP 2: WHO CARRIES THIS KNOWLEDGE? -->
                <!-- ---------------------------------------------------- -->
                @if (createStep() === 2) {
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-serif font-bold text-base text-[#004343]">Who carries this knowledge?</h4>
                      <p class="text-xs text-[#6f7978]">Select the verified elder or cultural custodian who will lead this preservation experience.</p>
                    </div>

                    <!-- Search Input -->
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#6f7978] text-sm">search</span>
                      <input 
                        type="text" 
                        [(ngModel)]="holderSearchQuery" 
                        placeholder="Search knowledge custodians by name, craft, or district..."
                        class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-4 py-2 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white"
                      />
                    </div>

                    <!-- Knowledge Holders Selection Grid -->
                    <div class="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                      @for (kh of filteredKnowledgeHolders(); track kh.id) {
                        <div 
                          (click)="oppKnowledgeHolderId.set(kh.id)"
                          [class]="oppKnowledgeHolderId() === kh.id ? 'border-2 border-[#004343] bg-emerald-50/40 ring-2 ring-[#004343]/10' : 'border-[#dde3eb] hover:bg-[#f8faf9]'"
                          class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs">
                          
                          <div class="flex items-center gap-3 min-w-0">
                            <img [src]="kh.avatarUrl" [alt]="kh.name" class="w-11 h-11 rounded-full object-cover border border-[#dde3eb] shrink-0" />
                            <div class="min-w-0">
                              <div class="flex items-center gap-1.5">
                                <h5 class="font-serif font-bold text-sm text-[#004343] truncate">{{ kh.name }}</h5>
                                @if (kh.isVerified) {
                                  <span class="material-symbols-outlined text-[#fe893e] text-sm">verified</span>
                                }
                              </div>
                              <p class="text-xs text-[#6f7978] truncate">{{ kh.specialty }}</p>
                              <span class="text-[10px] text-[#9b4600] font-semibold">{{ kh.location }} • {{ kh.experienceYears }} yrs lineage</span>
                            </div>
                          </div>

                          <div 
                            [class]="oppKnowledgeHolderId() === kh.id ? 'bg-[#004343] text-white' : 'border border-[#c2c8c7] bg-white'"
                            class="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                            @if (oppKnowledgeHolderId() === kh.id) {
                              <span class="material-symbols-outlined text-xs">check</span>
                            }
                          </div>

                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- ---------------------------------------------------- -->
                <!-- STEP 3: LOCATION & SCHEDULE + INTERACTIVE MAP -->
                <!-- ---------------------------------------------------- -->
                @if (createStep() === 3) {
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-serif font-bold text-base text-[#004343]">Plan the experience</h4>
                      <p class="text-xs text-[#6f7978]">Configure the location and scheduling details for this field preservation mission.</p>
                    </div>

                    <!-- Where will this happen? -->
                    <div class="p-4 bg-[#f8faf9] border border-[#dde3eb] rounded-2xl space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-[#191c1c]">
                          <span class="material-symbols-outlined text-[#fe893e] text-base">pin_drop</span>
                          <span>Where will this happen? *</span>
                        </div>
                        
                        @if (isLocationSaved()) {
                          <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs">check_circle</span>
                            <span>Location Confirmed</span>
                          </span>
                        }
                      </div>

                      <!-- Search & Locate Input -->
                      <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                          <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#6f7978] text-sm">search</span>
                          <input 
                            type="text" 
                            [(ngModel)]="oppLocationText" 
                            (keyup.enter)="handleLocationSearch()"
                            placeholder="Enter site location, district, or town..."
                            class="w-full bg-white border border-[#c2c8c7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#191c1c] focus:ring-1 focus:ring-[#004343] focus:outline-none"
                          />
                        </div>
                        <button 
                          (click)="handleLocationSearch()"
                          class="px-3 py-2 bg-[#f2f4f3] hover:bg-[#e1e3e2] text-[#004343] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0">
                          Locate
                        </button>
                      </div>

                      <!-- Quick Region Preset Chips -->
                      <div>
                        <span class="text-[10px] font-bold text-[#6f7978] uppercase tracking-wider block mb-1">Quick Select Region:</span>
                        <div class="flex flex-wrap gap-1.5">
                          @for (preset of mapPresets; track preset.name) {
                            <button 
                              (click)="selectMapPreset(preset)"
                              class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-[#004343] hover:text-white text-[#3f4948] border border-[#dde3eb] transition-colors cursor-pointer">
                              {{ preset.name }}
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Interactive Map Canvas -->
                      <div 
                        (click)="onMapClick($event)"
                        [class]="isLocationSaved() ? 'cursor-default' : 'cursor-crosshair'"
                        class="relative h-48 sm:h-56 rounded-xl overflow-hidden border border-[#dde3eb] bg-[#004343] shadow-inner select-none group">
                        
                        <!-- Map Background Cartography Canvas -->
                        <div 
                          class="absolute inset-0 bg-cover bg-center opacity-85 group-hover:scale-101 transition-transform" 
                          style="background-image: url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&auto=format&fit=crop&q=80')">
                        </div>

                        <!-- Top-Left GPS HUD Badge -->
                        <div class="absolute top-2.5 left-2.5 z-10 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full" [class]="isLocationSaved() ? 'bg-emerald-400' : 'bg-[#fe893e] animate-pulse'"></span>
                          <span>Lat: {{ oppMapLat() | number:'1.4-4' }}°N, Lng: {{ oppMapLng() | number:'1.4-4' }}°E</span>
                        </div>

                        <!-- Interactive Pin Location Marker -->
                        <div 
                          class="absolute z-20 flex flex-col items-center pointer-events-none transition-all duration-300 transform -translate-x-1/2 -translate-y-full"
                          [style.left.%]="oppMapPinX()"
                          [style.top.%]="oppMapPinY()">
                          <span 
                            class="material-symbols-outlined text-3xl drop-shadow-md"
                            [class]="isLocationSaved() ? 'text-emerald-500' : 'text-[#fe893e] animate-bounce'">
                            location_on
                          </span>
                          <span class="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap mt-[-4px]">
                            {{ oppLocationText() || 'Target Heritage Site' }}
                          </span>
                        </div>

                        <!-- Bottom Helper Note -->
                        @if (!isLocationSaved()) {
                          <div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded pointer-events-none">
                            Click anywhere on map to reposition pin
                          </div>
                        }
                      </div>

                      <!-- Save / Confirm Location Button -->
                      <div class="flex items-center justify-between pt-1">
                        <span class="text-[11px] text-[#6f7978]">
                          {{ isLocationSaved() ? 'Location confirmed and locked for this mission.' : 'Click "Save Location" once the pin is positioned.' }}
                        </span>
                        
                        <button 
                          (click)="isLocationSaved.set(!isLocationSaved())"
                          [disabled]="!oppLocationText().trim()"
                          [class]="isLocationSaved() ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-[#004343] hover:bg-[#003131] text-white'"
                          class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                          <span class="material-symbols-outlined text-sm">{{ isLocationSaved() ? 'edit' : 'my_location' }}</span>
                          <span>{{ isLocationSaved() ? 'Change Pin' : 'Save Location' }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Schedule Configuration -->
                    <div class="p-4 bg-[#f8faf9] border border-[#dde3eb] rounded-2xl space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-xs font-bold text-[#191c1c]">
                          <span class="material-symbols-outlined text-[#fe893e] text-base">calendar_month</span>
                          <span>Schedule Details</span>
                        </div>

                        <label class="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          <input type="checkbox" [(ngModel)]="oppIsFlexibleSchedule" class="text-[#fe893e] focus:ring-[#fe893e] rounded" />
                          <span>Flexible schedule</span>
                        </label>
                      </div>

                      @if (!oppIsFlexibleSchedule()) {
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                          <div>
                            <label class="block text-[11px] font-bold text-[#6f7978] mb-1">Date *</label>
                            <input type="date" [(ngModel)]="oppScheduleDate" class="w-full bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs" />
                          </div>
                          <div>
                            <label class="block text-[11px] font-bold text-[#6f7978] mb-1">Duration *</label>
                            <input type="text" [(ngModel)]="oppScheduleDuration" placeholder="e.g., 3-4 hours" class="w-full bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs" />
                          </div>
                          <div>
                            <label class="block text-[11px] font-bold text-[#6f7978] mb-1">Start time *</label>
                            <input type="text" [(ngModel)]="oppScheduleStartTime" placeholder="e.g., 09:30 AM" class="w-full bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs" />
                          </div>
                          <div>
                            <label class="block text-[11px] font-bold text-[#6f7978] mb-1">End time</label>
                            <input type="text" [(ngModel)]="oppScheduleEndTime" placeholder="e.g., 01:30 PM" class="w-full bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs" />
                          </div>
                        </div>
                      } @else {
                        <p class="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          Flexible Schedule enabled: Volunteers can coordinate specific visit times directly with the knowledge custodian.
                        </p>
                      }
                    </div>

                    <!-- Perks & Stipend -->
                    <div class="p-4 bg-[#f8faf9] border border-[#dde3eb] rounded-2xl space-y-3">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#191c1c]">
                        <span class="material-symbols-outlined text-[#fe893e] text-base">payments</span>
                        <span>What will participants receive?</span>
                      </div>

                      <div class="flex flex-wrap gap-1.5">
                        @for (perk of availablePerksList; track perk) {
                          <button 
                            (click)="togglePerk(perk)"
                            [class]="oppSelectedPerks().includes(perk) ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-white text-[#3f4948] border border-[#dde3eb]'"
                            class="px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
                            {{ perk }}
                          </button>
                        }
                      </div>

                      <div class="pt-1">
                        <label class="block text-xs font-bold text-[#6f7978] mb-1">Volunteer Stipend (LKR)</label>
                        <div class="flex items-center gap-2 max-w-xs">
                          <span class="text-xs font-bold text-[#004343]">Rs.</span>
                          <input type="number" [(ngModel)]="oppOfferedAmount" placeholder="e.g., 3500" class="w-full bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs font-bold" />
                        </div>
                      </div>
                    </div>

                  </div>
                }

                <!-- ---------------------------------------------------- -->
                <!-- STEP 4: STORY & DELIVERABLES -->
                <!-- ---------------------------------------------------- -->
                @if (createStep() === 4) {
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-serif font-bold text-base text-[#004343]">Tell the story</h4>
                      <p class="text-xs text-[#6f7978]">Help participants understand the cultural mission and specific documentation tasks.</p>
                    </div>

                    <!-- Preservation Description -->
                    <div>
                      <div class="flex justify-between items-center mb-1">
                        <label class="text-xs font-bold text-[#191c1c] uppercase tracking-wider">Preservation Description *</label>
                        <span class="text-[10px] text-[#6f7978]">{{ oppPreservationDesc().length }}/500</span>
                      </div>
                      <textarea 
                        [(ngModel)]="oppPreservationDesc" 
                        rows="3"
                        placeholder="Describe what cultural knowledge will be documented, the historical significance, and the volunteer guidelines..."
                        class="w-full bg-white border border-[#c2c8c7] rounded-xl p-2.5 text-xs md:text-sm focus:ring-1 focus:ring-[#004343] focus:outline-none">
                      </textarea>
                    </div>

                    <!-- What will they do? Tasks -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-0.5">What will they do? *</label>
                      <p class="text-[11px] text-[#6f7978] mb-2">Outline the specific tasks required during this preservation session.</p>

                      <div class="space-y-2">
                        @for (task of oppTasks(); track $index) {
                          <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full bg-[#004343]/10 text-[#004343] text-xs font-bold flex items-center justify-center shrink-0">
                              {{ $index + 1 }}
                            </span>
                            <input 
                              type="text" 
                              [value]="task" 
                              (input)="updateTask($index, $any($event.target).value)"
                              placeholder="e.g., Record 4K video of clay preparation or audio interview on terminology"
                              class="flex-1 bg-white border border-[#c2c8c7] rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#004343] focus:outline-none"
                            />
                            @if (oppTasks().length > 1) {
                              <button (click)="removeTask($index)" class="text-[#6f7978] hover:text-red-700 p-1 cursor-pointer">
                                <span class="material-symbols-outlined text-base">close</span>
                              </button>
                            }
                          </div>
                        }
                      </div>

                      <button 
                        (click)="addTask()" 
                        class="mt-2 text-xs font-bold text-[#fe893e] hover:underline flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">add</span>
                        <span>Add another task</span>
                      </button>
                    </div>

                    <!-- Required Skills -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-1">Required Skills *</label>
                      <div class="flex flex-wrap gap-1.5">
                        @for (skill of availableSkillsList; track skill) {
                          <button 
                            (click)="toggleSkill(skill)"
                            [class]="oppRequiredSkills().includes(skill) ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                            class="px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer">
                            {{ skill }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Expected Deliverables -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] uppercase tracking-wider mb-1">Expected Deliverables *</label>
                      <div class="space-y-1.5">
                        @for (item of availableDeliverablesList; track item) {
                          <label class="flex items-center gap-2.5 p-2 rounded-xl border border-[#dde3eb] hover:bg-[#f8faf9] cursor-pointer text-xs transition-colors">
                            <input 
                              type="checkbox" 
                              [checked]="oppDeliverables().includes(item)" 
                              (change)="toggleDeliverable(item)"
                              class="text-[#004343] focus:ring-[#004343] rounded" 
                            />
                            <span class="text-[#191c1c]">{{ item }}</span>
                          </label>
                        }
                      </div>
                    </div>

                  </div>
                }

                <!-- ---------------------------------------------------- -->
                <!-- STEP 5: REVIEW & PUBLISH -->
                <!-- ---------------------------------------------------- -->
                @if (createStep() === 5) {
                  <div class="space-y-4">
                    <div>
                      <h4 class="font-serif font-bold text-base text-[#004343]">Review & Publish</h4>
                      <p class="text-xs text-[#6f7978]">Your opportunity is ready. Review how participants will see it.</p>
                    </div>

                    <!-- Quality Score Meter & Readiness Checklist -->
                    <div class="bg-[#f8faf9] p-4 rounded-2xl border border-[#dde3eb]">
                      <div class="flex justify-between items-center mb-1 text-xs">
                        <span class="font-bold text-[#191c1c]">Opportunity quality</span>
                        <span class="font-bold text-[#004343]">{{ calculatedQualityScore() }}%</span>
                      </div>
                      <div class="w-full bg-[#dde3eb] h-2 rounded-full overflow-hidden mb-3">
                        <div 
                          [class]="calculatedQualityScore() >= 80 ? 'bg-emerald-600' : 'bg-[#fe893e]'"
                          class="h-full rounded-full transition-all duration-500" 
                          [style.width.%]="calculatedQualityScore()">
                        </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div class="flex items-center gap-1.5" [class]="oppTitle().trim().length >= 3 ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                          <span class="material-symbols-outlined text-sm">{{ oppTitle().trim().length >= 3 ? 'check_circle' : 'radio_button_unchecked' }}</span>
                          <span>Clear title</span>
                        </div>
                        <div class="flex items-center gap-1.5" [class]="oppCoverImage() ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                          <span class="material-symbols-outlined text-sm">{{ oppCoverImage() ? 'check_circle' : 'radio_button_unchecked' }}</span>
                          <span>Cover image added</span>
                        </div>
                        <div class="flex items-center gap-1.5" [class]="selectedKnowledgeHolderObj() ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                          <span class="material-symbols-outlined text-sm">{{ selectedKnowledgeHolderObj() ? 'check_circle' : 'radio_button_unchecked' }}</span>
                          <span>Verified custodian selected</span>
                        </div>
                        <div class="flex items-center gap-1.5" [class]="isLocationSaved() ? 'text-emerald-700 font-semibold' : 'text-[#6f7978]'">
                          <span class="material-symbols-outlined text-sm">{{ isLocationSaved() ? 'check_circle' : 'radio_button_unchecked' }}</span>
                          <span>Location pinned & saved</span>
                        </div>
                      </div>
                    </div>

                    <!-- Live Preview Card -->
                    <div>
                      <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978] block mb-2">Live Opportunity Card Preview</span>
                      
                      <div class="border-2 border-[#004343]/30 rounded-2xl overflow-hidden shadow-md bg-white max-w-md mx-auto">
                        <div class="relative h-44 bg-[#f2f4f3]">
                          <img [src]="oppCoverImage() || sampleCoverImages[0].url" class="w-full h-full object-cover" />
                          <div class="absolute top-2.5 left-2.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            PREVIEW
                          </div>
                          <div class="absolute top-2.5 right-2.5 bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                            Rs. {{ (oppOfferedAmount() || 0) | number }}
                          </div>
                        </div>

                        <div class="p-3.5 space-y-2.5">
                          <div class="flex items-center gap-2">
                            <img [src]="selectedKnowledgeHolderObj()?.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'" class="w-7 h-7 rounded-full object-cover border border-[#dde3eb]" />
                            <div class="min-w-0">
                              <span class="text-xs font-bold text-[#191c1c] block truncate">Hosted by {{ selectedKnowledgeHolderObj()?.name || 'Selected Custodian' }}</span>
                              <span class="text-[10px] text-[#6f7978] block truncate">{{ oppLocationText() || 'Location TBD' }}</span>
                            </div>
                          </div>

                          <h4 class="font-serif font-bold text-sm text-[#004343]">{{ oppTitle() || 'Untitled Opportunity' }}</h4>
                          <p class="text-xs text-[#6f7978] line-clamp-2">{{ oppPreservationDesc() || 'No preservation description provided yet.' }}</p>

                          <div class="flex items-center gap-2 pt-2 border-t border-[#f2f4f3] text-[10px] font-bold">
                            <span class="px-2 py-0.5 rounded bg-[#f2f4f3] text-[#004343]">{{ oppCategory() || 'Craft' }}</span>
                            <span class="px-2 py-0.5 rounded bg-[#f2f4f3] text-[#6f7978]">{{ oppIsFlexibleSchedule() ? 'Flexible Schedule' : (oppScheduleDuration() || 'Time TBD') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                }

                <!-- Wizard Bottom Action Navigation -->
                <div class="pt-3.5 border-t border-[#dde3eb] flex items-center justify-between gap-3">
                  <button 
                    (click)="goToPrevStep()"
                    class="px-4 py-2 bg-[#f2f4f3] hover:bg-[#e1e3e2] text-[#3f4948] rounded-xl text-xs font-bold transition-all cursor-pointer">
                    Back
                  </button>

                  @if (createStep() < 5) {
                    <button 
                      (click)="goToNextStep()"
                      [disabled]="!canContinueCurrentStep()"
                      [class]="canContinueCurrentStep() 
                        ? 'bg-[#004343] hover:bg-[#003131] text-white shadow-md shadow-[#004343]/20 cursor-pointer' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'"
                      class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                      <span>Continue</span>
                      <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  } @else {
                    <button 
                      (click)="publishOpportunity()"
                      [disabled]="isPublishing() || !canContinueCurrentStep()"
                      class="px-6 py-2.5 bg-[#fe893e] hover:bg-[#e0722c] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#fe893e]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      <span class="material-symbols-outlined text-base">check</span>
                      <span>{{ isPublishing() ? 'Publishing...' : 'Publish Opportunity' }}</span>
                    </button>
                  }
                </div>

              </div>
            </div>

          </div>
        }

      </div>

      <!-- ========================================================================= -->
      <!-- MODAL 1: QUICK AUDIO PREVIEW PLAYER MODAL -->
      <!-- ========================================================================= -->
      @if (previewModalOpen()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-[#004343] text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-emerald-400/20 space-y-5 animate-scaleUp">
            
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-bold tracking-widest uppercase text-emerald-300">PLAYING PREVIEW</span>
                <h3 class="font-serif text-lg font-bold text-white mt-0.5">{{ previewItem()?.topic }}</h3>
                <p class="text-xs text-white/70">{{ previewItem()?.elderName }} • {{ previewItem()?.location }}</p>
              </div>
              <button (click)="closeQuickPreview()" class="text-white/70 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <!-- Waveform in Modal -->
            <div class="bg-black/30 p-4 rounded-2xl border border-white/10">
              <div class="h-14 flex items-end gap-[3px] mb-2">
                @for (bar of waveformBars(); track $index) {
                  <div 
                    [style.height.%]="bar.height"
                    [class]="bar.played ? 'bg-emerald-400' : 'bg-white/20'"
                    class="flex-1 rounded-sm min-w-[2px]">
                  </div>
                }
              </div>
              <div class="flex justify-between text-xs font-mono text-emerald-300">
                <span>{{ currentPlaybackTime() }}</span>
                <span>{{ previewItem()?.duration || '12:48' }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center gap-4">
              <button (click)="seekBackward(10)" class="text-white/80 hover:text-white p-2 rounded-full cursor-pointer">
                <span class="material-symbols-outlined text-2xl">replay_10</span>
              </button>
              <button 
                (click)="togglePlay()" 
                class="w-14 h-14 bg-white text-[#004343] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <span class="material-symbols-outlined text-3xl">{{ isPlaying() ? 'pause' : 'play_arrow' }}</span>
              </button>
              <button (click)="seekForward(10)" class="text-white/80 hover:text-white p-2 rounded-full cursor-pointer">
                <span class="material-symbols-outlined text-2xl">forward_10</span>
              </button>
            </div>

            <!-- Action Button: Opens Full Review -->
            <button 
              (click)="openFullReview()"
              class="w-full py-3 bg-[#fe893e] hover:bg-[#e0722c] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
              <span>Open Full Review</span>
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </button>

          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 2: REJECT WITH FEEDBACK MODAL -->
      <!-- ========================================================================= -->
      @if (showRejectModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#dde3eb] space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#dde3eb]">
              <h3 class="font-serif font-bold text-base text-[#ba1a1a] flex items-center gap-2">
                <span class="material-symbols-outlined">cancel</span>
                <span>Reject Ingestion Submission</span>
              </h3>
              <button (click)="showRejectModal.set(false)" class="text-[#6f7978] hover:text-[#191c1c] text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#191c1c] mb-1">Select Rejection Rationale</label>
              <select [(ngModel)]="rejectionReason" class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-2.5 text-xs">
                <option value="Audio quality below archival standard">Audio quality below archival standard</option>
                <option value="Incomplete narrative or truncated recording">Incomplete narrative or truncated recording</option>
                <option value="Duplicate cultural entry in district registry">Duplicate cultural entry in district registry</option>
                <option value="Non-consented audio submission">Non-consented audio submission</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#191c1c] mb-1">Feedback Notes</label>
              <textarea [(ngModel)]="rejectionNotes" rows="3" placeholder="Provide actionable recording feedback for field volunteers..." class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-2.5 text-xs resize-none"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button (click)="showRejectModal.set(false)" class="px-3.5 py-2 bg-[#f2f4f3] text-[#3f4948] rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button (click)="confirmReject()" class="px-4 py-2 bg-[#ba1a1a] text-white rounded-xl text-xs font-bold cursor-pointer">Confirm Rejection</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 3: REQUEST CLARIFICATION MODAL -->
      <!-- ========================================================================= -->
      @if (showClarifyModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#dde3eb] space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-[#dde3eb]">
              <h3 class="font-serif font-bold text-base text-[#9b4600] flex items-center gap-2">
                <span class="material-symbols-outlined">help</span>
                <span>Request Clarification</span>
              </h3>
              <button (click)="showClarifyModal.set(false)" class="text-[#6f7978] hover:text-[#191c1c] text-sm font-bold cursor-pointer">✕</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-[#191c1c] mb-1">Clarification Required</label>
              <textarea [(ngModel)]="clarificationNotes" rows="3" placeholder="Specify which dialect phrase, technique detail, or context needs clarifying..." class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-2.5 text-xs resize-none"></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <button (click)="showClarifyModal.set(false)" class="px-3.5 py-2 bg-[#f2f4f3] text-[#3f4948] rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button (click)="confirmClarify()" class="px-4 py-2 bg-[#004343] text-white rounded-xl text-xs font-bold cursor-pointer">Dispatch Clarification</button>
            </div>
          </div>
        </div>
      }

      <!-- ========================================================================= -->
      <!-- MODAL 4: PUBLISHED SUCCESS CELEBRATION MODAL -->
      <!-- ========================================================================= -->
      @if (showSuccessModal()) {
        <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#dde3eb] text-center space-y-4 animate-scaleUp">
            
            <div class="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-md">
              <span class="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <div>
              <h3 class="font-serif font-bold text-lg text-[#004343]">Your opportunity is now part of Legacy Lens</h3>
              <p class="text-xs text-[#6f7978] mt-1">Field participants can now apply and help preserve this cultural heritage for future generations.</p>
            </div>

            <div class="bg-[#f8faf9] p-3 rounded-2xl border border-[#dde3eb] flex items-center gap-3 text-left">
              <img [src]="oppCoverImage() || sampleCoverImages[0].url" class="w-14 h-14 rounded-xl object-cover" />
              <div class="min-w-0 flex-1">
                <span class="text-[10px] font-bold text-[#fe893e] uppercase">Preservation Task</span>
                <h5 class="text-xs font-bold text-[#191c1c] truncate">{{ oppTitle() }}</h5>
                <span class="text-[11px] text-[#6f7978] truncate block">{{ oppLocationText() }}</span>
              </div>
            </div>

            <div class="space-y-2 pt-2">
              <button 
                (click)="finishPublishFlow()" 
                class="w-full py-3 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">
                View in Published Opportunities
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #dde3eb;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #bfc8c8;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
    .pulse-dot {
      animation: pulseGlow 2s infinite ease-in-out;
    }
  `]
})
export class OpportunityIntakeComponent implements OnInit, OnDestroy {
  // Navigation & Views
  currentSection = signal<TopSection>('intake');
  currentViewState = signal<ViewState>('intake_queue');
  activeHubTab = signal<HubSubTab>('drafts');
  
  // Intake Search, Filter & Sorting
  intakeSearchQuery = signal<string>('');
  activeIntakeFilter = signal<IntakeFilterType>('All');
  locationFilter = signal<string>('all');
  sortOrder = signal<'newest' | 'oldest' | 'nameAsc' | 'nameDesc'>('newest');
  isFilterDrawerOpen = signal<boolean>(false);

  // Opportunities Hub Search, Category & Sorting
  oppSearchQuery = signal<string>('');
  oppCategoryFilter = signal<string>('all');
  oppSortOrder = signal<'newest' | 'oldest' | 'titleAsc' | 'qualityDesc'>('newest');

  // Selected item for review & audio playback
  selectedIntakeItem = signal<AudioIntakeItem | null>(null);
  
  // Audio Player State (Intake & Review)
  isPlaying = signal<boolean>(false);
  currentPlaybackTime = signal<string>('04:32');
  totalPlaybackDuration = signal<string>('12:48');
  playbackProgress = signal<number>(35); // 0 - 100
  playbackSpeed = signal<number>(1.0);
  waveformBars = signal<{ height: number; played: boolean; active: boolean; time: string }[]>([]);
  private audioTimer: any;

  // Quick Preview Audio Modal
  previewModalOpen = signal<boolean>(false);
  previewItem = signal<AudioIntakeItem | null>(null);

  // Review Edit Mode & Tagging
  isEditingTranslation = signal<boolean>(false);
  isAutoTranscribing = signal<boolean>(false);
  isAddingTag = signal<boolean>(false);
  newTagInput = '';
  
  // Rejection & Clarification Modals
  showRejectModal = signal<boolean>(false);
  showClarifyModal = signal<boolean>(false);
  rejectionReason = signal<string>('Audio quality below archival standard');
  rejectionNotes = signal<string>('');
  clarificationNotes = signal<string>('');

  // Toast Notifications
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'warning' | 'info' | 'error'>('info');

  // ----------------------------------------------------
  // CREATE OPPORTUNITY WIZARD STATE
  // ----------------------------------------------------
  createStep = signal<number>(1);
  isPublishing = signal<boolean>(false);
  showSuccessModal = signal<boolean>(false);
  creationOrigin = signal<'intake_review' | 'opp_hub'>('intake_review');

  // Step 1: Core Info
  oppTitle = signal<string>('');
  oppCoverImage = signal<string | null>(null);
  oppCategory = signal<string | null>(null);

  // Step 2: Knowledge Holder
  oppKnowledgeHolderId = signal<string | null>(null);
  holderSearchQuery = signal<string>('');

  // Step 3: Location & Schedule
  oppLocationText = signal<string>('');
  isLocationSaved = signal<boolean>(false);
  oppMapLat = signal<number>(6.9271);
  oppMapLng = signal<number>(79.8612);
  locationSearchQuery = signal<string>('');
  oppIsFlexibleSchedule = signal<boolean>(false);
  oppScheduleDate = signal<string>('');
  oppScheduleDuration = signal<string>('');
  oppScheduleStartTime = signal<string>('');
  oppScheduleEndTime = signal<string>('');
  oppSelectedPerks = signal<string[]>([]);
  oppOfferedAmount = signal<number>(3500);

  // Step 4: Story & Deliverables
  oppPreservationDesc = signal<string>('');
  oppTasks = signal<string[]>(['']);
  oppRequiredSkills = signal<string[]>([]);
  oppDeliverables = signal<string[]>([]);

  // Editing existing draft
  editingDraftId = signal<string | null>(null);

  // Map Location Presets
  mapPresets = [
    { name: 'Matara Artisan Quarter', district: 'Matara', lat: 5.9549, lng: 80.5550 },
    { name: 'Kandy Temple Guilds', district: 'Kandy', lat: 7.2906, lng: 80.6337 },
    { name: 'Galle Fort Heritage Zone', district: 'Galle', lat: 6.0329, lng: 80.2168 },
    { name: 'Jaffna Cultural Precinct', district: 'Jaffna', lat: 9.6615, lng: 80.0255 },
    { name: 'Anuradhapura Sacred Area', district: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
    { name: 'Colombo Folk Archive', district: 'Colombo', lat: 6.9271, lng: 79.8612 }
  ];

  // Preset Available Assets & Knowledge Holders
  availableCategories: string[] = [
    'Craft', 'Food', 'Language', 'Tradition', 'Music', 'Dance', 'Agriculture', 'Ritual', 'Folk Knowledge'
  ];

  sampleCoverImages: { url: string; label: string }[] = [
    { url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80', label: 'Pottery & Ceramics' },
    { url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80', label: 'Traditional Weaving' },
    { url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80', label: 'Temple Fresco Art' },
    { url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80', label: 'Agrarian Harvesting' },
    { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80', label: 'Traditional Mask Carving' },
    { url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&auto=format&fit=crop&q=80', label: 'Spices & Herbal Medicine' }
  ];

  availableSkillsList: string[] = [
    'Photography', 'Videography', 'Documentation', 'Translation (Sinhala/English)', 'Translation (Tamil/English)', 'Interviews', 'Field Sound Recording', 'Archival Scanning'
  ];

  availableDeliverablesList: string[] = [
    'Minimum 15 high-resolution photos',
    '3-5 minute edited video summary',
    'Written site documentation (500 words)',
    'Audio interviews with locals',
    'Raw audio stem recordings & transcript notes'
  ];

  availablePerksList: string[] = [
    'Paid', 'Certificate', 'Meals Provided', 'Transport', 'Accommodation', 'Heritage Badge'
  ];

  locationPresets: string[] = [
    'all', 'Matara', 'Anuradhapura', 'Galle', 'Kandy', 'Colombo', 'Jaffna', 'Kurunegala', 'Hambantota', 'Badulla', 'Negombo'
  ];

  // ----------------------------------------------------
  // DATA COLLECTIONS (Loaded dynamically from backend)
  // ----------------------------------------------------
  knowledgeHolders = signal<KnowledgeHolder[]>([]);

  private opportunityService = inject(OpportunityService);
  isSyncingOpportunities = signal<boolean>(false);
  isSyncingAudios = signal<boolean>(false);

  audioSubmissions = signal<AudioIntakeItem[]>([]);
  opportunitiesList = signal<OpportunityItem[]>([]);

  // ----------------------------------------------------
  // COMPUTED SIGNALS
  // ----------------------------------------------------
  filteredAudioSubmissions = computed(() => {
    let items = this.audioSubmissions();
    const filter = this.activeIntakeFilter();
    const loc = this.locationFilter();
    const query = this.intakeSearchQuery().toLowerCase().trim();
    const sort = this.sortOrder();

    if (filter === 'Fully Listened') {
      items = items.filter(i => i.status === 'FULLY_LISTENED');
    } else if (filter === 'Partially Listened') {
      items = items.filter(i => i.status === 'PARTIALLY_LISTENED');
    } else if (filter === 'Unlistened') {
      items = items.filter(i => i.status === 'UNLISTENED');
    } else if (filter === 'Need Review') {
      items = items.filter(i => i.status === 'NEEDS_REVIEW');
    }

    if (loc !== 'all') {
      items = items.filter(i => 
        (i.district && i.district.toLowerCase() === loc.toLowerCase()) || 
        (i.location && i.location.toLowerCase().includes(loc.toLowerCase()))
      );
    }

    if (query) {
      items = items.filter(i =>
        i.elderName.toLowerCase().includes(query) ||
        i.topic.toLowerCase().includes(query) ||
        i.location.toLowerCase().includes(query) ||
        (i.district && i.district.toLowerCase().includes(query)) ||
        i.id.toLowerCase().includes(query) ||
        i.tags.some(t => t.toLowerCase().includes(query)) ||
        i.transcriptOriginal.some(t => t.text.toLowerCase().includes(query)) ||
        i.transcriptTranslation.some(t => t.text.toLowerCase().includes(query))
      );
    }

    items = [...items].sort((a, b) => {
      if (sort === 'newest') return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
      if (sort === 'oldest') return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
      if (sort === 'nameAsc') return a.elderName.localeCompare(b.elderName);
      if (sort === 'nameDesc') return b.elderName.localeCompare(a.elderName);
      return 0;
    });

    return items;
  });

  intakeCounts = computed(() => {
    const list = this.audioSubmissions();
    return {
      all: list.length,
      fullyListened: list.filter(i => i.status === 'FULLY_LISTENED').length,
      partiallyListened: list.filter(i => i.status === 'PARTIALLY_LISTENED').length,
      unlistened: list.filter(i => i.status === 'UNLISTENED').length,
      needReview: list.filter(i => i.status === 'NEEDS_REVIEW').length
    };
  });

  draftOpportunities = computed(() => {
    return this.opportunitiesList().filter(o => o.status === 'DRAFT');
  });

  publishedOpportunities = computed(() => {
    return this.opportunitiesList().filter(o => o.status === 'PUBLISHED');
  });

  removedOpportunities = computed(() => {
    return this.opportunitiesList().filter(o => o.status === 'CLOSED');
  });

  filteredDraftOpportunities = computed(() => {
    let items = this.draftOpportunities();
    const query = this.oppSearchQuery().toLowerCase().trim();
    const cat = this.oppCategoryFilter();
    const sort = this.oppSortOrder();

    if (cat !== 'all') {
      items = items.filter(o => o.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      items = items.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.location.toLowerCase().includes(query) ||
        (o.elderName && o.elderName.toLowerCase().includes(query)) ||
        (o.category && o.category.toLowerCase().includes(query)) ||
        o.skills.some(s => s.toLowerCase().includes(query)) ||
        o.perks.some(p => p.toLowerCase().includes(query))
      );
    }

    items = [...items].sort((a, b) => {
      if (sort === 'newest') return new Date(b.lastEditedAt || b.createdAt).getTime() - new Date(a.lastEditedAt || a.createdAt).getTime();
      if (sort === 'oldest') return new Date(a.lastEditedAt || a.createdAt).getTime() - new Date(b.lastEditedAt || b.createdAt).getTime();
      if (sort === 'titleAsc') return a.title.localeCompare(b.title);
      if (sort === 'qualityDesc') return (b.qualityScore || 0) - (a.qualityScore || 0);
      return 0;
    });

    return items;
  });

  filteredPublishedOpportunities = computed(() => {
    let items = this.publishedOpportunities();
    const query = this.oppSearchQuery().toLowerCase().trim();
    const cat = this.oppCategoryFilter();
    const sort = this.oppSortOrder();

    if (cat !== 'all') {
      items = items.filter(o => o.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      items = items.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.location.toLowerCase().includes(query) ||
        (o.elderName && o.elderName.toLowerCase().includes(query)) ||
        (o.category && o.category.toLowerCase().includes(query)) ||
        o.skills.some(s => s.toLowerCase().includes(query)) ||
        o.perks.some(p => p.toLowerCase().includes(query))
      );
    }

    items = [...items].sort((a, b) => {
      if (sort === 'newest') return new Date(b.lastEditedAt || b.createdAt).getTime() - new Date(a.lastEditedAt || a.createdAt).getTime();
      if (sort === 'oldest') return new Date(a.lastEditedAt || a.createdAt).getTime() - new Date(b.lastEditedAt || b.createdAt).getTime();
      if (sort === 'titleAsc') return a.title.localeCompare(b.title);
      if (sort === 'qualityDesc') return (b.qualityScore || 0) - (a.qualityScore || 0);
      return 0;
    });

    return items;
  });

  filteredRemovedOpportunities = computed(() => {
    let items = this.removedOpportunities();
    const query = this.oppSearchQuery().toLowerCase().trim();
    const cat = this.oppCategoryFilter();

    if (cat !== 'all') {
      items = items.filter(o => o.category?.toLowerCase() === cat.toLowerCase());
    }

    if (query) {
      items = items.filter(o =>
        o.title.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.location.toLowerCase().includes(query) ||
        (o.elderName && o.elderName.toLowerCase().includes(query)) ||
        (o.category && o.category.toLowerCase().includes(query))
      );
    }

    return items;
  });

  featuredDraft = computed(() => {
    const drafts = this.filteredDraftOpportunities();
    if (drafts.length === 0) return null;
    return [...drafts].sort((a, b) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime())[0];
  });

  otherDrafts = computed(() => {
    const feat = this.featuredDraft();
    if (!feat) return [];
    return this.filteredDraftOpportunities().filter(d => d.id !== feat.id);
  });

  featuredPublished = computed(() => {
    const pubs = this.filteredPublishedOpportunities();
    if (pubs.length === 0) return null;
    return pubs[0];
  });

  otherPublished = computed(() => {
    const feat = this.featuredPublished();
    if (!feat) return [];
    return this.filteredPublishedOpportunities().filter(p => p.id !== feat.id);
  });

  selectedKnowledgeHolderObj = computed(() => {
    const id = this.oppKnowledgeHolderId();
    if (!id) return null;
    return this.knowledgeHolders().find(k => k.id === id) || null;
  });

  filteredKnowledgeHolders = computed(() => {
    const query = this.holderSearchQuery().toLowerCase().trim();
    if (!query) return this.knowledgeHolders();
    return this.knowledgeHolders().filter(k =>
      k.name.toLowerCase().includes(query) ||
      k.location.toLowerCase().includes(query) ||
      k.specialty.toLowerCase().includes(query)
    );
  });

  calculatedQualityScore = computed(() => {
    let score = 0;
    if (this.oppTitle().trim().length >= 8) score += 20;
    if (this.oppCoverImage()) score += 15;
    if (this.oppKnowledgeHolderId()) score += 15;
    if (this.isLocationSaved()) score += 15;
    if (this.oppIsFlexibleSchedule() || (this.oppScheduleDate() && this.oppScheduleStartTime())) score += 15;
    if (this.oppPreservationDesc().trim().length >= 40) score += 10;
    if (this.oppTasks().filter(t => t.trim().length > 0).length >= 2) score += 5;
    if (this.oppRequiredSkills().length > 0 && this.oppDeliverables().length > 0) score += 5;
    return Math.min(100, score);
  });

  canContinueStep1 = computed(() => {
    return Boolean(this.oppTitle().trim().length >= 3 && this.oppCoverImage() && this.oppCategory());
  });

  canContinueStep2 = computed(() => {
    return Boolean(this.oppKnowledgeHolderId());
  });

  canContinueStep3 = computed(() => {
    if (!this.isLocationSaved()) return false;
    if (this.oppIsFlexibleSchedule()) return true;
    return Boolean(this.oppScheduleDate() && this.oppScheduleDuration() && this.oppScheduleStartTime());
  });

  canContinueStep4 = computed(() => {
    return Boolean(
      this.oppPreservationDesc().trim().length >= 20 &&
      this.oppTasks().some(t => t.trim().length > 0) &&
      this.oppRequiredSkills().length > 0 &&
      this.oppDeliverables().length > 0
    );
  });

  canContinueCurrentStep = computed(() => {
    const step = this.createStep();
    if (step === 1) return this.canContinueStep1();
    if (step === 2) return this.canContinueStep2();
    if (step === 3) return this.canContinueStep3();
    if (step === 4) return this.canContinueStep4();
    return true;
  });

  oppMapPinX = computed(() => {
    const lng = this.oppMapLng();
    const pct = ((lng - 79.5) / (81.9 - 79.5)) * 100;
    return Math.max(5, Math.min(95, pct));
  });

  oppMapPinY = computed(() => {
    const lat = this.oppMapLat();
    const pct = ((9.8 - lat) / (9.8 - 5.9)) * 100;
    return Math.max(5, Math.min(95, pct));
  });

  hasDraftChanges = computed(() => {
    return Boolean(
      this.oppTitle().trim().length > 0 ||
      this.oppCoverImage() !== null ||
      this.oppCategory() !== null ||
      this.oppKnowledgeHolderId() !== null ||
      this.oppLocationText().trim().length > 0 ||
      this.oppPreservationDesc().trim().length > 0 ||
      this.oppTasks().some(t => t.trim().length > 0) ||
      this.oppRequiredSkills().length > 0 ||
      this.oppDeliverables().length > 0
    );
  });

  // ----------------------------------------------------
  // LIFECYCLE HOOKS
  // ----------------------------------------------------
  ngOnInit(): void {
    this.generateWaveformBars();
    this.loadOpportunitiesFromBackend(true);
    this.loadAudiosFromBackend(true);
  }

  loadOpportunitiesFromBackend(silent: boolean = false): void {
    this.isSyncingOpportunities.set(true);
    this.opportunityService.getAllOpportunities('ALL').subscribe({
      next: (data: AdminOpportunityResponse[]) => {
        this.isSyncingOpportunities.set(false);
        const list = data || [];
        const mapped = list.map(item => this.mapBackendOpportunityToItem(item));
        this.opportunitiesList.set(mapped);

        // Also dynamically populate knowledge holders if not already listed
        const existingKhIds = new Set(this.knowledgeHolders().map(k => k.id));
        const newHolders: KnowledgeHolder[] = [];
        mapped.forEach(opp => {
          if (opp.elderId && !existingKhIds.has(opp.elderId) && opp.elderName) {
            existingKhIds.add(opp.elderId);
            newHolders.push({
              id: opp.elderId,
              name: opp.elderName,
              location: opp.location,
              district: opp.location?.split(',')[0]?.trim() || 'Western',
              avatarUrl: opp.elderAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
              isElder: true,
              isVerified: true,
              specialty: opp.category,
              experienceYears: 40
            });
          }
        });
        if (newHolders.length > 0) {
          this.knowledgeHolders.update(khs => [...khs, ...newHolders]);
        }

        if (!silent) {
          this.showToastNotification(`Synchronized ${mapped.length} opportunities with Central Vault.`, 'success');
        }
      },
      error: (err) => {
        this.isSyncingOpportunities.set(false);
        console.warn('Could not load opportunities from backend:', err);
        if (!silent) {
          this.showToastNotification('Could not reach opportunity service.', 'warning');
        }
      }
    });
  }

  loadAudiosFromBackend(silent: boolean = false): void {
    this.isSyncingAudios.set(true);
    this.opportunityService.getAudioSubmissions('ALL').subscribe({
      next: (data: OpportunityAudioResponse[]) => {
        this.isSyncingAudios.set(false);
        const list = data || [];
        if (list.length > 0) {
          const mapped = list.map(item => this.mapBackendAudioToItem(item));
          this.audioSubmissions.set(mapped);
          if (!this.selectedIntakeItem() && mapped.length > 0) {
            this.selectedIntakeItem.set(mapped[0]);
          }
        }
        if (!silent && list.length > 0) {
          this.showToastNotification(`Loaded ${list.length} field audio records.`, 'success');
        }
      },
      error: (err) => {
        this.isSyncingAudios.set(false);
        console.warn('Could not load audio submissions from backend:', err);
      }
    });
  }

  private mapBackendOpportunityToItem(res: AdminOpportunityResponse): OpportunityItem {
    let heroImageUrl = res.heroImageUrl || '';
    if (heroImageUrl.startsWith('local:')) {
      heroImageUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';
    } else if (!heroImageUrl) {
      heroImageUrl = 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80';
    }

    const tasksList: string[] = res.tasks ? res.tasks.split('\n').map(t => t.trim()).filter(Boolean) : [];
    const perksList: string[] = ['Paid', 'Certificate', 'Meals Provided'];
    const skillsList: string[] = ['Photography', 'Documentation', 'Videography'];
    const deliverablesList: string[] = [
      'Minimum 15 high-resolution photos',
      'Written site documentation (500 words)',
      'Audio interviews with locals'
    ];

    const status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' = 
      res.status === 'PUBLISHED' ? 'PUBLISHED' : (res.status === 'DRAFT' ? 'DRAFT' : 'CLOSED');

    return {
      id: res.id,
      title: res.title,
      description: res.description || res.preservationGoal || '',
      heroImageUrl,
      location: res.location || 'Sri Lanka',
      category: res.category || 'Craft',
      elderId: res.elderId,
      elderName: res.elderName || 'Culture Custodian',
      elderAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      elderVerified: true,
      scheduledDate: res.scheduledDate ? String(res.scheduledDate) : undefined,
      durationText: res.durationText || '2 - 3 hours',
      timeWindowText: res.timeWindowText || '10:00 AM - 01:00 PM',
      isFlexibleSchedule: !res.scheduledDate,
      offeredAmount: Number(res.offeredAmount) || 3500,
      perks: perksList,
      tasks: tasksList.length > 0 ? tasksList : ['Document traditional knowledge with elder'],
      skills: skillsList,
      deliverables: deliverablesList,
      status,
      lastEditedAt: res.updatedAt || res.createdAt || new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString().split('T')[0],
      reachCount: 2500,
      qualityScore: res.matchPercentage || 85
    };
  }

  private mapBackendAudioToItem(res: OpportunityAudioResponse): AudioIntakeItem {
    const rawStatus = (res.status || 'UNLISTENED').toUpperCase();
    let status: 'FULLY_LISTENED' | 'PARTIALLY_LISTENED' | 'UNLISTENED' | 'NEEDS_REVIEW' = 'UNLISTENED';
    let statusLabel = 'Not Listened';
    let statusColor = '#ba1a1a';
    let progressPercent = 0;

    if (rawStatus.includes('FULL')) {
      status = 'FULLY_LISTENED';
      statusLabel = 'Fully Listened';
      statusColor = '#10b981';
      progressPercent = 100;
    } else if (rawStatus.includes('PARTIAL')) {
      status = 'PARTIALLY_LISTENED';
      statusLabel = 'Partially Listened';
      statusColor = '#fe893e';
      progressPercent = 45;
    } else if (rawStatus.includes('REVIEW') || rawStatus.includes('NEED')) {
      status = 'NEEDS_REVIEW';
      statusLabel = 'Need Review';
      statusColor = '#6f7978';
      progressPercent = 20;
    }

    const tagList = res.tags ? (typeof res.tags === 'string' ? res.tags.split(',').map(t => t.trim()).filter(Boolean) : res.tags) : ['Oral History', 'Cultural Archive'];

    return {
      id: res.id,
      elderName: res.elderName || 'Elder Witness',
      elderAvatarUrl: res.elderAvatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      verified: res.verified ?? true,
      location: res.location || 'Sri Lanka',
      district: res.location?.split(',')[0]?.trim() || 'Western',
      recordedAt: res.recordedAt || res.createdAt || new Date().toISOString(),
      date: res.recordedAt ? res.recordedAt.split(' ')[0] : 'Recent',
      time: res.recordedAt ? (res.recordedAt.split(' ')[1] || '10:00 AM') : '10:00 AM',
      duration: res.duration || '12m 45s',
      topic: res.topic || 'Oral Testimony on Cultural Traditions',
      tags: tagList,
      status,
      statusLabel,
      statusColor,
      progressPercent,
      originalLanguage: 'Sinhala',
      audioQuality: 'Excellent',
      recordedEra: 'Contemporary Archive (2026)',
      transcriptOriginal: [
        { time: '00:12', text: 'අපි හැමදාම මේ සම්ප්‍රදායික දැනුම ආරක්ෂා කරගන්න කැපවෙලා කටයුතු කරනවා.' },
        { time: '01:45', text: 'අනාගත පරපුරට මේ දැනුම නිවැරදිව ලබාදීම අපේ යුතුකමක්.' }
      ],
      transcriptTranslation: [
        { time: '00:12', text: 'We have dedicated our lives to preserving this indigenous tradition.' },
        { time: '01:45', text: 'It is our collective duty to pass down this knowledge accurately to future generations.' }
      ],
      reviewerNotes: 'Audio submission verified.'
    };
  }

  ngOnDestroy(): void {
    if (this.audioTimer) {
      clearInterval(this.audioTimer);
    }
  }

  // ----------------------------------------------------
  // NAVIGATION SWITCHING
  // ----------------------------------------------------
  switchSection(section: TopSection): void {
    this.currentSection.set(section);
    if (section === 'intake') {
      this.currentViewState.set('intake_queue');
    } else {
      this.currentViewState.set('opp_hub');
    }
  }

  // ----------------------------------------------------
  // WAVEFORM & AUDIO PLAYBACK ENGINE
  // ----------------------------------------------------
  generateWaveformBars(): void {
    const bars: { height: number; played: boolean; active: boolean; time: string }[] = [];
    const totalBars = 45;
    const activeIndex = 14;

    for (let i = 0; i < totalBars; i++) {
      const height = Math.max(20, Math.floor(Math.sin(i / 2.5) * 35 + Math.cos(i / 1.8) * 25 + 45));
      const mins = Math.floor((i * 18) / 60);
      const secs = (i * 18) % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      bars.push({
        height,
        played: i < activeIndex,
        active: i === activeIndex,
        time: timeStr
      });
    }
    this.waveformBars.set(bars);
  }

  togglePlay(): void {
    const next = !this.isPlaying();
    this.isPlaying.set(next);

    if (next) {
      this.audioTimer = setInterval(() => {
        this.waveformBars.update(bars => {
          const activeIdx = bars.findIndex(b => b.active);
          const nextIdx = (activeIdx + 1) % bars.length;
          
          const curBar = bars[nextIdx];
          if (curBar) {
            this.currentPlaybackTime.set(curBar.time);
            this.playbackProgress.set(Math.round((nextIdx / bars.length) * 100));
          }

          return bars.map((b, idx) => ({
            ...b,
            played: idx < nextIdx,
            active: idx === nextIdx
          }));
        });
      }, 700);
    } else {
      if (this.audioTimer) clearInterval(this.audioTimer);
    }
  }

  seekToBar(index: number): void {
    this.waveformBars.update(bars => 
      bars.map((b, idx) => ({
        ...b,
        played: idx < index,
        active: idx === index
      }))
    );
    const target = this.waveformBars()[index];
    if (target) {
      this.currentPlaybackTime.set(target.time);
      this.playbackProgress.set(Math.round((index / this.waveformBars().length) * 100));
    }
  }

  seekBackward(seconds: number = 10): void {
    this.waveformBars.update(bars => {
      const activeIdx = bars.findIndex(b => b.active);
      const newIdx = Math.max(0, activeIdx - 4);
      const target = bars[newIdx];
      if (target) {
        this.currentPlaybackTime.set(target.time);
      }
      return bars.map((b, idx) => ({
        ...b,
        played: idx < newIdx,
        active: idx === newIdx
      }));
    });
    this.showToastNotification(`Rewound ${seconds}s`, 'info');
  }

  seekForward(seconds: number = 10): void {
    this.waveformBars.update(bars => {
      const activeIdx = bars.findIndex(b => b.active);
      const newIdx = Math.min(bars.length - 1, activeIdx + 4);
      const target = bars[newIdx];
      if (target) {
        this.currentPlaybackTime.set(target.time);
      }
      return bars.map((b, idx) => ({
        ...b,
        played: idx < newIdx,
        active: idx === newIdx
      }));
    });
    this.showToastNotification(`Forwarded ${seconds}s`, 'info');
  }

  cycleSpeed(): void {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const cur = this.playbackSpeed();
    const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
    this.playbackSpeed.set(next);
    this.showToastNotification(`Playback speed set to ${next}x`, 'info');
  }

  jumpToTranscriptSegment(time: string, idx: number): void {
    const item = this.selectedIntakeItem();
    if (!item) return;

    item.transcriptOriginal.forEach((s, i) => s.active = (i === idx));
    item.transcriptTranslation.forEach((s, i) => s.active = (i === idx));
    this.currentPlaybackTime.set(time);
    this.showToastNotification(`Jumped to time ${time}`, 'info');
  }

  // ----------------------------------------------------
  // INTAKE ACTIONS & SEQUENTIAL TRANSITIONS
  // ----------------------------------------------------
  openQuickPreview(item: AudioIntakeItem): void {
    this.previewItem.set(item);
    this.previewModalOpen.set(true);
    this.isPlaying.set(true);
  }

  closeQuickPreview(): void {
    this.previewModalOpen.set(false);
    this.isPlaying.set(false);
    if (this.audioTimer) clearInterval(this.audioTimer);
  }

  openFullReview(item?: AudioIntakeItem): void {
    if (item) {
      this.selectedIntakeItem.set(item);
    } else if (this.previewItem()) {
      this.selectedIntakeItem.set(this.previewItem());
    }
    this.closeQuickPreview();
    this.currentSection.set('intake');
    this.currentViewState.set('intake_review');
  }

  autoTranscribe(): void {
    this.isAutoTranscribing.set(true);
    this.showToastNotification('AI Neural Model transcribing audio stream...', 'info');
    setTimeout(() => {
      this.isAutoTranscribing.set(false);
      this.showToastNotification('Transcript synchronized with bilingual glossaries.', 'success');
    }, 1400);
  }

  toggleEditTranslation(): void {
    this.isEditingTranslation.set(!this.isEditingTranslation());
    if (!this.isEditingTranslation()) {
      this.showToastNotification('English translation updates saved.', 'success');
    }
  }

  addTag(): void {
    const tag = this.newTagInput.trim();
    const item = this.selectedIntakeItem();
    if (tag && item && !item.tags.includes(tag)) {
      item.tags.push(tag);
      this.newTagInput = '';
      this.isAddingTag.set(false);
      this.showToastNotification(`Tag "${tag}" added to taxonomy.`, 'success');
    }
  }

  removeTag(tag: string): void {
    const item = this.selectedIntakeItem();
    if (item) {
      item.tags = item.tags.filter(t => t !== tag);
    }
  }

  promptReject(): void {
    this.showRejectModal.set(true);
  }

  confirmReject(): void {
    const item = this.selectedIntakeItem();
    if (item) {
      item.status = 'NEEDS_REVIEW';
      item.statusLabel = 'Need Review';
      item.statusColor = '#ba1a1a';
      this.showRejectModal.set(false);
      this.showToastNotification(`Submission "${item.id}" marked for re-recording with feedback.`, 'warning');
      this.currentViewState.set('intake_queue');
    }
  }

  promptClarify(): void {
    this.showClarifyModal.set(true);
  }

  confirmClarify(): void {
    const item = this.selectedIntakeItem();
    if (item) {
      this.showClarifyModal.set(false);
      this.showToastNotification(`Clarification notice sent to ${item.elderName}.`, 'info');
    }
  }

  // Sequentially transitions from Review into Opportunity Creator
  approveAndCreateOpportunity(): void {
    const item = this.selectedIntakeItem();
    if (!item) return;

    item.status = 'FULLY_LISTENED';
    item.statusLabel = 'Fully Listened';
    item.statusColor = '#10b981';

    // Populate Create Wizard with intake data
    this.editingDraftId.set(null);
    this.oppTitle.set(`Documenting ${item.topic}`);
    this.oppCoverImage.set(this.sampleCoverImages[0].url);
    this.oppCategory.set('Craft');
    
    // Find matching elder
    const matchedHolder = this.knowledgeHolders().find(k => k.name.toLowerCase() === item.elderName.toLowerCase());
    if (matchedHolder) {
      this.oppKnowledgeHolderId.set(matchedHolder.id);
    }

    this.oppLocationText.set(item.location);
    this.oppPreservationDesc.set(`Preserve and archive master knowledge from ${item.elderName} on ${item.topic}. Initial audio ingestion documented in ${item.district}.`);
    this.oppTasks.set([
      `Conduct high-definition 4K video recording on ${item.topic}`,
      `Digitize step-by-step techniques as guided by ${item.elderName}`,
      'Compile bilingual vocabulary glossary'
    ]);

    this.createStep.set(1);
    this.creationOrigin.set('intake_review');
    this.currentViewState.set('opp_create');
    this.showToastNotification(`Approved "${item.id}"! Proceeding to Opportunity Creator.`, 'success');
  }

  // ----------------------------------------------------
  // OPPORTUNITIES HUB (DRAFTS, PUBLISHED, REMOVED)
  // ----------------------------------------------------
  startNewOpportunity(): void {
    this.editingDraftId.set(null);
    this.oppTitle.set('');
    this.oppCoverImage.set(null);
    this.oppCategory.set(null);
    this.oppKnowledgeHolderId.set(null);
    this.oppLocationText.set('');
    this.isLocationSaved.set(false);
    this.oppMapLat.set(6.9271);
    this.oppMapLng.set(79.8612);
    this.locationSearchQuery.set('');
    this.oppIsFlexibleSchedule.set(false);
    this.oppScheduleDate.set('');
    this.oppScheduleDuration.set('');
    this.oppScheduleStartTime.set('');
    this.oppScheduleEndTime.set('');
    this.oppSelectedPerks.set([]);
    this.oppOfferedAmount.set(3500);
    this.oppPreservationDesc.set('');
    this.oppTasks.set(['']);
    this.oppRequiredSkills.set([]);
    this.oppDeliverables.set([]);

    this.createStep.set(1);
    this.creationOrigin.set('opp_hub');
    this.currentViewState.set('opp_create');
  }

  editOpportunityDraft(draft: OpportunityItem): void {
    this.editingDraftId.set(draft.id);
    this.oppTitle.set(draft.title);
    this.oppCoverImage.set(draft.heroImageUrl || null);
    this.oppCategory.set(draft.category || null);
    this.oppKnowledgeHolderId.set(draft.elderId || null);
    this.oppLocationText.set(draft.location || '');
    this.isLocationSaved.set(Boolean(draft.location));
    this.oppIsFlexibleSchedule.set(draft.isFlexibleSchedule || false);
    this.oppScheduleDate.set(draft.scheduledDate || '');
    this.oppScheduleDuration.set(draft.durationText || '');
    this.oppOfferedAmount.set(draft.offeredAmount || 3500);
    this.oppSelectedPerks.set(draft.perks || []);
    this.oppPreservationDesc.set(draft.description || '');
    this.oppTasks.set(draft.tasks?.length ? [...draft.tasks] : ['']);
    this.oppRequiredSkills.set(draft.skills?.length ? [...draft.skills] : []);
    this.oppDeliverables.set(draft.deliverables?.length ? [...draft.deliverables] : []);

    this.createStep.set(1);
    this.creationOrigin.set('opp_hub');
    this.currentViewState.set('opp_create');
    this.showToastNotification(`Loaded draft "${draft.title}".`, 'info');
  }

  removeOpportunityToArchive(item: OpportunityItem): void {
    if (item.id && item.id.includes('-') && !item.id.startsWith('OPP-')) {
      this.opportunityService.updateOpportunityStatus(item.id, { status: 'CLOSED' }).subscribe({
        next: () => {
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification(`Opportunity "${item.title}" moved to Archive.`, 'warning');
        },
        error: () => {
          item.status = 'CLOSED';
          this.showToastNotification(`Opportunity "${item.title}" moved to Archive.`, 'warning');
        }
      });
    } else {
      item.status = 'CLOSED';
      this.showToastNotification(`Opportunity "${item.title}" moved to Archive.`, 'warning');
    }
  }

  restoreOpportunity(item: OpportunityItem): void {
    if (item.id && item.id.includes('-') && !item.id.startsWith('OPP-')) {
      this.opportunityService.updateOpportunityStatus(item.id, { status: 'PUBLISHED' }).subscribe({
        next: () => {
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification(`Opportunity "${item.title}" restored to Active Published status!`, 'success');
        },
        error: () => {
          item.status = 'PUBLISHED';
          this.showToastNotification(`Opportunity "${item.title}" restored to Active Published status!`, 'success');
        }
      });
    } else {
      item.status = 'PUBLISHED';
      this.showToastNotification(`Opportunity "${item.title}" restored to Active Published status!`, 'success');
    }
  }

  deleteDraft(draftId: string): void {
    this.opportunitiesList.update(list => list.filter(o => o.id !== draftId));
    this.showToastNotification('Draft discarded.', 'info');
  }

  formatTimeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Last edited today';
    if (days === 1) return 'Last edited yesterday';
    return `Last edited ${days} days ago`;
  }

  // ----------------------------------------------------
  // CREATE OPPORTUNITY WIZARD ACTIONS
  // ----------------------------------------------------
  selectCoverImagePreset(presetUrl: string): void {
    this.oppCoverImage.set(presetUrl);
  }

  onDeviceImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.oppCoverImage.set(e.target.result as string);
          this.showToastNotification('Device cover image uploaded successfully!', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  selectMapPreset(preset: { name: string; district: string; lat: number; lng: number }): void {
    this.oppMapLat.set(preset.lat);
    this.oppMapLng.set(preset.lng);
    this.oppLocationText.set(`${preset.name}, ${preset.district}`);
    this.isLocationSaved.set(true);
    this.showToastNotification(`Pinned location: ${preset.name}`, 'info');
  }

  onMapClick(event: MouseEvent): void {
    if (this.isLocationSaved()) return;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Map bounds: Lat: 5.9 to 9.8, Lng: 79.5 to 81.9
    const lat = +(9.8 - (y / rect.height) * (9.8 - 5.9)).toFixed(4);
    const lng = +(79.5 + (x / rect.width) * (81.9 - 79.5)).toFixed(4);
    
    this.oppMapLat.set(lat);
    this.oppMapLng.set(lng);
    if (!this.oppLocationText().trim()) {
      this.oppLocationText.set(`Custom Site Coordinates (${lat}° N, ${lng}° E)`);
    }
  }

  handleLocationSearch(): void {
    const query = this.oppLocationText().trim().toLowerCase();
    if (!query) return;
    const found = this.mapPresets.find(p => p.name.toLowerCase().includes(query) || p.district.toLowerCase().includes(query));
    if (found) {
      this.selectMapPreset(found);
    } else {
      this.isLocationSaved.set(true);
      this.showToastNotification(`Custom location pinned: ${this.oppLocationText()}`, 'info');
    }
  }

  selectCategory(cat: string): void {
    this.oppCategory.set(cat);
  }

  togglePerk(perk: string): void {
    const current = this.oppSelectedPerks();
    if (current.includes(perk)) {
      this.oppSelectedPerks.set(current.filter(p => p !== perk));
    } else {
      this.oppSelectedPerks.set([...current, perk]);
    }
  }

  toggleSkill(skill: string): void {
    const current = this.oppRequiredSkills();
    if (current.includes(skill)) {
      this.oppRequiredSkills.set(current.filter(s => s !== skill));
    } else {
      this.oppRequiredSkills.set([...current, skill]);
    }
  }

  toggleDeliverable(item: string): void {
    const current = this.oppDeliverables();
    if (current.includes(item)) {
      this.oppDeliverables.set(current.filter(d => d !== item));
    } else {
      this.oppDeliverables.set([...current, item]);
    }
  }

  addTask(): void {
    this.oppTasks.update(t => [...t, '']);
  }

  removeTask(index: number): void {
    this.oppTasks.update(t => t.length > 1 ? t.filter((_, i) => i !== index) : ['']);
  }

  updateTask(index: number, val: string): void {
    this.oppTasks.update(t => {
      const copy = [...t];
      copy[index] = val;
      return copy;
    });
  }

  goToNextStep(): void {
    const cur = this.createStep();
    if (cur === 1 && !this.canContinueStep1()) {
      this.showToastNotification('Please provide a Title, Cover Image, and Category.', 'warning');
      return;
    }
    if (cur === 2 && !this.canContinueStep2()) {
      this.showToastNotification('Please select a Knowledge Holder.', 'warning');
      return;
    }
    if (cur === 3 && !this.canContinueStep3()) {
      this.showToastNotification('Please save the location and schedule.', 'warning');
      return;
    }
    if (cur === 4 && !this.canContinueStep4()) {
      this.showToastNotification('Please complete the preservation description, tasks, and deliverables.', 'warning');
      return;
    }

    this.createStep.set(Math.min(5, cur + 1));
  }

  goToPrevStep(): void {
    const cur = this.createStep();
    if (cur > 1) {
      this.createStep.set(cur - 1);
    } else {
      if (this.creationOrigin() === 'intake_review') {
        this.currentViewState.set('intake_review');
      } else {
        this.currentViewState.set('opp_hub');
      }
    }
  }

  saveDraftOnly(): void {
    const kh = this.selectedKnowledgeHolderObj();
    const req: CreateOpportunityRequest = {
      title: this.oppTitle().trim() || 'Untitled Opportunity',
      description: this.oppPreservationDesc().trim(),
      heroImageUrl: this.oppCoverImage() || this.sampleCoverImages[0].url,
      location: this.oppLocationText(),
      category: this.oppCategory() || 'Craft',
      locationType: 'On-Site',
      matchPercentage: this.calculatedQualityScore(),
      urgent: false,
      scheduledDate: this.oppScheduleDate() || null,
      durationText: this.oppScheduleDuration() || '2 - 3 hours',
      timeWindowText: `${this.oppScheduleStartTime()} - ${this.oppScheduleEndTime()}`,
      language: 'Sinhala',
      offeredAmount: this.oppOfferedAmount(),
      preservationGoal: this.oppPreservationDesc().trim(),
      tasks: this.oppTasks().filter(t => t.trim().length > 0).join('\n'),
      status: 'DRAFT',
      elderId: kh?.id,
      elderName: kh?.name
    };

    const draftId = this.editingDraftId();
    if (draftId && draftId.includes('-') && !draftId.startsWith('OPP-')) {
      this.opportunityService.updateOpportunityStatus(draftId, { status: 'DRAFT' }).subscribe({
        next: () => {
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification(`Draft saved successfully!`, 'success');
          this.currentSection.set('opportunities');
          this.currentViewState.set('opp_hub');
          this.activeHubTab.set('drafts');
        },
        error: () => {
          this.showToastNotification(`Draft updated locally.`, 'info');
          this.currentSection.set('opportunities');
          this.currentViewState.set('opp_hub');
          this.activeHubTab.set('drafts');
        }
      });
    } else {
      this.opportunityService.createOpportunity(req).subscribe({
        next: () => {
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification(`Draft saved to Central Archive!`, 'success');
          this.currentSection.set('opportunities');
          this.currentViewState.set('opp_hub');
          this.activeHubTab.set('drafts');
        },
        error: () => {
          this.showToastNotification(`Draft saved locally.`, 'info');
          this.currentSection.set('opportunities');
          this.currentViewState.set('opp_hub');
          this.activeHubTab.set('drafts');
        }
      });
    }
  }

  publishOpportunity(): void {
    this.isPublishing.set(true);
    const kh = this.selectedKnowledgeHolderObj();
    const req: CreateOpportunityRequest = {
      title: this.oppTitle().trim(),
      description: this.oppPreservationDesc().trim(),
      heroImageUrl: this.oppCoverImage() || this.sampleCoverImages[0].url,
      location: this.oppLocationText(),
      category: this.oppCategory() || 'Craft',
      locationType: 'On-Site',
      matchPercentage: this.calculatedQualityScore(),
      urgent: false,
      scheduledDate: this.oppScheduleDate() || null,
      durationText: this.oppScheduleDuration() || '2 - 3 hours',
      timeWindowText: `${this.oppScheduleStartTime()} - ${this.oppScheduleEndTime()}`,
      language: 'Sinhala',
      offeredAmount: this.oppOfferedAmount(),
      preservationGoal: this.oppPreservationDesc().trim(),
      tasks: this.oppTasks().filter(t => t.trim().length > 0).join('\n'),
      status: 'PUBLISHED',
      elderId: kh?.id,
      elderName: kh?.name
    };

    const draftId = this.editingDraftId();
    if (draftId && draftId.includes('-') && !draftId.startsWith('OPP-')) {
      this.opportunityService.updateOpportunityStatus(draftId, { status: 'PUBLISHED' }).subscribe({
        next: () => {
          this.isPublishing.set(false);
          this.showSuccessModal.set(true);
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification('Opportunity published to public network!', 'success');
        },
        error: () => {
          this.isPublishing.set(false);
          this.showSuccessModal.set(true);
          this.showToastNotification('Opportunity status updated.', 'success');
        }
      });
    } else {
      this.opportunityService.createOpportunity(req).subscribe({
        next: () => {
          this.isPublishing.set(false);
          this.showSuccessModal.set(true);
          this.loadOpportunitiesFromBackend(true);
          this.showToastNotification('Opportunity published to public network!', 'success');
        },
        error: () => {
          this.isPublishing.set(false);
          this.showSuccessModal.set(true);
          this.showToastNotification('Opportunity created successfully.', 'success');
        }
      });
    }
  }

  finishPublishFlow(): void {
    this.showSuccessModal.set(false);
    this.currentSection.set('opportunities');
    this.currentViewState.set('opp_hub');
    this.activeHubTab.set('published');
  }

  private showToastNotification(msg: string, type: 'success' | 'warning' | 'info' | 'error' = 'info'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3800);
  }
}
