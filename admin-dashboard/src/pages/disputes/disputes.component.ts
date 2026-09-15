import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface DisputeCase {
  id: string;
  category: string;
  title: string;
  summary: string;
  contestedAsset: {
    title: string;
    catalogNumber: string;
    publisher: string;
    imageUrl: string;
    segmentTime: string;
    spectralMatch: number;
  };
  claimant: {
    name: string;
    masterRoll: string;
    depositedBy: string;
    year: string;
    imageUrl: string;
    clause: string;
    statement: string;
  };
  status: 'Under Review' | 'Check Inflow' | 'Triage' | 'Resolved' | 'Rejected';
  priority: 'Critical' | 'Normal';
  remainingTimeOrElapsed: string;
  evidenceCount: string;
  dispatchClaimantPreview: string;
  dispatchContributorPreview: string;
}

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
      
      <!-- Toast Alert -->
      <div 
        *ngIf="toastMessage()" 
        class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 animate-bounce">
        <span class="material-symbols-outlined text-emerald-300 text-xl">gavel</span>
        <div class="text-sm font-medium">{{ toastMessage() }}</div>
        <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
      </div>

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Dispute Resolution" 
          section="Console"
          searchPlaceholder="Search records, disputes, hashes..."
          [searchQuery]="searchQuery"
          (searchQueryChange)="searchQuery = $event">
        </app-header>

        <!-- Main Body Scroll Area -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Metric Ribbon Cards -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            <!-- Breadcrumb & Title Card (5 cols) -->
            <div class="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-[11px] text-[#6f7978] uppercase tracking-wider font-semibold">
                  <span class="inline-flex items-center gap-1 text-[#0f5c5c] font-bold">
                    <span class="material-symbols-outlined text-sm">verified_user</span>
                    Tribal Heritage Council
                  </span>
                  <span>•</span>
                  <span>Docket 2024-C</span>
                </div>
                <h1 class="font-['Source_Serif_4',serif] text-2xl text-[#004343] font-bold tracking-tight">
                  Dispute Resolution Queue
                </h1>
                <p class="text-xs text-[#3f4948] leading-relaxed line-clamp-2">
                  Adjudicate conflicting claims over sacred cultural material, copyright claims, and oral lineage attributions.
                </p>
              </div>

              <div class="flex items-center gap-3 pt-4 border-t border-[#eceeed] mt-3">
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fe893e]/20 text-[#672c00] text-xs font-bold">
                  <span class="w-2 h-2 rounded-full bg-[#9b4600] animate-ping"></span>
                  <span>{{ activeDisputesCount() }} Pending Review</span>
                </div>
                <span class="text-xs text-[#6f7978]">Median turnaround: 18h</span>
              </div>
            </div>

            <!-- Quick Stats Bento (3 cols) -->
            <div class="lg:col-span-3 bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between">
              <div class="flex items-center justify-between text-[#6f7978] text-xs font-medium">
                <span>Evidence Sufficiency Rate</span>
                <span class="material-symbols-outlined text-[#004343] text-lg">fact_check</span>
              </div>
              <div class="my-2 flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#202426]">81.4%</span>
                <span class="text-xs text-[#004343] font-semibold flex items-center">
                  <span class="material-symbols-outlined text-sm">arrow_upward</span> +4.2%
                </span>
              </div>
              <!-- Mini Sparkline SVG -->
              <div class="w-full h-8 pt-1">
                <svg class="w-full h-full text-[#0f5c5c]" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
                  <path d="M0 18 L15 14 L30 19 L45 8 L60 11 L75 4 L90 7 L100 2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                  <path d="M0 18 L15 14 L30 19 L45 8 L60 11 L75 4 L90 7 L100 2 V 24 H 0 Z" fill="currentColor" fill-opacity="0.08"></path>
                </svg>
              </div>
            </div>

            <!-- Active Tier Card (4 cols) -->
            <div class="lg:col-span-4 bg-[#004343] text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div class="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#0f5c5c]/40 blur-2xl pointer-events-none"></div>
              
              <div class="flex items-center justify-between z-10">
                <span class="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Council Mandate v4.2</span>
                <span class="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold text-white tracking-wide">HIGH ESCALATION</span>
              </div>

              <div class="my-2 z-10">
                <h3 class="font-['Source_Serif_4',serif] text-lg font-bold text-white">Sacred Heritage Shield</h3>
                <p class="text-xs text-teal-100/80 mt-0.5">Dual-signoff active for any Takedown or Lineage Reassignment.</p>
              </div>

              <div class="flex items-center gap-3 z-10 pt-2 border-t border-teal-800">
                <div class="flex -space-x-2">
                  <div class="w-6 h-6 rounded-full bg-[#fe893e] text-[#672c00] flex items-center justify-center text-[10px] font-bold ring-2 ring-[#004343]">EV</div>
                  <div class="w-6 h-6 rounded-full bg-teal-200 text-[#004343] flex items-center justify-center text-[10px] font-bold ring-2 ring-[#004343]">MK</div>
                  <div class="w-6 h-6 rounded-full bg-gray-200 text-gray-800 flex items-center justify-center text-[10px] font-bold ring-2 ring-[#004343]">AL</div>
                </div>
                <span class="text-xs text-teal-200">3 Custodians on call</span>
              </div>
            </div>

          </div>

          <!-- Split Screen Workspace -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- LEFT COLUMN: Open Disputes Queue Flow (4 cols) -->
            <div class="lg:col-span-4 flex flex-col gap-3">
              
              <!-- Filter Bar -->
              <div class="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#dde3eb] shadow-xs">
                <div class="flex items-center gap-1">
                  <button 
                    (click)="activeTab.set('active')"
                    [class]="activeTab() === 'active' ? 'bg-[#004343] text-white font-bold' : 'text-[#6f7978] hover:bg-[#f2f4f3]'"
                    class="px-2.5 py-1 rounded-lg text-xs transition-colors">
                    Active ({{ activeDisputesCount() }})
                  </button>
                  <button 
                    (click)="activeTab.set('flagged')"
                    [class]="activeTab() === 'flagged' ? 'bg-[#004343] text-white font-bold' : 'text-[#6f7978] hover:bg-[#f2f4f3]'"
                    class="px-2.5 py-1 rounded-lg text-xs transition-colors">
                    Flagged
                  </button>
                  <button 
                    (click)="activeTab.set('archive')"
                    [class]="activeTab() === 'archive' ? 'bg-[#004343] text-white font-bold' : 'text-[#6f7978] hover:bg-[#f2f4f3]'"
                    class="px-2.5 py-1 rounded-lg text-xs transition-colors">
                    Archive
                  </button>
                </div>
                <span class="material-symbols-outlined text-[#6f7978] text-lg cursor-pointer hover:text-[#191c1c]">tune</span>
              </div>

              <!-- Case Cards List -->
              <div class="flex flex-col gap-2.5">
                <div 
                  *ngFor="let item of filteredDisputes()"
                  (click)="selectCase(item)"
                  [class]="selectedCase()?.id === item.id ? 'border-[#004343] bg-white ring-2 ring-[#004343]/30 shadow-md translate-x-1' : 'border-[#dde3eb] bg-white hover:border-[#6f7978]/40 shadow-xs'"
                  class="p-4 rounded-xl border transition-all cursor-pointer">
                  
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-[11px] uppercase font-bold text-[#9b4600] tracking-wide">
                      {{ item.id }} • {{ item.category }}
                    </span>
                    <span 
                      [class]="item.status === 'Under Review' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {{ item.status }}
                    </span>
                  </div>

                  <h3 class="font-bold text-xs text-[#202426] mt-1.5 leading-snug">
                    {{ item.title }}
                  </h3>

                  <p class="text-xs text-[#3f4948] line-clamp-2 mt-1 leading-snug">
                    {{ item.summary }}
                  </p>

                  <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-[#eceeed] text-[11px] text-[#6f7978]">
                    <span class="flex items-center gap-1 text-[#0f5c5c] font-semibold">
                      <span class="material-symbols-outlined text-sm">timer</span>
                      {{ item.remainingTimeOrElapsed }}
                    </span>
                    <span>{{ item.evidenceCount }}</span>
                  </div>
                </div>
              </div>

              <!-- Flow Helper Banner -->
              <div class="p-3.5 bg-white border border-[#dde3eb] rounded-xl flex items-center gap-3 shadow-xs">
                <span class="material-symbols-outlined text-[#004343] text-2xl">account_tree</span>
                <div>
                  <h4 class="text-xs font-bold text-[#004343]">Protocol v2.4 Verification</h4>
                  <p class="text-[11px] text-[#6f7978]">Strict compliance with ICH UNESCO 2003 guidelines.</p>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Review Information & Decision Engine (8 cols) -->
            <div class="lg:col-span-8 flex flex-col gap-5" *ngIf="selectedCase() as c">
              
              <!-- Case Main Dossier Card -->
              <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs space-y-5">
                
                <!-- Top Case Bar -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#dde3eb]">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs uppercase tracking-wider text-[#9b4600] font-bold">Case #{{ c.id }}</span>
                      <span class="text-[#6f7978]">•</span>
                      <span class="text-xs text-[#6f7978]">Priority 1 Critical</span>
                    </div>
                    <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343] mt-1">
                      {{ c.title }}
                    </h2>
                  </div>

                  <div class="flex items-center gap-2">
                    <button class="px-3 py-1.5 rounded-lg bg-[#f2f4f3] text-[#191c1c] text-xs font-medium hover:bg-[#dde3eb] transition-colors flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">history</span> History
                    </button>
                    <button class="px-3 py-1.5 rounded-lg bg-[#f2f4f3] text-[#191c1c] text-xs font-medium hover:bg-[#dde3eb] transition-colors flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">share</span> Export
                    </button>
                  </div>
                </div>

                <!-- Split Evidence & Comparison Arena -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Contested Asset -->
                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold uppercase text-[#6f7978]">Contested Asset</span>
                      <span class="px-2 py-0.5 rounded bg-white text-[10px] font-bold text-[#004343] border border-[#dde3eb]">
                        {{ c.contestedAsset.catalogNumber }}
                      </span>
                    </div>

                    <div class="w-full h-44 rounded-xl overflow-hidden relative shadow-inner">
                      <img 
                        [src]="c.contestedAsset.imageUrl" 
                        [alt]="c.contestedAsset.title"
                        class="w-full h-full object-cover"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
                        <span class="font-['Source_Serif_4',serif] text-base font-bold">{{ c.contestedAsset.title }}</span>
                        <span class="text-white/80 text-[11px]">{{ c.contestedAsset.publisher }}</span>
                      </div>
                    </div>

                    <!-- Audio Waveform Comparison Bar -->
                    <div class="p-3 bg-white rounded-lg border border-[#dde3eb] space-y-2">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#6f7978]">Accused Segment ({{ c.contestedAsset.segmentTime }})</span>
                        <span class="text-[#9b4600] font-bold">{{ c.contestedAsset.spectralMatch }}% Spectral Match</span>
                      </div>
                      
                      <div class="flex items-center gap-2 h-8 px-2 bg-[#f2f4f3] rounded-lg">
                        <button 
                          (click)="toggleAudioPlay()"
                          class="w-6 h-6 rounded-full bg-[#004343] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <span class="material-symbols-outlined text-xs">{{ isPlayingAudio() ? 'pause' : 'play_arrow' }}</span>
                        </button>
                        
                        <!-- Simulated animated wave bars -->
                        <div class="flex-1 flex items-center gap-1 h-full py-1">
                          <span class="w-1 h-2 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-4 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-6 bg-[#fe893e] rounded-full" [class.animate-pulse]="isPlayingAudio()"></span>
                          <span class="w-1 h-7 bg-[#fe893e] rounded-full" [class.animate-pulse]="isPlayingAudio()"></span>
                          <span class="w-1 h-5 bg-[#fe893e] rounded-full"></span>
                          <span class="w-1 h-3 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-6 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-2 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-5 bg-[#004343] rounded-full"></span>
                          <span class="w-1 h-4 bg-[#004343] rounded-full"></span>
                        </div>
                        <span class="text-[10px] font-mono text-[#6f7978]">00:35</span>
                      </div>
                    </div>
                  </div>

                  <!-- Claimant Assertion & Lineage Proof -->
                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold uppercase text-[#6f7978]">Claimant Dossier</span>
                      <span class="px-2 py-0.5 rounded bg-[#fe893e]/20 text-[10px] font-bold text-[#9b4600] border border-[#fe893e]/30">
                        {{ c.claimant.name }}
                      </span>
                    </div>

                    <div class="w-full h-44 rounded-xl overflow-hidden relative shadow-inner">
                      <img 
                        [src]="c.claimant.imageUrl" 
                        [alt]="c.claimant.name"
                        class="w-full h-full object-cover"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white">
                        <span class="font-['Source_Serif_4',serif] text-base font-bold">{{ c.claimant.masterRoll }}</span>
                        <span class="text-white/80 text-[11px]">Deposited by {{ c.claimant.depositedBy }} • Year {{ c.claimant.year }}</span>
                      </div>
                    </div>

                    <!-- Claimant Claim Card -->
                    <div class="p-3 bg-white rounded-lg border border-[#dde3eb] space-y-1.5">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[#6f7978]">{{ c.claimant.clause }}</span>
                        <span class="text-[#004343] font-bold">Non-Commercial Clan Asset</span>
                      </div>
                      <p class="text-xs text-[#202426] italic leading-snug">
                        "{{ c.claimant.statement }}"
                      </p>
                    </div>
                  </div>

                </div>

                <!-- Evidentiary Verification Checklist -->
                <div class="bg-[#f2f4f3] rounded-xl p-4 border border-[#dde3eb] space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#004343]">rule</span>
                      <span class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343]">Sufficiency Evaluation Checklist</span>
                    </div>
                    <span 
                      [class]="isAllChecked() ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'"
                      class="text-xs px-2.5 py-0.5 rounded-full font-bold border">
                      Gateway: {{ isAllChecked() ? 'Passed (4/4)' : 'Flagged Incomplete' }}
                    </span>
                  </div>

                  <p class="text-xs text-[#3f4948]">
                    Mark all verified validation anchors. If critical provenance documents or spectral proof are absent, dispatch an immediate rejection.
                  </p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-[#dde3eb] shadow-2xs cursor-pointer select-none">
                      <input type="checkbox" [(ngModel)]="checklist.clanIdentity" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Verified Clan Identity / Mandate</p>
                        <p class="text-[11px] text-[#6f7978]">Claimant provided stamped registry certificate from the Council.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-[#dde3eb] shadow-2xs cursor-pointer select-none">
                      <input type="checkbox" [(ngModel)]="checklist.spectralMatch" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Forensic Audio Match Confirmation</p>
                        <p class="text-[11px] text-[#6f7978]">Spectral algorithmic parity exceeds threshold (>90%).</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-[#dde3eb] shadow-2xs cursor-pointer select-none">
                      <input type="checkbox" [(ngModel)]="checklist.rebuttalPeriod" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Creator Rebuttal Period Elapsed</p>
                        <p class="text-[11px] text-[#6f7978]">Accused submitted formal reply alleging 'open-air public recording'.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-[#dde3eb] shadow-2xs cursor-pointer select-none">
                      <input type="checkbox" [(ngModel)]="checklist.customaryRights" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Customary Rights Precedent Cited</p>
                        <p class="text-[11px] text-[#6f7978]">Socio-religious taboo against digital monetization documented.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Interactive Decision Terminal (Flowchart Branches) -->
                <div class="space-y-3 pt-2">
                  <div class="flex items-center justify-between">
                    <span class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343]">Adjudication Determination</span>
                    <span class="text-xs text-[#6f7978]">Select one action to build resolution docket</span>
                  </div>

                  <!-- Branch 1: If NOT ENOUGH INFO -->
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                      <span class="material-symbols-outlined text-[#6f7978] text-2xl">cancel_presentation</span>
                      <div>
                        <p class="text-xs font-bold text-[#191c1c]">Lacking Substantive Proof?</p>
                        <p class="text-[11px] text-[#6f7978]">Dismiss claim outright or request supplementary archival evidence.</p>
                      </div>
                    </div>
                    <button 
                      (click)="showRejectModal.set(true)"
                      class="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer">
                      Reject Dispute With Reason
                    </button>
                  </div>

                  <!-- Branch 2: Four Adjudication Choice Badges -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    
                    <!-- Option A: Dismiss -->
                    <button 
                      (click)="resolutionAction.set('dismiss')"
                      [class]="resolutionAction() === 'dismiss' ? 'bg-[#363c42] text-white ring-2 ring-[#363c42]' : 'bg-white hover:bg-[#f2f4f3] text-[#202426] border-[#dde3eb]'"
                      class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all shadow-2xs cursor-pointer">
                      <span class="material-symbols-outlined text-lg">close</span>
                      <span class="text-xs font-bold">Dismiss Dispute</span>
                      <span class="text-[10px] opacity-80">Fair use or unencumbered public heritage.</span>
                    </button>

                    <!-- Option B: Request Edit -->
                    <button 
                      (click)="resolutionAction.set('edit')"
                      [class]="resolutionAction() === 'edit' ? 'bg-[#fe893e] text-[#672c00] ring-2 ring-[#fe893e]' : 'bg-white hover:bg-[#f2f4f3] text-[#202426] border-[#dde3eb]'"
                      class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all shadow-2xs cursor-pointer">
                      <span class="material-symbols-outlined text-lg">edit_note</span>
                      <span class="text-xs font-bold">Request Edit</span>
                      <span class="text-[10px] opacity-80">Require creator to remove sampled chant stem.</span>
                    </button>

                    <!-- Option C: Reassign Credit (Default) -->
                    <button 
                      (click)="resolutionAction.set('reassign')"
                      [class]="resolutionAction() === 'reassign' ? 'bg-[#004343] text-white ring-2 ring-[#004343]' : 'bg-white hover:bg-[#f2f4f3] text-[#202426] border-[#dde3eb]'"
                      class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all shadow-2xs cursor-pointer">
                      <span class="material-symbols-outlined text-lg">switch_account</span>
                      <span class="text-xs font-bold">Reassign Credit</span>
                      <span class="text-[10px] opacity-80">Mandate dual royalty & sacred attribution.</span>
                    </button>

                    <!-- Option D: Takedown Content -->
                    <button 
                      (click)="resolutionAction.set('takedown')"
                      [class]="resolutionAction() === 'takedown' ? 'bg-red-700 text-white ring-2 ring-red-700' : 'bg-white hover:bg-[#f2f4f3] text-[#202426] border-[#dde3eb]'"
                      class="p-3 rounded-xl border text-left flex flex-col gap-1 transition-all shadow-2xs cursor-pointer">
                      <span class="material-symbols-outlined text-lg">delete_forever</span>
                      <span class="text-xs font-bold">Takedown Content</span>
                      <span class="text-[10px] opacity-80">Enforce immediate global removal from network.</span>
                    </button>

                  </div>

                </div>

              </div>

              <!-- Resolution & Party Notification Dispatch Card -->
              <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-xs space-y-4">
                <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#9b4600]">forward_to_inbox</span>
                    <span class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343]">Simultaneous Dispatch Preview</span>
                  </div>
                  <span class="text-xs text-[#6f7978]">Templates generated via Smart Lexicon v3</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Claimant Dispatch -->
                  <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-2">
                    <div class="flex items-center justify-between text-[11px] font-bold text-[#6f7978]">
                      <span>DISPATCH TO: CLAIMANT</span>
                      <span class="text-[#004343]">{{ c.claimant.name }}</span>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-[#dde3eb] text-xs text-[#3f4948] space-y-1">
                      <p class="font-bold text-[#202426]">Subject: Ruling Rendered • {{ c.id }} In Re {{ c.title }}</p>
                      <p class="leading-relaxed">{{ c.dispatchClaimantPreview }}</p>
                    </div>
                  </div>

                  <!-- Contributor Dispatch -->
                  <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-2">
                    <div class="flex items-center justify-between text-[11px] font-bold text-[#6f7978]">
                      <span>DISPATCH TO: CONTRIBUTOR</span>
                      <span class="text-[#9b4600]">{{ c.contestedAsset.publisher }}</span>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-[#dde3eb] text-xs text-[#3f4948] space-y-1">
                      <p class="font-bold text-[#202426]">Subject: Action Mandate • Resolution for Asset {{ c.contestedAsset.catalogNumber }}</p>
                      <p class="leading-relaxed">{{ c.dispatchContributorPreview }}</p>
                    </div>
                  </div>
                </div>

                <!-- Final Action Bar -->
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#eceeed]">
                  <div class="flex items-center gap-1.5 text-xs text-[#6f7978]">
                    <span class="material-symbols-outlined text-sm text-[#004343]">verified</span>
                    <span>Signed by Overseer E. Vance • Timestamped to Ledger</span>
                  </div>

                  <div class="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      (click)="saveDraft()"
                      class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#191c1c] text-xs font-bold transition-colors cursor-pointer">
                      Save Draft
                    </button>
                    <button 
                      (click)="commitResolution()"
                      class="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
                      <span class="material-symbols-outlined text-base">gavel</span>
                      <span>Execute Ruling & Notify Parties</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>

      <!-- Slide-over / Modal for Rejection -->
      <div 
        *ngIf="showRejectModal()" 
        class="fixed inset-0 z-50 bg-[#202426]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div class="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-[#dde3eb] space-y-4">
          <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
            <div class="flex items-center gap-2 text-red-700">
              <span class="material-symbols-outlined">report_problem</span>
              <h3 class="font-['Source_Serif_4',serif] text-base font-bold">Reject Dispute Docket</h3>
            </div>
            <button (click)="showRejectModal.set(false)" class="text-[#6f7978] hover:text-[#191c1c]">✕</button>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-[#202426]">Reason for Dismissal</label>
            <select [(ngModel)]="rejectReason" class="w-full p-2.5 text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl focus:outline-none focus:border-[#004343]">
              <option value="insufficient">Insufficient Oral Lineage Documentation</option>
              <option value="public_domain">Public Domain Sounding (Unauthenticated Clan Mark)</option>
              <option value="duplicative">Duplicative Cross-Docket Filing</option>
              <option value="unverified">Unverified Filer Standing</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-[#202426]">Clarification Guidance for Filer</label>
            <textarea 
              [(ngModel)]="rejectGuidance" 
              placeholder="Explain which exact documents, customary certificates, or elder affidavits must be submitted for reconsideration..." 
              rows="3" 
              class="w-full p-2.5 text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl focus:outline-none focus:border-[#004343]"></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button (click)="showRejectModal.set(false)" class="px-4 py-2 rounded-xl bg-[#f2f4f3] text-xs font-bold text-[#191c1c]">
              Cancel
            </button>
            <button (click)="confirmRejection()" class="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold shadow-md hover:bg-red-800">
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class DisputesComponent {
  user = this.authService.currentUser;

  // Search & Filter
  searchQuery = '';
  activeTab = signal<'active' | 'flagged' | 'archive'>('active');

  // Resolution selection: 'dismiss' | 'edit' | 'reassign' | 'takedown'
  resolutionAction = signal<'dismiss' | 'edit' | 'reassign' | 'takedown'>('reassign');

  // Audio simulation
  isPlayingAudio = signal<boolean>(false);

  // Toast
  toastMessage = signal<string | null>(null);

  // Reject Modal
  showRejectModal = signal<boolean>(false);
  rejectReason = 'insufficient';
  rejectGuidance = '';

  // Checklist state
  checklist = {
    clanIdentity: true,
    spectralMatch: true,
    rebuttalPeriod: true,
    customaryRights: true
  };

  // Sample Disputes Data
  disputesList: DisputeCase[] = [
    {
      id: 'DSP-9042',
      category: 'Sacred Audio',
      title: 'Copyright Clash: Sacred Monsoon Chant (1974 Tape Sample)',
      summary: 'Elderly choir of Ruhuna claims unpermitted sampling of liturgical rain invocation by contemporary producer K. Silva.',
      contestedAsset: {
        title: 'Monsoon Rain Invocation',
        catalogNumber: 'Catalog #LNS-2931',
        publisher: 'Published by @ksilva_audio • Track 03: \'Ruhuna Low Tides\'',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60',
        segmentTime: '02:14 - 02:49',
        spectralMatch: 94.3
      },
      claimant: {
        name: 'Ruhuna Elder Guild',
        masterRoll: 'Archival Master Roll #RC-74',
        depositedBy: 'Rev. S. Gunaratne',
        year: '1974',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60',
        clause: 'Custodial Protection Clause 11',
        statement: 'The rhythmic chant contains non-public initiatory cadences protected under regional matrilineal inheritance laws.'
      },
      status: 'Under Review',
      priority: 'Critical',
      remainingTimeOrElapsed: '2h remaining',
      evidenceCount: '4 Evidence Artifacts',
      dispatchClaimantPreview: 'Your custodial challenge has been affirmed by the Legacy Lens Overseer Council. The work cataloged as LNS-2931 has been re-indexed with immutable matrilineal attribution to your clan registry.',
      dispatchContributorPreview: 'Following verification with the Ruhuna Council, your upload has been updated to reflect sacred co-attribution. You are granted 48 hours to update linked external streaming masters.'
    },
    {
      id: 'DSP-8821',
      category: 'Oral Lineage',
      title: 'Attribution Dispute: Batticaloa Fisher Lore & Sea Songs',
      summary: 'Contested matriarchal narration rights. Claimant states interviewee lacked ancestral mandate for coastal rites.',
      contestedAsset: {
        title: 'Song of the Singing Fish',
        catalogNumber: 'Catalog #LNS-1840',
        publisher: 'Published by @arun_cultural_vlogs',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
        segmentTime: '01:00 - 03:20',
        spectralMatch: 88.7
      },
      claimant: {
        name: 'Batticaloa Heritage Society',
        masterRoll: 'East Coast Oral Register #EC-12',
        depositedBy: 'Elder M. Sellathurai',
        year: '1982',
        imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=60',
        clause: 'Lineage Integrity Mandate Sec 4',
        statement: 'The lagoon chants require traditional sea-guardian invocations that were omitted, causing cultural misrepresentation.'
      },
      status: 'Check Inflow',
      priority: 'Normal',
      remainingTimeOrElapsed: '14h ago',
      evidenceCount: '2 Audio Tracks',
      dispatchClaimantPreview: 'The East Coast Oral Register review has commenced. Council examiners are verifying the informant lineage against the 1982 tape deposits.',
      dispatchContributorPreview: 'A lineage verification inquiry has been lodged regarding your lagoon oral history recording. Supplemental context notes may be required.'
    },
    {
      id: 'DSP-7719',
      category: 'Ethno-Botanical',
      title: 'Cultural Inaccuracy: Vedda Herb & Plant Codex',
      summary: 'Indigenous youth assembly reports severe mistranslation of ceremonial root preparation instructions.',
      contestedAsset: {
        title: 'Dambana Medicinal Manuscript',
        catalogNumber: 'Catalog #LNS-0955',
        publisher: 'Published by @botanical_ceylon',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=60',
        segmentTime: 'Full Text Document',
        spectralMatch: 91.2
      },
      claimant: {
        name: 'Dambana Community Council',
        masterRoll: 'Indigenous Botanical Codex #DM-04',
        depositedBy: 'Uruwarige Clan Elders',
        year: '1995',
        imageUrl: 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?w=800&auto=format&fit=crop&q=60',
        clause: 'Indigenous Knowledge Preservation Act',
        statement: 'Crucial purification rituals before extracting sacred bark were omitted in the modern translation.'
      },
      status: 'Triage',
      priority: 'Normal',
      remainingTimeOrElapsed: '1d ago',
      evidenceCount: '1 PDF Manuscript',
      dispatchClaimantPreview: 'Your clarification on the medicinal preparation sequence has been received by the Botanical Oversight Committee.',
      dispatchContributorPreview: 'Notice: The editorial team will update the plant codex translation with annotations provided by the Dambana elders.'
    }
  ];

  selectedCase = signal<DisputeCase | null>(this.disputesList[0]);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  activeDisputesCount = computed(() => this.disputesList.filter(d => d.status !== 'Resolved' && d.status !== 'Rejected').length);

  filteredDisputes(): DisputeCase[] {
    return this.disputesList.filter(item => {
      if (this.activeTab() === 'flagged' && item.priority !== 'Critical') return false;
      if (this.activeTab() === 'archive' && item.status !== 'Resolved' && item.status !== 'Rejected') return false;

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesClaimant = item.claimant.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesClaimant) return false;
      }
      return true;
    });
  }

  selectCase(item: DisputeCase): void {
    this.selectedCase.set(item);
    this.isPlayingAudio.set(false);
  }

  toggleAudioPlay(): void {
    this.isPlayingAudio.set(!this.isPlayingAudio());
  }

  isAllChecked(): boolean {
    return this.checklist.clanIdentity &&
           this.checklist.spectralMatch &&
           this.checklist.rebuttalPeriod &&
           this.checklist.customaryRights;
  }

  confirmRejection(): void {
    const current = this.selectedCase();
    if (current) {
      current.status = 'Rejected';
      this.toastMessage.set(`Dispute #${current.id} officially rejected and logged in public council record.`);
    }
    this.showRejectModal.set(false);
    setTimeout(() => this.toastMessage.set(null), 4500);
  }

  saveDraft(): void {
    this.toastMessage.set('Resolution draft saved to secure local enclave.');
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  commitResolution(): void {
    const current = this.selectedCase();
    if (!current) return;

    current.status = 'Resolved';
    this.toastMessage.set(`Resolution docket #${current.id} committed to ledger. Dispatches sent to both parties.`);

    const remaining = this.disputesList.filter(d => d.status !== 'Resolved' && d.status !== 'Rejected');
    if (remaining.length > 0) {
      this.selectCase(remaining[0]);
    }

    setTimeout(() => this.toastMessage.set(null), 4500);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

