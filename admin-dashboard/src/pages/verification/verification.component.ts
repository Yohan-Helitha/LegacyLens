import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface VerificationProfile {
  id: string;
  name: string;
  roleCategory: 'Elder' | 'Artisan' | 'Historian';
  applyingTitle: string;
  nic: string;
  specialization: string;
  division: string;
  district: string;
  gnDivision: string;
  priority: 'Urgent' | 'High' | 'Normal';
  status: 'In Review' | 'Queued' | 'Pending Notes' | 'Approved' | 'Revision Requested';
  receivedTime: string;
  avatarUrl: string;
  yearsOfPractice: string;
  lineageDescription: string;
  endorsingBody: string;
  gnValidator: string;
  archiveImpact: string;
  archiveImpactDetail: string;
  statement: string;
  documents: {
    title: string;
    type: 'PDF' | 'JPG' | 'WAV';
    sizeOrDuration: string;
    subtext: string;
    imageUrl?: string;
  }[];
}

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
      
      <!-- Toast Alert Notification -->
      <div 
        *ngIf="toastMessage()" 
        class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 animate-bounce">
        <span class="material-symbols-outlined text-emerald-300 text-xl">verified_user</span>
        <div class="text-sm font-medium">{{ toastMessage() }}</div>
        <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
      </div>

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Profile Verification" 
          section="Console"
          searchPlaceholder="Filter by name, NIC, or district..."
          [searchQuery]="searchQuery"
          (searchQueryChange)="searchQuery = $event">
        </app-header>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Dossier Header Ribbon -->
          <div class="flex flex-col xl:flex-row items-start justify-between gap-4 pb-2">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span>
                <span class="text-xs uppercase tracking-wider text-[#6f7978] font-bold">Governance Workflow</span>
                <span class="text-[#6f7978]">/</span>
                <span class="text-xs font-bold text-[#0f5c5c]">Decentralized Archive Validation</span>
              </div>
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#202426] tracking-tight">
                Profile Verification Dossier
              </h1>
              <p class="text-xs text-[#3f4948] max-w-2xl leading-relaxed">
                Review credentials, community endorsements, and oral stewardship consents for traditional custodians, Grama Niladhari verifications, and village elders.
              </p>
            </div>

            <!-- Queue Status & Batch Filter CTA -->
            <div class="flex items-center gap-3 w-full xl:w-auto justify-end">
              <div class="bg-white border border-[#dde3eb] shadow-xs rounded-xl px-4 py-2.5 flex items-center gap-4">
                <div>
                  <p class="text-[10px] text-[#6f7978] uppercase font-bold">Pending Queue</p>
                  <p class="font-['Source_Serif_4',serif] text-base font-bold text-[#202426]">{{ pendingCount() }} Profiles</p>
                </div>
                <div class="w-px h-8 bg-[#dde3eb]"></div>
                <div>
                  <p class="text-[10px] text-[#6f7978] uppercase font-bold">Target SLA</p>
                  <p class="text-xs font-bold text-[#9b4600]">&lt; 18h Remaining</p>
                </div>
              </div>

              <button class="bg-[#004343] hover:bg-[#0f5c5c] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
                <span class="material-symbols-outlined text-base">tune</span>
                <span>Batch Filters</span>
              </button>
            </div>
          </div>

          <!-- 2-Column Split Workspace -->
          <div class="grid grid-cols-12 gap-6 items-start">
            
            <!-- LEFT COLUMN: Verification Requests Queue (4 cols) -->
            <div class="col-span-12 lg:col-span-4 flex flex-col gap-4">
              
              <!-- Filter & Search Card -->
              <div class="bg-white rounded-2xl p-4 border border-[#dde3eb] shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#0f5c5c] text-xl">inbox</span>
                    <h3 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#202426]">Verification Requests</h3>
                  </div>
                  <span class="bg-[#f2f4f3] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#3f4948]">
                    {{ filteredProfiles().length }} active
                  </span>
                </div>

                <!-- Filter Pills -->
                <div class="flex gap-1.5 overflow-x-auto py-1">
                  <button 
                    (click)="activeCategory.set('all')"
                    [class]="activeCategory() === 'all' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors">
                    All ({{ profiles.length }})
                  </button>
                  <button 
                    (click)="activeCategory.set('Elder')"
                    [class]="activeCategory() === 'Elder' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors">
                    Elders (2)
                  </button>
                  <button 
                    (click)="activeCategory.set('Artisan')"
                    [class]="activeCategory() === 'Artisan' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors">
                    Artisans (1)
                  </button>
                  <button 
                    (click)="activeCategory.set('Historian')"
                    [class]="activeCategory() === 'Historian' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors">
                    Historians (1)
                  </button>
                </div>
              </div>

              <!-- Profile Cards List -->
              <div class="flex flex-col gap-2.5">
                <div 
                  *ngFor="let p of filteredProfiles()"
                  (click)="selectProfile(p)"
                  [class]="selectedProfile()?.id === p.id ? 'border-[#004343] bg-white ring-2 ring-[#004343]/30 shadow-md translate-x-1' : 'border-[#dde3eb] bg-white hover:border-[#6f7978]/40 shadow-xs'"
                  class="p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden">
                  
                  <div *ngIf="selectedProfile()?.id === p.id" class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#004343]"></div>

                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <img 
                          [src]="p.avatarUrl" 
                          [alt]="p.name"
                          class="w-12 h-12 rounded-xl object-cover shadow-xs"
                        />
                        <span *ngIf="p.roleCategory === 'Elder'" class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#fe893e] flex items-center justify-center text-white text-[10px] font-bold">★</span>
                      </div>
                      <div class="min-w-0">
                        <h4 class="font-bold text-xs text-[#202426] truncate">{{ p.name }}</h4>
                        <p class="text-[11px] text-[#6f7978] truncate">{{ p.division }}</p>
                      </div>
                    </div>
                    
                    <span 
                      [class]="p.priority === 'Urgent' ? 'bg-[#fe893e]/20 text-[#9b4600] border border-[#fe893e]/30' : 'bg-[#f2f4f3] text-[#3f4948]'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                      {{ p.priority === 'Urgent' ? 'Urgent' : p.status }}
                    </span>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6f7978]">
                    <span class="inline-flex items-center gap-1 bg-[#f2f4f3] px-2 py-0.5 rounded text-[#3f4948]">
                      <span class="material-symbols-outlined text-[12px]">pin_drop</span>
                      {{ p.district }}
                    </span>
                    <span class="inline-flex items-center gap-1 bg-[#004343]/10 px-2 py-0.5 rounded text-[#004343] font-bold">
                      {{ p.applyingTitle }}
                    </span>
                    <span class="ml-auto text-[10px] text-[#6f7978]">{{ p.receivedTime }}</span>
                  </div>
                </div>
              </div>

              <!-- Trust Index Baseline -->
              <div class="bg-white p-4 rounded-xl border border-[#dde3eb] flex items-center justify-between shadow-xs">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#004343] text-xl">verified</span>
                  <span class="text-xs font-bold text-[#202426]">Trust Index Baseline: 94.2%</span>
                </div>
                <a class="text-xs text-[#9b4600] font-bold hover:underline cursor-pointer">View SLA Rules</a>
              </div>

            </div>

            <!-- RIGHT COLUMN: Detailed Applicant Dossier (8 cols) -->
            <div class="col-span-12 lg:col-span-8 flex flex-col gap-5" *ngIf="selectedProfile() as p">
              
              <!-- Applicant Profile Main Dossier Card -->
              <div class="bg-white rounded-2xl shadow-xs border border-[#dde3eb] p-6 space-y-6">
                
                <!-- Applicant Header Bar -->
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#eceeed]">
                  <div class="flex items-center gap-4">
                    <img 
                      [src]="p.avatarUrl" 
                      [alt]="p.name"
                      class="w-20 h-20 rounded-2xl object-cover shadow-sm ring-2 ring-[#004343]/20"
                    />
                    <div class="space-y-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="font-['Source_Serif_4',serif] text-xl font-bold text-[#202426]">{{ p.name }}</h2>
                        <span class="bg-[#004343]/10 text-[#004343] px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                          <span class="material-symbols-outlined text-sm">military_tech</span>
                          Applying: {{ p.applyingTitle }}
                        </span>
                      </div>
                      <p class="text-xs text-[#6f7978]">NIC: {{ p.nic }} • {{ p.specialization }}</p>
                      <div class="flex items-center gap-2 text-xs">
                        <span class="text-[#004343] font-semibold flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-sm">location_on</span>
                          {{ p.division }}, {{ p.district }}
                        </span>
                        <span class="text-[#6f7978]">•</span>
                        <span class="text-[#6f7978]">{{ p.gnDivision }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col md:items-end gap-1 text-xs">
                    <span class="text-[#6f7978]">Application ID</span>
                    <span class="font-mono text-xs bg-[#f2f4f3] px-2.5 py-1 rounded text-[#202426] font-bold tracking-wider border border-[#dde3eb]">
                      {{ p.id }}
                    </span>
                    <span class="text-[#9b4600] font-bold mt-0.5">Priority: {{ p.priority }}</span>
                  </div>
                </div>

                <!-- 3 Metric Cards Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f8faf9] p-4 rounded-xl border border-[#dde3eb]">
                  <div class="space-y-1">
                    <span class="text-[10px] text-[#6f7978] uppercase tracking-wider font-bold">Years of Practice</span>
                    <p class="font-['Source_Serif_4',serif] text-xl font-bold text-[#202426]">{{ p.yearsOfPractice }}</p>
                    <p class="text-xs text-[#3f4948]">{{ p.lineageDescription }}</p>
                  </div>

                  <div class="space-y-1">
                    <span class="text-[10px] text-[#6f7978] uppercase tracking-wider font-bold">Endorsing Body</span>
                    <p class="font-['Source_Serif_4',serif] text-base font-bold text-[#202426]">{{ p.endorsingBody }}</p>
                    <p class="text-xs text-[#3f4948]">{{ p.gnValidator }}</p>
                  </div>

                  <div class="space-y-1">
                    <span class="text-[10px] text-[#6f7978] uppercase tracking-wider font-bold">Archive Impact</span>
                    <p class="font-['Source_Serif_4',serif] text-xl font-bold text-[#202426]">{{ p.archiveImpact }}</p>
                    <p class="text-xs text-[#3f4948]">{{ p.archiveImpactDetail }}</p>
                  </div>
                </div>

                <!-- Statement & Lineage Block -->
                <div class="space-y-2">
                  <h3 class="text-xs uppercase tracking-wider text-[#202426] font-bold">Applicant Statement & Lineage</h3>
                  <div class="bg-[#f8faf9] rounded-xl p-4 border border-[#dde3eb] text-xs text-[#191c1c] leading-relaxed italic">
                    “{{ p.statement }}”
                  </div>
                </div>

                <!-- Submitted Credentials & Field Verification Documents -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs uppercase tracking-wider text-[#202426] font-bold">Submitted Credentials & Field Verification</h3>
                    <span class="text-xs text-[#6f7978]">{{ p.documents.length }} documents attached</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div 
                      *ngFor="let doc of p.documents"
                      class="bg-white p-3 rounded-xl border border-[#dde3eb] shadow-2xs flex flex-col justify-between hover:bg-[#f8faf9] transition-colors group cursor-pointer space-y-2">
                      
                      <!-- Document Preview Box -->
                      <div class="h-32 rounded-lg bg-[#f2f4f3] flex items-center justify-center relative overflow-hidden">
                        <img 
                          *ngIf="doc.imageUrl" 
                          [src]="doc.imageUrl" 
                          [alt]="doc.title"
                          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div 
                          *ngIf="doc.type === 'WAV'" 
                          class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#0f5c5c] to-[#004343] text-white">
                          <span class="material-symbols-outlined text-3xl animate-pulse">mic</span>
                          <span class="text-xs mt-1">{{ doc.sizeOrDuration }}</span>
                        </div>
                        <span class="absolute bottom-2 right-2 bg-[#004343]/80 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur font-mono">
                          {{ doc.type }} • {{ doc.sizeOrDuration }}
                        </span>
                      </div>

                      <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-[#202426] truncate">{{ doc.title }}</span>
                        <span class="material-symbols-outlined text-[#004343] text-base">verified</span>
                      </div>
                      <span class="text-[10px] text-[#6f7978]">{{ doc.subtext }}</span>
                    </div>
                  </div>
                </div>

                <!-- Stewardship & Archival Ethics Audit (Checklist) -->
                <div class="bg-[#f2f4f3] rounded-xl p-4 border border-[#dde3eb] space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[#004343] text-lg">fact_check</span>
                      <h4 class="font-['Source_Serif_4',serif] text-xs font-bold text-[#004343]">Stewardship & Archival Ethics Audit</h4>
                    </div>
                    <span class="text-xs font-bold text-[#004343] bg-white px-2 py-0.5 rounded border border-[#dde3eb]">Mandatory Checklist</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <label class="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-[#dde3eb] cursor-pointer hover:bg-[#f8faf9] transition-colors shadow-2xs">
                      <input type="checkbox" [(ngModel)]="ethicsChecklist.communityConsent" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Community Consent Validated</p>
                        <p class="text-[11px] text-[#6f7978]">No sacred or restricted rites published without elders' circle sign-off.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-[#dde3eb] cursor-pointer hover:bg-[#f8faf9] transition-colors shadow-2xs">
                      <input type="checkbox" [(ngModel)]="ethicsChecklist.gnSeal" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Grama Niladhari Physical Seal</p>
                        <p class="text-[11px] text-[#6f7978]">Seal and signature match National Registry Division 614 records.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-[#dde3eb] cursor-pointer hover:bg-[#f8faf9] transition-colors shadow-2xs">
                      <input type="checkbox" [(ngModel)]="ethicsChecklist.openAccess" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Open Access Attribution</p>
                        <p class="text-[11px] text-[#6f7978]">Applicant retains cultural attribution under Creative Heritage Licensure.</p>
                      </div>
                    </label>

                    <label class="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-[#dde3eb] cursor-pointer hover:bg-[#f8faf9] transition-colors shadow-2xs">
                      <input type="checkbox" [(ngModel)]="ethicsChecklist.dialogueVerified" class="mt-0.5 w-4 h-4 rounded text-[#004343] accent-[#004343] cursor-pointer" />
                      <div>
                        <p class="text-xs font-bold text-[#202426]">Direct Dialogue Verification</p>
                        <p class="text-[11px] text-[#6f7978]">Audio test confirms vocal clarity and authentic regional dialect.</p>
                      </div>
                    </label>
                  </div>
                </div>

              </div>

              <!-- Adjudication & Resolution Actions Card -->
              <div class="bg-white rounded-2xl shadow-xs border border-[#dde3eb] p-6 space-y-4">
                <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#9b4600] text-xl">gavel</span>
                    <h3 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343]">Adjudication & Resolution Actions</h3>
                  </div>
                  <span class="text-xs text-[#6f7978]">Logged as Overseer: E. Vance</span>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <!-- Action Branch 1: Request Revision -->
                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between space-y-3">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#202426]">
                        <span class="material-symbols-outlined text-sm text-[#9b4600]">edit_note</span>
                        <span>Action Branch 1: Request Revision</span>
                      </div>
                      <p class="text-xs text-[#6f7978]">
                        Issue instructions back to the applicant or field supervisor for supplementary documentation or clearer scans.
                      </p>
                      <textarea 
                        [(ngModel)]="revisionNotes"
                        rows="3" 
                        placeholder="Provide actionable requirements (e.g. Higher resolution scan of page 4, official Grama Niladhari callback)..." 
                        class="w-full mt-1 p-2.5 bg-white border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] resize-none"></textarea>
                    </div>

                    <button 
                      (click)="requestRevision()"
                      class="w-full py-2.5 rounded-lg bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#202426] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-sm">send</span>
                      <span>Submit for Changes & Notes</span>
                    </button>
                  </div>

                  <!-- Action Branch 2: Approve & Activate Badge -->
                  <div class="p-4 rounded-xl bg-[#004343]/5 border border-[#004343]/20 flex flex-col justify-between space-y-3">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#004343]">
                        <span class="material-symbols-outlined text-sm">verified_user</span>
                        <span>Action Branch 2: Approve & Activate Badge</span>
                      </div>
                      <p class="text-xs text-[#3f4948]">
                        Instantly confers the official “Verified Elder Custodian” seal, unlocks oral history transcription pipelines, and publishes profile to map.
                      </p>
                      <div class="space-y-1 mt-1">
                        <label class="text-[11px] font-bold text-[#6f7978]">Permanent Archival Audit Note</label>
                        <input 
                          type="text" 
                          [(ngModel)]="auditNote" 
                          class="w-full p-2 bg-white border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                        />
                      </div>
                    </div>

                    <button 
                      (click)="approveProfile()"
                      class="w-full py-3 rounded-lg bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer">
                      <span class="material-symbols-outlined text-base">check_circle</span>
                      <span>Accept & Verify Custodian Profile</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

    </div>
  `
})
export class VerificationComponent {
  user = this.authService.currentUser;

  // Search & Filter
  searchQuery = '';
  activeCategory = signal<'all' | 'Elder' | 'Artisan' | 'Historian'>('all');

  // Toast message
  toastMessage = signal<string | null>(null);

  // Ethics Checklist state
  ethicsChecklist = {
    communityConsent: true,
    gnSeal: true,
    openAccess: true,
    dialogueVerified: true
  };

  // Action fields
  revisionNotes = '';
  auditNote = 'Authenticity verified against Kandy Cultural Triangle database record #9921.';

  // Profiles Database
  profiles: VerificationProfile[] = [
    {
      id: 'LK-KD-2024-0891',
      name: 'Punchi Bandara Wijeratne',
      roleCategory: 'Elder',
      applyingTitle: 'Elder Knowledge Holder',
      nic: '194830104829',
      specialization: 'Traditional Lacquer Art & Ola Leaf Script Specialist',
      division: 'Medadumbara',
      district: 'Kandy, Central',
      gnDivision: 'Grama Niladhari Division 614-B',
      priority: 'Urgent',
      status: 'In Review',
      receivedTime: '2h ago',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60',
      yearsOfPractice: '54 Years',
      lineageDescription: '4th generation lacquer artisan lineage',
      endorsingBody: 'Central Cultural Fund',
      gnValidator: 'Validated by GN Officer D. Ranatunga',
      archiveImpact: '18 Recordings',
      archiveImpactDetail: 'Transcribing rare botanical formulas',
      statement: 'I have preserved the dry-zone natural resin lacquer distillation techniques practiced in the Dumbara valley since the royal court era of Kandy. Without centralized digital archival recordings, the local terminology for 27 distinct pigment-stabilizing bark extracts risks complete obsolescence. I commit to making my voice recordings and physical artifact processes public under the Community Commons Protocol.',
      documents: [
        {
          title: 'Grama Niladhari Attestation',
          type: 'PDF',
          sizeOrDuration: '2.4 MB',
          subtext: 'Signatory: GN Div 614-B',
          imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=60'
        },
        {
          title: 'Ola Leaf Lineage Registry',
          type: 'JPG',
          sizeOrDuration: '8.1 MB',
          subtext: 'Dumbara Artisanal Guild 1912',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60'
        },
        {
          title: 'Oral Craft Testimony',
          type: 'WAV',
          sizeOrDuration: '12:44 Audio',
          subtext: 'Language: Kandyan Sinhala (Dialect)'
        }
      ]
    },
    {
      id: 'LK-JF-2024-0412',
      name: 'Sivagami Nadarajah',
      roleCategory: 'Historian',
      applyingTitle: 'Village Historian',
      nic: '196270401823',
      specialization: 'Palm Leaf Manuscript Archival & Tamil Folklore',
      division: 'Chavakachcheri North',
      district: 'Jaffna, Northern',
      gnDivision: 'Grama Niladhari Division J-284',
      priority: 'Normal',
      status: 'In Review',
      receivedTime: '5h ago',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=60',
      yearsOfPractice: '38 Years',
      lineageDescription: 'Custodial scholar of Chavakachcheri manuscripts',
      endorsingBody: 'Jaffna Heritage Foundation',
      gnValidator: 'Certified by GN Secretary K. Tharmalingam',
      archiveImpact: '32 Manuscripts',
      archiveImpactDetail: 'Digitizing coastal seasonal agricultural poems',
      statement: 'Our family collection holds palm leaf manuscripts documenting water management and rain cycles across the Vadamarachchi lagoons. Preserving these chants allows future generations to understand indigenous hydraulic knowledge.',
      documents: [
        {
          title: 'Jaffna Heritage Certificate',
          type: 'PDF',
          sizeOrDuration: '1.9 MB',
          subtext: 'Endorsed by University of Jaffna History Dept',
          imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=60'
        },
        {
          title: 'Palm Leaf Manuscript Sample',
          type: 'JPG',
          sizeOrDuration: '5.4 MB',
          subtext: '1890 Palm Leaf Foliage',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60'
        }
      ]
    },
    {
      id: 'LK-GL-2024-0733',
      name: 'K. L. Sunil De Silva',
      roleCategory: 'Artisan',
      applyingTitle: 'Traditional Artisan',
      nic: '197022301948',
      specialization: 'Kolam Mask Carving & Puppetry Heritage',
      division: 'Ambalangoda Coastal',
      district: 'Galle, Southern',
      gnDivision: 'Grama Niladhari Division 88-A',
      priority: 'Normal',
      status: 'Queued',
      receivedTime: '1d ago',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60',
      yearsOfPractice: '35 Years',
      lineageDescription: 'Master carver of the De Silva Kolam lineage',
      endorsingBody: 'Southern Crafts Council',
      gnValidator: 'Signed by Divisional Officer P. Jayalath',
      archiveImpact: '14 Artifacts',
      archiveImpactDetail: 'Cataloging sacred Kaduru wood masks',
      statement: 'Kolam mask traditions require specific tree blessing prayers before the timber is cut. I seek to record both the carving methods and the ritual verses to preserve this living heritage.',
      documents: [
        {
          title: 'Southern Crafts Guild Registry',
          type: 'PDF',
          sizeOrDuration: '3.1 MB',
          subtext: 'Registered Master Artisan #GL-104',
          imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=60'
        }
      ]
    },
    {
      id: 'LK-BT-2024-0994',
      name: 'M. F. Riswan Marikkar',
      roleCategory: 'Elder',
      applyingTitle: 'Oral Genealogist',
      nic: '195510204910',
      specialization: 'Eastern Coastal Oral Lineages & Maritime Lore',
      division: 'Kattankudy Heritage Ward',
      district: 'Batticaloa, Eastern',
      gnDivision: 'Grama Niladhari Division 14-C',
      priority: 'Normal',
      status: 'Pending Notes',
      receivedTime: '2d ago',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=60',
      yearsOfPractice: '42 Years',
      lineageDescription: 'Custodial recorder of eastern trade routes',
      endorsingBody: 'Eastern Province Cultural Secretariat',
      gnValidator: 'Signed by GN Ward Officer M. Naleem',
      archiveImpact: '25 Audio Rolls',
      archiveImpactDetail: 'Recording maritime sea chants and trade histories',
      statement: 'The trade records and oral verses of eastern seafaring merchants have been passed down verbally in my family. Archiving them provides vital historical context to Sri Lanka’s trade history.',
      documents: [
        {
          title: 'Eastern Cultural Endorsement',
          type: 'PDF',
          sizeOrDuration: '2.0 MB',
          subtext: 'Authenticated by Eastern Cultural Bureau',
          imageUrl: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&auto=format&fit=crop&q=60'
        }
      ]
    }
  ];

  selectedProfile = signal<VerificationProfile | null>(this.profiles[0]);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  pendingCount = computed(() => this.profiles.filter(p => p.status !== 'Approved').length);

  filteredProfiles(): VerificationProfile[] {
    return this.profiles.filter(p => {
      if (this.activeCategory() !== 'all' && p.roleCategory !== this.activeCategory()) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesNic = p.nic.toLowerCase().includes(q);
        const matchesDist = p.district.toLowerCase().includes(q);
        if (!matchesName && !matchesNic && !matchesDist) return false;
      }
      return true;
    });
  }

  selectProfile(p: VerificationProfile): void {
    this.selectedProfile.set(p);
  }

  approveProfile(): void {
    const current = this.selectedProfile();
    if (!current) return;

    current.status = 'Approved';
    this.toastMessage.set(`Profile for "${current.name}" successfully approved! Official Verified Elder Custodian seal issued.`);

    const remaining = this.profiles.filter(p => p.status !== 'Approved');
    if (remaining.length > 0) {
      this.selectProfile(remaining[0]);
    }

    setTimeout(() => this.toastMessage.set(null), 4500);
  }

  requestRevision(): void {
    const current = this.selectedProfile();
    if (!current) return;

    current.status = 'Revision Requested';
    this.toastMessage.set(`Revision notes dispatched to regional coordinator for "${current.name}".`);

    const remaining = this.profiles.filter(p => p.status !== 'Approved');
    if (remaining.length > 0) {
      this.selectProfile(remaining[0]);
    }

    setTimeout(() => this.toastMessage.set(null), 4500);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

