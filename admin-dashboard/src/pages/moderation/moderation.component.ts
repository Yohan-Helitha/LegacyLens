import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

interface ModerationItem {
  id: string;
  code: string;
  title: string;
  contributor: string;
  avatar: string;
  role: string;
  type: 'Audio' | 'Video' | 'Document' | 'Image';
  typeIcon: string;
  status: 'PENDING' | 'LIVE' | 'COLD_VAULT';
  category: string;
  submittedAt: string;
  durationOrSize: string;
  isElderPriority?: boolean;
  views?: string;
  sha256?: string;
  excerpt?: string;
  tags?: string[];
  nlpConfidence?: number;
  dialect?: string;
  tier?: string;
  flagCount?: number;
  contributorAge?: number;
  videoSrc?: string;
}

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">done_all</span>
          <div>
            <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          </div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Moderation Queue" 
          section="Console"
          searchPlaceholder="Search submissions, audio transcripts, or elder IDs..."
          [searchQuery]="searchQuery()"
          (searchQueryChange)="searchQuery.set($event)">
          <div class="hidden lg:flex items-center gap-2">
            <button (click)="autoTagAll()" 
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-base text-[#9b4600]">auto_awesome</span>
              <span>Auto-Tag All (NLP)</span>
            </button>
            <button (click)="exportQueueCsv()" 
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-base text-[#004343]">download</span>
              <span>Export Queue CSV</span>
            </button>
            <button (click)="syncColdChain()" 
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-[#004343] text-white rounded-lg text-xs font-semibold hover:bg-[#003131] transition-colors shadow-sm shadow-[#004343]/20">
              <span class="material-symbols-outlined text-base">cloud_sync</span>
              <span>Sync Cold Chain</span>
            </button>
          </div>
        </app-header>

        <!-- Main Body Workspace -->
        <div class="flex-1 flex overflow-hidden">
          
          <!-- Middle Left: Moderation Queue List -->
          <div class="w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-[#dde3eb] flex flex-col shrink-0">
            
            <!-- Queue Filter Tabs -->
            <div class="p-4 border-b border-[#dde3eb] space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-base font-serif font-bold text-[#191c1c]">Moderation Queue</h2>
                  <p class="text-[11px] text-[#6e7978]">AI-assisted cultural artifact & oral history review</p>
                </div>
                <span class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {{ pendingCount() }} Pending
                </span>
              </div>

              <!-- Filter Buttons -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button (click)="activeFilter.set('ALL')"
                        [ngClass]="activeFilter() === 'ALL' ? 'bg-[#004343] text-white font-semibold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                        class="px-2.5 py-1 rounded-md transition-colors whitespace-nowrap">
                  All ({{ records().length }})
                </button>
                <button (click)="activeFilter.set('ELDER')"
                        [ngClass]="activeFilter() === 'ELDER' ? 'bg-[#004343] text-white font-semibold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                        class="px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Elder Priority
                </button>
                <button (click)="activeFilter.set('AUDIO')"
                        [ngClass]="activeFilter() === 'AUDIO' ? 'bg-[#004343] text-white font-semibold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                        class="px-2.5 py-1 rounded-md transition-colors whitespace-nowrap">
                  Audio
                </button>
                <button (click)="activeFilter.set('VIDEO')"
                        [ngClass]="activeFilter() === 'VIDEO' ? 'bg-[#004343] text-white font-semibold' : 'bg-[#f2f4f7] text-[#3e4948] hover:bg-[#e1e3e3]'"
                        class="px-2.5 py-1 rounded-md transition-colors whitespace-nowrap">
                  Video
                </button>
              </div>

              <!-- Status Switcher Tabs -->
              <div class="grid grid-cols-3 gap-1 bg-[#f2f4f7] p-1 rounded-lg text-xs font-medium text-center">
                <button (click)="activeTab.set('PENDING')" 
                        [ngClass]="activeTab() === 'PENDING' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="py-1 rounded-md transition-all">
                  Pending ({{ pendingCount() }})
                </button>
                <button (click)="activeTab.set('LIVE')" 
                        [ngClass]="activeTab() === 'LIVE' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="py-1 rounded-md transition-all">
                  Live Stream
                </button>
                <button (click)="activeTab.set('COLD_VAULT')" 
                        [ngClass]="activeTab() === 'COLD_VAULT' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="py-1 rounded-md transition-all">
                  Cold Vault
                </button>
              </div>
            </div>

            <!-- Queue Scroll List -->
            <div class="flex-1 overflow-y-auto divide-y divide-[#dde3eb]">
              @for (item of filteredList(); track item.id) {
                <div (click)="selectRecord(item)"
                     [ngClass]="selectedRecord()?.id === item.id ? 'bg-[#004343]/5 border-l-4 border-[#004343]' : 'hover:bg-[#f8faf9]'"
                     class="p-4 cursor-pointer transition-all">
                  <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-sm text-[#004343]">{{ item.typeIcon }}</span>
                      <span class="text-[10px] font-mono font-bold text-[#6e7978]">{{ item.code }}</span>
                      @if (item.isElderPriority) {
                        <span class="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">Elder Custodian</span>
                      }
                    </div>
                    <span class="text-[10px] text-[#6e7978] font-mono">{{ item.submittedAt }}</span>
                  </div>

                  <h3 class="text-xs font-bold text-[#191c1c] line-clamp-1 mb-1">{{ item.title }}</h3>
                  <p class="text-[11px] text-[#6e7978] line-clamp-2 mb-2">{{ item.excerpt }}</p>

                  <div class="flex items-center justify-between text-[10px]">
                    <div class="flex items-center gap-1 text-[#3e4948]">
                      <span class="material-symbols-outlined text-xs">person</span>
                      <span>{{ item.contributor }}</span>
                      @if (item.contributorAge) {
                        <span class="text-[#6e7978]">({{ item.contributorAge }} yrs)</span>
                      }
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-emerald-700 font-semibold font-mono">{{ item.nlpConfidence }}% NLP Match</span>
                      <span class="text-[#6e7978] font-mono">{{ item.durationOrSize }}</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-[#6e7978]">
                  <span class="material-symbols-outlined text-3xl mb-2">check_circle</span>
                  <p class="text-xs">No items currently in this queue view.</p>
                </div>
              }
            </div>
          </div>

          <!-- Middle Right: Detailed Inspection & Moderation Decision Panel -->
          <div class="flex-1 bg-[#f8faf9] overflow-y-auto p-6 space-y-6">
            @if (selectedRecord(); as rec) {
              <!-- Artifact Header Card -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#dde3eb]">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#004343]/10 text-[#004343]">
                        {{ rec.code }}
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {{ rec.category }}
                      </span>
                      <span class="text-xs text-[#6e7978] font-mono">Dialect: {{ rec.dialect || 'Sinhala (Southern High-Kandyan)' }}</span>
                    </div>
                    <h2 class="text-xl font-serif font-bold text-[#191c1c]">{{ rec.title }}</h2>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <div class="text-[10px] uppercase font-bold text-[#6e7978]">Contributor Clearance</div>
                      <div class="text-xs font-bold text-[#004343]">{{ rec.contributor }}</div>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-[#004343] text-white flex items-center justify-center font-serif font-bold">
                      {{ rec.avatar }}
                    </div>
                  </div>
                </div>

                <!-- Video / Media Player Simulation Box -->
                <div class="mt-4 rounded-xl bg-[#191c1c] overflow-hidden relative group aspect-video max-h-[360px] flex items-center justify-center">
                  <div class="absolute inset-0 bg-cover bg-center opacity-40" 
                       style="background-image: url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200');">
                  </div>
                  <div class="relative z-10 text-center text-white space-y-2">
                    <button class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined text-3xl">play_arrow</span>
                    </button>
                    <div class="text-xs font-mono bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                      Length: {{ rec.durationOrSize }} • HD 1080p 60fps • 48kHz Stereo Master
                    </div>
                  </div>
                </div>

                <!-- Waveform Audio Analyzer Simulation -->
                <div class="mt-4 p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#004343] text-sm">graphic_eq</span>
                      <span class="text-xs font-bold text-[#191c1c]">AI Audio Transcription & Sacred Syllable Verification</span>
                    </div>
                    <span class="text-xs font-mono text-emerald-700 font-bold">98.4% Precision Attested</span>
                  </div>
                  <div class="h-8 flex items-end gap-1 px-2 bg-white rounded-lg border border-[#dde3eb] py-1">
                    @for (bar of waveBars; track $index) {
                      <div class="flex-1 bg-[#004343]/60 rounded-t hover:bg-[#004343] transition-colors" [style.height.%]="bar"></div>
                    }
                  </div>
                </div>
              </div>

              <!-- Community Guidelines & Integrity Checklist -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                  <h3 class="text-sm font-serif font-bold text-[#191c1c]">Curatorial Verification Protocol</h3>
                  <span class="text-[10px] text-[#6e7978]">All criteria required for public canon endorsement</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <label class="flex items-start gap-3 p-3 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors">
                    <input type="checkbox" [(ngModel)]="guide1" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                    <div>
                      <div class="font-bold text-[#191c1c]">Authenticity & Dialect Verification</div>
                      <div class="text-[10px] text-[#6e7978]">Content matches stated historic period and linguistic register.</div>
                    </div>
                  </label>

                  <label class="flex items-start gap-3 p-3 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors">
                    <input type="checkbox" [(ngModel)]="guide2" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                    <div>
                      <div class="font-bold text-[#191c1c]">Elder Informed Consent Confirmed</div>
                      <div class="text-[10px] text-[#6e7978]">Oral history recording conforms to ethical lineage release guidelines.</div>
                    </div>
                  </label>

                  <label class="flex items-start gap-3 p-3 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors">
                    <input type="checkbox" [(ngModel)]="guide3" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                    <div>
                      <div class="font-bold text-[#191c1c]">Sacred Boundary Non-Infringement</div>
                      <div class="text-[10px] text-[#6e7978]">Location GPS does not disclose protected esoteric sanctum areas.</div>
                    </div>
                  </label>

                  <label class="flex items-start gap-3 p-3 rounded-xl border border-[#dde3eb] bg-[#f8faf9] cursor-pointer hover:bg-white transition-colors">
                    <input type="checkbox" [(ngModel)]="guide4" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]" />
                    <div>
                      <div class="font-bold text-[#191c1c]">Digital Preservation Standard Met</div>
                      <div class="text-[10px] text-[#6e7978]">Bitrate and lossless encoding sufficient for National Archives deposit.</div>
                    </div>
                  </label>
                </div>

                <!-- Tag Management & NLP Auto-Tagger -->
                <div class="pt-2">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-[#191c1c]">Applied Cultural Taxonomy Tags</span>
                    <span class="text-[10px] text-[#6e7978]">Generated via NLP Engine v4.2</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    @for (tag of customTags(); track tag) {
                      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#004343]/10 text-[#004343] border border-[#004343]/20">
                        {{ tag }}
                        <button (click)="removeTag(tag)" class="hover:text-[#ba1a1a] text-xs">✕</button>
                      </span>
                    }
                    <div class="inline-flex items-center gap-1">
                      <input type="text" [(ngModel)]="newTag" (keyup.enter)="addTag()" placeholder="+ Add tag"
                             class="px-3 py-1 bg-[#f2f4f7] border border-[#c2c8c7] rounded-full text-xs focus:outline-none focus:border-[#004343] w-28" />
                    </div>
                  </div>
                </div>

                <!-- Decision Action Bar -->
                <div class="pt-4 border-t border-[#dde3eb] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div class="flex items-center gap-2 w-full sm:w-auto">
                    <button (click)="rejectAndArchive(rec)"
                            class="flex-1 sm:flex-none px-4 py-2 border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-xl text-xs font-bold transition-colors">
                      Reject & Archive
                    </button>
                    <button (click)="routeToDispute(rec)"
                            class="flex-1 sm:flex-none px-4 py-2 border border-[#9b4600]/30 text-[#9b4600] hover:bg-[#9b4600]/10 rounded-xl text-xs font-bold transition-colors">
                      Route to Dispute Review
                    </button>
                  </div>

                  <button (click)="approveAndPublish(rec)"
                          [disabled]="!allGuidelinesMet"
                          [ngClass]="allGuidelinesMet ? 'bg-[#004343] text-white hover:bg-[#003131] shadow-md shadow-[#004343]/20' : 'bg-[#e1e3e3] text-[#6e7978] cursor-not-allowed'"
                          class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>Approve & Publish Live</span>
                  </button>
                </div>
              </div>
            }
          </div>

        </div>

      </main>

    </div>
  `
})
export class ModerationComponent {
  toastMessage = signal<string | null>(null);
  searchQuery = signal<string>('');
  activeTab = signal<'PENDING' | 'LIVE' | 'COLD_VAULT'>('PENDING');
  activeFilter = signal<'ALL' | 'ELDER' | 'AUDIO' | 'VIDEO'>('ALL');

  guide1 = true;
  guide2 = true;
  guide3 = true;
  guide4 = true;

  get allGuidelinesMet(): boolean {
    return this.guide1 && this.guide2 && this.guide3 && this.guide4;
  }

  waveBars = [20, 35, 60, 45, 80, 95, 65, 40, 75, 85, 90, 50, 70, 40, 60, 85, 90, 70, 45, 30];
  newTag = '';
  customTags = signal<string[]>(['#WoodCraft', '#AmbalangodaMask', '#FolkLore', '#SouthernHeritage']);

  records = signal<ModerationItem[]>([
    {
      id: 'MOD-8821',
      code: 'MOD-8821',
      title: 'Oral History: Traditional Ambalangoda Mask Carving Secret Lineages',
      contributor: 'Elder Bandara Jayasinghe',
      avatar: 'BJ',
      role: 'Master Craftsman',
      type: 'Video',
      typeIcon: 'videocam',
      status: 'PENDING',
      category: 'Intangible Craftsmanship',
      submittedAt: 'Today, 10:24 AM',
      durationOrSize: '18m 42s',
      isElderPriority: true,
      contributorAge: 79,
      dialect: 'Southern Maritime Galle Dialect',
      nlpConfidence: 96.2,
      excerpt: 'Comprehensive testimony on ancient Kaduru timber curing formulas and Raksha mask spirit invocations in Ambalangoda.'
    },
    {
      id: 'MOD-8819',
      code: 'MOD-8819',
      title: 'The Last Kohomba Kankariya of Balangoda: Ritual Chants & Drum Cadences',
      contributor: 'Ven. Medankara Thero',
      avatar: 'VM',
      role: 'Chief Monk & Lineage Witness',
      type: 'Audio',
      typeIcon: 'graphic_eq',
      status: 'PENDING',
      category: 'Sacred Ritual Music',
      submittedAt: 'Today, 08:15 AM',
      durationOrSize: '42m 10s',
      isElderPriority: true,
      contributorAge: 84,
      dialect: 'Sabaragamuwa Temple Chants',
      nlpConfidence: 98.4,
      excerpt: 'Unbroken recordings of the 12 sacred invocations to local guardian deities recorded in high-fidelity ambisonics.'
    },
    {
      id: 'MOD-8804',
      code: 'MOD-8804',
      title: 'Kandyan Drum Rhythm Transcriptions: Geta Bera Masterclass Vol 4',
      contributor: 'Kasun Wickramasinghe',
      avatar: 'KW',
      role: 'Curatorial Fellow',
      type: 'Video',
      typeIcon: 'videocam',
      status: 'PENDING',
      category: 'Musicological Archives',
      submittedAt: 'Yesterday, 18:40',
      durationOrSize: '24m 05s',
      isElderPriority: false,
      dialect: 'Central Hill-Country Kandyan',
      nlpConfidence: 91.5,
      excerpt: 'Detailed demonstration of complex Vannam tempo shifts documented under traditional guru-kula pedagogical standards.'
    },
    {
      id: 'MOD-8790',
      code: 'MOD-8790',
      title: 'Ola Leaf Manuscript Scan: Ancient Ayurvedic Toxicology Remedies (Vishavaidya)',
      contributor: 'Dr. Nimali Gunawardena',
      avatar: 'NG',
      role: 'Indigenous Medical Historian',
      type: 'Document',
      typeIcon: 'description',
      status: 'COLD_VAULT',
      category: 'Manuscript Vault',
      submittedAt: '14 Oct 2024',
      durationOrSize: '142 MB PDF',
      isElderPriority: false,
      dialect: 'Classical Sinhala & Pali Gloss',
      nlpConfidence: 94.0,
      excerpt: 'High-resolution multispectral imaging of 48 palm-leaf folios dating back to late Dambadeniya era with botanical cross-references.'
    }
  ]);

  selectedRecord = signal<ModerationItem | null>(this.records()[0]);

  pendingCount = computed(() => this.records().filter(r => r.status === 'PENDING').length);

  filteredList = computed(() => {
    let list = this.records().filter(r => r.status === this.activeTab());
    const f = this.activeFilter();
    if (f === 'ELDER') {
      list = list.filter(r => r.isElderPriority);
    } else if (f === 'AUDIO') {
      list = list.filter(r => r.type === 'Audio');
    } else if (f === 'VIDEO') {
      list = list.filter(r => r.type === 'Video');
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.contributor.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q)
      );
    }
    return list;
  });

  constructor(private authService: AuthService, private router: Router) {}

  selectRecord(item: ModerationItem): void {
    this.selectedRecord.set(item);
  }

  addTag(): void {
    if (this.newTag.trim()) {
      let t = this.newTag.trim();
      if (!t.startsWith('#')) t = '#' + t;
      this.customTags.update(tags => [...tags, t]);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    this.customTags.update(tags => tags.filter(t => t !== tag));
  }

  approveAndPublish(rec: ModerationItem): void {
    this.records.update(items =>
      items.map(i => i.id === rec.id ? { ...i, status: 'LIVE' as const } : i)
    );
    this.showToast(`Submission ${rec.code} approved and published to the Sovereign Heritage Canon!`);
  }

  routeToDispute(rec: ModerationItem): void {
    this.showToast(`${rec.code} dispatched to Curatorial Council Dispute Queue for multi-signoff.`);
  }

  rejectAndArchive(rec: ModerationItem): void {
    this.records.update(items =>
      items.map(i => i.id === rec.id ? { ...i, status: 'COLD_VAULT' as const } : i)
    );
    this.showToast(`Submission ${rec.code} flagged and moved to Cold Vault Archive.`);
  }

  autoTagAll(): void {
    this.showToast('NLP Engine completed taxonomy auto-tagging on 14 queued records.');
  }

  exportQueueCsv(): void {
    this.showToast('Moderation queue exported as encrypted curatorial CSV.');
  }

  syncColdChain(): void {
    this.showToast('Cold Chain synchronisation initiated with Central National Vault.');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
