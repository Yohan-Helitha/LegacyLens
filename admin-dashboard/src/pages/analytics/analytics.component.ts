import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">check_circle</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Platform Analytics" 
          section="Console"
          searchPlaceholder="Search audit hashes, hubs, logs..."
          [(searchQuery)]="searchQuery">
        </app-header>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          
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
              <h1 class="font-serif text-2xl md:text-3xl font-bold text-[#004343] tracking-tight">
                Platform Analytics & Heritage Intake
              </h1>
              <p class="text-xs text-[#52605f] max-w-2xl leading-relaxed">
                Continuous archival surveillance, cryptographic provenance verification, and field recording throughput across 25 administrative districts.
              </p>
            </div>

            <!-- Controls -->
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="flex items-center bg-[#f2f4f3] rounded-xl p-1 shadow-sm border border-[#dde3eb]">
                <button
                  (click)="activeRange.set('30d')"
                  [ngClass]="activeRange() === '30d' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all"
                >
                  Last 30 Days
                </button>
                <button
                  (click)="activeRange.set('q3')"
                  [ngClass]="activeRange() === 'q3' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all"
                >
                  Q3 2024
                </button>
                <button
                  (click)="activeRange.set('annual')"
                  [ngClass]="activeRange() === 'annual' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all"
                >
                  Annual 2024
                </button>
              </div>

              <button
                (click)="exportReport()"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004343] hover:bg-[#003131] text-white text-xs font-bold shadow-sm transition-all"
              >
                <span class="material-symbols-outlined text-base">download_for_offline</span>
                <span>Export Audit Report</span>
              </button>

              <button
                (click)="syncCaches()"
                title="Sync Provincial Caches"
                class="p-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#004343] transition-colors border border-[#dde3eb]"
              >
                <span class="material-symbols-outlined text-base" [class.animate-spin]="isSyncing()">sync</span>
              </button>
            </div>
          </div>

          <!-- Key KPI Metric Cards (4 Cards) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <!-- KPI 1 -->
            <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#004343]/40 transition-all">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Digitized Assets</span>
                  <div class="font-serif text-2xl font-bold text-[#004343] mt-1">14,892</div>
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
            <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#9b4600]/40 transition-all">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Elder Lineage Index</span>
                  <div class="font-serif text-2xl font-bold text-[#004343] mt-1">94.6%</div>
                </div>
                <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-[#9b4600]">
                  <span class="material-symbols-outlined text-xl">verified_user</span>
                </div>
              </div>
              <div class="mt-4 flex items-end justify-between pt-1">
                <div class="flex items-center gap-1 text-[#9b4600]">
                  <span class="material-symbols-outlined text-sm">verified</span>
                  <span class="text-[11px] font-semibold text-[#191c1c]">Verified Lineage Accuracy</span>
                </div>
                <div class="w-16 bg-[#f2f4f3] h-2 rounded-full overflow-hidden">
                  <div class="bg-[#fe893e] h-full rounded-full" style="width: 94.6%"></div>
                </div>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe893e]"></div>
            </div>

            <!-- KPI 3 -->
            <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Mod SLA Turnaround</span>
                  <div class="flex items-baseline gap-1 mt-1">
                    <span class="font-serif text-2xl font-bold text-[#004343]">2.4</span>
                    <span class="text-xs text-[#6f7978]">Hours</span>
                  </div>
                </div>
                <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <span class="material-symbols-outlined text-xl">timer</span>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-between pt-1">
                <div class="flex items-center gap-1 text-emerald-700">
                  <span class="material-symbols-outlined text-sm">check_circle</span>
                  <span class="text-xs font-bold">99.1%</span>
                  <span class="text-[10px] text-[#6f7978]">compliance</span>
                </div>
                <span class="text-[11px] text-[#6f7978]">Target &lt; 6h</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
            </div>

            <!-- KPI 4 -->
            <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#363c42]/40 transition-all">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Active Field Scouts</span>
                  <div class="font-serif text-2xl font-bold text-[#004343] mt-1">2,418</div>
                </div>
                <div class="w-10 h-10 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                  <span class="material-symbols-outlined text-xl">explore</span>
                </div>
              </div>
              <div class="mt-4 flex items-center justify-between pt-1">
                <div class="flex items-center gap-1.5 text-[#3f4948]">
                  <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                  <span class="text-[11px] font-semibold">Active in 25/25 Districts</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5f4] text-[#004343] font-bold">100% Geo-bound</span>
              </div>
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#363c42]"></div>
            </div>
          </div>

          <!-- Deep Analytics Section: Asymmetric Split Layout (7 Cols Left / 5 Cols Right) -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            <!-- Left Column: Primary Intake & Trajectory (7 Cols) -->
            <div class="xl:col-span-7 space-y-6">
              
              <!-- Intake Throughput & Dialect Breakdown -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Intake Throughput</span>
                    <h2 class="font-serif text-lg font-bold text-[#004343]">Archival Velocity & Dialect Distribution</h2>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-xs font-semibold text-[#191c1c]">
                      <span class="w-2 h-2 rounded-full bg-[#004343]"></span> Sinhala 62%
                    </span>
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-xs font-semibold text-[#191c1c]">
                      <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span> Tamil 28%
                    </span>
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f4f3] text-xs font-semibold text-[#191c1c]">
                      <span class="w-2 h-2 rounded-full bg-[#363c42]"></span> Indigenous 10%
                    </span>
                  </div>
                </div>

                <!-- Multi-series Archival Ingestion Bar/Line Graph -->
                <div class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-4 space-y-3">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6f7978] gap-2">
                    <span class="font-medium">Monthly Submissions by Category</span>
                    <div class="flex items-center gap-4">
                      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-[#004343]"></span> Oral Histories</span>
                      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-[#fe893e]"></span> Craft Blueprints</span>
                      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-sky-600"></span> Ritual Footage</span>
                    </div>
                  </div>

                  <!-- Synthetic Data Bars -->
                  <div class="h-56 w-full flex items-end gap-3 pt-4 pb-2">
                    <!-- May -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3 bg-[#004343] rounded-t transition-all group-hover:opacity-80" style="height: 55%" title="Oral: 1,420"></div>
                        <div class="w-3 bg-[#fe893e] rounded-t transition-all group-hover:opacity-80" style="height: 38%" title="Craft: 890"></div>
                        <div class="w-3 bg-sky-600 rounded-t transition-all group-hover:opacity-80" style="height: 24%" title="Ritual: 450"></div>
                      </div>
                      <span class="text-xs text-[#6f7978]">May</span>
                    </div>
                    <!-- Jun -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3 bg-[#004343] rounded-t transition-all group-hover:opacity-80" style="height: 64%" title="Oral: 1,730"></div>
                        <div class="w-3 bg-[#fe893e] rounded-t transition-all group-hover:opacity-80" style="height: 44%" title="Craft: 1,120"></div>
                        <div class="w-3 bg-sky-600 rounded-t transition-all group-hover:opacity-80" style="height: 32%" title="Ritual: 620"></div>
                      </div>
                      <span class="text-xs text-[#6f7978]">Jun</span>
                    </div>
                    <!-- Jul -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3 bg-[#004343] rounded-t transition-all group-hover:opacity-80" style="height: 78%" title="Oral: 2,100"></div>
                        <div class="w-3 bg-[#fe893e] rounded-t transition-all group-hover:opacity-80" style="height: 52%" title="Craft: 1,300"></div>
                        <div class="w-3 bg-sky-600 rounded-t transition-all group-hover:opacity-80" style="height: 45%" title="Ritual: 910"></div>
                      </div>
                      <span class="text-xs text-[#6f7978]">Jul</span>
                    </div>
                    <!-- Aug -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3 bg-[#004343] rounded-t transition-all group-hover:opacity-80" style="height: 72%" title="Oral: 1,940"></div>
                        <div class="w-3 bg-[#fe893e] rounded-t transition-all group-hover:opacity-80" style="height: 49%" title="Craft: 1,220"></div>
                        <div class="w-3 bg-sky-600 rounded-t transition-all group-hover:opacity-80" style="height: 48%" title="Ritual: 970"></div>
                      </div>
                      <span class="text-xs text-[#6f7978]">Aug</span>
                    </div>
                    <!-- Sep -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3 bg-[#004343] rounded-t transition-all group-hover:opacity-80" style="height: 86%" title="Oral: 2,450"></div>
                        <div class="w-3 bg-[#fe893e] rounded-t transition-all group-hover:opacity-80" style="height: 61%" title="Craft: 1,510"></div>
                        <div class="w-3 bg-sky-600 rounded-t transition-all group-hover:opacity-80" style="height: 55%" title="Ritual: 1,120"></div>
                      </div>
                      <span class="text-xs text-[#6f7978]">Sep</span>
                    </div>
                    <!-- Oct (Current Highlight) -->
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end bg-emerald-50/70 rounded-lg p-1 border border-emerald-200 group">
                      <div class="w-full flex items-end justify-center gap-1 h-full">
                        <div class="w-3.5 bg-[#004343] rounded-t shadow-sm" style="height: 96%" title="Oral: 2,890"></div>
                        <div class="w-3.5 bg-[#fe893e] rounded-t shadow-sm" style="height: 75%" title="Craft: 1,840"></div>
                        <div class="w-3.5 bg-sky-600 rounded-t shadow-sm" style="height: 68%" title="Ritual: 1,380"></div>
                      </div>
                      <span class="text-xs font-bold text-[#004343]">Oct</span>
                    </div>
                  </div>
                </div>

                <!-- Linguistic & Dialect Inset Bar -->
                <div class="p-3.5 rounded-xl bg-[#f2f4f3] border border-[#dde3eb] space-y-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-[#004343]">Dialectal Representation Index</span>
                    <span class="text-[#3f4948]">Coverage against UNESCO Endangerment List: <strong class="text-[#9b4600]">High</strong></span>
                  </div>
                  <div class="w-full h-3 rounded-full bg-[#dde3eb] overflow-hidden flex">
                    <div class="bg-[#004343] h-full" style="width: 62%" title="Sinhala Dialects 62%"></div>
                    <div class="bg-[#fe893e] h-full" style="width: 28%" title="Tamil Dialects 28%"></div>
                    <div class="bg-[#363c42] h-full" style="width: 10%" title="Vedda & Indigenous Tongues 10%"></div>
                  </div>
                  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#6f7978] pt-0.5 gap-1">
                    <span>Uva-Vellassa & Kandyan (9,233)</span>
                    <span>Jaffna & Batticaloa (4,170)</span>
                    <span>Dambana Wanniyala-Aetto (1,489)</span>
                  </div>
                </div>
              </div>

              <!-- Dispute & Resolution Trajectory -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Provincial Legal Oversight</span>
                    <h2 class="font-serif text-lg font-bold text-[#004343]">Dispute Trajectory & Attribution Resolution</h2>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-[#f2f4f3] text-[#004343] text-xs font-semibold self-start sm:self-auto">
                    Sufficiency Pass Rate: <span class="text-[#9b4600] font-bold">88.2%</span>
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                    <span class="text-xs text-[#6f7978]">Active Contested Claims</span>
                    <div class="flex items-baseline gap-1 my-1">
                      <span class="font-serif text-xl font-bold text-[#191c1c]">42</span>
                      <span class="text-xs text-[#004343] font-semibold">-14% vs Q2</span>
                    </div>
                    <span class="text-[11px] text-[#3f4948]">8 clan attributions under review</span>
                  </div>

                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                    <span class="text-xs text-[#6f7978]">Mean Dispute Latency</span>
                    <div class="flex items-baseline gap-1 my-1">
                      <span class="font-serif text-xl font-bold text-[#191c1c]">3.1</span>
                      <span class="text-xs text-[#6f7978]">Days</span>
                    </div>
                    <span class="text-[11px] text-[#004343] font-semibold">Down from 9.4 days in 2023</span>
                  </div>

                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between">
                    <span class="text-xs text-[#6f7978]">Consensus Sign-Off</span>
                    <div class="flex items-baseline gap-1 my-1">
                      <span class="font-serif text-xl font-bold text-[#191c1c]">96.8%</span>
                      <span class="text-xs text-[#9b4600] font-bold">Binding</span>
                    </div>
                    <span class="text-[11px] text-[#3f4948]">Village council ratifications</span>
                  </div>
                </div>

                <!-- Trajectory Progress visual -->
                <div class="p-3.5 rounded-xl bg-[#f2f4f3] border border-[#dde3eb] space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-[#004343]">Resolution vs Inflow Delta (Last 6 Months)</span>
                    <span class="text-[#004343] font-bold">142 Resolved / 158 Logged</span>
                  </div>
                  <div class="w-full bg-[#dde3eb] h-2 rounded-full overflow-hidden">
                    <div class="bg-[#004343] h-full rounded-full" style="width: 89.8%"></div>
                  </div>
                  <div class="flex items-center justify-between text-xs text-[#6f7978]">
                    <span>Primary driver: Autonomous audio transcription lineage match</span>
                    <span class="font-bold text-[#191c1c]">89.8% Clearance</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Column: Regional Density & Custodian Velocity (5 Cols) -->
            <div class="xl:col-span-5 space-y-6">
              
              <!-- Provincial Heritage Distribution -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Geographic Balance</span>
                    <h2 class="font-serif text-lg font-bold text-[#004343]">9 Provincial Heritage Hubs</h2>
                  </div>
                  <span class="p-2 rounded-lg bg-[#f2f4f3] text-[#004343]">
                    <span class="material-symbols-outlined text-xl">map</span>
                  </span>
                </div>

                <!-- Province List -->
                <div class="space-y-2.5">
                  <!-- Central -->
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors space-y-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#004343]"></span>
                        <span class="text-xs font-bold text-[#004343]">Central Province</span>
                        <span class="text-[11px] text-[#6f7978] hidden sm:inline">(Kandy, Matale, Nuwara Eliya)</span>
                      </div>
                      <span class="text-xs font-bold text-[#191c1c]">3,892</span>
                    </div>
                    <div class="w-full bg-[#dde3eb] h-1.5 rounded-full overflow-hidden">
                      <div class="bg-[#004343] h-full" style="width: 88%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-[#9b4600] font-semibold">100% Geo-bound</span>
                      <span class="text-[#6f7978]">96% Elder Verified</span>
                    </div>
                  </div>

                  <!-- Southern -->
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors space-y-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#0f5c5c]"></span>
                        <span class="text-xs font-bold text-[#004343]">Southern Province</span>
                        <span class="text-[11px] text-[#6f7978] hidden sm:inline">(Galle, Matara, Hambantota)</span>
                      </div>
                      <span class="text-xs font-bold text-[#191c1c]">2,914</span>
                    </div>
                    <div class="w-full bg-[#dde3eb] h-1.5 rounded-full overflow-hidden">
                      <div class="bg-[#0f5c5c] h-full" style="width: 74%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-[#9b4600] font-semibold">100% Geo-bound</span>
                      <span class="text-[#6f7978]">94% Elder Verified</span>
                    </div>
                  </div>

                  <!-- Northern -->
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors space-y-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span>
                        <span class="text-xs font-bold text-[#004343]">Northern Province</span>
                        <span class="text-[11px] text-[#6f7978] hidden sm:inline">(Jaffna, Kilinochchi, Mannar)</span>
                      </div>
                      <span class="text-xs font-bold text-[#191c1c]">2,410</span>
                    </div>
                    <div class="w-full bg-[#dde3eb] h-1.5 rounded-full overflow-hidden">
                      <div class="bg-[#fe893e] h-full" style="width: 68%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-[#9b4600] font-semibold">98% Geo-bound</span>
                      <span class="text-[#6f7978]">92% Elder Verified</span>
                    </div>
                  </div>

                  <!-- Eastern -->
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors space-y-1.5">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#9b4600]"></span>
                        <span class="text-xs font-bold text-[#004343]">Eastern Province</span>
                        <span class="text-[11px] text-[#6f7978] hidden sm:inline">(Batticaloa, Trinco, Ampara)</span>
                      </div>
                      <span class="text-xs font-bold text-[#191c1c]">1,980</span>
                    </div>
                    <div class="w-full bg-[#dde3eb] h-1.5 rounded-full overflow-hidden">
                      <div class="bg-[#9b4600] h-full" style="width: 58%"></div>
                    </div>
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-[#9b4600] font-semibold">99% Geo-bound</span>
                      <span class="text-[#6f7978]">89% Elder Verified</span>
                    </div>
                  </div>

                  <!-- 5 Other Provinces Combined -->
                  <div class="p-3 rounded-xl bg-[#f2f4f3] border border-[#dde3eb] flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#6f7978] text-base">travel_explore</span>
                      <span class="font-medium text-[#191c1c]">5 Other Provinces Combined</span>
                    </div>
                    <span class="font-bold text-[#004343]">3,696 assets</span>
                  </div>
                </div>
              </div>

              <!-- Elder Custodian Retention & Verification Efficiency -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Generational Transfer</span>
                    <h2 class="font-serif text-lg font-bold text-[#004343]">Custodian Verification</h2>
                  </div>
                  <div class="w-9 h-9 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-lg">groups</span>
                  </div>
                </div>

                <div class="space-y-2.5">
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-[#004343]">Grama Niladhari Velocity</h4>
                      <p class="text-[11px] text-[#6f7978]">Administrative sign-off cycle</p>
                    </div>
                    <div class="text-right">
                      <span class="font-serif text-base font-bold text-[#9b4600]">1.8 Days</span>
                      <p class="text-[10px] text-[#6f7978]">Target &lt; 3.0d</p>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-[#004343]">Youth-Elder Recording Ratio</h4>
                      <p class="text-[11px] text-[#6f7978]">Apprentices paired with masters</p>
                    </div>
                    <div class="text-right">
                      <span class="font-serif text-base font-bold text-[#004343]">3.4 : 1</span>
                      <p class="text-[10px] text-emerald-700 font-semibold">Active pairing</p>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                    <div>
                      <h4 class="text-xs font-bold text-[#004343]">Custodians Retained</h4>
                      <p class="text-[11px] text-[#6f7978]">Submitting periodic updates</p>
                    </div>
                    <div class="text-right">
                      <span class="font-serif text-base font-bold text-[#191c1c]">91.4%</span>
                      <p class="text-[10px] text-[#9b4600] font-semibold">+4.2% MoM</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- Field Scout Spotlight Banner (Photo-Rich Visual Element) -->
          <div class="w-full rounded-2xl bg-white border border-[#dde3eb] p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5 overflow-hidden relative">
            <div class="flex flex-col sm:flex-row items-center gap-4 z-10 text-center sm:text-left">
              <img 
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80" 
                alt="Field Scout and Elder" 
                class="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0 border-2 border-white"
              />
              <div>
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-[#9b4600] font-bold">Field Scout Spotlight</span>
                  <span class="text-xs text-[#6f7978]">Uva Province Deployment</span>
                </div>
                <h3 class="font-serif text-base font-bold text-[#004343] mt-1">Dambana Traditional Guild Recording Mission Completed</h3>
                <p class="text-xs text-[#52605f] max-w-xl mt-0.5">
                  412 chants and metallurgical formulas cataloged in lossless audio with full village chieftain cryptographic authorization.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 z-10 shrink-0">
              <button 
                (click)="inspectManifest()"
                class="px-4 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#004343] text-xs font-bold transition-colors border border-[#dde3eb]">
                Inspect Ingest Manifest
              </button>
              <button 
                (click)="viewChainOfCustody()"
                class="px-4 py-2 rounded-xl bg-[#004343] hover:bg-[#003131] text-white text-xs font-bold transition-colors shadow-sm">
                View Chain of Custody
              </button>
            </div>

            <div class="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#004343]/5 pointer-events-none blur-2xl"></div>
          </div>

          <!-- Bottom Panel: Cryptographic Integrity Audits & Ledger Telemetry -->
          <div class="w-full rounded-2xl bg-white border border-[#dde3eb] shadow-sm p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">System Health & Verification</span>
                <h2 class="font-serif text-lg font-bold text-[#004343]">Recent Integrity Audits & Ledger Telemetry</h2>
              </div>
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5f4] text-[#004343] font-semibold border border-[#004343]/20">
                  <span class="w-2 h-2 rounded-full bg-[#004343]"></span> SHA-256 Merkle Root Verified
                </span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f4f3] text-[#191c1c] font-medium border border-[#dde3eb]">
                  <span class="material-symbols-outlined text-sm text-[#9b4600]">cloud_done</span> Cold Archive Synced
                </span>
              </div>
            </div>

            <!-- Audits Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-[#f2f4f3] text-[#6f7978] font-bold uppercase tracking-wider text-[11px]">
                    <th class="px-4 py-3 rounded-l-lg">Block ID / Hash</th>
                    <th class="px-4 py-3">Provincial Hub</th>
                    <th class="px-4 py-3">Audit Routine</th>
                    <th class="px-4 py-3">Payload Type</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3 rounded-r-lg text-right">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#f2f4f3]">
                  @for (log of filteredLogs(); track log.id) {
                    <tr class="hover:bg-[#f8faf9] transition-colors">
                      <td class="px-4 py-3.5 font-mono font-bold text-[#004343]">
                        {{ log.blockHash }}
                      </td>
                      <td class="px-4 py-3.5 font-medium text-[#191c1c]">
                        {{ log.hub }}
                      </td>
                      <td class="px-4 py-3.5 text-[#52605f]">
                        {{ log.routine }}
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] font-medium text-[11px] border border-[#dde3eb]">
                          {{ log.payloadType }}
                        </span>
                      </td>
                      <td class="px-4 py-3.5">
                        @if (log.status === 'VERIFIED') {
                          <span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <span class="material-symbols-outlined text-sm">check_circle</span> Verified
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 text-[#9b4600] font-bold text-[11px]">
                            <span class="material-symbols-outlined text-sm">pending</span> Auto-Resolving
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3.5 text-right text-[#6f7978]">
                        {{ log.timestamp }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="px-4 py-8 text-center text-[#6f7978]">
                        No audit ledger records match your search criteria.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Integrity Footer -->
            <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6f7978] border-t border-[#f2f4f3]">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-[#004343]">security</span>
                <span>Cryptographic zero-knowledge verification active on all elder testimony archives.</span>
              </div>
              <button (click)="openLedgerInspector()" class="text-[#004343] font-bold hover:underline flex items-center gap-1">
                <span>Open Cryptographic Ledger Inspector</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

        </main>
      </div>

    </div>
  `
})
export class AnalyticsComponent {
  user = this.authService.currentUser;
  searchQuery = '';
  activeRange = signal<'30d' | 'q3' | 'annual'>('30d');
  isSyncing = signal(false);
  toastMessage = signal<string | null>(null);

  auditLogs = signal<AuditLog[]>([
    {
      id: '1',
      blockHash: '0x8F92...B310',
      hub: 'Central (Kandy Hub-01)',
      routine: 'Elder Signature Re-attestation',
      payloadType: 'Ola Leaf Manuscript',
      status: 'VERIFIED',
      timestamp: 'Just now (14:32:18)'
    },
    {
      id: '2',
      blockHash: '0x4C18...91EE',
      hub: 'Northern (Jaffna Hub-03)',
      routine: 'FLAC Multi-track Audio Hash',
      payloadType: 'Carnatic Temple Chants',
      status: 'VERIFIED',
      timestamp: '3 mins ago (14:29:02)'
    },
    {
      id: '3',
      blockHash: '0x11A0...76CD',
      hub: 'Southern (Galle Hub-02)',
      routine: 'Copyright Provenance Check',
      payloadType: 'Kolam Mask Carving Blueprint',
      status: 'RESOLVING',
      timestamp: '11 mins ago (14:21:44)'
    },
    {
      id: '4',
      blockHash: '0x992B...01F2',
      hub: 'Eastern (Trinco Hub-01)',
      routine: 'IPFS Cold-Storage Mirror Sync',
      payloadType: 'Maritime Folklore Records',
      status: 'VERIFIED',
      timestamp: '24 mins ago (14:08:12)'
    }
  ]);

  filteredLogs = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.auditLogs();
    return this.auditLogs().filter(l =>
      l.blockHash.toLowerCase().includes(q) ||
      l.hub.toLowerCase().includes(q) ||
      l.routine.toLowerCase().includes(q) ||
      l.payloadType.toLowerCase().includes(q)
    );
  });

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  exportReport(): void {
    this.showToast('National Heritage Ingestion & Cryptographic Audit Report exported (PDF).');
  }

  syncCaches(): void {
    this.isSyncing.set(true);
    setTimeout(() => {
      this.isSyncing.set(false);
      this.showToast('All 9 Provincial Cache nodes synchronized with Colombo Master Registry.');
    }, 1200);
  }

  inspectManifest(): void {
    this.showToast('Ingest Manifest #UVA-DAMBANA-412 loaded with 412 acoustic tracks.');
  }

  viewChainOfCustody(): void {
    this.showToast('Chain of Custody: Chief Uruwarige Wanniya → Scout #892 → Central Coldvault verified.');
  }

  openLedgerInspector(): void {
    this.showToast('Connecting to Cryptographic Ledger Inspector on Block #4,192,801...');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }
}

