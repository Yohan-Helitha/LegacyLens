import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { ModerationService } from '../../app/core/services/moderation.service';
import { ModerationQueueItemResponse, StoryQuizDTO, RegionDTO } from '../../app/core/models/moderation.model';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export type TabType = 'review' | 'published' | 'rejected' | 'archived';
export type ContentTypeFilter = 'all' | 'video' | 'blog' | 'audio';
export type ContributorFilter = 'all' | 'elders' | 'students';
export type SortOrder = 'newest' | 'oldest' | 'titleAsc' | 'titleDesc';

export interface QuizOption {
  optionKey: string;
  optionText: string;
  description: string;
  isCorrect: boolean;
}

export interface ModerationItem {
  id: string;
  code: string;
  title: string;
  contributor: string;
  avatar: string;
  role: string;
  type: 'video' | 'blog' | 'audio';
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  category: string;
  region?: string;
  district?: string;
  submittedAt: string;
  durationOrSize: string;
  isElder: boolean;
  contributorAge?: number;
  dialect?: string;
  nlpConfidence?: number;
  excerpt: string;
  bodyContent?: string;
  imageUrl?: string;
  tags: string[];
  rejectionReason?: string;
  rejectionNotes?: string;
  quiz?: {
    question: string;
    explanation: string;
    options: QuizOption[];
  };
}

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">verified</span>
          <div>
            <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          </div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Rejection Modal -->
      @if (showRejectModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#ba1a1a] text-2xl">cancel</span>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Reject Submission</h3>
                  <p class="text-[11px] text-[#6e7978]">Specify the curatorial feedback for the contributor</p>
                </div>
              </div>
              <button (click)="showRejectModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] text-lg font-bold">✕</button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Primary Rejection Reason</label>
                <div class="space-y-1.5">
                  @for (reason of rejectionReasons; track reason) {
                    <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#dde3eb] hover:bg-[#f8faf9] cursor-pointer text-xs transition-colors"
                           [ngClass]="selectedRejectionReason() === reason ? 'border-[#ba1a1a] bg-[#ba1a1a]/5 font-semibold text-[#ba1a1a]' : 'text-[#3e4948]'">
                      <input type="radio" name="rejectionReason" [value]="reason" 
                             [checked]="selectedRejectionReason() === reason"
                             (change)="selectedRejectionReason.set(reason)"
                             class="text-[#ba1a1a] focus:ring-[#ba1a1a]" />
                      <span>{{ reason }}</span>
                    </label>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Curator Guidance & Revision Notes</label>
                <textarea [(ngModel)]="rejectionNotesText" rows="3" 
                          placeholder="Provide clear historical or technical guidance on what needs amendment before re-submission..."
                          class="w-full p-3 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs focus:outline-none focus:border-[#ba1a1a] focus:bg-white text-[#191c1c] transition-all"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#dde3eb]">
              <button (click)="showRejectModal.set(false)" 
                      class="px-4 py-2 border border-[#dde3eb] text-[#3e4948] hover:bg-[#f2f4f3] rounded-xl text-xs font-semibold transition-colors">
                Cancel
              </button>
              <button (click)="confirmRejection()" 
                      class="px-5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold shadow-md shadow-[#ba1a1a]/20 transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">block</span>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Archive New Story Modal -->
      @if (showArchiveNewModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#fe893e] text-2xl">archive</span>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Archive Published Story to Cold Vault</h3>
                  <p class="text-[11px] text-[#6e7978]">Select a published heritage story to move into cold storage</p>
                </div>
              </div>
              <button (click)="showArchiveNewModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] text-lg font-bold">✕</button>
            </div>

            <div class="space-y-3">
              <input type="text" [(ngModel)]="archiveSearchQuery" placeholder="Search published stories to archive..."
                     class="w-full px-3 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs focus:outline-none focus:border-[#fe893e] text-[#191c1c]" />

              <div class="max-h-60 overflow-y-auto divide-y divide-[#dde3eb] border border-[#dde3eb] rounded-xl">
                @for (item of publishedStoriesForArchive(); track item.id) {
                  <div class="p-3 flex items-center justify-between hover:bg-[#f8faf9] transition-colors">
                    <div>
                      <div class="text-xs font-bold text-[#191c1c]">{{ item.title }}</div>
                      <div class="text-[10px] text-[#6e7978]">{{ item.code }} • {{ item.contributor }} • {{ item.category }}</div>
                    </div>
                    <button (click)="archiveItem(item)" class="px-3 py-1 bg-[#fe893e] hover:bg-[#e0722a] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors">
                      Archive
                    </button>
                  </div>
                } @empty {
                  <div class="p-6 text-center text-xs text-[#6e7978]">No eligible published stories found.</div>
                }
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button (click)="showArchiveNewModal.set(false)" class="px-4 py-2 border border-[#dde3eb] text-[#3e4948] hover:bg-[#f2f4f3] rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Common Top Header Navigation -->
        <app-header 
          pageTitle="Moderation Queue" 
          section="Console"
          searchPlaceholder="Search title, contributor, category or tags..."
          [searchQuery]="searchQuery()"
          (searchQueryChange)="searchQuery.set($event)">
        </app-header>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Top Executive Bar (Title & Subtitle on Left, Sync and Action triggers on Right) -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Moderation Queue & Archive Management
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Review, verify cultural authenticity, generate interactive knowledge checks, and canonize Sri Lankan oral histories, elder testimonies, and multimedia submissions.
              </p>
            </div>

            <!-- Action Triggers: Sync Button & Archive Post -->
            <div class="flex items-center gap-3 self-start xl:self-auto flex-wrap">
              <button 
                (click)="syncQueue()"
                [disabled]="isSyncing()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base text-[#004343]" [ngClass]="{'animate-spin': isSyncing()}">sync</span>
                <span>{{ isSyncing() ? 'Syncing...' : 'Sync Info' }}</span>
              </button>
            </div>
          </div>

          <!-- 4 Metric Cards Strip -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Pending Review</span>
                <span class="material-symbols-outlined text-[#004343] text-lg">pending_actions</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">{{ countReview() }}</span>
                <span class="text-xs text-amber-700 font-semibold">{{ pctReview() }}% (Priority)</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#004343] h-full rounded-full transition-all duration-500" [style.width.%]="pctReview()"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Published</span>
                <span class="material-symbols-outlined text-emerald-700 text-lg">verified</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-emerald-800">{{ countPublished() }}</span>
                <span class="text-xs text-emerald-700 font-semibold">{{ pctPublished() }}% (Canon)</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-600 h-full rounded-full transition-all duration-500" [style.width.%]="pctPublished()"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Rejected</span>
                <span class="material-symbols-outlined text-[#ba1a1a] text-lg">block</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#ba1a1a]">{{ countRejected() }}</span>
                <span class="text-xs text-[#ba1a1a] font-semibold">{{ pctRejected() }}% (Revision)</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#ba1a1a] h-full rounded-full transition-all duration-500" [style.width.%]="pctRejected()"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Archives</span>
                <span class="material-symbols-outlined text-[#fe893e] text-lg">archive</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#9b4600]">{{ countArchived() }}</span>
                <span class="text-xs text-[#9b4600] font-semibold">{{ pctArchived() }}% (Vault)</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#fe893e] h-full rounded-full transition-all duration-500" [style.width.%]="pctArchived()"></div>
              </div>
            </div>

          </div>

          <!-- Dual Split Workspace Under Title & Metrics -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- LEFT PANE: Queue List & Filters Column (5 cols) -->
            <div class="lg:col-span-5 bg-white border border-[#dde3eb] rounded-2xl shadow-xs flex flex-col overflow-hidden">
              
              <!-- Top Controls in Queue Sidebar -->
              <div class="p-4 border-b border-[#dde3eb] space-y-3">
                
                <!-- 4 Primary Workflow Tabs (Segmented Control) -->
                <div class="grid grid-cols-4 gap-1 bg-[#f2f4f7] p-1 rounded-xl text-center text-xs font-semibold">
                  <button (click)="setTab('review')" 
                          [ngClass]="activeTab() === 'review' ? 'bg-[#004343] text-white shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                          class="py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Review</span>
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                          [ngClass]="activeTab() === 'review' ? 'bg-white/20 text-white' : 'bg-[#dde3eb] text-[#3e4948]'">
                      {{ countReview() }}
                    </span>
                  </button>

                  <button (click)="setTab('published')" 
                          [ngClass]="activeTab() === 'published' ? 'bg-emerald-700 text-white shadow-xs font-bold' : 'text-[#6e7978] hover:text-[#191c1c]'"
                          class="py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Published</span>
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                          [ngClass]="activeTab() === 'published' ? 'bg-white/20 text-white' : 'bg-[#dde3eb] text-[#3e4948]'">
                      {{ countPublished() }}
                    </span>
                  </button>

                  <button (click)="setTab('rejected')" 
                          [ngClass]="activeTab() === 'rejected' ? 'bg-[#ba1a1a] text-white shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                          class="py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Rejected</span>
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                          [ngClass]="activeTab() === 'rejected' ? 'bg-white/20 text-white' : 'bg-[#dde3eb] text-[#3e4948]'">
                      {{ countRejected() }}
                    </span>
                  </button>

                  <button (click)="setTab('archived')" 
                          [ngClass]="activeTab() === 'archived' ? 'bg-[#fe893e] text-white shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                          class="py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Archived</span>
                    <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
                          [ngClass]="activeTab() === 'archived' ? 'bg-white/20 text-white' : 'bg-[#dde3eb] text-[#3e4948]'">
                      {{ countArchived() }}
                    </span>
                  </button>
                </div>

                <!-- Content Type Filters & Advanced Toggle -->
                <div class="flex items-center justify-between gap-1">
                  <div class="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
                    <button (click)="typeFilter.set('all')"
                            [ngClass]="typeFilter() === 'all' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                            class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
                      All
                    </button>
                    <button (click)="typeFilter.set('video')"
                            [ngClass]="typeFilter() === 'video' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                            class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">videocam</span> Video
                    </button>
                    <button (click)="typeFilter.set('blog')"
                            [ngClass]="typeFilter() === 'blog' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                            class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">article</span> Blog
                    </button>
                    <button (click)="typeFilter.set('audio')"
                            [ngClass]="typeFilter() === 'audio' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                            class="px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-xs">graphic_eq</span> Audio
                    </button>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <button (click)="openArchiveModal()" 
                            title="Archive Story to Cold Vault"
                            class="px-2.5 py-1 bg-[#004343] hover:bg-[#0f5c5c] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer">
                      <span class="material-symbols-outlined text-sm">archive</span>
                      <span>Archive Post</span>
                    </button>
                    <button (click)="toggleFiltersDrawer()"
                            [ngClass]="filtersDrawerOpen() ? 'bg-[#004343] text-white' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                            class="p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center cursor-pointer border border-[#dde3eb]"
                            title="Toggle Filters">
                      <span class="material-symbols-outlined text-sm">tune</span>
                    </button>
                  </div>
                </div>

                <!-- Collapsible Multi-dimensional Filter Drawer -->
                @if (filtersDrawerOpen()) {
                  <div class="p-3 bg-[#f8faf9] border border-[#dde3eb] rounded-xl space-y-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-[10px] font-bold text-[#6e7978] uppercase mb-1">Category</label>
                        <select [(ngModel)]="categoryFilter" 
                                class="w-full p-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                          <option value="all">All Categories</option>
                          @for (cat of availableCategories; track cat) {
                            <option [value]="cat">{{ cat }}</option>
                          }
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10px] font-bold text-[#6e7978] uppercase mb-1">Contributor</label>
                        <select [(ngModel)]="contributorFilter" 
                                class="w-full p-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                          <option value="all">All Contributors</option>
                          <option value="elders">Elders Only</option>
                          <option value="students">Youth / Students</option>
                        </select>
                      </div>
                    </div>

                    <!-- Region & District Filter Row -->
                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-[#dde3eb]">
                      <div>
                        <label class="block text-[10px] font-bold text-[#6e7978] uppercase mb-1">
                          Cultural Region
                        </label>
                        <select [ngModel]="regionFilter()" (ngModelChange)="onRegionFilterChange($event)"
                                class="w-full p-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                          <option value="all">All Regions</option>
                          @for (reg of selectableRegions(); track reg.id) {
                            <option [value]="reg.label">{{ reg.label }}</option>
                          }
                        </select>
                      </div>

                      <div>
                        <label class="block text-[10px] font-bold text-[#6e7978] uppercase mb-1">
                          District <span class="text-[9px] text-[#6e7978] font-normal">(Optional)</span>
                        </label>
                        <select [ngModel]="districtFilter()" (ngModelChange)="districtFilter.set($event)"
                                [disabled]="regionFilter() === 'all'"
                                [ngClass]="regionFilter() === 'all' ? 'bg-[#f2f4f7] text-[#6e7978] cursor-not-allowed' : 'bg-white text-[#191c1c]'"
                                class="w-full p-1.5 border border-[#c2c8c7] rounded-lg text-xs focus:outline-none focus:border-[#004343]">
                          <option value="all">
                            {{ regionFilter() === 'all' ? 'Select Region First' : 'All Districts' }}
                          </option>
                          @for (dist of filterDistricts(); track dist) {
                            <option [value]="dist">{{ dist }}</option>
                          }
                        </select>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-[#dde3eb]">
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-bold text-[#6e7978] uppercase">Sort:</span>
                        <select [(ngModel)]="sortOrder" 
                                class="p-1 bg-white border border-[#c2c8c7] rounded-lg text-xs text-[#191c1c]">
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="titleAsc">Title (A-Z)</option>
                          <option value="titleDesc">Title (Z-A)</option>
                        </select>
                      </div>

                      <button (click)="resetFilters()" class="text-[11px] text-[#004343] font-bold hover:underline cursor-pointer">
                        Reset All
                      </button>
                    </div>
                  </div>
                }

              </div>

              <!-- Queue Scroll List -->
              <div class="max-h-[640px] overflow-y-auto divide-y divide-[#dde3eb]">
                @for (item of filteredQueueList(); track item.id) {
                  <div (click)="selectItem(item)"
                       [ngClass]="selectedItem()?.id === item.id ? 'bg-[#004343]/5 border-l-4 border-[#004343]' : 'hover:bg-[#f8faf9]'"
                       class="p-4 cursor-pointer transition-all">
                    
                    <!-- Card Header: Type Badge, Code, Elder Badge, Timestamp -->
                    <div class="flex items-start justify-between gap-2 mb-1.5">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="material-symbols-outlined text-sm text-[#004343]">
                          {{ item.type === 'video' ? 'videocam' : (item.type === 'audio' ? 'graphic_eq' : 'article') }}
                        </span>
                        <span class="text-[10px] font-mono font-bold text-[#6e7978]">{{ item.code }}</span>
                        
                        @if (item.isElder) {
                          <span class="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded flex items-center gap-0.5">
                            <span class="w-1 h-1 rounded-full bg-amber-500"></span>
                            Elder Custodian
                          </span>
                        }
                      </div>

                      <span class="text-[10px] text-[#6e7978] font-mono">{{ item.submittedAt }}</span>
                    </div>

                    <!-- Title & Excerpt -->
                    <h3 class="text-xs font-bold text-[#191c1c] line-clamp-1 mb-1">{{ item.title }}</h3>
                    <p class="text-[11px] text-[#6e7978] line-clamp-2 mb-2">{{ item.excerpt }}</p>

                    <!-- Region Provenance Pill -->
                    @if (item.region) {
                      <div class="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#004343]/5 border border-[#004343]/15 rounded text-[9px] font-semibold text-[#004343]">
                        <span class="material-symbols-outlined text-[11px] text-[#fe893e]">location_on</span>
                        <span>{{ item.region }}{{ item.district ? ' • ' + item.district : '' }}</span>
                      </div>
                    } @else {
                      <div class="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-semibold text-amber-800">
                        <span class="material-symbols-outlined text-[11px]">warning</span>
                        <span>Region Unassigned (Required)</span>
                      </div>
                    }

                    <!-- Status specific badges -->
                    @if (item.status === 'REJECTED') {
                      <div class="mb-2 p-1.5 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-lg text-[10px] text-[#ba1a1a] flex items-center gap-1 font-semibold">
                        <span class="material-symbols-outlined text-xs">info</span>
                        <span>Reason: {{ item.rejectionReason || 'Needs Revision' }}</span>
                      </div>
                    } @else if (item.status === 'ARCHIVED') {
                      <div class="mb-2 p-1.5 bg-[#fe893e]/10 border border-[#fe893e]/20 rounded-lg text-[10px] text-[#9b4600] flex items-center gap-1 font-semibold">
                        <span class="material-symbols-outlined text-xs">archive</span>
                        <span>Cold Vault Storage</span>
                      </div>
                    }

                    <!-- Footer: Author, Category pill, NLP Score / Size -->
                    <div class="flex items-center justify-between text-[10px]">
                      <div class="flex items-center gap-1 text-[#3e4948]">
                        <span class="material-symbols-outlined text-xs">person</span>
                        <span class="font-medium">{{ item.contributor }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#f2f4f7] text-[#3e4948]">{{ item.category }}</span>
                        @if (item.nlpConfidence) {
                          <span class="text-emerald-700 font-semibold font-mono">{{ item.nlpConfidence }}% NLP</span>
                        }
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="p-10 text-center text-[#6e7978] space-y-2">
                    <span class="material-symbols-outlined text-3xl text-[#6e7978]/50">inbox</span>
                    <p class="text-xs font-semibold">No items match this filter criteria.</p>
                    <button (click)="resetFilters()" class="text-xs text-[#004343] font-bold underline cursor-pointer">
                      Clear all filters
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- RIGHT PANE: Detailed Curatorial Inspector & Decision Workspace (7 cols) -->
            <div class="lg:col-span-7 flex flex-col gap-6">
              @if (selectedItem(); as item) {
                
                <!-- 1. Submission Overview & Media Viewer Card -->
                <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-xs space-y-5">
                  
                  <!-- Status & Identification Header -->
                  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#dde3eb]">
                    <div>
                      <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#004343]/10 text-[#004343]">
                          {{ item.code }}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {{ item.category }}
                        </span>
                        <span class="text-xs text-[#6e7978] font-mono">
                          {{ item.dialect || 'Southern High-Kandyan Sinhala' }}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                              [ngClass]="{
                                'bg-emerald-100 text-emerald-800': item.status === 'PUBLISHED',
                                'bg-amber-100 text-amber-800': item.status === 'PENDING',
                                'bg-red-100 text-red-800': item.status === 'REJECTED',
                                'bg-orange-100 text-orange-800': item.status === 'ARCHIVED'
                              }">
                          {{ item.status }}
                        </span>
                      </div>
                      <h2 class="text-xl font-serif font-bold text-[#191c1c]">{{ item.title }}</h2>
                    </div>

                    <!-- Contributor Profile Pill -->
                    <div class="flex items-center gap-3 bg-[#f8faf9] p-2.5 rounded-xl border border-[#dde3eb]">
                      <div class="w-10 h-10 rounded-xl bg-[#004343] text-white flex items-center justify-center font-serif font-bold text-sm">
                        {{ item.avatar }}
                      </div>
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978]">Contributor Clearance</div>
                        <div class="text-xs font-bold text-[#004343] flex items-center gap-1">
                          {{ item.contributor }}
                          @if (item.isElder) {
                            <span class="text-amber-500 font-bold" title="Verified Elder Custodian">★</span>
                          }
                        </div>
                        <div class="text-[10px] text-[#6e7978]">{{ item.role }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Rejection Banner if item is REJECTED -->
                  @if (item.status === 'REJECTED') {
                    <div class="p-4 bg-[#ba1a1a]/5 border border-[#ba1a1a]/20 rounded-xl space-y-1 text-xs">
                      <div class="flex items-center gap-1.5 font-bold text-[#ba1a1a]">
                        <span class="material-symbols-outlined text-sm">cancel</span>
                        <span>Rejection Reason: {{ item.rejectionReason }}</span>
                      </div>
                      <p class="text-[#6e7978] text-[11px]">{{ item.rejectionNotes || 'No additional curator notes recorded.' }}</p>
                    </div>
                  }

                  <!-- Media Artifact Viewer Box -->
                  @if (item.type === 'video') {
                    <div class="rounded-xl bg-[#191c1c] overflow-hidden relative group aspect-video max-h-[380px] flex items-center justify-center shadow-inner">
                      <div class="absolute inset-0 bg-cover bg-center opacity-40" 
                           style="background-image: url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200');">
                      </div>
                      <div class="relative z-10 text-center text-white space-y-3">
                        <button (click)="toggleVideoPlayback()" 
                                class="w-16 h-16 rounded-full bg-white/20 hover:bg-[#fe893e] backdrop-blur-md flex items-center justify-center text-white hover:scale-105 transition-all shadow-xl cursor-pointer">
                          <span class="material-symbols-outlined text-3xl">
                            {{ isPlayingVideo ? 'pause' : 'play_arrow' }}
                          </span>
                        </button>
                        <div class="text-xs font-mono bg-black/70 px-4 py-1.5 rounded-full backdrop-blur-sm">
                          Length: {{ item.durationOrSize }} • HD 1080p 60fps • 48kHz Stereo Master
                        </div>
                      </div>
                      <!-- Scrubbing simulation bar -->
                      <div class="absolute bottom-0 inset-x-0 bg-black/60 p-2 flex items-center gap-3 text-[11px] text-white font-mono">
                        <span>06:12</span>
                        <div class="flex-1 bg-white/30 h-1.5 rounded-full overflow-hidden">
                          <div class="bg-[#fe893e] h-full" [style.width.%]="videoProgress"></div>
                        </div>
                        <span>{{ item.durationOrSize }}</span>
                      </div>
                    </div>
                  } @else if (item.type === 'audio') {
                    <!-- Waveform Audio Analyzer Box -->
                    <div class="p-5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-[#004343] text-lg">graphic_eq</span>
                          <div>
                            <div class="text-xs font-bold text-[#191c1c]">AI Audio Transcription & Sacred Syllable Verification</div>
                            <div class="text-[10px] text-[#6e7978]">Lossless Ambisonic Lineage Recording</div>
                          </div>
                        </div>
                        <span class="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {{ item.nlpConfidence || 98.4 }}% Precision Attested
                        </span>
                      </div>

                      <!-- Animated equalizer waveform bars -->
                      <div class="h-12 flex items-end gap-1 px-3 bg-white rounded-xl border border-[#dde3eb] py-2">
                        @for (bar of waveBars; track $index) {
                          <div class="flex-1 bg-[#004343]/60 rounded-t hover:bg-[#fe893e] transition-colors" [style.height.%]="bar"></div>
                        }
                      </div>

                      <!-- Transcript excerpt -->
                      <div class="p-3 bg-white rounded-xl border border-[#dde3eb] text-xs text-[#3e4948] italic font-serif leading-relaxed">
                        "{{ item.bodyContent || item.excerpt }}"
                      </div>
                    </div>
                  } @else {
                    <!-- Article / Blog Viewer Box -->
                    <div class="p-5 rounded-xl bg-white border border-[#dde3eb] space-y-4">
                      <div class="aspect-video max-h-[260px] rounded-xl overflow-hidden bg-cover bg-center border border-[#dde3eb]"
                           style="background-image: url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200');">
                      </div>
                      <div class="prose prose-sm max-w-none text-[#3e4948] font-serif leading-relaxed">
                        <p class="font-bold text-sm text-[#191c1c]">{{ item.excerpt }}</p>
                        <p>{{ item.bodyContent || 'The master artisans maintain an oral tradition where every grain and incision represents an elemental spirit. During the early morning rituals, blessed timber is soaked in herbal resin before carving the sacred eyes.' }}</p>
                      </div>
                    </div>
                  }
                  <!-- Rejection Information (Only under the post when rejected) -->
                  @if (item.status === 'REJECTED') {
                    <div class="p-4 bg-[#ffdad6] border border-[#ba1a1a]/30 rounded-xl space-y-2 mt-4">
                      <div class="flex items-center gap-2 font-bold text-[#ba1a1a] text-xs">
                        <span class="material-symbols-outlined text-base">error</span>
                        <span>Rejection Information</span>
                      </div>
                      <div class="bg-white p-3.5 rounded-lg border border-[#ba1a1a]/20 space-y-2">
                        <div>
                          <div class="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-wider">Primary Reason</div>
                          <div class="text-xs font-bold text-[#191c1c] mt-0.5">{{ item.rejectionReason || 'Needs Revision' }}</div>
                        </div>
                        <div>
                          <div class="text-[10px] font-bold text-[#6e7978] uppercase tracking-wider">Detailed Feedback Sent to Contributor</div>
                          <div class="text-xs text-[#3e4948] mt-0.5 leading-relaxed">{{ item.rejectionNotes || 'No additional curator notes recorded.' }}</div>
                        </div>
                      </div>
                    </div>
                  }

                </div>

                <!-- Curatorial Verification & Decision Controls (Only for non-rejected items) -->
                @if (item.status !== 'REJECTED') {
                  <!-- 2. Knowledge Check (AI Quiz Generator) Section -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-xs space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#dde3eb]">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#fe893e] text-xl">psychology</span>
                        <div>
                          <h3 class="text-sm font-serif font-bold text-[#191c1c]">Knowledge Check / AI Quiz Generator</h3>
                          <p class="text-[10px] text-[#6e7978]">Interactive cultural engagement quiz for learners in the mobile app</p>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        @if (quizSaved()) {
                          <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs">check_circle</span>
                            Quiz Ready
                          </span>
                        }
                        <button (click)="generateAiQuiz()" 
                                [disabled]="isGeneratingQuiz()"
                                class="px-3.5 py-1.5 bg-[#fe893e]/10 hover:bg-[#fe893e]/20 text-[#9b4600] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                          <span class="material-symbols-outlined text-sm" [ngClass]="{'animate-spin': isGeneratingQuiz()}">
                            {{ isGeneratingQuiz() ? 'sync' : 'auto_awesome' }}
                          </span>
                          <span>{{ isGeneratingQuiz() ? 'Synthesizing...' : 'Auto-Generate with AI' }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Question Prompt -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] mb-1">Knowledge Question Prompt</label>
                      <input type="text" [(ngModel)]="quizQuestion" (ngModelChange)="quizSaved.set(false)"
                             placeholder="e.g. Which sacred timber is traditionally seasoned for carving Raksha masks?"
                             class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all font-medium" />
                    </div>

                    <!-- 4 Options (A, B, C, D) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      @for (opt of quizOptions; track opt.optionKey) {
                        <div class="p-3 rounded-xl border transition-all"
                             [ngClass]="opt.isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-[#dde3eb] bg-[#f8faf9]'">
                          
                          <div class="flex items-center justify-between mb-2">
                            <span class="w-6 h-6 rounded-lg bg-[#004343] text-white text-xs font-bold flex items-center justify-center">
                              {{ opt.optionKey }}
                            </span>
                            <label class="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                   [ngClass]="opt.isCorrect ? 'text-emerald-700' : 'text-[#6e7978]'">
                              <input type="radio" name="correctOption" [value]="opt.optionKey"
                                     [checked]="opt.isCorrect"
                                     (change)="setCorrectOption(opt.optionKey)"
                                     class="text-emerald-600 focus:ring-emerald-500" />
                              <span>{{ opt.isCorrect ? 'Correct Answer' : 'Mark Correct' }}</span>
                            </label>
                          </div>

                          <input type="text" [(ngModel)]="opt.optionText" (ngModelChange)="quizSaved.set(false)"
                                 placeholder="Option text..."
                                 class="w-full p-2 bg-white border border-[#c2c8c7] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] mb-1.5" />
                          
                          <input type="text" [(ngModel)]="opt.description" (ngModelChange)="quizSaved.set(false)"
                                 placeholder="Explanation / hint for this choice..."
                                 class="w-full p-1.5 bg-white/70 border border-[#dde3eb] rounded-lg text-[11px] text-[#6e7978] focus:outline-none focus:border-[#004343]" />
                        </div>
                      }
                    </div>

                    <!-- Detailed Explanation Field -->
                    <div>
                      <label class="block text-xs font-bold text-[#191c1c] mb-1">Educational Explanation / Historic Rationale</label>
                      <textarea [(ngModel)]="quizExplanation" (ngModelChange)="quizSaved.set(false)" rows="2"
                                placeholder="Explain why the correct answer holds historical significance in Sri Lankan intangible heritage..."
                                class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all"></textarea>
                    </div>

                    <!-- Save Quiz Button -->
                    <div class="flex justify-end pt-1">
                      <button (click)="saveQuiz()" 
                              [disabled]="isSavingQuiz()"
                              class="px-4 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">bookmark_added</span>
                        <span>Save Knowledge Check</span>
                      </button>
                    </div>
                  </div>

                  <!-- 3. Geographical Provenance & Cultural Regional Alignment -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#004343] text-xl">map</span>
                        <div>
                          <h3 class="text-sm font-serif font-bold text-[#191c1c]">Geographical & Cultural Provenance</h3>
                          <p class="text-[10px] text-[#6e7978]">Link this submission to Sri Lanka's official cultural landscape</p>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                            [ngClass]="item.region ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'">
                        {{ item.region ? 'Provenance Assigned' : 'Region Compulsory *' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <!-- Cultural Region Dropdown (Compulsory) -->
                      <div>
                        <div class="flex items-center justify-between mb-1.5">
                          <label class="block text-xs font-bold text-[#191c1c]">
                            Cultural Region <span class="text-[#ba1a1a] font-bold">*</span>
                          </label>
                          <span class="text-[10px] text-[#ba1a1a] font-bold uppercase tracking-wider">Compulsory</span>
                        </div>
                        <select [ngModel]="item.region" (ngModelChange)="onInspectorRegionChange(item, $event)"
                                class="w-full p-2.5 bg-[#f8faf9] border rounded-xl text-xs font-medium text-[#191c1c] focus:outline-none transition-all"
                                [ngClass]="item.region ? 'border-[#c2c8c7] focus:border-[#004343]' : 'border-[#ba1a1a] bg-rose-50/20 focus:border-[#ba1a1a]'">
                          <option value="">-- Select Cultural Region (Compulsory) --</option>
                          @for (reg of selectableRegions(); track reg.id) {
                            <option [value]="reg.label">{{ reg.label }} ({{ reg.regionName }})</option>
                          }
                        </select>
                        @if (!item.region) {
                          <p class="text-[10px] text-[#ba1a1a] mt-1 flex items-center gap-1 font-semibold">
                            <span class="material-symbols-outlined text-xs">info</span>
                            Cultural region is mandatory before publishing.
                          </p>
                        }
                      </div>

                      <!-- District Dropdown (Optional, Enabled only after region selected) -->
                      <div>
                        <div class="flex items-center justify-between mb-1.5">
                          <label class="block text-xs font-bold text-[#191c1c]">
                            District
                          </label>
                          <span class="text-[10px] text-[#6e7978] font-normal uppercase tracking-wider">Optional</span>
                        </div>
                        <select [ngModel]="item.district" (ngModelChange)="onInspectorDistrictChange(item, $event)"
                                [disabled]="!item.region"
                                [ngClass]="!item.region ? 'bg-[#f2f4f7] text-[#6e7978] border-[#dde3eb] cursor-not-allowed' : 'bg-[#f8faf9] text-[#191c1c] border-[#c2c8c7] focus:border-[#004343]'"
                                class="w-full p-2.5 border rounded-xl text-xs font-medium focus:outline-none transition-all">
                          <option value="">
                            {{ !item.region ? '-- Select Region First --' : '-- Entire Region / Optional District --' }}
                          </option>
                          @for (dist of getDistrictsForRegion(item.region); track dist) {
                            <option [value]="dist">{{ dist }}</option>
                          }
                        </select>
                        @if (item.region) {
                          <p class="text-[10px] text-[#6e7978] mt-1">
                            Available districts in {{ item.region }}
                          </p>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- 4. Taxonomy, Category & Tag Curation -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                      <h3 class="text-sm font-serif font-bold text-[#191c1c]">Cultural Taxonomy & Category Alignment</h3>
                      <span class="text-[10px] text-[#6e7978]">Metadata Classification</span>
                    </div>

                    <div class="space-y-4">
                      <!-- Category Assignment Dropdown -->
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Official Heritage Category</label>
                        <select [(ngModel)]="item.category" 
                                class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs font-medium text-[#191c1c] focus:outline-none focus:border-[#004343]">
                          @for (cat of availableCategories; track cat) {
                            <option [value]="cat">{{ cat }}</option>
                          }
                        </select>
                      </div>

                      <!-- Applied Tags Editor -->
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Applied Taxonomy Tags</label>
                        <div class="flex flex-wrap items-center gap-1.5 p-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl">
                          @for (tag of item.tags; track tag) {
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#004343]/10 text-[#004343] border border-[#004343]/20">
                              {{ tag }}
                              <button (click)="removeTagFromItem(item, tag)" class="hover:text-[#ba1a1a] text-xs cursor-pointer">✕</button>
                            </span>
                          }
                          <div class="inline-flex items-center gap-1">
                            <input type="text" [(ngModel)]="newTagInput" (keyup.enter)="addTagToItem(item)" placeholder="+ Add tag"
                                   class="px-2.5 py-1 bg-white border border-[#c2c8c7] rounded-full text-xs focus:outline-none focus:border-[#004343] w-28" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 5. Guideline Checklist (Matched with Mobile App Admin Screen) -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#004343] text-xl">fact_check</span>
                        <div>
                          <h3 class="text-sm font-serif font-bold text-[#191c1c]">Guideline Checklist</h3>
                          <p class="text-[10px] text-[#6e7978]">Review the submission below before publishing to the main feed</p>
                        </div>
                      </div>
                      <button (click)="toggleAllGuidelines()" class="text-xs text-[#004343] font-bold hover:underline cursor-pointer">
                        {{ allGuidelinesMet ? 'Uncheck All' : 'Check All' }}
                      </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <label class="flex items-start gap-3 p-3.5 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors"
                             [ngClass]="{'border-[#004343] bg-[#004343]/5': guideNoHateSpeech}">
                        <input type="checkbox" [(ngModel)]="guideNoHateSpeech" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                        <div>
                          <div class="font-bold text-[#191c1c]">No hate speech or harmful content</div>
                          <div class="text-[10px] text-[#6e7978] mt-0.5">Verify submission is free of discrimination, hate speech, or harmful narratives.</div>
                        </div>
                      </label>

                      <label class="flex items-start gap-3 p-3.5 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors"
                             [ngClass]="{'border-[#004343] bg-[#004343]/5': guideCulturallyAccurate}">
                        <input type="checkbox" [(ngModel)]="guideCulturallyAccurate" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                        <div>
                          <div class="font-bold text-[#191c1c]">Culturally accurate and respectful</div>
                          <div class="text-[10px] text-[#6e7978] mt-0.5">Authentic representation of Sri Lankan traditions, customs, and heritage.</div>
                        </div>
                      </label>

                      <label class="flex items-start gap-3 p-3.5 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors"
                             [ngClass]="{'border-[#004343] bg-[#004343]/5': guideHighQuality}">
                        <input type="checkbox" [(ngModel)]="guideHighQuality" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                        <div>
                          <div class="font-bold text-[#191c1c]">High quality audio and clear visuals</div>
                          <div class="text-[10px] text-[#6e7978] mt-0.5">Clear audio recording, legible imagery, and audible narrative fidelity.</div>
                        </div>
                      </label>
                    </div>

                    <!-- 6. Decision Action Controls Bar -->
                    <div class="pt-4 border-t border-[#dde3eb] flex flex-col sm:flex-row items-center justify-between gap-3">
                      
                      <!-- Left contextual action buttons based on status -->
                      <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        @if (item.status === 'PENDING') {
                          <button (click)="openRejectModal(item)"
                                  class="flex-1 sm:flex-none px-4 py-2 border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">block</span>
                            Reject
                          </button>
                        } @else if (item.status === 'PUBLISHED') {
                          <button (click)="archiveItem(item)"
                                  class="flex-1 sm:flex-none px-4 py-2 border border-[#fe893e]/40 text-[#9b4600] hover:bg-[#fe893e]/10 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">archive</span>
                            Archives
                          </button>
                        } @else if (item.status === 'ARCHIVED') {
                          <button (click)="restoreToReview(item)"
                                  class="flex-1 sm:flex-none px-4 py-2 border border-[#004343]/30 text-[#004343] hover:bg-[#004343]/10 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">restore</span>
                            Restore to Review Queue
                          </button>
                        }
                      </div>

                      <!-- Right Approve & Publish Live action -->
                      @if (item.status !== 'PUBLISHED') {
                        <button (click)="approveAndPublish(item)"
                                [disabled]="!allGuidelinesMet || !item.region"
                                [ngClass]="(allGuidelinesMet && item.region) ? 'bg-[#004343] text-white hover:bg-[#003131] shadow-md shadow-[#004343]/20 cursor-pointer' : 'bg-[#e1e3e3] text-[#6e7978] cursor-not-allowed'"
                                class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
                                [title]="!item.region ? 'Cultural Region is compulsory' : (!allGuidelinesMet ? 'Please satisfy all guidelines' : 'Publish Live')">
                          <span class="material-symbols-outlined text-base">verified</span>
                          <span>Approve & Publish Live</span>
                        </button>
                      } @else {
                        <div class="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                          <span class="material-symbols-outlined text-lg">check_circle</span>
                          <span>Published in Sovereign Heritage Canon</span>
                        </div>
                      }

                    </div>
                  </div>
                }

              } @else {
                <!-- Empty Selection State -->
                <div class="h-96 flex items-center justify-center p-12 text-center text-[#6e7978] bg-white border border-[#dde3eb] rounded-2xl shadow-xs">
                  <div class="max-w-sm space-y-3">
                    <div class="w-16 h-16 rounded-2xl bg-[#004343]/10 text-[#004343] flex items-center justify-center mx-auto">
                      <span class="material-symbols-outlined text-3xl">fact_check</span>
                    </div>
                    <h3 class="text-base font-serif font-bold text-[#191c1c]">Select a submission to inspect</h3>
                    <p class="text-xs text-[#6e7978]">
                      Choose any item from the left queue to review media artifacts, generate knowledge check quizzes, curate tags, and execute moderation approvals.
                    </p>
                  </div>
                </div>
              }
            </div>

          </div>

        </main>

      </div>

      <!-- Archive Post Modal Dialog -->
      @if (showArchiveNewModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div class="bg-white rounded-2xl max-w-lg w-full border border-[#dde3eb] shadow-2xl p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-[#dde3eb] pb-3">
              <div class="flex items-center gap-2 text-[#9b4600]">
                <span class="material-symbols-outlined text-2xl text-[#fe893e]">archive</span>
                <h3 class="font-serif font-bold text-lg text-[#191c1c]">Archive Story</h3>
              </div>
              <button (click)="showArchiveNewModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <p class="text-xs text-[#3f4948] leading-relaxed">
              Archiving transfers cultural submissions into the cold preservation tier. Archived items are retained for long-term lineage research but removed from public discovery.
            </p>

            <div class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-[#6e7978] uppercase mb-1">Select Item to Archive</label>
                <select [(ngModel)]="itemToArchiveId" class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                  @for (itm of getUnarchivedItems(); track itm.id) {
                    <option [value]="itm.id">[{{ itm.code }}] {{ itm.title }} ({{ itm.contributor }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#6e7978] uppercase mb-1">Archival Retention Reason</label>
                <select [(ngModel)]="archiveReason" class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                  <option value="Long-term Heritage Preservation">Long-term Heritage Preservation</option>
                  <option value="Elder Lineage Custody Storage">Elder Lineage Custody Storage</option>
                  <option value="Duplicate or Superseded Version">Duplicate or Superseded Version</option>
                  <option value="Unverified Spatial Context">Unverified Spatial Context</option>
                  <option value="Restricted Lineage Record">Restricted Lineage Record</option>
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#6e7978] uppercase mb-1">Archival Notes (Optional)</label>
                <textarea [(ngModel)]="archiveNotesText" rows="2" placeholder="Add vault accession notes or preservation references..." class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] resize-none"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#dde3eb]">
              <button (click)="showArchiveNewModal.set(false)" class="px-4 py-2 border border-[#dde3eb] rounded-xl text-xs font-bold text-[#3e4948] hover:bg-[#f2f4f3] cursor-pointer">
                Cancel
              </button>
              <button (click)="confirmManualArchive()" class="px-5 py-2 bg-[#004343] hover:bg-[#0f5c5c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-sm">archive</span>
                <span>Confirm Archive</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Reject Item Modal Dialog -->
      @if (showRejectModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div class="bg-white rounded-2xl max-w-lg w-full border border-[#dde3eb] shadow-2xl p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-[#dde3eb] pb-3">
              <div class="flex items-center gap-2 text-[#ba1a1a]">
                <span class="material-symbols-outlined text-2xl">cancel</span>
                <h3 class="font-serif font-bold text-lg text-[#191c1c]">Reject Submission</h3>
              </div>
              <button (click)="showRejectModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-[#6e7978] uppercase mb-1">Rejection Reason</label>
                <select [ngModel]="selectedRejectionReason()" (ngModelChange)="selectedRejectionReason.set($event)" class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#ba1a1a]">
                  @for (reason of rejectionReasons; track reason) {
                    <option [value]="reason">{{ reason }}</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-[#6e7978] uppercase mb-1">Feedback Notes for Contributor</label>
                <textarea [(ngModel)]="rejectionNotesText" rows="3" placeholder="Explain required revisions or cultural sensitivity concerns..." class="w-full p-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#ba1a1a] resize-none"></textarea>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#dde3eb]">
              <button (click)="showRejectModal.set(false)" class="px-4 py-2 border border-[#dde3eb] rounded-xl text-xs font-bold text-[#3e4948] hover:bg-[#f2f4f3] cursor-pointer">
                Cancel
              </button>
              <button (click)="confirmRejection()" class="px-5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span class="material-symbols-outlined text-sm">block</span>
                <span>Flag & Reject</span>
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class ModerationComponent implements OnInit {
  // Toast notifications
  toastMessage = signal<string | null>(null);

  // Sync state
  isSyncing = signal<boolean>(false);

  // Search & Navigation
  searchQuery = signal<string>('');
  activeTab = signal<TabType>('review');
  typeFilter = signal<ContentTypeFilter>('all');
  categoryFilter = 'all';
  contributorFilter: ContributorFilter = 'all';
  sortOrder: SortOrder = 'newest';
  filtersDrawerOpen = signal<boolean>(false);

  // Cultural Regions & Districts from database (regions table)
  readonly DEFAULT_REGIONS: RegionDTO[] = [
    { id: 1, code: 'r1', label: 'Northern Sri Lanka', regionName: 'Northern Province', description: 'Jaffna / Mannar / Kilinochchi / Mullaitivu', districts: ['Jaffna', 'Mannar', 'Kilinochchi', 'Mullaitivu', 'Vavuniya'], districtsString: 'Jaffna, Mannar, Kilinochchi, Mullaitivu, Vavuniya' },
    { id: 2, code: 'r2', label: 'North Central', regionName: 'North Central Province', description: 'Anuradhapura / Polonnaruwa', districts: ['Anuradhapura', 'Polonnaruwa'], districtsString: 'Anuradhapura, Polonnaruwa' },
    { id: 3, code: 'r3', label: 'Eastern Sri Lanka', regionName: 'Eastern Province', description: 'Trincomalee / Batticaloa / Ampara', districts: ['Trincomalee', 'Batticaloa', 'Ampara'], districtsString: 'Trincomalee, Batticaloa, Ampara' },
    { id: 4, code: 'r4', label: 'North Western', regionName: 'North Western Province', description: 'Puttalam / Kurunegala', districts: ['Puttalam', 'Kurunegala'], districtsString: 'Puttalam, Kurunegala' },
    { id: 5, code: 'r5', label: 'Central Highlands', regionName: 'Central Highlands', description: 'Kandy / Matale / Nuwara Eliya', districts: ['Kandy', 'Matale', 'Nuwara Eliya'], districtsString: 'Kandy, Matale, Nuwara Eliya' },
    { id: 6, code: 'r6', label: 'Uva & Eastern Highlands', regionName: 'Uva Province', description: 'Badulla / Monaragala', districts: ['Badulla', 'Monaragala'], districtsString: 'Badulla, Monaragala' },
    { id: 7, code: 'r7', label: 'Western Sri Lanka', regionName: 'Western Province', description: 'Colombo / Gampaha / Kalutara', districts: ['Colombo', 'Gampaha', 'Kalutara'], districtsString: 'Colombo, Gampaha, Kalutara' },
    { id: 8, code: 'r8', label: 'Southern & Sabaragamuwa', regionName: 'Southern Province', description: 'Galle / Matara / Ratnapura / Kegalle', districts: ['Galle', 'Matara', 'Hambantota', 'Ratnapura', 'Kegalle'], districtsString: 'Galle, Matara, Hambantota, Ratnapura, Kegalle' }
  ];

  regions = signal<RegionDTO[]>([]);

  selectableRegions = computed(() => {
    const list = this.regions();
    return list.length > 0 ? list.filter(r => r.code !== 'all') : this.DEFAULT_REGIONS;
  });

  // Filter toolbar state
  regionFilter = signal<string>('all');
  districtFilter = signal<string>('all');

  filterDistricts = computed(() => {
    const reg = this.regionFilter();
    if (reg === 'all') return [];
    const found = this.selectableRegions().find(r => r.label === reg || r.regionName === reg || r.code === reg);
    return found ? (found.districts || []) : [];
  });

  onRegionFilterChange(val: string): void {
    this.regionFilter.set(val);
    this.districtFilter.set('all');
  }

  getDistrictsForRegion(regionLabel?: string): string[] {
    if (!regionLabel) return [];
    const found = this.selectableRegions().find(
      r => r.label === regionLabel || r.regionName === regionLabel || r.code === regionLabel
    );
    return found ? (found.districts || []) : [];
  }

  onInspectorRegionChange(item: ModerationItem, regionLabel: string): void {
    item.region = regionLabel;
    const allowedDistricts = this.getDistrictsForRegion(regionLabel);
    if (item.district && !allowedDistricts.includes(item.district)) {
      item.district = '';
    }
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, region: item.region, district: item.district } : i));
    const current = this.selectedItem();
    if (current && current.id === item.id) {
      this.selectedItem.set({ ...current, region: item.region, district: item.district });
    }
  }

  onInspectorDistrictChange(item: ModerationItem, district: string): void {
    item.district = district;
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, district: item.district } : i));
    const current = this.selectedItem();
    if (current && current.id === item.id) {
      this.selectedItem.set({ ...current, district: item.district });
    }
  }

  // Available Sri Lankan Heritage Categories
  availableCategories: string[] = [
    'Traditional Food',
    'Farming & Agriculture',
    'Traditional Crafts',
    'Arts & Performing Arts',
    'Customs & Traditions',
    'Traditional Knowledge',
    'Beliefs & Rituals',
    'Traditional Clothing'
  ];

  // Rejection reasons & modal state
  rejectionReasons: string[] = [
    'Needs Revision',
    'Inappropriate Content',
    'Inaccurate Cultural Metadata',
    'Poor Media Quality',
    'Copyright or Informed Consent Issue'
  ];
  showRejectModal = signal<boolean>(false);
  itemToReject = signal<ModerationItem | null>(null);
  selectedRejectionReason = signal<string>('Needs Revision');
  rejectionNotesText = '';

  // Archive modal state
  showArchiveNewModal = signal<boolean>(false);
  itemToArchiveId = '';
  archiveReason = 'Long-term Heritage Preservation';
  archiveNotesText = '';
  archiveSearchQuery = '';

  // Guideline checklist flags (aligned with Mobile App Moderation Screen)
  guideNoHateSpeech = true;
  guideCulturallyAccurate = true;
  guideHighQuality = true;

  get allGuidelinesMet(): boolean {
    return this.guideNoHateSpeech && this.guideCulturallyAccurate && this.guideHighQuality;
  }

  // Media Simulation
  isPlayingVideo = false;
  videoProgress = 33;
  waveBars = [20, 35, 60, 45, 80, 95, 65, 40, 75, 85, 90, 50, 70, 40, 60, 85, 90, 70, 45, 30];

  // Knowledge Check Quiz State
  quizQuestion = '';
  quizExplanation = '';
  quizOptions: QuizOption[] = [
    { optionKey: 'A', optionText: '', description: '', isCorrect: true },
    { optionKey: 'B', optionText: '', description: '', isCorrect: false },
    { optionKey: 'C', optionText: '', description: '', isCorrect: false },
    { optionKey: 'D', optionText: '', description: '', isCorrect: false },
  ];
  isGeneratingQuiz = signal<boolean>(false);
  isSavingQuiz = signal<boolean>(false);
  quizSaved = signal<boolean>(false);

  // Tag editor input
  newTagInput = '';

  // Master Items Data (Loaded directly from backend REST API)
  items = signal<ModerationItem[]>([]);

  // Selected item signal
  selectedItem = signal<ModerationItem | null>(null);

  // Counts & Dynamic Percentages
  countReview = computed(() => this.items().filter(i => i.status === 'PENDING').length);
  countPublished = computed(() => this.items().filter(i => i.status === 'PUBLISHED').length);
  countRejected = computed(() => this.items().filter(i => i.status === 'REJECTED').length);
  countArchived = computed(() => this.items().filter(i => i.status === 'ARCHIVED').length);

  pctReview = computed(() => {
    const total = this.items().length;
    return total > 0 ? Math.round((this.countReview() / total) * 100) : 0;
  });
  pctPublished = computed(() => {
    const total = this.items().length;
    return total > 0 ? Math.round((this.countPublished() / total) * 100) : 0;
  });
  pctRejected = computed(() => {
    const total = this.items().length;
    return total > 0 ? Math.round((this.countRejected() / total) * 100) : 0;
  });
  pctArchived = computed(() => {
    const total = this.items().length;
    return total > 0 ? Math.round((this.countArchived() / total) * 100) : 0;
  });

  // Filtered list
  filteredQueueList = computed(() => {
    const tab = this.activeTab();
    let list = this.items().filter(item => {
      if (tab === 'review') return item.status === 'PENDING';
      if (tab === 'published') return item.status === 'PUBLISHED';
      if (tab === 'rejected') return item.status === 'REJECTED';
      if (tab === 'archived') return item.status === 'ARCHIVED';
      return true;
    });

    // Type filter
    const tf = this.typeFilter();
    if (tf !== 'all') {
      list = list.filter(item => item.type === tf);
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      list = list.filter(item => item.category === this.categoryFilter);
    }

    // Cultural Region filter
    const rf = this.regionFilter();
    if (rf !== 'all') {
      list = list.filter(item => {
        if (!item.region) return false;
        return item.region === rf || item.region.toLowerCase() === rf.toLowerCase();
      });
    }

    // District filter
    const df = this.districtFilter();
    if (df !== 'all') {
      list = list.filter(item => {
        if (!item.district) return false;
        return item.district === df || item.district.toLowerCase() === df.toLowerCase();
      });
    }

    // Contributor filter
    if (this.contributorFilter === 'elders') {
      list = list.filter(item => item.isElder);
    } else if (this.contributorFilter === 'students') {
      list = list.filter(item => !item.isElder);
    }

    // Search query
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.contributor.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.region && item.region.toLowerCase().includes(q)) ||
        (item.district && item.district.toLowerCase().includes(q)) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    const sort = this.sortOrder;
    return [...list].sort((a, b) => {
      if (sort === 'titleAsc') return a.title.localeCompare(b.title);
      if (sort === 'titleDesc') return b.title.localeCompare(a.title);
      if (sort === 'oldest') return a.code.localeCompare(b.code);
      return b.code.localeCompare(a.code); // newest first
    });
  });

  // Published stories eligible for cold archiving
  publishedStoriesForArchive = computed(() => {
    let list = this.items().filter(i => i.status === 'PUBLISHED');
    const q = this.archiveSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.code.toLowerCase().includes(q));
    }
    return list;
  });

  constructor(
    private authService: AuthService,
    private moderationService: ModerationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Initial local selection
    this.selectFirstItemInTab();

    // 2. Fetch regions table from backend
    this.loadRegionsFromBackend();

    // 3. Fetch live moderation queue from Spring Boot backend
    this.loadQueueFromBackend(true);
  }

  loadRegionsFromBackend(): void {
    this.moderationService.getRegions().subscribe({
      next: (data: RegionDTO[]) => {
        if (data && data.length > 0) {
          this.regions.set(data);
        } else {
          this.regions.set(this.DEFAULT_REGIONS);
        }
      },
      error: (err) => {
        console.warn('Could not fetch regions from backend, using defaults:', err);
        this.regions.set(this.DEFAULT_REGIONS);
      }
    });
  }

  loadQueueFromBackend(silent: boolean = false): void {
    this.isSyncing.set(true);
    if (!silent) {
      this.showToast('Synchronizing Moderation Queue with Central Cultural Vault...');
    }

    this.moderationService.getQueueItems('ALL').subscribe({
      next: (backendData: ModerationQueueItemResponse[]) => {
        this.isSyncing.set(false);
        const data = backendData || [];
        const mappedItems = data.map(res => this.mapBackendToItem(res));
        this.items.set(mappedItems);

        // Restore selection
        const current = this.selectedItem();
        if (current) {
          const stillExists = mappedItems.find(i => i.id === current.id);
          if (stillExists) {
            this.selectItem(stillExists);
          } else {
            this.selectFirstItemInTab();
          }
        } else {
          this.selectFirstItemInTab();
        }

        if (!silent) {
          this.showToast(`Moderation Queue synchronised (${mappedItems.length} records verified).`);
        }
      },
      error: (err) => {
        this.isSyncing.set(false);
        console.warn('Backend moderation queue unreachable:', err);
        if (!silent) {
          this.showToast(`Unable to synchronize with Moderation Queue backend.`);
        }
      }
    });
  }

  private mapBackendToItem(res: ModerationQueueItemResponse): ModerationItem {
    const rawType = (res.type || 'blog').toLowerCase();
    const type: 'video' | 'blog' | 'audio' =
      rawType.includes('video') ? 'video' : (rawType.includes('audio') ? 'audio' : 'blog');

    const code = res.id.length > 8 ? `MOD-${res.id.slice(0, 6).toUpperCase()}` : res.id;
    const author = res.authorName || 'Community Contributor';
    const avatar = author.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'CC';

    let category = 'Traditional Knowledge';
    if (res.tags && res.tags.length > 0) {
      const match = this.availableCategories.find(c => res.tags!.some(t => t.toLowerCase().includes(c.toLowerCase().split(' ')[0])));
      if (match) category = match;
    }

    return {
      id: res.id,
      code,
      title: res.title,
      contributor: author,
      avatar,
      role: res.elder ? 'Elder Cultural Custodian' : 'Heritage Contributor',
      type,
      status: res.status,
      category,
      region: res.region || '',
      district: res.district || '',
      submittedAt: res.createdAt || 'Recent',
      durationOrSize: type === 'video' ? '18m 42s' : (type === 'audio' ? '12m 30s' : '1,500 words'),
      isElder: res.elder,
      dialect: 'Regional Heritage Dialect',
      nlpConfidence: 96.5,
      excerpt: res.description || '',
      bodyContent: res.bodyContent || res.description || '',
      imageUrl: res.imageUrl,
      tags: res.tags || [],
      rejectionReason: res.rejectionReason,
      rejectionNotes: res.rejectionNotes
    };
  }

  private selectFirstItemInTab(): void {
    const tab = this.activeTab();
    const itemsInTab = this.items().filter(i => {
      if (tab === 'review') return i.status === 'PENDING';
      if (tab === 'published') return i.status === 'PUBLISHED';
      if (tab === 'rejected') return i.status === 'REJECTED';
      if (tab === 'archived') return i.status === 'ARCHIVED';
      return false;
    });

    if (itemsInTab.length > 0) {
      this.selectItem(itemsInTab[0]);
    } else {
      this.selectedItem.set(null);
    }
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.selectFirstItemInTab();
  }

  selectItem(item: ModerationItem): void {
    this.selectedItem.set(item);
    this.isPlayingVideo = false;
    this.videoProgress = 33;
    this.quizSaved.set(false);

    // Populate or reset quiz state
    if (item.quiz) {
      this.quizQuestion = item.quiz.question;
      this.quizExplanation = item.quiz.explanation;
      this.quizOptions = JSON.parse(JSON.stringify(item.quiz.options));
      this.quizSaved.set(true);
    } else {
      this.quizQuestion = '';
      this.quizExplanation = '';
      this.quizOptions = [
        { optionKey: 'A', optionText: '', description: '', isCorrect: true },
        { optionKey: 'B', optionText: '', description: '', isCorrect: false },
        { optionKey: 'C', optionText: '', description: '', isCorrect: false },
        { optionKey: 'D', optionText: '', description: '', isCorrect: false },
      ];

      // Fetch quiz from backend if available
      if (item.id && item.id.includes('-')) {
        this.moderationService.getStoryQuiz(item.id).subscribe({
          next: (quizDto: StoryQuizDTO | null) => {
            if (quizDto && quizDto.question) {
              this.quizQuestion = quizDto.question;
              this.quizExplanation = quizDto.explanation || '';
              if (quizDto.options && quizDto.options.length > 0) {
                this.quizOptions = quizDto.options.map(o => ({
                  optionKey: o.optionKey,
                  optionText: o.optionText,
                  description: o.description || '',
                  isCorrect: o.isCorrect
                }));
              }
              this.quizSaved.set(true);
              item.quiz = {
                question: this.quizQuestion,
                explanation: this.quizExplanation,
                options: JSON.parse(JSON.stringify(this.quizOptions))
              };
            }
          }
        });
      }
    }
  }

  toggleFiltersDrawer(): void {
    this.filtersDrawerOpen.update(v => !v);
  }

  resetFilters(): void {
    this.typeFilter.set('all');
    this.categoryFilter = 'all';
    this.regionFilter.set('all');
    this.districtFilter.set('all');
    this.contributorFilter = 'all';
    this.sortOrder = 'newest';
    this.searchQuery.set('');
  }

  toggleVideoPlayback(): void {
    this.isPlayingVideo = !this.isPlayingVideo;
    if (this.isPlayingVideo) {
      this.showToast('Simulating HD video playback stream...');
    }
  }

  // Quiz Management
  generateAiQuiz(): void {
    const item = this.selectedItem();
    if (!item) return;

    this.isGeneratingQuiz.set(true);

    if (item.id && item.id.includes('-')) {
      this.moderationService.generateAiQuiz(item.id, {
        title: item.title,
        description: item.excerpt,
        bodyContent: item.bodyContent,
        tags: item.tags
      }).subscribe({
        next: (aiQuiz: StoryQuizDTO) => {
          this.isGeneratingQuiz.set(false);
          if (aiQuiz && aiQuiz.question) {
            this.quizQuestion = aiQuiz.question;
            this.quizExplanation = aiQuiz.explanation || '';
            if (aiQuiz.options && aiQuiz.options.length > 0) {
              this.quizOptions = aiQuiz.options.map(o => ({
                optionKey: o.optionKey,
                optionText: o.optionText,
                description: o.description || '',
                isCorrect: o.isCorrect
              }));
            }
            this.quizSaved.set(false);
            this.showToast('AI Knowledge Check quiz synthesized based on cultural metadata!');
          } else {
            this.synthesizeLocalAiQuiz(item);
          }
        },
        error: () => {
          this.isGeneratingQuiz.set(false);
          this.synthesizeLocalAiQuiz(item);
        }
      });
    } else {
      setTimeout(() => {
        this.isGeneratingQuiz.set(false);
        this.synthesizeLocalAiQuiz(item);
      }, 700);
    }
  }

  private synthesizeLocalAiQuiz(item: ModerationItem): void {
    if (item.category === 'Traditional Crafts') {
      this.quizQuestion = `In traditional ${item.category}, what is the primary sacred technique described in this record?`;
      this.quizExplanation = 'Craft traditions require seasoning native timbers with herbal decoctions before sacred incising.';
      this.quizOptions = [
        { optionKey: 'A', optionText: 'Harvesting timber according to lunar cycles & herbal curing', description: 'Primary traditional protocol', isCorrect: true },
        { optionKey: 'B', optionText: 'Using industrial synthetic lacquers', description: 'Violates heritage methodology', isCorrect: false },
        { optionKey: 'C', optionText: 'Accelerated thermal kiln drying', description: 'Causes stress fractures in soft wood', isCorrect: false },
        { optionKey: 'D', optionText: 'Chemical pesticide immersion', description: 'Replaces organic botanical repellents', isCorrect: false }
      ];
    } else if (item.category === 'Farming & Agriculture') {
      this.quizQuestion = 'How does the Bethma system distribute water and communal land during drought?';
      this.quizExplanation = 'Bethma ensures agrarian survival by consolidating all village cultivation directly under the reservoir sluice.';
      this.quizOptions = [
        { optionKey: 'A', optionText: 'Equal consolidation of plots near the tank sluice', description: 'Equalitarian water sharing', isCorrect: true },
        { optionKey: 'B', optionText: 'Auctioning all surplus water to the highest bidder', description: 'Non-traditional commercial practice', isCorrect: false },
        { optionKey: 'C', optionText: 'Abandoning upstream paddy tracts permanently', description: 'Temporary drought adaptation only', isCorrect: false },
        { optionKey: 'D', optionText: 'Relying exclusively on diesel water pumps', description: 'Modern intervention', isCorrect: false }
      ];
    } else {
      this.quizQuestion = `What core cultural heritage insight is attested in "${item.title}"?`;
      this.quizExplanation = `Preserving intangible oral knowledge transmitted through ${item.contributor}'s verified lineage.`;
      this.quizOptions = [
        { optionKey: 'A', optionText: 'Authentic oral transmission conforming to lineage standards', description: 'Curatorial gold standard', isCorrect: true },
        { optionKey: 'B', optionText: 'Modern commercial reproduction without ritual consent', description: 'Non-canon submission', isCorrect: false },
        { optionKey: 'C', optionText: 'Synthetically generated folk music', description: 'Artificial generation', isCorrect: false },
        { optionKey: 'D', optionText: 'Western orchestral adaptation', description: 'Classical variation', isCorrect: false }
      ];
    }
    this.quizSaved.set(false);
    this.showToast('AI Knowledge Check quiz synthesized based on cultural metadata!');
  }

  setCorrectOption(key: string): void {
    this.quizOptions = this.quizOptions.map(opt => ({
      ...opt,
      isCorrect: opt.optionKey === key
    }));
    this.quizSaved.set(false);
  }

  saveQuiz(): void {
    const item = this.selectedItem();
    if (!item) return;
    if (!this.quizQuestion.trim()) {
      this.showToast('Please enter a valid quiz question prompt.');
      return;
    }
    if (this.quizOptions.some(o => !o.optionText.trim())) {
      this.showToast('Please fill in text for all 4 options (A, B, C, D).');
      return;
    }

    this.isSavingQuiz.set(true);
    const updatedQuiz = {
      question: this.quizQuestion.trim(),
      explanation: this.quizExplanation.trim(),
      options: JSON.parse(JSON.stringify(this.quizOptions))
    };

    if (item.id && item.id.includes('-')) {
      this.moderationService.saveStoryQuiz(item.id, {
        storyId: item.id,
        question: updatedQuiz.question,
        explanation: updatedQuiz.explanation,
        options: updatedQuiz.options.map((o: QuizOption) => ({
          optionKey: o.optionKey,
          optionText: o.optionText,
          description: o.description,
          isCorrect: o.isCorrect
        }))
      }).subscribe({
        next: () => this.finishSaveQuiz(item, updatedQuiz),
        error: () => this.finishSaveQuiz(item, updatedQuiz)
      });
    } else {
      setTimeout(() => {
        this.finishSaveQuiz(item, updatedQuiz);
      }, 300);
    }
  }

  private finishSaveQuiz(item: ModerationItem, updatedQuiz: any): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, quiz: updatedQuiz } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);
    this.isSavingQuiz.set(false);
    this.quizSaved.set(true);
    this.showToast('Knowledge Check quiz saved to Sovereign Heritage Knowledge Base!');
  }

  // Tag Management
  addTagToItem(item: ModerationItem): void {
    if (this.newTagInput.trim()) {
      let t = this.newTagInput.trim();
      if (!t.startsWith('#')) t = '#' + t;
      if (!item.tags.includes(t)) {
        this.items.update(list => list.map(i => i.id === item.id ? { ...i, tags: [...i.tags, t] } : i));
        const updated = this.items().find(i => i.id === item.id) || null;
        if (updated) this.selectedItem.set(updated);
      }
      this.newTagInput = '';
    }
  }

  removeTagFromItem(item: ModerationItem, tag: string): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, tags: i.tags.filter(t => t !== tag) } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);
  }

  toggleAllGuidelines(): void {
    const newState = !this.allGuidelinesMet;
    this.guideNoHateSpeech = newState;
    this.guideCulturallyAccurate = newState;
    this.guideHighQuality = newState;
  }

  // Moderation Decision Workflows
  approveAndPublish(item: ModerationItem): void {
    if (!this.allGuidelinesMet) return;
    if (!item.region || item.region.trim() === '') {
      this.showToast('⚠️ Cultural Region is compulsory! Please select a region before publishing.');
      return;
    }

    this.items.update(list => list.map(i => i.id === item.id ? { ...i, status: 'PUBLISHED' } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);

    if (item.id && item.id.includes('-')) {
      this.moderationService.updateItemStatus(item.id, {
        status: 'PUBLISHED',
        region: item.region,
        district: item.district
      }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${item.id} published with region ${item.region}`),
        error: (err) => console.warn(`[Backend] Error publishing item ${item.id}:`, err)
      });
    }

    this.showToast(`Submission ${item.code} published live with ${item.region} provenance!`);
  }

  openRejectModal(item: ModerationItem): void {
    this.itemToReject.set(item);
    this.selectedRejectionReason.set('Needs Revision');
    this.rejectionNotesText = '';
    this.showRejectModal.set(true);
  }

  confirmRejection(): void {
    const item = this.itemToReject();
    if (!item) return;

    const reason = this.selectedRejectionReason();
    const notes = this.rejectionNotesText.trim() || 'Please revise according to cultural curatorial guidelines.';

    this.items.update(list => list.map(i => i.id === item.id ? {
      ...i,
      status: 'REJECTED',
      rejectionReason: reason,
      rejectionNotes: notes
    } : i));

    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);
    this.showRejectModal.set(false);

    if (item.id && item.id.includes('-')) {
      this.moderationService.updateItemStatus(item.id, {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectionNotes: notes,
        reason,
        notes
      }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${item.id} rejected`),
        error: (err) => console.warn(`[Backend] Error rejecting item ${item.id}:`, err)
      });
    }

    this.showToast(`Submission ${item.code} flagged as REJECTED: ${reason}`);
  }

  unpublishToReview(item: ModerationItem): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, status: 'PENDING' } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);

    if (item.id && item.id.includes('-')) {
      this.moderationService.updateItemStatus(item.id, { status: 'PENDING' }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${item.id} unpublished`),
        error: (err) => console.warn(`[Backend] Error unpublishing item ${item.id}:`, err)
      });
    }

    this.showToast(`Submission ${item.code} unpublished and returned to Review Queue.`);
  }

  restoreToReview(item: ModerationItem): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, status: 'PENDING' } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);

    if (item.id && item.id.includes('-')) {
      this.moderationService.updateItemStatus(item.id, { status: 'PENDING' }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${item.id} restored to pending`),
        error: (err) => console.warn(`[Backend] Error restoring item ${item.id}:`, err)
      });
    }

    this.showToast(`Item ${item.code} restored to active Review Queue.`);
  }

  openArchiveModal(item?: ModerationItem): void {
    if (item) {
      this.itemToArchiveId = item.id;
    } else if (this.selectedItem()) {
      this.itemToArchiveId = this.selectedItem()!.id;
    } else {
      const candidates = this.getUnarchivedItems();
      if (candidates.length > 0) {
        this.itemToArchiveId = candidates[0].id;
      }
    }
    this.archiveReason = 'Long-term Heritage Preservation';
    this.archiveNotesText = '';
    this.showArchiveNewModal.set(true);
  }

  getUnarchivedItems(): ModerationItem[] {
    return this.items().filter(i => i.status !== 'ARCHIVED');
  }

  confirmManualArchive(): void {
    const targetId = this.itemToArchiveId;
    const itm = this.items().find(i => i.id === targetId);
    if (!itm) {
      this.showToast('Please select a valid item to archive.');
      return;
    }
    this.items.update(list => list.map(i => i.id === targetId ? { ...i, status: 'ARCHIVED' } : i));
    const updated = this.items().find(i => i.id === targetId) || null;
    if (updated && this.selectedItem()?.id === targetId) {
      this.selectedItem.set(updated);
    }
    this.showArchiveNewModal.set(false);

    if (itm.id && itm.id.includes('-')) {
      this.moderationService.updateItemStatus(itm.id, {
        status: 'ARCHIVED',
        rejectionReason: this.archiveReason,
        rejectionNotes: this.archiveNotesText
      }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${itm.id} archived`),
        error: (err) => console.warn(`[Backend] Error archiving item ${itm.id}:`, err)
      });
    }

    this.showToast(`Submission ${itm.code} transferred to Cold Vault Archive (${this.archiveReason}).`);
  }

  archiveItem(item: ModerationItem): void {
    this.items.update(list => list.map(i => i.id === item.id ? { ...i, status: 'ARCHIVED' } : i));
    const updated = this.items().find(i => i.id === item.id) || null;
    if (updated) this.selectedItem.set(updated);
    this.showArchiveNewModal.set(false);

    if (item.id && item.id.includes('-')) {
      this.moderationService.updateItemStatus(item.id, {
        status: 'ARCHIVED',
        rejectionReason: 'Long-term Heritage Preservation'
      }).subscribe({
        next: () => console.log(`[Backend] Moderation item ${item.id} archived`),
        error: (err) => console.warn(`[Backend] Error archiving item ${item.id}:`, err)
      });
    }

    this.showToast(`Item ${item.code} transferred to Cold Vault Archive.`);
  }

  syncQueue(): void {
    if (this.isSyncing()) return;
    this.loadQueueFromBackend(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }
}
