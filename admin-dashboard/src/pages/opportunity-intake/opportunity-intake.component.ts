import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface IntakeQueueItem {
  id: string;
  title: string;
  type: 'audio' | 'text';
  duration: string;
  knowledgeHolderName: string;
  knowledgeHolderAvatar: string;
  district: string;
  isElder: boolean;
  isVerified: boolean;
  priority: 'High Priority' | 'Standard' | 'Pending';
  priorityClass: string;
  date: string;
  primaryTopic: string;
  recordedYear: string;
  audioQuality: 'Excellent' | 'Good' | 'Fair';
  originalLanguage: string;
  transcriptOriginal: { time: string; text: string; active?: boolean }[];
  transcriptTranslation: { time: string; text: string; active?: boolean }[];
  suggestedTags: string[];
  reviewerNotes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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
            {{ toastType() === 'approve' ? 'verified' : (toastType() === 'reject' ? 'cancel' : 'info') }}
          </span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Reusable Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Container -->
      <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <!-- Common Top Header Component -->
        <app-header 
          pageTitle="Opportunity Intake" 
          section="Moderation"
          searchPlaceholder="Search intake queue, transcripts, or elder records..."
          [(searchQuery)]="searchQuery">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {{ pendingCount() }} Pending Intake Items
            </span>
          </div>
        </app-header>

        <!-- 3-Pane Workspace -->
        <main class="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] xl:grid-cols-[340px_1fr_360px] h-[calc(100vh-64px)] overflow-hidden bg-[#f8faf9]">
          
          <!-- ========================================== -->
          <!-- LEFT PANE: Intake Queue List -->
          <!-- ========================================== -->
          <section class="bg-white border-r border-[#dde3eb] flex flex-col h-full overflow-hidden">
            <div class="p-4 border-b border-[#dde3eb] flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <h3 class="font-serif text-base font-bold text-[#004343]">Intake Queue</h3>
                <span class="bg-[#f2f4f3] text-[#3f4948] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#dde3eb]">
                  {{ filteredQueue().length }} Items
                </span>
              </div>

              <!-- Media Type Filter Tabs -->
              <div class="flex gap-2">
                <button 
                  (click)="filterType.set('ALL')"
                  [class]="filterType() === 'ALL' ? 'bg-[#004343] text-white' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                  class="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors">
                  All ({{ queueItems().length }})
                </button>
                <button 
                  (click)="filterType.set('audio')"
                  [class]="filterType() === 'audio' ? 'bg-[#004343] text-white' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                  class="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-xs">mic</span>
                  <span>Audio ({{ audioCount() }})</span>
                </button>
                <button 
                  (click)="filterType.set('text')"
                  [class]="filterType() === 'text' ? 'bg-[#004343] text-white' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2]'"
                  class="flex-1 text-xs py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-xs">article</span>
                  <span>Text ({{ textCount() }})</span>
                </button>
              </div>
            </div>

            <!-- Queue Scrollable List -->
            <div class="overflow-y-auto flex-1 p-3 flex flex-col gap-2.5 custom-scrollbar">
              @for (item of filteredQueue(); track item.id) {
                <div 
                  (click)="selectItem(item)"
                  [class]="selectedItem()?.id === item.id 
                    ? 'bg-white border-2 border-[#004343] shadow-md ring-2 ring-[#004343]/10' 
                    : 'bg-[#f8faf9] hover:bg-white border border-[#dde3eb] shadow-xs'"
                  class="rounded-xl p-3.5 cursor-pointer transition-all relative overflow-hidden group">
                  
                  @if (selectedItem()?.id === item.id) {
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#004343]"></div>
                  }

                  <div class="flex justify-between items-start mb-1.5">
                    <h4 class="text-xs font-bold text-[#191c1c] truncate pr-2 group-hover:text-[#004343] transition-colors">
                      {{ item.title }}
                    </h4>
                    <span class="text-[#6f7978] text-[11px] flex items-center gap-1 shrink-0">
                      <span class="material-symbols-outlined text-xs">
                        {{ item.type === 'audio' ? 'schedule' : 'menu_book' }}
                      </span> 
                      {{ item.duration }}
                    </span>
                  </div>

                  <p class="text-[11px] text-[#6f7978] mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px]">person</span>
                    <span>{{ item.knowledgeHolderName }}, {{ item.district }}</span>
                  </p>

                  <div class="flex justify-between items-center pt-1 border-t border-[#f2f4f3]">
                    <div class="flex gap-1.5">
                      <span [class]="item.priorityClass" class="px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider">
                        {{ item.priority }}
                      </span>
                      @if (item.status === 'APPROVED') {
                        <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded font-bold">Approved</span>
                      } @else if (item.status === 'REJECTED') {
                        <span class="px-1.5 py-0.5 bg-red-100 text-red-800 text-[9px] rounded font-bold">Rejected</span>
                      }
                    </div>
                    <span class="text-[10px] text-[#6f7978] font-medium">{{ item.date }}</span>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-[#6f7978]">
                  <span class="material-symbols-outlined text-3xl mb-1 text-[#004343]">inbox</span>
                  <p class="text-xs font-semibold">No items match criteria</p>
                </div>
              }
            </div>
          </section>

          <!-- ========================================== -->
          <!-- CENTER PANE: Listening & Transcription -->
          <!-- ========================================== -->
          <section class="flex flex-col h-full overflow-hidden bg-white border-r border-[#dde3eb]">
            @if (selectedItem(); as current) {
              <!-- Workspace Top Header -->
              <div class="p-4 md:p-5 border-b border-[#dde3eb] bg-white">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            [class]="current.type === 'audio' ? 'bg-amber-100 text-[#9b4600]' : 'bg-blue-100 text-blue-800'">
                        {{ current.type === 'audio' ? 'Audio Ingest' : 'Manuscript Ingest' }}
                      </span>
                      <span class="text-xs text-[#6f7978]">• ID: {{ current.id }}</span>
                    </div>
                    <h2 class="font-serif text-xl md:text-2xl font-bold text-[#004343]">
                      {{ current.title }}
                    </h2>
                    <p class="text-xs text-[#6f7978] flex items-center gap-1.5 mt-1">
                      <span class="material-symbols-outlined text-sm text-[#004343]">translate</span> 
                      Original {{ current.originalLanguage }} with AI-assisted contextual translation
                    </p>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <button (click)="resetPlayback()" class="p-1.5 text-[#6f7978] hover:text-[#004343] hover:bg-[#f2f4f3] rounded-lg transition-colors" title="Reload Segment">
                      <span class="material-symbols-outlined text-lg">refresh</span>
                    </button>
                  </div>
                </div>

                <!-- Advanced Audio Player / Visualizer Card -->
                <div class="bg-[#f8faf9] rounded-2xl border border-[#dde3eb] p-4 shadow-sm">
                  <!-- Simulated Interactive Waveform Bars -->
                  <div class="h-16 flex items-end gap-[3px] mb-3 w-full px-1 overflow-hidden">
                    @for (bar of waveformBars(); track $index) {
                      <div 
                        (click)="seekToBar($index)"
                        [style.height.%]="bar.height"
                        [class]="bar.played ? 'bg-[#004343]' : (bar.active ? 'bg-[#fe893e] scale-y-110' : 'bg-[#dde3eb] hover:bg-[#90d2d1]')"
                        class="flex-1 rounded-sm transition-all duration-150 cursor-pointer min-w-[2px]"
                        [title]="'Seek to ' + bar.time">
                      </div>
                    }
                  </div>

                  <!-- Audio Controls Bar -->
                  <div class="flex items-center justify-between pt-1">
                    <span class="text-xs font-mono font-bold text-[#004343] w-14">
                      {{ currentPlaybackTime() }}
                    </span>

                    <div class="flex items-center gap-3">
                      <button 
                        (click)="seekBackward()" 
                        class="text-[#3f4948] hover:text-[#004343] p-1.5 rounded-full hover:bg-white transition-colors"
                        title="Rewind 10 seconds">
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
                        (click)="seekForward()" 
                        class="text-[#3f4948] hover:text-[#004343] p-1.5 rounded-full hover:bg-white transition-colors"
                        title="Forward 10 seconds">
                        <span class="material-symbols-outlined text-xl">forward_10</span>
                      </button>
                    </div>

                    <div class="flex items-center gap-2 justify-end w-20">
                      <button 
                        (click)="cyclePlaybackSpeed()"
                        class="px-2.5 py-1 bg-white border border-[#dde3eb] rounded-lg text-xs font-bold text-[#004343] hover:bg-[#f2f4f3] transition-colors shadow-xs">
                        {{ playbackSpeed() }}x
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dual Column Transcription Workspace -->
              <div class="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8faf9] custom-scrollbar">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  
                  <!-- Left Column: Original Language -->
                  <div class="flex flex-col gap-3 pr-0 md:pr-3 border-b md:border-b-0 md:border-r border-[#dde3eb]">
                    <div class="sticky top-0 bg-[#f8faf9]/90 backdrop-blur-xs py-1.5 flex items-center justify-between border-b border-[#dde3eb]/60 z-10">
                      <h4 class="text-xs font-bold text-[#191c1c] uppercase tracking-wider flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm text-[#004343]">record_voice_over</span>
                        Original ({{ current.originalLanguage }})
                      </h4>
                      <span class="text-[10px] text-[#6f7978]">Lossless Archive Audio</span>
                    </div>

                    <div class="space-y-2.5 pt-1">
                      @for (segment of current.transcriptOriginal; track segment.time; let idx = $index) {
                        <div 
                          (click)="jumpToSegment(segment.time, idx)"
                          [class]="segment.active 
                            ? 'bg-emerald-50/80 border-l-4 border-[#004343] shadow-xs' 
                            : 'hover:bg-white border-l-4 border-transparent'"
                          class="p-3 rounded-lg bg-white/70 border border-[#dde3eb] transition-all cursor-pointer group">
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

                  <!-- Right Column: English Translation (Editable) -->
                  <div class="flex flex-col gap-3 pl-0 md:pl-2">
                    <div class="sticky top-0 bg-[#f8faf9]/90 backdrop-blur-xs py-1.5 flex justify-between items-center border-b border-[#dde3eb]/60 z-10">
                      <h4 class="text-xs font-bold text-[#004343] uppercase tracking-wider flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">g_translate</span>
                        English Translation
                      </h4>
                      <button 
                        (click)="toggleEditMode()" 
                        class="text-[11px] text-[#004343] font-bold hover:underline flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">{{ isEditingTranslation() ? 'check' : 'edit' }}</span>
                        <span>{{ isEditingTranslation() ? 'Done' : 'Edit' }}</span>
                      </button>
                    </div>

                    <div class="space-y-2.5 pt-1">
                      @for (segment of current.transcriptTranslation; track segment.time; let idx = $index) {
                        <div 
                          [class]="segment.active 
                            ? 'bg-[#004343]/5 border-l-4 border-[#004343] shadow-xs' 
                            : 'hover:bg-white border-l-4 border-transparent'"
                          class="p-3 rounded-lg bg-white/70 border border-[#dde3eb] transition-all relative group">
                          
                          <div class="flex items-center justify-between mb-1">
                            <span [class]="segment.active ? 'text-[#004343] font-bold' : 'text-[#6f7978]'" class="text-[11px] font-mono">
                              {{ segment.time }}
                            </span>
                          </div>

                          @if (isEditingTranslation()) {
                            <textarea 
                              [(ngModel)]="segment.text" 
                              rows="2"
                              class="w-full text-xs md:text-sm bg-white border border-[#c2c8c7] rounded-md p-2 focus:ring-1 focus:ring-[#004343] focus:outline-none">
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
                <p class="text-base font-semibold">Select an intake item to begin curatorial review</p>
              </div>
            }
          </section>

          <!-- ========================================== -->
          <!-- RIGHT PANE: Metadata & Actions -->
          <!-- ========================================== -->
          <section class="bg-white flex flex-col h-full overflow-hidden shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
            @if (selectedItem(); as current) {
              <div class="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5 custom-scrollbar">
                
                <!-- Knowledge Holder Card -->
                <div>
                  <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">badge</span>
                    Knowledge Holder
                  </h3>
                  <div class="bg-[#f8faf9] border border-[#dde3eb] rounded-2xl p-4 flex gap-3.5 items-center shadow-xs hover:border-[#004343]/50 transition-colors">
                    <img 
                      [src]="current.knowledgeHolderAvatar" 
                      [alt]="current.knowledgeHolderName"
                      class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0" 
                    />
                    <div class="min-w-0 flex-1">
                      <h4 class="font-serif text-base font-bold text-[#004343] truncate">
                        {{ current.knowledgeHolderName }}
                      </h4>
                      <p class="text-xs text-[#6f7978] mb-1.5 flex items-center gap-1 truncate">
                        <span class="material-symbols-outlined text-xs text-[#9b4600]">location_on</span> 
                        {{ current.district }} District
                      </p>
                      <div class="flex items-center gap-1.5">
                        @if (current.isElder) {
                          <span class="bg-[#e1e3e2] text-[#191c1c] text-[10px] px-2 py-0.5 rounded font-bold">
                            Elder Custodian
                          </span>
                        }
                        @if (current.isVerified) {
                          <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
                            <span class="material-symbols-outlined text-[11px]">verified</span> Verified
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recording Context -->
                <div>
                  <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2.5 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">info</span>
                    Recording Context
                  </h3>
                  <div class="bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3.5 space-y-3">
                    <div>
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">Primary Topic</span>
                      <span class="text-xs font-semibold text-[#191c1c]">{{ current.primaryTopic }}</span>
                    </div>
                    
                    <div class="h-px bg-[#dde3eb] w-full"></div>
                    
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">Recorded Era</span>
                        <span class="text-xs font-medium text-[#191c1c]">{{ current.recordedYear }}</span>
                      </div>
                      <div>
                        <span class="block text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mb-0.5">Acoustic Fidelity</span>
                        <span class="text-xs font-bold text-[#004343] flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs text-emerald-600">graphic_eq</span>
                          {{ current.audioQuality }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Auto-suggested Tags -->
                <div>
                  <div class="flex justify-between items-center mb-2.5">
                    <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">sell</span>
                      Taxonomy & Tags
                    </h3>
                    <button 
                      (click)="isAddingTag.set(!isAddingTag())" 
                      class="text-[#004343] hover:text-[#003131] text-xs font-bold flex items-center gap-0.5">
                      <span class="material-symbols-outlined text-sm">add_circle</span>
                      <span>Add</span>
                    </button>
                  </div>

                  @if (isAddingTag()) {
                    <div class="flex gap-1.5 mb-2">
                      <input 
                        type="text" 
                        [(ngModel)]="newTagInput" 
                        placeholder="New tag..." 
                        (keyup.enter)="addTag()"
                        class="flex-1 text-xs bg-white border border-[#c2c8c7] rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-[#004343] focus:outline-none" 
                      />
                      <button 
                        (click)="addTag()" 
                        class="px-3 py-1 bg-[#004343] text-white text-xs font-bold rounded-lg hover:bg-[#003131]">
                        Save
                      </button>
                    </div>
                  }

                  <div class="flex flex-wrap gap-1.5">
                    @for (tag of current.suggestedTags; track tag) {
                      <span class="px-2.5 py-1 bg-[#004343]/10 border border-[#004343]/20 text-[#004343] rounded-lg text-xs font-medium flex items-center gap-1 group">
                        {{ tag }}
                        <button (click)="removeTag(tag)" class="text-[#6f7978] hover:text-red-700 ml-0.5">
                          <span class="material-symbols-outlined text-xs">close</span>
                        </button>
                      </span>
                    }
                  </div>
                </div>

                <!-- Reviewer Notes -->
                <div>
                  <h3 class="text-[11px] font-bold text-[#6f7978] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">note_alt</span>
                    Curator Routing Notes
                  </h3>
                  <textarea 
                    [(ngModel)]="current.reviewerNotes"
                    placeholder="Add specific feedback or routing notes for the Opportunity Creator team..."
                    rows="3"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all resize-none">
                  </textarea>
                </div>

              </div>

              <!-- Action Panel Bottom Fixed -->
              <div class="p-4 border-t border-[#dde3eb] bg-[#f8faf9] flex flex-col gap-2.5 shrink-0">
                <button 
                  (click)="approveOpportunity()" 
                  class="w-full py-2.5 px-4 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#004343]/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
                  <span class="material-symbols-outlined text-base">check_circle</span>
                  <span>Approve to Opportunity Creator</span>
                </button>
                <button 
                  (click)="rejectOpportunity()" 
                  class="w-full py-2 px-4 bg-white hover:bg-red-50 text-[#ba1a1a] hover:border-red-200 rounded-xl text-xs font-semibold transition-colors border border-[#dde3eb] flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-base">cancel</span>
                  <span>Reject with Feedback</span>
                </button>
              </div>
            }
          </section>

        </main>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #dde3eb;
      border-radius: 4px;
    }
  `]
})
export class OpportunityIntakeComponent implements OnInit, OnDestroy {
  searchQuery = '';
  filterType = signal<'ALL' | 'audio' | 'text'>('ALL');
  toastMessage = signal<string | null>(null);
  toastType = signal<'approve' | 'reject' | 'info'>('info');

  isPlaying = signal(false);
  currentPlaybackTime = signal('12:04');
  playbackSpeed = signal<number>(1.2);
  isEditingTranslation = signal(false);
  isAddingTag = signal(false);
  newTagInput = '';

  private playbackTimer: any;

  queueItems = signal<IntakeQueueItem[]>([
    {
      id: 'INTK-8921',
      title: 'Village Council Meeting 1984',
      type: 'audio',
      duration: '45:12',
      knowledgeHolderName: 'Siriwardana',
      knowledgeHolderAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      district: 'Kandy',
      isElder: true,
      isVerified: true,
      priority: 'High Priority',
      priorityClass: 'bg-red-100 text-red-800',
      date: 'Oct 12, 2023',
      primaryTopic: 'Community Governance & Traditional Irrigation',
      recordedYear: '1984 (Digitized 2023)',
      audioQuality: 'Good',
      originalLanguage: 'Sinhalese',
      suggestedTags: ['Irrigation', 'Shramadana', 'Village Council', 'Water Sharing'],
      reviewerNotes: 'Elder audio transcript verified against the 1984 Kandy Gemi Sabha archives.',
      status: 'PENDING',
      transcriptOriginal: [
        { time: '11:58', text: 'ඒ කාලේ අපේ ගමේ හැමෝම එකතු වෙලා තමයි මේ තීරණ ගත්තේ.' },
        { time: '12:04', text: 'වැව ප්‍රතිසංස්කරණය කරන එක ගැන ලොකු සාකච්ඡාවක් තිබුණා. මොකද ඊළඟ කන්නයට වතුර ඕන නිසා.', active: true },
        { time: '12:15', text: 'ගමේ මුලාදෑනිතුමා කීවා අපිම ශ්‍රමදානයක් කරලා මේක ඉවරයක් කරමු කියලා.' },
        { time: '12:32', text: 'එදා රෑ වෙනකල් ගමේ වැඩිහිටියෝ බෙදාහැරීමේ නීති ගැන සම්මුතියකට ආවා.' }
      ],
      transcriptTranslation: [
        { time: '11:58', text: 'In those days, everyone in our village gathered together to make these decisions.' },
        { time: '12:04', text: 'There was a big discussion about renovating the reservoir. Because we needed water for the next agricultural season.', active: true },
        { time: '12:15', text: 'The village headman suggested that we should organize a voluntary work campaign and complete it ourselves.' },
        { time: '12:32', text: 'By nightfall, village elders reached a binding agreement regarding the water distribution protocols.' }
      ]
    },
    {
      id: 'INTK-8922',
      title: 'Monsoon Harvest Rituals & Chants',
      type: 'audio',
      duration: '12:30',
      knowledgeHolderName: 'Meenakshi Amma',
      knowledgeHolderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      district: 'Jaffna',
      isElder: true,
      isVerified: true,
      priority: 'Standard',
      priorityClass: 'bg-amber-100 text-amber-800',
      date: 'Oct 11, 2023',
      primaryTopic: 'Agrarian Chants & Temple Offerings',
      recordedYear: '1979 (Lossless Master)',
      audioQuality: 'Excellent',
      originalLanguage: 'Tamil',
      suggestedTags: ['Agrarian Folk Songs', 'Monsoon Chants', 'Harvest Festivals'],
      reviewerNotes: 'Lossless audio captured from Jaffna Tamil Sangam archives.',
      status: 'PENDING',
      transcriptOriginal: [
        { time: '00:15', text: 'மழைக்கால தொடக்கத்தில் இந்த பாடல்களை நாம் பாடுவோம்.' },
        { time: '01:20', text: 'விவசாய நிலங்களை தெய்வமாக வணங்கி நெல் விதைக்கும் சடங்கு இதுவாகும்.', active: true },
        { time: '02:45', text: 'முதியவர்கள் அனைவரும் ஒன்று கூடி மாரியம்மன் கோயிலில் பொங்கலிடுவர்.' }
      ],
      transcriptTranslation: [
        { time: '00:15', text: 'We sang these hymns at the very onset of the northeast monsoon rains.' },
        { time: '01:20', text: 'This was the sacred ceremony where we revered the paddy fields as divine and sowed the first seeds.', active: true },
        { time: '02:45', text: 'All the village elders gathered at the Mariamman shrine to prepare the ceremonial milk-rice offering.' }
      ]
    },
    {
      id: 'INTK-8923',
      title: 'Traditional Beeralu Lace Patterns',
      type: 'text',
      duration: '1,420 words',
      knowledgeHolderName: 'Kamala Fernando',
      knowledgeHolderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      district: 'Batticaloa',
      isElder: false,
      isVerified: true,
      priority: 'Pending',
      priorityClass: 'bg-emerald-100 text-emerald-800',
      date: 'Oct 10, 2023',
      primaryTopic: 'Maritime Bobbin Lace & Guild Techniques',
      recordedYear: '1992',
      audioQuality: 'Good',
      originalLanguage: 'Sinhalese',
      suggestedTags: ['Beeralu Lace', 'Southern Guilds', 'Handloom Artifacts'],
      reviewerNotes: 'Photographic transcript documentation attached for lace patterns.',
      status: 'PENDING',
      transcriptOriginal: [
        { time: '01:00', text: 'බීරළු රෙදි විවීම අපේ පරම්පරාවේ මව්වරුන්ගෙන් දූවරුන්ට ලැබුණු දායාදයකි.' },
        { time: '02:10', text: 'ලී කුළුණු මත නූල් ගොතා සාදන විචිත්‍ර මෝස්තර ඕලන්ද යුගයේ සිට පැවත එයි.', active: true }
      ],
      transcriptTranslation: [
        { time: '01:00', text: 'Beeralu bobbin lace weaving was the heritage passed down from mothers to daughters in our lineage.' },
        { time: '02:10', text: 'The intricate patterns woven on wooden pillows have been preserved since the Dutch maritime era.', active: true }
      ]
    }
  ]);

  selectedItem = signal<IntakeQueueItem | null>(null);

  waveformBars = signal<{ height: number; played: boolean; active: boolean; time: string }[]>([]);

  pendingCount = computed(() => this.queueItems().filter(i => i.status === 'PENDING').length);
  audioCount = computed(() => this.queueItems().filter(i => i.type === 'audio').length);
  textCount = computed(() => this.queueItems().filter(i => i.type === 'text').length);

  filteredQueue = computed(() => {
    let list = this.queueItems();
    const fType = this.filterType();
    const query = this.searchQuery.toLowerCase().trim();

    if (fType !== 'ALL') {
      list = list.filter(i => i.type === fType);
    }

    if (query) {
      list = list.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.knowledgeHolderName.toLowerCase().includes(query) ||
        i.district.toLowerCase().includes(query) ||
        i.primaryTopic.toLowerCase().includes(query) ||
        i.suggestedTags.some(t => t.toLowerCase().includes(query))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.generateWaveformBars();
    if (this.queueItems().length > 0) {
      this.selectedItem.set(this.queueItems()[0]);
    }
  }

  ngOnDestroy(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
    }
  }

  selectItem(item: IntakeQueueItem): void {
    this.selectedItem.set(item);
    this.isPlaying.set(false);
    if (this.playbackTimer) clearInterval(this.playbackTimer);
  }

  generateWaveformBars(): void {
    const bars: { height: number; played: boolean; active: boolean; time: string }[] = [];
    const totalBars = 64;
    const activeIndex = 22;

    for (let i = 0; i < totalBars; i++) {
      const height = Math.max(15, Math.floor(Math.sin(i / 3) * 35 + Math.cos(i / 2) * 25 + 40));
      const mins = Math.floor((i * 35) / 60);
      const secs = (i * 35) % 60;
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
    const nextState = !this.isPlaying();
    this.isPlaying.set(nextState);

    if (nextState) {
      this.showToast('Audio playback started.', 'info');
      this.playbackTimer = setInterval(() => {
        this.waveformBars.update(bars => {
          const activeIdx = bars.findIndex(b => b.active);
          const nextIdx = (activeIdx + 1) % bars.length;
          return bars.map((b, idx) => ({
            ...b,
            played: idx < nextIdx,
            active: idx === nextIdx
          }));
        });
      }, 800);
    } else {
      if (this.playbackTimer) clearInterval(this.playbackTimer);
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
    const targetBar = this.waveformBars()[index];
    if (targetBar) {
      this.currentPlaybackTime.set(targetBar.time);
    }
  }

  seekBackward(): void {
    this.waveformBars.update(bars => {
      const currentIdx = bars.findIndex(b => b.active);
      const newIdx = Math.max(0, currentIdx - 5);
      return bars.map((b, idx) => ({
        ...b,
        played: idx < newIdx,
        active: idx === newIdx
      }));
    });
    this.showToast('Rewound 10s', 'info');
  }

  seekForward(): void {
    this.waveformBars.update(bars => {
      const currentIdx = bars.findIndex(b => b.active);
      const newIdx = Math.min(bars.length - 1, currentIdx + 5);
      return bars.map((b, idx) => ({
        ...b,
        played: idx < newIdx,
        active: idx === newIdx
      }));
    });
    this.showToast('Forwarded 10s', 'info');
  }

  cyclePlaybackSpeed(): void {
    const speeds = [1.0, 1.2, 1.5, 2.0];
    const current = this.playbackSpeed();
    const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
    this.playbackSpeed.set(speeds[nextIdx]);
    this.showToast(`Playback speed set to ${speeds[nextIdx]}x`, 'info');
  }

  resetPlayback(): void {
    this.isPlaying.set(false);
    if (this.playbackTimer) clearInterval(this.playbackTimer);
    this.generateWaveformBars();
    this.currentPlaybackTime.set('12:04');
    this.showToast('Audio track reset to start of curatorial segment.', 'info');
  }

  jumpToSegment(time: string, idx: number): void {
    const current = this.selectedItem();
    if (!current) return;

    current.transcriptOriginal.forEach((t, i) => t.active = (i === idx));
    current.transcriptTranslation.forEach((t, i) => t.active = (i === idx));
    this.currentPlaybackTime.set(time);
    this.showToast(`Jumped to time ${time}`, 'info');
  }

  toggleEditMode(): void {
    this.isEditingTranslation.set(!this.isEditingTranslation());
    if (!this.isEditingTranslation()) {
      this.showToast('Translation updates saved.', 'info');
    }
  }

  removeTag(tagToRemove: string): void {
    const current = this.selectedItem();
    if (current) {
      current.suggestedTags = current.suggestedTags.filter(t => t !== tagToRemove);
    }
  }

  addTag(): void {
    const tag = this.newTagInput.trim();
    const current = this.selectedItem();
    if (tag && current && !current.suggestedTags.includes(tag)) {
      current.suggestedTags.push(tag);
      this.newTagInput = '';
      this.isAddingTag.set(false);
      this.showToast(`Tag "${tag}" added.`, 'info');
    }
  }

  approveOpportunity(): void {
    const current = this.selectedItem();
    if (!current) return;
    current.status = 'APPROVED';
    this.showToast(`Approved "${current.title}" to Opportunity Creator pipeline!`, 'approve');
  }

  rejectOpportunity(): void {
    const current = this.selectedItem();
    if (!current) return;
    current.status = 'REJECTED';
    this.showToast(`Rejected "${current.title}". Feedback dispatched to field team.`, 'reject');
  }

  private showToast(msg: string, type: 'approve' | 'reject' | 'info' = 'info'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}

