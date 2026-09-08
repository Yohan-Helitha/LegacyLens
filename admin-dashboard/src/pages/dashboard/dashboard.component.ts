import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
      
      <!-- Toast Alert Notification -->
      <div 
        *ngIf="toastMessage()" 
        class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 animate-bounce">
        <span class="material-symbols-outlined text-emerald-300 text-xl">sync</span>
        <div class="text-sm font-medium">{{ toastMessage() }}</div>
        <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
      </div>

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Top Navigation Header -->
        <app-header pageTitle="Overview + Analytics" section="Console"></app-header>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Operational Overview Header & Live Status -->
          <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs uppercase tracking-wider text-[#9b4600] font-bold">Central Command Engine</span>
                <span class="w-1.5 h-1.5 rounded-full bg-[#9b4600]"></span>
                <span class="text-xs text-[#6f7978]">Real-time Telemetry Active</span>
              </div>
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Institutional Governance Console
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Unified administration bridge orchestrating Sri Lankan cultural archive ingestion, oral-history authentication, territorial cartography nodes, and legal attribution disputes.
              </p>
            </div>

            <!-- Operational Toggles & Sync Action -->
            <div class="flex items-center gap-2.5 bg-white border border-[#dde3eb] p-1.5 rounded-2xl shadow-xs self-start xl:self-auto flex-wrap">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f2f4f3] text-xs font-medium text-[#191c1c]">
                <span class="material-symbols-outlined text-sm text-[#004343]">cloud_done</span>
                <span>Archival Coldvault: Online</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fe893e]/15 text-xs font-bold text-[#9b4600]">
                <span class="material-symbols-outlined text-sm text-[#9b4600]">speed</span>
                <span>SLA: 98.4% On-time</span>
              </div>
              <button 
                (click)="syncAllQueues()"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-sm" [class.animate-spin]="isSyncing()">cached</span>
                <span>Sync All Queues</span>
              </button>
            </div>
          </div>

          <!-- Primary Key Metrics Strip (4 Cards) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#004343] transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Weekly Ingestion</span>
                <div class="w-8 h-8 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                  <span class="material-symbols-outlined text-lg">upload_file</span>
                </div>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">1,482</span>
                <span class="flex items-center text-xs font-bold text-[#004343]">
                  <span class="material-symbols-outlined text-sm">north_east</span> +18.4%
                </span>
              </div>
              <div class="text-[11px] text-[#6f7978]">Verified historical media artifacts</div>
              <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#004343] h-full rounded-full" style="width: 74%"></div>
              </div>
            </div>

            <a routerLink="/verifications" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#9b4600] transition-colors cursor-pointer">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Pending Verifications</span>
                <div class="w-8 h-8 rounded-lg bg-[#fe893e]/20 flex items-center justify-center text-[#9b4600]">
                  <span class="material-symbols-outlined text-lg">verified_user</span>
                </div>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">47</span>
                <span class="flex items-center text-xs font-bold text-[#9b4600]">
                  <span class="material-symbols-outlined text-sm">priority_high</span> 12 Critical
                </span>
              </div>
              <div class="text-[11px] text-[#6f7978]">Elder dossiers & lineage custodians</div>
              <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#fe893e] h-full rounded-full" style="width: 58%"></div>
              </div>
            </a>

            <a routerLink="/moderation" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-red-600 transition-colors cursor-pointer">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Active Flagged Intake</span>
                <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                  <span class="material-symbols-outlined text-lg">flag</span>
                </div>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">28</span>
                <span class="flex items-center text-xs font-bold text-red-700">
                  <span class="material-symbols-outlined text-sm">trending_up</span> 2.1% anomaly
                </span>
              </div>
              <div class="text-[11px] text-[#6f7978]">Guideline checks & auto-tag errors</div>
              <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                <div class="bg-red-600 h-full rounded-full" style="width: 32%"></div>
              </div>
            </a>

            <a routerLink="/map" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#0f5c5c] transition-colors cursor-pointer">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Geographic Nodes</span>
                <div class="w-8 h-8 rounded-lg bg-[#004343]/10 flex items-center justify-center text-[#004343]">
                  <span class="material-symbols-outlined text-lg">explore</span>
                </div>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">312</span>
                <span class="flex items-center text-xs font-bold text-[#004343]">
                  <span class="material-symbols-outlined text-sm">pin_drop</span> 9 Provinces
                </span>
              </div>
              <div class="text-[11px] text-[#6f7978]">Mapped oral testimony points</div>
              <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                <div class="bg-[#0f5c5c] h-full rounded-full" style="width: 88%"></div>
              </div>
            </a>

          </div>

          <!-- The 5 Core Operational Queues Hub (Bento Layout) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Queue 1: Profile Verification (7 cols) -->
            <div class="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#004343] text-white flex items-center justify-center shadow-xs">
                    <span class="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Queue 01: Profile Verification</h2>
                    <p class="text-[11px] text-[#6f7978]">Oral Historians & Master Lineage Keepers</p>
                  </div>
                </div>
                <a routerLink="/verifications" class="px-3 py-1.5 rounded-lg bg-[#f2f4f3] text-[#004343] text-xs font-bold hover:bg-[#004343] hover:text-white transition-colors flex items-center gap-1">
                  <span>Inspect Queue</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <!-- Micro Dossiers List -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <img 
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=60" 
                      alt="Mudiyanse Jayakody" 
                      class="w-11 h-11 rounded-xl object-cover shadow-2xs shrink-0"
                    />
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-[#191c1c] truncate">Mudiyanse Jayakody (78)</h4>
                      <p class="text-[11px] text-[#6f7978] truncate">Ruhunu Traditional Drumming Lineage • Southern Province</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">Dossier 94% Valid</span>
                    <button (click)="approveElder('Mudiyanse Jayakody')" class="px-3 py-1 rounded-lg bg-[#004343] text-white text-xs font-bold hover:bg-[#0f5c5c] transition-colors cursor-pointer">
                      Approve
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <img 
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=60" 
                      alt="Kathirkamar Sivagnanam" 
                      class="w-11 h-11 rounded-xl object-cover shadow-2xs shrink-0"
                    />
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-[#191c1c] truncate">Kathirkamar Sivagnanam (84)</h4>
                      <p class="text-[11px] text-[#6f7978] truncate">Nallur Temple Song Reciter • Northern Province</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Gramasevaka Seal Ok</span>
                    <button (click)="approveElder('Kathirkamar Sivagnanam')" class="px-3 py-1 rounded-lg bg-[#004343] text-white text-xs font-bold hover:bg-[#0f5c5c] transition-colors cursor-pointer">
                      Approve
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="flex items-center gap-3 min-w-0">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=60" 
                      alt="Don Charles Wickramaratne" 
                      class="w-11 h-11 rounded-xl object-cover shadow-2xs shrink-0"
                    />
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-[#191c1c] truncate">Don Charles Wickramaratne (82)</h4>
                      <p class="text-[11px] text-[#6f7978] truncate">Galle Fort Maritime Lore Keeper • Southern Province</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">Dossier 88% Valid</span>
                    <button (click)="approveElder('Don Charles Wickramaratne')" class="px-3 py-1 rounded-lg bg-[#004343] text-white text-xs font-bold hover:bg-[#0f5c5c] transition-colors cursor-pointer">
                      Approve
                    </button>
                  </div>
                </div>
              </div>

              <div class="pt-2 flex items-center justify-between text-xs text-[#6f7978] border-t border-[#eceeed]">
                <span>Showing 3 of 47 pending elders across 9 territorial divisions</span>
                <span class="text-[#004343] font-bold">Batch processing ready</span>
              </div>
            </div>

            <!-- Queue 2: Moderation & Auto-Tagging (5 cols) -->
            <div class="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shadow-xs">
                    <span class="material-symbols-outlined text-xl">rule</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Queue 02: Moderation</h2>
                    <p class="text-[11px] text-[#6f7978]">Media Intake & AI Auto-Tagging</p>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold">28 Hold</span>
              </div>

              <!-- Threshold & Sparkline -->
              <div class="p-3.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[#191c1c]">Violation Threshold Index</span>
                  <span class="font-bold text-red-700">1.8% vs 4.0% SLA</span>
                </div>
                
                <div class="h-16 w-full flex items-end gap-1 px-1">
                  <div class="bg-[#004343]/30 hover:bg-[#004343] transition-all rounded-t w-full h-[45%]" title="Mon: 1.2%"></div>
                  <div class="bg-[#004343]/30 hover:bg-[#004343] transition-all rounded-t w-full h-[60%]" title="Tue: 1.5%"></div>
                  <div class="bg-[#004343]/30 hover:bg-[#004343] transition-all rounded-t w-full h-[30%]" title="Wed: 0.9%"></div>
                  <div class="bg-[#004343]/40 hover:bg-[#004343] transition-all rounded-t w-full h-[75%]" title="Thu: 1.9%"></div>
                  <div class="bg-[#004343]/50 hover:bg-[#004343] transition-all rounded-t w-full h-[55%]" title="Fri: 1.4%"></div>
                  <div class="bg-[#fe893e] hover:bg-[#9b4600] transition-all rounded-t w-full h-[90%]" title="Sat: 2.3%"></div>
                  <div class="bg-red-600 hover:bg-red-800 transition-all rounded-t w-full h-[70%]" title="Sun: 1.8%"></div>
                </div>
                <div class="flex justify-between text-[10px] text-[#6f7978]">
                  <span>7 Days ago</span>
                  <span>Rolling avg: 1.57%</span>
                  <span>Today</span>
                </div>
              </div>

              <!-- Auto tagger status -->
              <div class="space-y-1.5 text-xs">
                <div class="flex items-center justify-between py-1">
                  <div class="flex items-center gap-1.5 text-[#3f4948]">
                    <span class="material-symbols-outlined text-sm text-[#9b4600]">psychology</span>
                    <span>Auto-tagger: Sinhala/Tamil Dialects</span>
                  </div>
                  <span class="text-[#004343] font-bold">96.2% match</span>
                </div>
                <div class="flex items-center justify-between py-1">
                  <div class="flex items-center gap-1.5 text-[#3f4948]">
                    <span class="material-symbols-outlined text-sm text-red-600">warning</span>
                    <span>Sensitive Cultural Ritual Clips</span>
                  </div>
                  <span class="text-red-700 font-bold">4 requiring review</span>
                </div>
              </div>

              <a routerLink="/moderation" class="w-full py-2.5 rounded-xl bg-[#f2f4f3] text-[#191c1c] text-xs font-bold hover:bg-[#004343] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-sm">gavel</span>
                <span>Open Moderation Studio</span>
              </a>
            </div>

            <!-- Queue 3: Disputes (4 cols) -->
            <div class="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#fe893e] text-[#672c00] flex items-center justify-center shadow-xs">
                    <span class="material-symbols-outlined text-xl">balance</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Queue 03: Disputes</h2>
                    <p class="text-[11px] text-[#6f7978]">Attribution & Copyright</p>
                  </div>
                </div>
                <span class="font-['Source_Serif_4',serif] text-lg font-bold text-[#9b4600]">06</span>
              </div>

              <div class="space-y-2.5">
                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-[#191c1c]">Sigiriya Folk Verse #441</span>
                    <span class="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">14h SLA left</span>
                  </div>
                  <p class="text-[11px] text-[#3f4948] line-clamp-2">
                    Disputed provenance claim between Matale Temple Trust and Central Cultural Fund regarding 19th-century palm record scans.
                  </p>
                  <div class="flex items-center justify-between pt-1 text-xs">
                    <span class="text-[#6f7978]">Assigned: Legal Core</span>
                    <a routerLink="/disputes" class="text-[#004343] font-bold hover:underline cursor-pointer">Arbitrate</a>
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-[#191c1c]">Galle Lacework Audio Log</span>
                    <span class="px-1.5 py-0.5 rounded bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">36h SLA left</span>
                  </div>
                  <p class="text-[11px] text-[#3f4948] line-clamp-2">
                    Family descendant requests redaction of private lineage name mentions in oral recording transcript.
                  </p>
                  <div class="flex items-center justify-between pt-1 text-xs">
                    <span class="text-[#6f7978]">Assigned: Ethics Panel</span>
                    <a routerLink="/disputes" class="text-[#004343] font-bold hover:underline cursor-pointer">Arbitrate</a>
                  </div>
                </div>
              </div>

              <a routerLink="/disputes" class="w-full py-2 rounded-xl bg-[#f2f4f3] text-[#191c1c] text-xs font-bold hover:bg-[#dde3eb] transition-colors flex items-center justify-center gap-1 cursor-pointer">
                <span>View Dispute Log</span>
                <span class="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>

            <!-- Queue 4: Cartography (4 cols) -->
            <div class="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#004343] text-white flex items-center justify-center shadow-xs">
                    <span class="material-symbols-outlined text-xl">map</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Queue 04: Cartography</h2>
                    <p class="text-[11px] text-[#6f7978]">Provincial Node Anchors</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-[#004343]/10 text-[#004343] text-xs font-bold">+9 Added</span>
              </div>

              <!-- Static Map Integration Preview -->
              <div class="w-full h-36 rounded-xl bg-cover bg-center relative overflow-hidden shadow-inner" style="background-image: url('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60')">
                <div class="absolute inset-0 bg-[#004343]/40 flex flex-col justify-between p-3">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded bg-white text-[#004343] text-[10px] font-bold shadow-xs">Active GPS Bounds</span>
                    <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e] animate-ping"></span>
                  </div>
                  <div class="bg-white/90 backdrop-blur-sm p-2 rounded-lg flex items-center justify-between text-xs">
                    <span class="font-bold text-[#191c1c]">Anuradhapura Sacred Precinct</span>
                    <span class="text-[#004343] font-bold">Node #188</span>
                  </div>
                </div>
              </div>

              <div class="space-y-1.5 text-xs text-[#3f4948]">
                <div class="flex justify-between items-center">
                  <span>Central Province: 84 markers</span>
                  <span class="text-[#004343] font-bold">100% Geo-bound</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Northern Province: 62 markers</span>
                  <span class="text-[#9b4600] font-bold">3 pending offset fix</span>
                </div>
              </div>

              <a routerLink="/map" class="w-full py-2.5 rounded-xl bg-[#004343] text-white text-xs font-bold hover:bg-[#0f5c5c] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-sm">travel_explore</span>
                <span>Launch GIS Map Studio</span>
              </a>
            </div>

            <!-- Queue 5: Vault Storage (4 cols) -->
            <div class="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#363c42] text-white flex items-center justify-center shadow-xs">
                    <span class="material-symbols-outlined text-xl">inventory_2</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Queue 05: Vault Storage</h2>
                    <p class="text-[11px] text-[#6f7978]">Cold-vault Lifecycle</p>
                  </div>
                </div>
                <span class="text-xs text-[#6f7978] font-bold">4.8 TB Total</span>
              </div>

              <div class="space-y-2.5">
                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-[#9b4600] text-xl">ac_unit</span>
                    <div>
                      <h4 class="text-xs font-bold text-[#191c1c]">Cold Storage Migration</h4>
                      <p class="text-[10px] text-[#6f7978]">Raw Master 4K Tapes (1970-1992)</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-[#004343]">99.98% Crypt-sealed</span>
                </div>

                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-[#004343] text-xl">unarchive</span>
                    <div>
                      <h4 class="text-xs font-bold text-[#191c1c]">Public Cache Restorations</h4>
                      <p class="text-[10px] text-[#6f7978]">34 assets restored for schools</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-[#9b4600]">Active</span>
                </div>
              </div>

              <div class="space-y-1">
                <div class="flex justify-between text-xs text-[#6f7978]">
                  <span>Allocated Archive Bandwidth</span>
                  <span class="text-[#191c1c] font-bold">3.2 TB / 10 TB</span>
                </div>
                <div class="w-full bg-[#f2f4f3] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#363c42] h-full rounded-full" style="width: 32%"></div>
                </div>
              </div>

              <button (click)="triggerRegistryNotice()" class="w-full py-2.5 rounded-xl bg-[#f2f4f3] text-[#191c1c] text-xs font-bold hover:bg-[#dde3eb] transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-sm">settings_backup_restore</span>
                <span>Inspect Archival Registry</span>
              </button>
            </div>

          </div>

          <!-- In-depth Telemetry & Community Analytics Split -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <!-- Ingestion vs Verification Flow (8 cols) -->
            <div class="lg:col-span-8 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#eceeed] pb-3">
                <div>
                  <h2 class="font-['Source_Serif_4',serif] text-base font-bold text-[#191c1c]">Intake Throughput & Contributor Distribution</h2>
                  <p class="text-xs text-[#6f7978]">Cross-province academic & village elder participation curve</p>
                </div>
                <div class="flex items-center gap-1 bg-[#f2f4f3] p-1 rounded-xl text-xs">
                  <button class="px-3 py-1 rounded-lg bg-white shadow-2xs text-[#004343] font-bold">Weekly</button>
                  <button class="px-3 py-1 rounded-lg text-[#6f7978] hover:text-[#191c1c]">Monthly</button>
                  <button class="px-3 py-1 rounded-lg text-[#6f7978] hover:text-[#191c1c]">Yearly</button>
                </div>
              </div>

              <!-- Vector SVG Chart -->
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-4">
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#004343]"></span> Curated Ingestion</span>
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span> Verified Approvals</span>
                  </div>
                  <span class="text-[#6f7978]">Total 7-day throughput: 3,420 media units</span>
                </div>

                <svg class="w-full h-44" fill="none" preserveAspectRatio="none" viewBox="0 0 700 180">
                  <defs>
                    <linearGradient id="primaryGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#0f5c5c" stop-opacity="0.3"></stop>
                      <stop offset="100%" stop-color="#0f5c5c" stop-opacity="0.0"></stop>
                    </linearGradient>
                    <linearGradient id="secondaryGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#fe893e" stop-opacity="0.25"></stop>
                      <stop offset="100%" stop-color="#fe893e" stop-opacity="0.0"></stop>
                    </linearGradient>
                  </defs>
                  <!-- Grid Lines -->
                  <line stroke="#bfc8c8" stroke-dasharray="4 4" stroke-opacity="0.3" x1="0" x2="700" y1="30" y2="30"></line>
                  <line stroke="#bfc8c8" stroke-dasharray="4 4" stroke-opacity="0.3" x1="0" x2="700" y1="80" y2="80"></line>
                  <line stroke="#bfc8c8" stroke-dasharray="4 4" stroke-opacity="0.3" x1="0" x2="700" y1="130" y2="130"></line>
                  <!-- Area 1 (Primary: Ingestion) -->
                  <path d="M0,130 C80,110 140,50 220,65 C300,80 380,20 460,40 C540,60 620,15 700,25 L700,180 L0,180 Z" fill="url(#primaryGrad)"></path>
                  <path d="M0,130 C80,110 140,50 220,65 C300,80 380,20 460,40 C540,60 620,15 700,25" fill="none" stroke="#004343" stroke-linecap="round" stroke-width="3"></path>
                  <!-- Area 2 (Secondary: Approvals) -->
                  <path d="M0,160 C90,140 160,110 240,115 C320,120 400,70 480,85 C560,100 620,60 700,75 L700,180 L0,180 Z" fill="url(#secondaryGrad)"></path>
                  <path d="M0,160 C90,140 160,110 240,115 C320,120 400,70 480,85 C560,100 620,60 700,75" fill="none" stroke="#9b4600" stroke-dasharray="6 4" stroke-linecap="round" stroke-width="2.5"></path>
                  <!-- Data Points -->
                  <circle cx="220" cy="65" fill="#004343" r="4"></circle>
                  <circle cx="460" cy="40" fill="#004343" r="4"></circle>
                  <circle cx="700" cy="25" fill="#004343" r="4"></circle>
                  <circle cx="480" cy="85" fill="#9b4600" r="3.5"></circle>
                </svg>

                <div class="flex justify-between text-[#6f7978] text-xs px-1">
                  <span>Mon 12</span>
                  <span>Tue 13</span>
                  <span>Wed 14</span>
                  <span>Thu 15</span>
                  <span>Fri 16</span>
                  <span>Sat 17</span>
                  <span>Sun 18</span>
                </div>
              </div>

              <!-- Demographics -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#eceeed]">
                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                  <span class="text-[10px] text-[#6f7978] uppercase font-bold">Student Recorders</span>
                  <p class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">54.2%</p>
                  <p class="text-[11px] text-[#3f4948]">12,410 active youth scouts</p>
                </div>
                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                  <span class="text-[10px] text-[#6f7978] uppercase font-bold">Elders & Custodians</span>
                  <p class="font-['Source_Serif_4',serif] text-lg font-bold text-[#9b4600]">31.8%</p>
                  <p class="text-[11px] text-[#3f4948]">Authentic source narrators</p>
                </div>
                <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                  <span class="text-[10px] text-[#6f7978] uppercase font-bold">University Historians</span>
                  <p class="font-['Source_Serif_4',serif] text-lg font-bold text-[#363c42]">14.0%</p>
                  <p class="text-[11px] text-[#3f4948]">Peer review validation tier</p>
                </div>
              </div>
            </div>

            <!-- Live Incident Feed & Oversight Actions (4 cols) -->
            <div class="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-[#eceeed]">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e] animate-pulse"></span>
                  <h2 class="font-['Source_Serif_4',serif] text-base font-bold text-[#191c1c]">Live Incident Stream</h2>
                </div>
                <span class="text-xs text-[#6f7978]">Auto-refresh: 5s</span>
              </div>

              <!-- Stream Items -->
              <div class="space-y-3 overflow-y-auto max-h-72 pr-1">
                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="w-7 h-7 rounded-full bg-[#fe893e]/20 text-[#9b4600] flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-sm">campaign</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#191c1c]">Diyawanna Oral Record Ingested</span>
                      <span class="text-[10px] text-[#6f7978]">2m ago</span>
                    </div>
                    <p class="text-[11px] text-[#3f4948] line-clamp-1">Scout ID #892 uploaded 22-min WAV master tape.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-sm">priority_high</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#191c1c]">Duplicate Hash Detected</span>
                      <span class="text-[10px] text-[#6f7978]">8m ago</span>
                    </div>
                    <p class="text-[11px] text-[#3f4948] line-clamp-1">Sha-256 match on Jaffna Library 1950 photograph.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="w-7 h-7 rounded-full bg-[#004343]/10 text-[#004343] flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#191c1c]">Elder Dossier Signed</span>
                      <span class="text-[10px] text-[#6f7978]">19m ago</span>
                    </div>
                    <p class="text-[11px] text-[#3f4948] line-clamp-1">Ven. Ratanasara Thero accredited as Kandy Custodian.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                  <div class="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-sm">lock_reset</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#191c1c]">Cold Vault Routine Snapshot</span>
                      <span class="text-[10px] text-[#6f7978]">44m ago</span>
                    </div>
                    <p class="text-[11px] text-[#3f4948] line-clamp-1">480 files synced to Colombo Secondary Cold Bank.</p>
                  </div>
                </div>
              </div>

              <!-- Fast Command Dispatches -->
              <div class="pt-3 border-t border-[#eceeed] space-y-2">
                <span class="text-[10px] uppercase font-bold tracking-wider text-[#6f7978]">Command Dispatches</span>
                <div class="grid grid-cols-2 gap-2">
                  <button (click)="broadcastAlert()" class="px-2 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#191c1c] text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">broadcast_on_home</span>
                    <span>Broadcast Alert</span>
                  </button>
                  <button (click)="autoPassVerified()" class="px-2 py-2 rounded-xl bg-[#fe893e] hover:bg-[#9b4600] text-[#672c00] hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    <span>Auto-Pass</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  `
})
export class DashboardComponent {
  user = this.authService.currentUser;
  isSyncing = signal<boolean>(false);
  toastMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  syncAllQueues(): void {
    this.isSyncing.set(true);
    this.toastMessage.set('Synchronizing all regional queues with National Heritage Coldvault...');
    setTimeout(() => {
      this.isSyncing.set(false);
      this.toastMessage.set('All 5 core governance queues are synchronized and live.');
      setTimeout(() => this.toastMessage.set(null), 3500);
    }, 1200);
  }

  approveElder(name: string): void {
    this.toastMessage.set(`Elder credentials for "${name}" approved & certified.`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  triggerRegistryNotice(): void {
    this.toastMessage.set('Accessing Master Archival Registry (4.8 TB online)...');
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  broadcastAlert(): void {
    this.toastMessage.set('High-priority alert dispatched to all regional GN officers.');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  autoPassVerified(): void {
    this.toastMessage.set('12 pre-screened elder dossiers auto-certified under ICH standards.');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
