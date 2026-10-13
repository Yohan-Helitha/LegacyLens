import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { AuthService } from '../../app/core/services/auth.service';
import { environment } from '../../environments/environment';

export interface FeaturedKeeper {
  id?: number;
  name: string;
  title: string;
  tag: string;
  quote: string;
  avatarUrl?: string;
  likesCount?: number;
  storyId?: string;
  storyTitle?: string;
  activeDate?: string;
  status: string;
  generatedByAi?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublishedStoryOption {
  id: string;
  title: string;
  type: string;
  authorName: string;
  avatarUrl?: string;
  excerpt?: string;
}

const API_BASE = `${environment.apiUrl}/admin/knowledge-keepers`;

@Component({
  selector: 'app-knowledge-keeper',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">

      <!-- Toast Feedback -->
      @if (toastMessage()) {
        <div
          [class]="isErrorToast() ? 'bg-[#ba1a1a]' : 'bg-[#004343]'"
          class="fixed top-5 right-6 z-50 flex items-center gap-3 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 animate-bounce transition-all duration-300">
          <span class="material-symbols-outlined text-xl">{{ isErrorToast() ? 'error' : 'psychology' }}</span>
          <div class="text-xs font-semibold max-w-xs">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs cursor-pointer">✕</button>
        </div>
      }

      <app-sidebar></app-sidebar>

      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <app-header></app-header>

        <main class="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12 space-y-8">

          <!-- Page Header & Action Bar -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#004343] mb-1">
                <span class="material-symbols-outlined text-base">psychology</span>
                <span>Home Showcase & Living Heritage</span>
              </div>
              <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-[#191c1c]">Knowledge Keepers</h1>
              <p class="text-xs md:text-sm text-[#6e7978] mt-1">
                Curate living tradition bearers featured on the mobile home screen. Scanned from published blogs via Groq AI or managed manually.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button
                (click)="openAiModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#fe893e] to-[#e6752d] text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-[#fe893e]/30 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base">auto_awesome</span>
                <span>Generate with Groq AI</span>
              </button>

              <button
                (click)="openCreateModal()"
                class="flex items-center gap-2 px-4 py-2.5 bg-[#004343] text-white rounded-xl text-xs font-bold hover:bg-[#003535] transition-all cursor-pointer shadow-sm">
                <span class="material-symbols-outlined text-base">add</span>
                <span>Add Keeper</span>
              </button>
            </div>
          </div>

          <!-- Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Metric 1: Total Keepers -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-xs font-bold uppercase text-[#6e7978]">Total Keepers</span>
                <div class="text-2xl font-bold text-[#191c1c] mt-1">{{ keepers().length }}</div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#004343]">
                <span class="material-symbols-outlined text-2xl">group</span>
              </div>
            </div>

            <!-- Metric 2: Active Today -->
            <div class="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between bg-emerald-50/20">
              <div>
                <span class="text-xs font-bold uppercase text-emerald-800">Featured Today</span>
                <div class="text-base font-bold text-emerald-950 mt-1 truncate max-w-[170px]" [title]="todayKeeper()?.name || 'None'">
                  {{ todayKeeper() ? todayKeeper()?.name : 'Auto-Rotating' }}
                </div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <span class="material-symbols-outlined text-2xl">star</span>
              </div>
            </div>

            <!-- Metric 3: AI Generated -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-xs font-bold uppercase text-[#6e7978]">Groq AI Formed</span>
                <div class="text-2xl font-bold text-[#fe893e] mt-1">{{ aiGeneratedCount() }}</div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#fe893e]">
                <span class="material-symbols-outlined text-2xl">smart_toy</span>
              </div>
            </div>

            <!-- Metric 4: Daily Rotation -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex items-center justify-between">
              <div>
                <span class="text-xs font-bold uppercase text-[#6e7978]">Daily Automation</span>
                <div class="text-sm font-bold text-[#004343] mt-1 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active & Rotating</span>
                </div>
              </div>
              <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-[#004343]">
                <span class="material-symbols-outlined text-2xl">published_with_changes</span>
              </div>
            </div>
          </div>

          <!-- Table Container -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden">
            <!-- Table Controls -->
            <div class="p-5 border-b border-[#f2f4f3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <!-- Search -->
              <div class="relative w-full sm:w-80">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978] text-base pointer-events-none">search</span>
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  placeholder="Search by name, title, or quote..."
                  class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-3 py-2 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] transition-all"
                />
              </div>

              <!-- Filter Tabs -->
              <div class="flex items-center gap-1 p-1 bg-[#f8faf9] rounded-xl border border-[#dde3eb] text-xs font-bold">
                <button
                  (click)="filterStatus.set('ALL')"
                  [class.bg-white]="filterStatus() === 'ALL'"
                  [class.shadow-sm]="filterStatus() === 'ALL'"
                  class="px-3 py-1.5 rounded-lg transition-all text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                  All ({{ keepers().length }})
                </button>
                <button
                  (click)="filterStatus.set('Active')"
                  [class.bg-white]="filterStatus() === 'Active'"
                  [class.shadow-sm]="filterStatus() === 'Active'"
                  class="px-3 py-1.5 rounded-lg transition-all text-emerald-700 hover:text-emerald-900 cursor-pointer">
                  Active
                </button>
                <button
                  (click)="filterStatus.set('Scheduled')"
                  [class.bg-white]="filterStatus() === 'Scheduled'"
                  [class.shadow-sm]="filterStatus() === 'Scheduled'"
                  class="px-3 py-1.5 rounded-lg transition-all text-blue-700 hover:text-blue-900 cursor-pointer">
                  Scheduled
                </button>
              </div>
            </div>

            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#f8faf9] text-[#6e7978] font-bold uppercase tracking-wider border-b border-[#dde3eb]">
                  <tr>
                    <th class="py-3 px-5">Knowledge Keeper</th>
                    <th class="py-3 px-4">Heritage Category</th>
                    <th class="py-3 px-5 max-w-sm">Wisdom Extract / Quote</th>
                    <th class="py-3 px-4">Source Story</th>
                    <th class="py-3 px-4">Active Date</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#f2f4f3] text-[#191c1c]">
                  @if (filteredKeepers().length === 0) {
                    <tr>
                      <td colspan="7" class="py-12 text-center text-[#6e7978]">
                        <span class="material-symbols-outlined text-4xl block text-gray-300 mb-2">psychology_alt</span>
                        <span class="font-semibold text-sm">No Knowledge Keepers Found</span>
                        <p class="text-xs mt-1">Generate one from a published story with Groq AI or add a keeper manually.</p>
                      </td>
                    </tr>
                  }

                  @for (k of filteredKeepers(); track k.id) {
                    <tr class="hover:bg-[#f8faf9]/70 transition-colors">
                      <!-- Keeper Column -->
                      <td class="py-3.5 px-5">
                        <div class="flex items-center gap-3">
                          <img
                            [src]="k.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200'"
                            [alt]="k.name"
                            class="w-10 h-10 rounded-full object-cover border border-[#dde3eb]"
                          />
                          <div>
                            <div class="font-bold text-[#191c1c]">{{ k.name }}</div>
                            <div class="text-[11px] text-[#6e7978]">{{ k.title }}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Tag Column -->
                      <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 rounded-md bg-teal-50 text-[#004343] font-bold text-[10px] tracking-wide border border-teal-200/50">
                          {{ k.tag }}
                        </span>
                      </td>

                      <!-- Quote Column -->
                      <td class="py-3.5 px-5 max-w-sm">
                        <p class="italic text-[#191c1c] line-clamp-2 text-xs leading-relaxed" [title]="k.quote">
                          "{{ k.quote }}"
                        </p>
                      </td>

                      <!-- Story Source Column -->
                      <td class="py-3.5 px-4">
                        <div class="text-[11px] font-medium text-[#191c1c] truncate max-w-[160px]" [title]="k.storyTitle || 'Manual entry'">
                          {{ k.storyTitle || 'Manual Entry' }}
                        </div>
                        @if (k.generatedByAi) {
                          <span class="inline-flex items-center gap-1 text-[10px] text-[#fe893e] font-bold mt-0.5">
                            <span class="material-symbols-outlined text-xs">auto_awesome</span>
                            Groq AI
                          </span>
                        }
                      </td>

                      <!-- Active Date Column -->
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        <span class="font-semibold text-xs text-[#191c1c]">{{ k.activeDate || 'Daily Fallback' }}</span>
                      </td>

                      <!-- Status Column -->
                      <td class="py-3.5 px-4">
                        @if (k.status === 'Active') {
                          <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                          </span>
                        } @else if (k.status === 'Scheduled') {
                          <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] inline-flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Scheduled
                          </span>
                        } @else {
                          <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-[10px]">
                            Draft
                          </span>
                        }
                      </td>

                      <!-- Actions Column -->
                      <td class="py-3.5 px-5 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-1.5">
                          @if (k.status !== 'Active') {
                            <button
                              (click)="setActiveToday(k)"
                              title="Set as Featured for Today"
                              class="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                              <span class="material-symbols-outlined text-base">today</span>
                            </button>
                          }
                          <button
                            (click)="openEditModal(k)"
                            title="Edit Keeper"
                            class="p-1.5 text-[#004343] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            (click)="deleteKeeper(k)"
                            title="Delete Keeper"
                            class="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <span class="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      <!-- MODAL 1: Generate with Groq AI -->
      @if (showAiModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#dde3eb] flex flex-col max-h-[90vh]">
            
            <!-- Header -->
            <div class="px-6 py-5 border-b border-[#f2f4f3] flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-white">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#fe893e]">
                  <span class="material-symbols-outlined text-xl">auto_awesome</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-[#191c1c]">Generate Knowledge Keeper with Groq AI</h3>
                  <p class="text-xs text-[#6e7978]">Extracts key cultural quotes & titles from published stories</p>
                </div>
              </div>
              <button (click)="showAiModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4 overflow-y-auto flex-1">
              <!-- Select Story -->
              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Select Published Story / Blog</label>
                <select
                  [(ngModel)]="selectedStoryId"
                  class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                  <option value="" disabled selected>-- Choose a story to scan --</option>
                  @for (s of publishedStories(); track s.id) {
                    <option [value]="s.id">
                      [{{ s.type | uppercase }}] {{ s.title }} (by {{ s.authorName }})
                    </option>
                  }
                </select>
                <p class="text-[11px] text-[#6e7978] mt-1">Groq will read the entire body of this story to synthesize the keeper card.</p>
              </div>

              <!-- Target Active Date -->
              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Scheduled Date</label>
                <input
                  type="date"
                  [(ngModel)]="aiTargetDate"
                  class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                />
              </div>

              <!-- Information Callout -->
              <div class="p-4 bg-teal-50/60 rounded-xl border border-teal-100 flex gap-3 text-xs text-[#004343] leading-relaxed">
                <span class="material-symbols-outlined text-base shrink-0 text-[#004343]">psychology</span>
                <div>
                  <strong>How Groq AI Works:</strong>
                  Llama-3.3-70B analyzes the narrative, selects the most culturally impactful sentences, coins a dignified title for the author, and tags the heritage category.
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-[#f8faf9] border-t border-[#f2f4f3] flex items-center justify-end gap-3">
              <button
                (click)="showAiModal.set(false)"
                class="px-4 py-2 text-xs font-bold text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                Cancel
              </button>
              <button
                (click)="executeAiGeneration()"
                [disabled]="!selectedStoryId || isGenerating()"
                class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#fe893e] to-[#e6752d] text-white rounded-xl text-xs font-bold hover:shadow-lg disabled:opacity-50 cursor-pointer">
                @if (isGenerating()) {
                  <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  <span>Scanning story with AI...</span>
                } @else {
                  <span class="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Scan & Generate</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL 2: Create / Edit Keeper Modal -->
      @if (showFormModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#dde3eb] flex flex-col max-h-[92vh]">
            
            <div class="px-6 py-5 border-b border-[#f2f4f3] flex items-center justify-between bg-[#f8faf9]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center text-[#004343]">
                  <span class="material-symbols-outlined text-xl">{{ isEditing() ? 'edit' : 'person_add' }}</span>
                </div>
                <div>
                  <h3 class="text-base font-bold text-[#191c1c]">{{ isEditing() ? 'Edit Knowledge Keeper' : 'New Knowledge Keeper' }}</h3>
                  <p class="text-xs text-[#6e7978]">Configure keeper showcase details</p>
                </div>
              </div>
              <button (click)="showFormModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <!-- Name & Title -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Author / Keeper Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="formKeeper.name"
                    placeholder="e.g. Somalatha Jayasuriya"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Honorific Title *</label>
                  <input
                    type="text"
                    [(ngModel)]="formKeeper.title"
                    placeholder="e.g. Master Brass Artisan of Kandy"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>
              </div>

              <!-- Tag & Status -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Heritage Tag *</label>
                  <input
                    type="text"
                    [(ngModel)]="formKeeper.tag"
                    placeholder="e.g. BRASS & METALWORK HERITAGE"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Status</label>
                  <select
                    [(ngModel)]="formKeeper.status"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                    <option value="Active">Active (Featured Today)</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <!-- Quote -->
              <div>
                <label class="block font-bold text-[#191c1c] mb-1">Quote / Wisdom Extract *</label>
                <textarea
                  rows="3"
                  [(ngModel)]="formKeeper.quote"
                  placeholder="The profound quote displayed on the home card..."
                  class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] leading-relaxed">
                </textarea>
              </div>

              <!-- Avatar & Date -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    [(ngModel)]="formKeeper.avatarUrl"
                    placeholder="https://..."
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>
                <div>
                  <label class="block font-bold text-[#191c1c] mb-1">Active Date</label>
                  <input
                    type="date"
                    [(ngModel)]="formKeeper.activeDate"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-[#f8faf9] border-t border-[#f2f4f3] flex items-center justify-end gap-3">
              <button
                (click)="showFormModal.set(false)"
                class="px-4 py-2 text-xs font-bold text-[#6e7978] hover:text-[#191c1c] cursor-pointer">
                Cancel
              </button>
              <button
                (click)="saveKeeperForm()"
                [disabled]="!formKeeper.name || !formKeeper.quote || !formKeeper.title || !formKeeper.tag"
                class="px-5 py-2.5 bg-[#004343] text-white rounded-xl text-xs font-bold hover:bg-[#003535] disabled:opacity-50 cursor-pointer">
                {{ isEditing() ? 'Save Changes' : 'Create Keeper' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class KnowledgeKeeperComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  keepers = signal<FeaturedKeeper[]>([]);
  publishedStories = signal<PublishedStoryOption[]>([]);
  searchQuery = '';
  filterStatus = signal<string>('ALL');

  // Modals state
  showAiModal = signal(false);
  showFormModal = signal(false);
  isEditing = signal(false);
  isGenerating = signal(false);

  // AI Form state
  selectedStoryId = '';
  aiTargetDate = new Date().toISOString().substring(0, 10);

  // Manual Form state
  formKeeper: FeaturedKeeper = {
    name: '',
    title: '',
    tag: '',
    quote: '',
    avatarUrl: '',
    activeDate: new Date().toISOString().substring(0, 10),
    status: 'Scheduled',
  };

  // Toast
  toastMessage = signal<string | null>(null);
  isErrorToast = signal(false);

  // Computeds
  todayKeeper = computed(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return this.keepers().find(k => k.status === 'Active' || k.activeDate === todayStr);
  });

  aiGeneratedCount = computed(() => {
    return this.keepers().filter(k => k.generatedByAi).length;
  });

  filteredKeepers = computed(() => {
    let list = this.keepers();
    const query = this.searchQuery.toLowerCase().trim();
    const status = this.filterStatus();

    if (status !== 'ALL') {
      list = list.filter(k => k.status === status);
    }

    if (query) {
      list = list.filter(k =>
        k.name?.toLowerCase().includes(query) ||
        k.title?.toLowerCase().includes(query) ||
        k.tag?.toLowerCase().includes(query) ||
        k.quote?.toLowerCase().includes(query)
      );
    }

    return list;
  });

  ngOnInit() {
    this.loadKeepers();
    this.loadPublishedStories();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  loadKeepers() {
    this.http.get<{ success: boolean; data: FeaturedKeeper[] }>(API_BASE, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.keepers.set(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to load knowledge keepers:', err);
          this.showToast('Could not load knowledge keepers.', true);
        }
      });
  }

  loadPublishedStories() {
    this.http.get<{ success: boolean; data: PublishedStoryOption[] }>(`${API_BASE}/published-stories`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.publishedStories.set(res.data);
          }
        },
        error: (err) => {
          console.error('Failed to load published stories:', err);
        }
      });
  }

  openAiModal() {
    this.selectedStoryId = '';
    this.aiTargetDate = new Date().toISOString().substring(0, 10);
    this.showAiModal.set(true);
  }

  executeAiGeneration() {
    if (!this.selectedStoryId) return;

    this.isGenerating.set(true);
    const url = `${API_BASE}/generate?storyId=${this.selectedStoryId}&activeDate=${this.aiTargetDate}`;

    this.http.post<{ success: boolean; data: FeaturedKeeper; message: string }>(url, {}, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.isGenerating.set(false);
          this.showAiModal.set(false);
          this.showToast('Knowledge Keeper generated with Groq AI!');
          this.loadKeepers();
        },
        error: (err) => {
          this.isGenerating.set(false);
          console.error('AI generation failed:', err);
          this.showToast('AI generation failed. Please try again.', true);
        }
      });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.formKeeper = {
      name: '',
      title: '',
      tag: '',
      quote: '',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200',
      activeDate: new Date().toISOString().substring(0, 10),
      status: 'Scheduled',
    };
    this.showFormModal.set(true);
  }

  openEditModal(keeper: FeaturedKeeper) {
    this.isEditing.set(true);
    this.formKeeper = { ...keeper };
    this.showFormModal.set(true);
  }

  saveKeeperForm() {
    if (this.isEditing() && this.formKeeper.id) {
      this.http.put<{ success: boolean; data: FeaturedKeeper }>(`${API_BASE}/${this.formKeeper.id}`, this.formKeeper, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.showFormModal.set(false);
            this.showToast('Knowledge Keeper updated successfully.');
            this.loadKeepers();
          },
          error: (err) => {
            console.error('Update failed:', err);
            this.showToast('Failed to update Knowledge Keeper.', true);
          }
        });
    } else {
      this.http.post<{ success: boolean; data: FeaturedKeeper }>(API_BASE, this.formKeeper, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            this.showFormModal.set(false);
            this.showToast('Knowledge Keeper created successfully.');
            this.loadKeepers();
          },
          error: (err) => {
            console.error('Create failed:', err);
            this.showToast('Failed to create Knowledge Keeper.', true);
          }
        });
    }
  }

  setActiveToday(keeper: FeaturedKeeper) {
    if (!keeper.id) return;
    this.http.post<{ success: boolean; data: FeaturedKeeper }>(`${API_BASE}/${keeper.id}/activate-today`, {}, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.showToast(`${keeper.name} is now featured as today's Knowledge Keeper!`);
          this.loadKeepers();
        },
        error: (err) => {
          console.error('Activate failed:', err);
          this.showToast('Could not set as active today.', true);
        }
      });
  }

  deleteKeeper(keeper: FeaturedKeeper) {
    if (!keeper.id || !confirm(`Are you sure you want to delete ${keeper.name}?`)) return;

    this.http.delete<{ success: boolean }>(`${API_BASE}/${keeper.id}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.showToast('Knowledge Keeper removed.');
          this.loadKeepers();
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.showToast('Failed to delete Knowledge Keeper.', true);
        }
      });
  }

  private showToast(msg: string, isError = false) {
    this.toastMessage.set(msg);
    this.isErrorToast.set(isError);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}

