import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

interface AuditLog {
  id: string;
  blockHash: string;
  hub: string;
  routine: string;
  payloadType: string;
  status: 'VERIFIED' | 'RESOLVING' | 'PENDING';
  timestamp: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">sync</span>
          <div class="text-sm font-medium">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
        </div>
      }

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Top Navigation Header -->
        <app-header 
          [pageTitle]="activeTab() === 'overview' ? 'Overview + Analytics' : 'Platform Analytics'" 
          section="Console">
        </app-header>

        <!-- Sub-Header Tabs Navigation (Overview | Analytics) -->
        <div class="bg-white border-b border-[#dde3eb] px-6 flex items-center justify-between shrink-0 select-none shadow-xs z-20">
          <div class="flex items-center gap-1 sm:gap-2">
            <!-- Tab 1: Overview Console -->
            <button 
              (click)="setActiveTab('overview')"
              [ngClass]="activeTab() === 'overview' ? 'border-[#004343] text-[#004343] font-bold bg-[#004343]/5' : 'border-transparent text-[#6f7978] hover:text-[#191c1c] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">dashboard</span>
              <span>Overview</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold" [ngClass]="activeTab() === 'overview' ? 'bg-[#004343] text-white' : 'bg-gray-100 text-gray-600'">Live</span>
            </button>

            <!-- Tab 2: Platform Analytics & Ingestion -->
            <button 
              (click)="setActiveTab('analytics')"
              [ngClass]="activeTab() === 'analytics' ? 'border-[#004343] text-[#004343] font-bold bg-[#004343]/5' : 'border-transparent text-[#6f7978] hover:text-[#191c1c] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">analytics</span>
              <span>Analytics & Intake</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold" [ngClass]="activeTab() === 'analytics' ? 'bg-[#fe893e] text-white' : 'bg-gray-100 text-gray-600'">25 Hubs</span>
            </button>
          </div>

          <!-- Quick Right Indicators -->
          <div class="hidden md:flex items-center gap-3 text-xs text-[#6f7978]">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-medium text-[#191c1c]">Provincial Sync Active</span>
            </span>
            <span class="text-[#c2c8c7]">•</span>
            <span class="font-mono text-[11px]">Block #4,192,801</span>
          </div>
        </div>

        <!-- ====================================================================== -->
        <!-- TAB 1: OVERVIEW PAGE CONTENT -->
        <!-- ====================================================================== -->
        @if (activeTab() === 'overview') {
          <main class="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-200">
            
            <!-- Operational Overview Header & Live Status -->
            <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
              <div class="space-y-1">
                <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                  Admin Dashboard & Analytics
                </h1>
                <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                  Unified administration bridge orchestrating Sri Lankan cultural archive ingestion, oral-history authentication, territorial cartography nodes, and legal attribution disputes.
                </p>
              </div>

              <!-- Operational Toggles & Sync Action -->
              <div class="flex items-center gap-2.5 bg-white border border-[#dde3eb] p-1.5 rounded-2xl shadow-xs self-start xl:self-auto flex-wrap">
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

              <a routerLink="/verification" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#9b4600] transition-colors cursor-pointer">
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
                  <a routerLink="/verification" class="px-3 py-1.5 rounded-lg bg-[#f2f4f3] text-[#004343] text-xs font-bold hover:bg-[#004343] hover:text-white transition-colors flex items-center gap-1">
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
        }

        <!-- ====================================================================== -->
        <!-- TAB 2: ANALYTICS & INTAKE PAGE CONTENT -->
        <!-- ====================================================================== -->
        @if (activeTab() === 'analytics') {
          <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
            
            <!-- Interactive Top Action & Live Telemetry Banner -->
            <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap text-xs">
                  <span class="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#fe893e] animate-ping"></span>
                  <span class="font-bold text-[#9b4600] uppercase tracking-wider">Telemetry Active</span>
                  <span class="text-[#6f7978]">&bull;</span>
                  <span class="text-[#3f4948]">Synced across 9 Provincial Data Hubs</span>
                  <span class="text-[#6f7978]">&bull;</span>
                  <span class="text-[#6f7978] font-mono">Node Block #4,192,801</span>
                </div>
                <h1 class="font-['Source_Serif_4',serif] text-2xl md:text-3xl font-bold text-[#004343] tracking-tight">
                  Platform Analytics & Heritage Intake
                </h1>
                <p class="text-xs text-[#52605f] max-w-2xl leading-relaxed">
                  Continuous archival surveillance, cryptographic provenance verification, and field recording throughput across 25 administrative districts.
                </p>
              </div>

              <!-- Controls -->
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="flex items-center bg-[#f2f4f3] rounded-xl p-1 shadow-xs border border-[#dde3eb]">
                  <button
                    (click)="activeRange.set('30d')"
                    [ngClass]="activeRange() === '30d' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#52605f] hover:text-[#191c1c]'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    (click)="activeRange.set('q3')"
                    [ngClass]="activeRange() === 'q3' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#52605f] hover:text-[#191c1c]'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Q3 2024
                  </button>
                  <button
                    (click)="activeRange.set('annual')"
                    [ngClass]="activeRange() === 'annual' ? 'bg-white text-[#004343] font-bold shadow-xs' : 'text-[#52605f] hover:text-[#191c1c]'"
                    class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Annual 2024
                  </button>
                </div>

                <button
                  (click)="exportReport()"
                  class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <span class="material-symbols-outlined text-base">download_for_offline</span>
                  <span>Export Audit Report</span>
                </button>

                <button
                  (click)="syncCaches()"
                  title="Sync Provincial Caches"
                  class="p-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#004343] transition-colors border border-[#dde3eb] cursor-pointer"
                >
                  <span class="material-symbols-outlined text-base" [class.animate-spin]="isSyncing()">sync</span>
                </button>
              </div>
            </div>

            <!-- Key KPI Metric Cards (4 Cards) -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <!-- KPI 1 -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#004343]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Digitized Assets</span>
                    <div class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] mt-1">14,892</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#e8f5f4] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">auto_stories</span>
                  </div>
                </div>
                <div class="mt-4 flex items-end justify-between pt-1">
                  <div class="flex items-center gap-1 text-[#004343]">
                    <span class="material-symbols-outlined text-sm font-bold">trending_up</span>
                    <span class="text-xs font-bold">+18.4%</span>
                    <span class="text-[10px] text-[#6f7978]">MoM</span>
                  </div>
                  <!-- Sparkline SVG -->
                  <svg class="w-24 h-7 text-[#004343]" fill="none" viewBox="0 0 96 28">
                    <path d="M2 24L18 19L34 22L50 14L66 16L82 6L94 2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                    <path d="M2 24L18 19L34 22L50 14L66 16L82 6L94 2V28H2Z" fill="currentColor" fill-opacity="0.08"></path>
                  </svg>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004343]"></div>
              </div>

              <!-- KPI 2 -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#9b4600]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Elder Lineage Index</span>
                    <div class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] mt-1">94.6%</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-[#9b4600]">
                    <span class="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                </div>
                <div class="mt-4 flex items-end justify-between pt-1">
                  <div class="flex items-center gap-1 text-[#9b4600]">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    <span class="text-xs font-semibold text-[#202426]">Verified Lineage Accuracy</span>
                  </div>
                  <div class="w-16 bg-[#e6e9e8] h-2 rounded-full overflow-hidden">
                    <div class="bg-[#fe893e] h-full rounded-full" style="width: 94.6%"></div>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe893e]"></div>
              </div>

              <!-- KPI 3 -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#004343]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Mod SLA Turnaround</span>
                    <div class="flex items-baseline gap-1 mt-1">
                      <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">2.4</span>
                      <span class="text-xs text-[#6f7978]">Hours</span>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#aceeee] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">timer</span>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between pt-1 text-xs">
                  <div class="flex items-center gap-1 text-[#004343]">
                    <span class="material-symbols-outlined text-sm">check_circle</span>
                    <span class="font-bold">99.1%</span>
                    <span class="text-[#6f7978]">compliance</span>
                  </div>
                  <span class="text-[10px] text-[#6f7978]">Target &lt; 6h</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#90d2d1]"></div>
              </div>

              <!-- KPI 4 -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#363c42]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Active Field Scouts</span>
                    <div class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] mt-1">2,418</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">explore</span>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between pt-1 text-xs">
                  <div class="flex items-center gap-1.5 text-[#3f4948]">
                    <span class="w-2 h-2 rounded-full bg-[#9b4600]"></span>
                    <span class="font-semibold text-[11px]">Active in 25/25 Districts</span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e6e9e8] text-[#004343] font-bold">100% Geo-bound</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#363c42]"></div>
              </div>
            </div>

            <!-- Deep Analytics Section: Asymmetric Split Layout -->
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              <!-- Left Column: Primary Intake & Trajectory (7 Cols) -->
              <div class="xl:col-span-7 flex flex-col gap-6">
                
                <!-- Intake Throughput & Dialect Breakdown -->
                <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col gap-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Intake Throughput</span>
                      <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Archival Velocity & Dialect Distribution</h2>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-[#191c1c] text-xs font-semibold">
                        <span class="w-2 h-2 rounded-full bg-[#0f5c5c]"></span> Sinhala 62%
                      </span>
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-[#191c1c] text-xs font-semibold">
                        <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span> Tamil 28%
                      </span>
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-[#191c1c] text-xs font-semibold">
                        <span class="w-2 h-2 rounded-full bg-[#363c42]"></span> Indigenous 10%
                      </span>
                    </div>
                  </div>

                  <!-- Multi-series Archival Ingestion Bar Graph -->
                  <div class="w-full bg-[#f8faf9] rounded-xl p-4 flex flex-col gap-3 border border-[#dde3eb]">
                    <div class="flex items-center justify-between text-[#6f7978] text-xs">
                      <span>Monthly Submissions by Category</span>
                      <div class="flex items-center gap-3">
                        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-[#004343]"></span> Oral Histories</span>
                        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-[#fe893e]"></span> Craft Blueprints</span>
                        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-[#90d2d1]"></span> Ritual Footage</span>
                      </div>
                    </div>

                    <!-- Synthetic Data Visualization Bars (May to Oct) -->
                    <div class="h-56 w-full flex items-end gap-3 pt-2 pb-2">
                      <!-- May -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3 bg-[#004343] rounded-t transition-all hover:opacity-80" style="height: 55%" title="Oral: 1,420"></div>
                          <div class="w-3 bg-[#fe893e] rounded-t transition-all hover:opacity-80" style="height: 38%" title="Craft: 890"></div>
                          <div class="w-3 bg-[#90d2d1] rounded-t transition-all hover:opacity-80" style="height: 24%" title="Ritual: 450"></div>
                        </div>
                        <span class="text-[11px] text-[#6f7978] font-medium">May</span>
                      </div>
                      <!-- Jun -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3 bg-[#004343] rounded-t transition-all hover:opacity-80" style="height: 64%" title="Oral: 1,730"></div>
                          <div class="w-3 bg-[#fe893e] rounded-t transition-all hover:opacity-80" style="height: 44%" title="Craft: 1,120"></div>
                          <div class="w-3 bg-[#90d2d1] rounded-t transition-all hover:opacity-80" style="height: 32%" title="Ritual: 620"></div>
                        </div>
                        <span class="text-[11px] text-[#6f7978] font-medium">Jun</span>
                      </div>
                      <!-- Jul -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3 bg-[#004343] rounded-t transition-all hover:opacity-80" style="height: 78%" title="Oral: 2,100"></div>
                          <div class="w-3 bg-[#fe893e] rounded-t transition-all hover:opacity-80" style="height: 52%" title="Craft: 1,300"></div>
                          <div class="w-3 bg-[#90d2d1] rounded-t transition-all hover:opacity-80" style="height: 45%" title="Ritual: 910"></div>
                        </div>
                        <span class="text-[11px] text-[#6f7978] font-medium">Jul</span>
                      </div>
                      <!-- Aug -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3 bg-[#004343] rounded-t transition-all hover:opacity-80" style="height: 72%" title="Oral: 1,940"></div>
                          <div class="w-3 bg-[#fe893e] rounded-t transition-all hover:opacity-80" style="height: 49%" title="Craft: 1,220"></div>
                          <div class="w-3 bg-[#90d2d1] rounded-t transition-all hover:opacity-80" style="height: 48%" title="Ritual: 970"></div>
                        </div>
                        <span class="text-[11px] text-[#6f7978] font-medium">Aug</span>
                      </div>
                      <!-- Sep -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3 bg-[#004343] rounded-t transition-all hover:opacity-80" style="height: 86%" title="Oral: 2,450"></div>
                          <div class="w-3 bg-[#fe893e] rounded-t transition-all hover:opacity-80" style="height: 61%" title="Craft: 1,510"></div>
                          <div class="w-3 bg-[#90d2d1] rounded-t transition-all hover:opacity-80" style="height: 55%" title="Ritual: 1,120"></div>
                        </div>
                        <span class="text-[11px] text-[#6f7978] font-medium">Sep</span>
                      </div>
                      <!-- Oct (Current) -->
                      <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end bg-[#004343]/5 rounded-lg p-1 border border-[#004343]/20">
                        <div class="w-full flex items-end justify-center gap-1 h-full">
                          <div class="w-3.5 bg-[#004343] rounded-t shadow-xs" style="height: 96%" title="Oral: 2,890"></div>
                          <div class="w-3.5 bg-[#fe893e] rounded-t shadow-xs" style="height: 75%" title="Craft: 1,840"></div>
                          <div class="w-3.5 bg-[#90d2d1] rounded-t shadow-xs" style="height: 68%" title="Ritual: 1,380"></div>
                        </div>
                        <span class="text-[11px] font-bold text-[#004343]">Oct</span>
                      </div>
                    </div>
                  </div>

                  <!-- Linguistic & Dialect Inset Bar -->
                  <div class="p-3.5 rounded-xl bg-[#f2f4f3] flex flex-col gap-2 border border-[#dde3eb]">
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-semibold text-[#004343]">Dialectal Representation Index</span>
                      <span class="text-[#3f4948]">Coverage against UNESCO Endangerment List: <strong class="text-[#9b4600]">High</strong></span>
                    </div>
                    <div class="w-full h-3 rounded-full bg-[#e1e3e2] overflow-hidden flex">
                      <div class="bg-[#004343] h-full" style="width: 62%" title="Sinhala Dialects 62%"></div>
                      <div class="bg-[#fe893e] h-full" style="width: 28%" title="Tamil Dialects 28%"></div>
                      <div class="bg-[#363c42] h-full" style="width: 10%" title="Vedda & Indigenous Tongues 10%"></div>
                    </div>
                    <div class="flex flex-wrap items-center justify-between text-[11px] text-[#6f7978] pt-1">
                      <span>Uva-Vellassa & Kandyan Sub-varieties (9,233)</span>
                      <span>Jaffna & Batticaloa Vernaculars (4,170)</span>
                      <span>Dambana Wanniyala-Aetto Lexicons (1,489)</span>
                    </div>
                  </div>
                </div>

                <!-- Dispute & Resolution Trajectory -->
                <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col gap-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Provincial Legal Oversight</span>
                      <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Dispute Trajectory & Attribution Resolution</h2>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-[#f2f4f3] text-[#004343] text-xs font-semibold self-start sm:self-auto">
                      Sufficiency Pass Rate: <span class="text-[#9b4600] font-bold">88.2%</span>
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                      <span class="text-xs text-[#6f7978]">Active Contested Claims</span>
                      <div class="flex items-baseline gap-1.5 my-1.5">
                        <span class="font-['Source_Serif_4',serif] text-2xl text-[#202426] font-bold">42</span>
                        <span class="text-xs text-[#004343] font-semibold">-14% vs Q2</span>
                      </div>
                      <span class="text-[11px] text-[#3f4948]">8 clan attributions under review</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                      <span class="text-xs text-[#6f7978]">Mean Dispute Latency</span>
                      <div class="flex items-baseline gap-1 my-1.5">
                        <span class="font-['Source_Serif_4',serif] text-2xl text-[#202426] font-bold">3.1</span>
                        <span class="text-xs text-[#6f7978]">Days</span>
                      </div>
                      <span class="text-[11px] text-[#004343] font-semibold">Down from 9.4 days in 2023</span>
                    </div>

                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                      <span class="text-xs text-[#6f7978]">Consensus Sign-Off</span>
                      <div class="flex items-baseline gap-1.5 my-1.5">
                        <span class="font-['Source_Serif_4',serif] text-2xl text-[#202426] font-bold">96.8%</span>
                        <span class="text-xs text-[#9b4600] font-bold">Binding</span>
                      </div>
                      <span class="text-[11px] text-[#3f4948]">Village council ratifications</span>
                    </div>
                  </div>

                  <!-- Trajectory Progress Visual -->
                  <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col gap-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-semibold text-[#004343]">Resolution vs Inflow Delta (Last 6 Months)</span>
                      <span class="text-[#004343] font-bold">142 Resolved / 158 Logged</span>
                    </div>
                    <div class="w-full bg-[#e1e3e2] h-2 rounded-full overflow-hidden">
                      <div class="bg-[#0f5c5c] h-full rounded-full" style="width: 89.8%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-[#6f7978]">
                      <span>Primary driver: Autonomous audio transcription lineage match</span>
                      <span class="font-bold text-[#202426]">89.8% Clearance</span>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Right Column: Regional Density & Custodian Velocity (5 Cols) -->
              <div class="xl:col-span-5 flex flex-col gap-6">
                
                <!-- Provincial Heritage Distribution -->
                <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Geographic Balance</span>
                      <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">9 Provincial Heritage Hubs</h2>
                    </div>
                    <span class="p-2 rounded-lg bg-[#f2f4f3] text-[#004343]">
                      <span class="material-symbols-outlined text-xl">map</span>
                    </span>
                  </div>

                  <!-- Province List -->
                  <div class="flex flex-col gap-3">
                    <!-- Central -->
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors flex flex-col gap-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#004343]"></span>
                          <span class="text-xs font-semibold text-[#004343]">Central Province</span>
                          <span class="text-[10px] text-[#6f7978]">(Kandy, Matale, Nuwara Eliya)</span>
                        </div>
                        <span class="text-xs font-bold text-[#191c1c]">3,892</span>
                      </div>
                      <div class="w-full bg-[#e1e3e2] h-1.5 rounded-full overflow-hidden">
                        <div class="bg-[#004343] h-full" style="width: 88%"></div>
                      </div>
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#9b4600] font-semibold">100% Geo-bound</span>
                        <span class="text-[#6f7978]">96% Elder Verified</span>
                      </div>
                    </div>

                    <!-- Southern -->
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors flex flex-col gap-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#0f5c5c]"></span>
                          <span class="text-xs font-semibold text-[#004343]">Southern Province</span>
                          <span class="text-[10px] text-[#6f7978]">(Galle, Matara, Hambantota)</span>
                        </div>
                        <span class="text-xs font-bold text-[#191c1c]">2,914</span>
                      </div>
                      <div class="w-full bg-[#e1e3e2] h-1.5 rounded-full overflow-hidden">
                        <div class="bg-[#0f5c5c] h-full" style="width: 74%"></div>
                      </div>
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#9b4600] font-semibold">100% Geo-bound</span>
                        <span class="text-[#6f7978]">94% Elder Verified</span>
                      </div>
                    </div>

                    <!-- Northern -->
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors flex flex-col gap-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span>
                          <span class="text-xs font-semibold text-[#004343]">Northern Province</span>
                          <span class="text-[10px] text-[#6f7978]">(Jaffna, Kilinochchi, Mannar)</span>
                        </div>
                        <span class="text-xs font-bold text-[#191c1c]">2,410</span>
                      </div>
                      <div class="w-full bg-[#e1e3e2] h-1.5 rounded-full overflow-hidden">
                        <div class="bg-[#fe893e] h-full" style="width: 68%"></div>
                      </div>
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#9b4600] font-semibold">98% Geo-bound</span>
                        <span class="text-[#6f7978]">92% Elder Verified</span>
                      </div>
                    </div>

                    <!-- Eastern -->
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors flex flex-col gap-1.5">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#9b4600]"></span>
                          <span class="text-xs font-semibold text-[#004343]">Eastern Province</span>
                          <span class="text-[10px] text-[#6f7978]">(Batticaloa, Trincomalee, Ampara)</span>
                        </div>
                        <span class="text-xs font-bold text-[#191c1c]">1,980</span>
                      </div>
                      <div class="w-full bg-[#e1e3e2] h-1.5 rounded-full overflow-hidden">
                        <div class="bg-[#9b4600] h-full" style="width: 58%"></div>
                      </div>
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#9b4600] font-semibold">99% Geo-bound</span>
                        <span class="text-[#6f7978]">89% Elder Verified</span>
                      </div>
                    </div>

                    <!-- 5 Other Provinces Combined -->
                    <div class="p-3 rounded-xl bg-[#e6e9e8]/50 border border-[#dde3eb] flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#6f7978] text-base">travel_explore</span>
                        <span class="text-xs font-medium text-[#191c1c]">5 Other Provinces Combined</span>
                      </div>
                      <span class="text-xs font-bold text-[#004343]">3,696 assets</span>
                    </div>
                  </div>
                </div>

                <!-- Elder Custodian Retention & Verification Efficiency -->
                <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col gap-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Generational Transfer</span>
                      <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Custodian Verification</h2>
                    </div>
                    <div class="w-9 h-9 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                      <span class="material-symbols-outlined text-xl">groups</span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <!-- Metric 1 -->
                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                      <div class="flex flex-col">
                        <span class="text-xs font-semibold text-[#004343]">Grama Niladhari Velocity</span>
                        <span class="text-[10px] text-[#6f7978]">Administrative sign-off cycle</span>
                      </div>
                      <div class="text-right">
                        <span class="font-['Source_Serif_4',serif] text-base font-bold text-[#9b4600]">1.8 Days</span>
                        <div class="text-[10px] text-[#6f7978]">Target &lt; 3.0d</div>
                      </div>
                    </div>

                    <!-- Metric 2 -->
                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                      <div class="flex flex-col">
                        <span class="text-xs font-semibold text-[#004343]">Youth-Elder Recording Ratio</span>
                        <span class="text-[10px] text-[#6f7978]">Apprentices paired with masters</span>
                      </div>
                      <div class="text-right">
                        <span class="font-['Source_Serif_4',serif] text-base font-bold text-[#004343]">3.4 : 1</span>
                        <div class="text-[10px] text-[#0f5c5c] font-semibold">Active pairing</div>
                      </div>
                    </div>

                    <!-- Metric 3 -->
                    <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                      <div class="flex flex-col">
                        <span class="text-xs font-semibold text-[#004343]">Custodians Retained</span>
                        <span class="text-[10px] text-[#6f7978]">Submitting periodic updates</span>
                      </div>
                      <div class="text-right">
                        <span class="font-['Source_Serif_4',serif] text-base font-bold text-[#202426]">91.4%</span>
                        <div class="text-[10px] text-[#9b4600] font-semibold">+4.2% MoM</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <!-- Field Scout Spotlight Banner (Photo-Rich Visual Element) -->
            <div class="w-full rounded-2xl bg-white border border-[#dde3eb] p-5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-5 overflow-hidden relative">
              <div class="flex flex-col sm:flex-row items-center gap-4 z-10">
                <img 
                  class="w-20 h-20 rounded-2xl object-cover shadow-xs shrink-0" 
                  alt="Senior Sri Lankan oral historian elder" 
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80"
                />
                <div class="flex flex-col text-center sm:text-left">
                  <div class="flex items-center justify-center sm:justify-start gap-2">
                    <span class="text-[11px] px-2.5 py-0.5 rounded-full bg-[#ffdbc9] text-[#9b4600] font-bold">Field Scout Spotlight</span>
                    <span class="text-xs text-[#6f7978]">Uva Province Deployment</span>
                  </div>
                  <span class="font-['Source_Serif_4',serif] text-base font-bold text-[#004343] mt-1">
                    Dambana Traditional Guild Recording Mission Completed
                  </span>
                  <p class="text-xs text-[#3f4948] max-w-xl mt-0.5">
                    412 chants and metallurgical formulas cataloged in lossless audio with full village chieftain cryptographic authorization.
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-2.5 z-10 shrink-0">
                <button (click)="inspectManifest()" class="px-4 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#004343] text-xs font-bold transition-colors cursor-pointer">
                  Inspect Ingest Manifest
                </button>
                <button (click)="viewChainOfCustody()" class="px-4 py-2 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold transition-colors cursor-pointer">
                  View Chain of Custody
                </button>
              </div>
              <div class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#aceeee]/20 pointer-events-none blur-2xl"></div>
            </div>

            <!-- Bottom Panel: Cryptographic Integrity Audits & Ledger Telemetry -->
            <div class="w-full rounded-2xl bg-white border border-[#dde3eb] shadow-xs p-5 flex flex-col gap-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#dde3eb]">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">System Health & Verification</span>
                  <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Recent Integrity Audits & Ledger Telemetry</h2>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f3] text-[#004343] text-xs font-semibold">
                    <span class="w-2 h-2 rounded-full bg-[#0f5c5c]"></span> SHA-256 Merkle Root Verified
                  </span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f3] text-[#191c1c] text-xs font-semibold">
                    <span class="material-symbols-outlined text-base text-[#9b4600]">cloud_done</span> Cold Archive Synced
                  </span>
                </div>
              </div>

              <!-- Audits Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="bg-[#f2f4f3] text-[#6f7978] uppercase text-[10px] font-bold tracking-wider">
                      <th class="px-4 py-3 rounded-l-lg">Block ID / Hash</th>
                      <th class="px-4 py-3">Provincial Hub</th>
                      <th class="px-4 py-3">Audit Routine</th>
                      <th class="px-4 py-3">Payload Type</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3 rounded-r-lg text-right">Timestamp (UTC)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#dde3eb]/40 font-medium">
                    <!-- Row 1 -->
                    <tr class="hover:bg-[#f8faf9] transition-colors">
                      <td class="px-4 py-3.5 font-bold text-[#004343] font-mono">0x8F92...B310</td>
                      <td class="px-4 py-3.5 text-[#191c1c]">Central (Kandy Hub-01)</td>
                      <td class="px-4 py-3.5 text-[#3f4948]">Elder Signature Re-attestation</td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] text-[11px] font-semibold">Ola Leaf Manuscript</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-1 text-[#0f5c5c] font-bold text-[11px]">
                          <span class="material-symbols-outlined text-sm">check_circle</span> Verified
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-right text-[#6f7978]">Just now (14:32:18)</td>
                    </tr>
                    <!-- Row 2 -->
                    <tr class="hover:bg-[#f8faf9] transition-colors">
                      <td class="px-4 py-3.5 font-bold text-[#004343] font-mono">0x4C18...91EE</td>
                      <td class="px-4 py-3.5 text-[#191c1c]">Northern (Jaffna Hub-03)</td>
                      <td class="px-4 py-3.5 text-[#3f4948]">FLAC Multi-track Audio Hash</td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] text-[11px] font-semibold">Carnatic Temple Chants</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-1 text-[#0f5c5c] font-bold text-[11px]">
                          <span class="material-symbols-outlined text-sm">check_circle</span> Verified
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-right text-[#6f7978]">3 mins ago (14:29:02)</td>
                    </tr>
                    <!-- Row 3 -->
                    <tr class="hover:bg-[#f8faf9] transition-colors">
                      <td class="px-4 py-3.5 font-bold text-[#004343] font-mono">0x11A0...76CD</td>
                      <td class="px-4 py-3.5 text-[#191c1c]">Southern (Galle Hub-02)</td>
                      <td class="px-4 py-3.5 text-[#3f4948]">Copyright Provenance Check</td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] text-[11px] font-semibold">Kolam Mask Carving Blueprint</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-1 text-[#9b4600] font-bold text-[11px]">
                          <span class="material-symbols-outlined text-sm">pending</span> Auto-Resolving
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-right text-[#6f7978]">11 mins ago (14:21:44)</td>
                    </tr>
                    <!-- Row 4 -->
                    <tr class="hover:bg-[#f8faf9] transition-colors">
                      <td class="px-4 py-3.5 font-bold text-[#004343] font-mono">0x992B...01F2</td>
                      <td class="px-4 py-3.5 text-[#191c1c]">Eastern (Trinco Hub-01)</td>
                      <td class="px-4 py-3.5 text-[#3f4948]">IPFS Cold-Storage Mirror Sync</td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] text-[11px] font-semibold">Maritime Folklore Records</span>
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="inline-flex items-center gap-1 text-[#0f5c5c] font-bold text-[11px]">
                          <span class="material-symbols-outlined text-sm">check_circle</span> Verified
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-right text-[#6f7978]">24 mins ago (14:08:12)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Integrity Footer -->
              <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6f7978] border-t border-[#dde3eb]">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-sm text-[#004343]">security</span>
                  <span>Cryptographic zero-knowledge verification active on all elder testimony archives.</span>
                </div>
                <a routerLink="/audit" class="text-[#004343] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                  <span>Open Cryptographic Ledger Inspector</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

          </main>
        }

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  user = this.authService.currentUser;
  
  // Tab state: 'overview' | 'analytics'
  activeTab = signal<'overview' | 'analytics'>('overview');
  activeRange = signal<'30d' | 'q3' | 'annual'>('30d');
  
  isSyncing = signal<boolean>(false);
  toastMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if route or queryParam specifies 'analytics'
    this.route.queryParamMap.subscribe(params => {
      const tabParam = params.get('tab');
      if (tabParam === 'analytics') {
        this.activeTab.set('analytics');
      } else if (tabParam === 'overview') {
        this.activeTab.set('overview');
      }
    });

    if (this.router.url.includes('analytics')) {
      this.activeTab.set('analytics');
    }
  }

  setActiveTab(tab: 'overview' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  syncAllQueues(): void {
    this.isSyncing.set(true);
    this.toastMessage.set('Synchronizing all regional queues with National Heritage Coldvault...');
    setTimeout(() => {
      this.isSyncing.set(false);
      this.toastMessage.set('All 5 core governance queues are synchronized and live.');
      setTimeout(() => this.toastMessage.set(null), 3500);
    }, 1200);
  }

  syncCaches(): void {
    this.isSyncing.set(true);
    this.toastMessage.set('Re-synchronizing 9 Provincial Cold Caches...');
    setTimeout(() => {
      this.isSyncing.set(false);
      this.toastMessage.set('Provincial caches successfully synchronized.');
      setTimeout(() => this.toastMessage.set(null), 3500);
    }, 1200);
  }

  exportReport(): void {
    this.toastMessage.set('Exporting National Heritage Audit Report (CSV + SHA-256 certificate)...');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  inspectManifest(): void {
    this.toastMessage.set('Opening Dambana Traditional Guild losslessly verified manifest...');
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  viewChainOfCustody(): void {
    this.toastMessage.set('Verifying chieftain cryptographic signatures on ledger...');
    setTimeout(() => this.toastMessage.set(null), 3000);
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
