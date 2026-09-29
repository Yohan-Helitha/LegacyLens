import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface CommunityMember {
  id: string;
  code: string;
  name: string;
  nic: string;
  role: 'ELDER' | 'YOUTH_ARCHIVIST' | 'FIELD_SCOUT' | 'APPRENTICE' | 'ELDER_APPLICANT' | 'DIGITAL_MODELER';
  roleTag: string;
  tier: string;
  specialty: string;
  guild: string;
  district: string;
  hub: string;
  outputCount: string;
  outputDetail: string;
  status: 'VERIFIED_MASTER' | 'BIO_ATTESTED' | 'GN_CERTIFIED' | 'VERIFIED_SCOUT' | 'REVIEW_PENDING';
  statusDisplay: string;
  statusClass: string;
  photoUrl: string;
  bio: string;
  language: string;
  phone: string;
  contactProxy: string;
  oralStories: number;
  manuscripts: number;
  trustScore: string;
  ledgerHash: string;
  apprentices: { name: string; role: string; initial: string; bg: string }[];
  fieldOffice: string;
  hubDistance: string;
}

@Component({
  selector: 'app-profile-management',
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

      <!-- Reusable Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Top Header Navigation -->
        <app-header 
          pageTitle="Profile Management" 
          section="Administration"
          searchPlaceholder="Search records, elders, crafts, NIC..."
          [searchQuery]="searchQuery()"
          (searchQueryChange)="searchQuery.set($event)">
        </app-header>

        <!-- Main Body Scroll Container -->
        <main class="flex-1 overflow-y-auto p-8 space-y-6">
          
          <!-- Page Header Banner -->
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-2xl font-serif font-bold text-[#191c1c] tracking-tight">Community & Creator Roster</h1>
                <span class="px-3 py-1 rounded-full bg-[#004343]/10 text-[#004343] text-xs inline-flex items-center gap-1.5 font-bold">
                  <span class="w-2 h-2 rounded-full bg-[#0f5c5c] animate-pulse"></span>
                  Direct Ledger v3.2
                </span>
              </div>
              <p class="text-xs text-[#6e7978] mt-1">
                Registry of Verified Cultural Keepers, Oral History Custodians, Youth Creators, and Lineage Apprentices.
              </p>
            </div>

            <div class="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm">
              <div class="w-8 h-8 rounded-xl bg-[#004343]/10 flex items-center justify-center text-[#004343]">
                <span class="material-symbols-outlined text-lg">verified</span>
              </div>
              <div class="flex flex-col text-left">
                <div class="text-xs text-[#191c1c] font-bold flex items-center gap-1.5">
                  Active User Verification Protocol v3.2
                  <span class="text-[#9b4600] font-bold">· 98.4% ID Attestation</span>
                </div>
                <div class="text-[10px] text-[#6e7978]">
                  Field-Verified via Divisional Secretariat & Grama Niladhari Hubs
                </div>
              </div>
            </div>
          </div>

          <!-- Metrics KPI Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Total Community -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Total Community</span>
                  <div class="w-8 h-8 rounded-xl bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-lg">groups</span>
                  </div>
                </div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">8,940 Active</div>
                <div class="text-[11px] text-[#3f4948] mt-1 flex items-center gap-1">
                  <span class="text-[#004343] font-bold inline-flex items-center">
                    <span class="material-symbols-outlined text-sm">trending_up</span>+14%
                  </span>
                  <span>this month (65% Youth, 35% Elders)</span>
                </div>
              </div>
              <div class="w-full bg-[#e6e9e8] h-1.5 rounded-full mt-4 overflow-hidden flex">
                <div class="bg-[#004343] h-full" style="width: 35%"></div>
                <div class="bg-[#fe893e] h-full" style="width: 65%"></div>
              </div>
            </div>

            <!-- Elder Keepers -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Elder Keepers</span>
                  <div class="w-8 h-8 rounded-xl bg-[#f2f4f3] flex items-center justify-center text-[#9b4600]">
                    <span class="material-symbols-outlined text-lg">elderly</span>
                  </div>
                </div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">1,420 Elders</div>
                <div class="text-[11px] text-[#3f4948] mt-1">
                  <span class="text-[#004343] font-bold">94% Lineage Verified</span> · 38 Ingestion Queue
                </div>
              </div>
              <div class="w-full bg-[#e6e9e8] h-1.5 rounded-full mt-4 overflow-hidden">
                <div class="bg-[#004343] h-full" style="width: 94%"></div>
              </div>
            </div>

            <!-- Youth Creators -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Youth Creators</span>
                  <div class="w-8 h-8 rounded-xl bg-[#f2f4f3] flex items-center justify-center text-[#0f5c5c]">
                    <span class="material-symbols-outlined text-lg">videocam</span>
                  </div>
                </div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">3,180 Creators</div>
                <div class="text-[11px] text-[#3f4948] mt-1">
                  <span class="text-[#9b4600] font-bold">4.8★ Field Score</span> · 210 Field Scouts Active
                </div>
              </div>
              <div class="w-full bg-[#e6e9e8] h-1.5 rounded-full mt-4 overflow-hidden">
                <div class="bg-[#9b4600] h-full" style="width: 82%"></div>
              </div>
            </div>

            <!-- Pending Verification -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Pending Verification</span>
                  <div class="w-8 h-8 rounded-xl bg-[#ffdbc9]/50 flex items-center justify-center text-[#672c00]">
                    <span class="material-symbols-outlined text-lg">pending_actions</span>
                  </div>
                </div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">19 Pending</div>
                <div class="text-[11px] text-[#3f4948] mt-1">
                  12 Elders, 7 Youth · <span class="font-semibold text-[#191c1c]">SLA 18.2h avg</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 mt-4">
                <span class="w-2 h-2 rounded-full bg-[#fe893e] animate-ping"></span>
                <span class="text-[11px] text-[#9b4600] font-bold">Action Required Today</span>
              </div>
            </div>

          </div>

          <!-- Filter Tabs & Actions Bar -->
          <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-[#dde3eb] shadow-sm">
            <div class="flex items-center gap-1 overflow-x-auto py-1">
              
              <button (click)="selectedCategoryTab.set('ALL')"
                      [ngClass]="selectedCategoryTab() === 'ALL' ? 'bg-[#004343] text-white font-bold shadow-sm' : 'text-[#3f4948] hover:bg-[#f2f4f3]'"
                      class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all">
                All Community (8,940)
              </button>

              <button (click)="selectedCategoryTab.set('ELDERS')"
                      [ngClass]="selectedCategoryTab() === 'ELDERS' ? 'bg-[#004343] text-white font-bold shadow-sm' : 'text-[#3f4948] hover:bg-[#f2f4f3]'"
                      class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-sm">verified</span>
                <span>Elder Knowledge Keepers (1,420)</span>
              </button>

              <button (click)="selectedCategoryTab.set('YOUTH')"
                      [ngClass]="selectedCategoryTab() === 'YOUTH' ? 'bg-[#004343] text-white font-bold shadow-sm' : 'text-[#3f4948] hover:bg-[#f2f4f3]'"
                      class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all">
                Youth Creators & Apprentices (3,180)
              </button>

              <button (click)="selectedCategoryTab.set('PENDING')"
                      [ngClass]="selectedCategoryTab() === 'PENDING' ? 'bg-[#004343] text-white font-bold shadow-sm' : 'text-[#3f4948] hover:bg-[#f2f4f3]'"
                      class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1">
                <span>Pending Verification</span>
                <span class="px-1.5 py-0.5 rounded-full bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">19</span>
              </button>

              <button (click)="selectedCategoryTab.set('FLAGGED')"
                      [ngClass]="selectedCategoryTab() === 'FLAGGED' ? 'bg-[#004343] text-white font-bold shadow-sm' : 'text-[#3f4948] hover:bg-[#f2f4f3]'"
                      class="px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all">
                Flagged / Restricted (6)
              </button>
            </div>

            <div class="flex items-center gap-2 self-end md:self-auto">
              <button (click)="exportRegistry()"
                      class="px-3 py-1.5 rounded-xl bg-[#f2f4f3] text-[#191c1c] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#e6e9e8] transition-colors">
                <span class="material-symbols-outlined text-base text-[#004343]">file_download</span>
                <span>Export Registry</span>
              </button>

              <button (click)="openRegisterElderModal()"
                      class="px-3.5 py-1.5 rounded-xl bg-[#004343] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#003131] transition-all shadow-sm shadow-[#004343]/20">
                <span class="material-symbols-outlined text-base">person_add</span>
                <span>+ Register Elder</span>
              </button>
            </div>
          </div>

          <!-- Secondary Filter Bar -->
          <div class="bg-white p-3 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col md:flex-row items-stretch gap-3">
            <div class="relative flex-1">
              <span class="material-symbols-outlined text-base text-[#6e7978] absolute left-3 top-1/2 -translate-y-1/2">search</span>
              <input type="text"
                     [ngModel]="searchQuery()"
                     (ngModelChange)="searchQuery.set($event)"
                     placeholder="Search by name, NIC, craft specialty, district, or mobile..."
                     class="w-full bg-[#f2f4f3] pl-9 pr-4 py-2 rounded-xl text-xs text-[#191c1c] placeholder:text-[#6e7978] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#004343] transition-all" />
            </div>

            <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select [ngModel]="selectedRoleDropdown()"
                      (ngModelChange)="selectedRoleDropdown.set($event)"
                      class="bg-[#f2f4f3] px-3 py-2 rounded-xl text-xs font-medium text-[#191c1c] border-none focus:outline-none focus:bg-white">
                <option value="ALL">All Roles (Elder / Youth / Apprentice)</option>
                <option value="ELDER">Elder Knowledge Holder</option>
                <option value="YOUTH_ARCHIVIST">Youth Storyteller</option>
                <option value="FIELD_SCOUT">Field Audio Scout</option>
                <option value="DIGITAL_MODELER">Digital Heritage Archivist</option>
              </select>

              <select [ngModel]="selectedDistrictDropdown()"
                      (ngModelChange)="selectedDistrictDropdown.set($event)"
                      class="bg-[#f2f4f3] px-3 py-2 rounded-xl text-xs font-medium text-[#191c1c] border-none focus:outline-none focus:bg-white">
                <option value="ALL">All 25 Districts (Central, Western, etc.)</option>
                <option value="Kandy">Kandy (Central)</option>
                <option value="Galle">Galle (Southern)</option>
                <option value="Jaffna">Jaffna (Northern)</option>
                <option value="Ratnapura">Ratnapura (Sabaragamuwa)</option>
                <option value="Kalutara">Kalutara (Western)</option>
                <option value="Colombo">Colombo (Western)</option>
              </select>

              <select [ngModel]="selectedStatusDropdown()"
                      (ngModelChange)="selectedStatusDropdown.set($event)"
                      class="bg-[#f2f4f3] px-3 py-2 rounded-xl text-xs font-medium text-[#191c1c] border-none focus:outline-none focus:bg-white">
                <option value="ALL">All Statuses (Verified, Attested, Pending)</option>
                <option value="VERIFIED_MASTER">Verified Master</option>
                <option value="BIO_ATTESTED">Bio-Attested & Sealed</option>
                <option value="GN_CERTIFIED">GN Certified</option>
                <option value="VERIFIED_SCOUT">Verified Scout</option>
                <option value="REVIEW_PENDING">Lineage Document Review</option>
              </select>

              <button (click)="clearFilters()" class="p-2 rounded-xl bg-[#f2f4f3] hover:bg-[#e6e9e8] text-[#3f4948] transition-colors" title="Clear Filters">
                <span class="material-symbols-outlined text-base">restart_alt</span>
              </button>
            </div>
          </div>

          <!-- Main Dual Column Layout (8 Cols Table / 4 Cols Selected Dossier) -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            <!-- LEFT COLUMN (8 Cols): Roster Table + Intergenerational Pairings -->
            <div class="xl:col-span-8 space-y-6">
              
              <!-- Members Table Card -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    
                    <thead class="bg-[#f8faf9] border-b border-[#dde3eb] text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">
                      <tr>
                        <th class="py-3.5 px-4 font-bold">Member Identity</th>
                        <th class="py-3.5 px-4 font-bold">Role & Lineage</th>
                        <th class="py-3.5 px-4 font-bold">Heritage Specialty</th>
                        <th class="py-3.5 px-4 font-bold">District Hub</th>
                        <th class="py-3.5 px-4 font-bold text-center">Output</th>
                        <th class="py-3.5 px-4 font-bold">Status</th>
                        <th class="py-3.5 px-4 text-right font-bold">Action</th>
                      </tr>
                    </thead>

                    <tbody class="divide-y divide-[#dde3eb]">
                      @for (member of filteredMembers(); track member.id) {
                        <tr (click)="selectMember(member)"
                            [ngClass]="selectedMember()?.id === member.id ? 'bg-[#004343]/5' : 'hover:bg-[#f8faf9]'"
                            class="transition-colors cursor-pointer">
                          
                          <!-- Identity -->
                          <td class="py-3.5 px-4">
                            <div class="flex items-center gap-3">
                              <img [src]="member.photoUrl" 
                                   [alt]="member.name" 
                                   class="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-black/5" />
                              <div class="min-w-0">
                                <div class="font-bold text-[#191c1c] truncate flex items-center gap-1">
                                  {{ member.name }}
                                  @if (member.status === 'VERIFIED_MASTER' || member.status === 'GN_CERTIFIED') {
                                    <span class="material-symbols-outlined text-sm text-[#004343]" title="Verified Master Lineage">verified</span>
                                  } @else if (member.status === 'REVIEW_PENDING') {
                                    <span class="w-2 h-2 rounded-full bg-[#fe893e] animate-ping" title="Review Pending"></span>
                                  }
                                </div>
                                <div class="text-[10px] text-[#6e7978] font-mono truncate">NIC: {{ member.nic }} · {{ member.code }}</div>
                              </div>
                            </div>
                          </td>

                          <!-- Role -->
                          <td class="py-3.5 px-4">
                            <span [ngClass]="getMemberRoleBadge(member.role)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {{ member.roleTag }}
                            </span>
                            <div class="text-[10px] text-[#6e7978] mt-0.5">{{ member.tier }}</div>
                          </td>

                          <!-- Specialty -->
                          <td class="py-3.5 px-4">
                            <div class="font-semibold text-[#191c1c] truncate">{{ member.specialty }}</div>
                            <div class="text-[10px] text-[#6e7978]">{{ member.guild }}</div>
                          </td>

                          <!-- District -->
                          <td class="py-3.5 px-4">
                            <div class="text-[#191c1c] font-medium truncate">{{ member.district }}</div>
                            <div class="text-[10px] text-[#6e7978]">{{ member.hub }}</div>
                          </td>

                          <!-- Output -->
                          <td class="py-3.5 px-4 text-center">
                            <div class="font-semibold text-[#191c1c]">{{ member.outputCount }}</div>
                            <div class="text-[10px] text-[#6e7978]">{{ member.outputDetail }}</div>
                          </td>

                          <!-- Status -->
                          <td class="py-3.5 px-4">
                            <span [ngClass]="member.statusClass" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border">
                              {{ member.statusDisplay }}
                            </span>
                          </td>

                          <!-- Action -->
                          <td class="py-3.5 px-4 text-right">
                            <button class="p-1 rounded-lg text-[#6e7978] hover:bg-[#dde3eb] transition-colors">
                              <span class="material-symbols-outlined text-base">chevron_right</span>
                            </button>
                          </td>

                        </tr>
                      }
                    </tbody>

                  </table>
                </div>

                <!-- Table Pagination -->
                <div class="p-4 bg-[#f8faf9] border-t border-[#dde3eb] flex items-center justify-between text-xs text-[#6e7978]">
                  <div class="flex items-center gap-2">
                    <span>Showing <span class="text-[#191c1c] font-bold">1-{{ filteredMembers().length }}</span> of <span class="text-[#191c1c] font-bold">1,420</span> Knowledge Keepers</span>
                    <span>•</span>
                    <span>Batch operations available for checked rows</span>
                  </div>
                  
                  <div class="flex items-center gap-1">
                    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#dde3eb] text-[#6e7978] font-semibold disabled:opacity-50" disabled>Previous</button>
                    <button class="px-2.5 py-1 rounded-lg bg-[#004343] text-white font-bold">1</button>
                    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c]">2</button>
                    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c]">3</button>
                    <span class="px-1 text-[#6e7978]">...</span>
                    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c]">118</button>
                    <button class="px-2.5 py-1 rounded-lg bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] font-semibold">Next</button>
                  </div>
                </div>

              </div>

              <!-- Active Intergenerational Pairings Card -->
              <div class="bg-white p-6 rounded-2xl border border-[#dde3eb] shadow-sm">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-xl text-[#004343]">diversity_3</span>
                    <h2 class="text-base font-serif font-bold text-[#191c1c]">Active Intergenerational Pairings</h2>
                  </div>
                  <span class="text-xs text-[#6e7978]">32 Active Matches in Kandy District</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-start gap-3.5">
                    <div class="w-10 h-10 rounded-xl bg-[#004343]/10 flex items-center justify-center text-[#004343] shrink-0">
                      <span class="material-symbols-outlined text-xl">sync_alt</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-[#191c1c] truncate">Tikiri Banda ↔ Sanduni J.</div>
                      <div class="text-[11px] text-[#6e7978] mt-0.5">Archiving: 18th Century Dumbara Loom Patterns</div>
                      <div class="flex items-center gap-2 mt-2 text-[10px]">
                        <span class="text-[#004343] font-bold">8 Sessions Transcribed</span>
                        <span class="text-[#dde3eb]">·</span>
                        <span class="text-[#3e4948]">Next: Tomorrow 10:00 AM</span>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-start gap-3.5">
                    <div class="w-10 h-10 rounded-xl bg-[#9b4600]/10 flex items-center justify-center text-[#9b4600] shrink-0">
                      <span class="material-symbols-outlined text-xl">sync_alt</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-bold text-[#191c1c] truncate">P. Selvaratnam ↔ Tharindu W.</div>
                      <div class="text-[11px] text-[#6e7978] mt-0.5">Archiving: Jaffna Hindu Rhythms & Bell Chants</div>
                      <div class="flex items-center gap-2 mt-2 text-[10px]">
                        <span class="text-[#004343] font-bold">5 Audio Master Tracks</span>
                        <span class="text-[#dde3eb]">·</span>
                        <span class="text-[#9b4600] font-bold">Consent Signed</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN (4 Cols): Live Selected Member Dossier -->
            @if (selectedMember(); as member) {
              <div class="xl:col-span-4 space-y-4 sticky top-20">
                
                <div class="bg-white p-6 rounded-2xl border border-[#dde3eb] shadow-sm space-y-4">
                  
                  <!-- Dossier Header -->
                  <div class="flex items-center justify-between pb-2 border-b border-[#dde3eb]">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-lg text-[#004343]">badge</span>
                      <h3 class="text-base font-serif font-bold text-[#191c1c]">Member Dossier</h3>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#004343]/10 text-[#004343] text-[10px] font-bold">
                      {{ member.code }}
                    </span>
                  </div>

                  <!-- Member Profile Card -->
                  <div class="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                    <img [src]="member.photoUrl" 
                         [alt]="member.name" 
                         class="w-16 h-16 rounded-xl object-cover shadow-sm shrink-0" />
                    <div class="min-w-0 flex-1">
                      <div class="text-base font-serif font-bold text-[#191c1c] leading-snug truncate">
                        {{ member.name }}
                      </div>
                      <div class="text-xs text-[#9b4600] font-bold">
                        {{ member.tier }} · {{ member.roleTag }}
                      </div>
                      <div class="text-[11px] text-[#6e7978] flex items-center gap-1 mt-0.5 truncate">
                        <span class="material-symbols-outlined text-xs">location_on</span>
                        {{ member.district }} ({{ member.hub }})
                      </div>
                    </div>
                  </div>

                  <!-- Bio & Lineage Attestation -->
                  <div class="space-y-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Bio & Lineage Attestation</span>
                    <div class="text-xs text-[#191c1c] leading-relaxed bg-[#f8faf9] p-3 rounded-xl border border-[#dde3eb]">
                      {{ member.bio }}
                    </div>
                  </div>

                  <!-- Language & Contact Grid -->
                  <div class="grid grid-cols-2 gap-2">
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                      <div class="text-[10px] uppercase font-bold text-[#6e7978]">Primary Language</div>
                      <div class="text-xs font-bold text-[#191c1c] mt-0.5">{{ member.language }}</div>
                      <div class="text-[10px] text-[#004343] font-semibold">Oral Consent Preferred</div>
                    </div>
                    
                    <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                      <div class="text-[10px] uppercase font-bold text-[#6e7978]">Direct Contact</div>
                      <div class="text-xs font-bold text-[#191c1c] mt-0.5 font-mono">{{ member.phone }}</div>
                      <div class="text-[10px] text-[#6e7978]">{{ member.contactProxy }}</div>
                    </div>
                  </div>

                  <!-- Contributions & Trust Index -->
                  <div class="space-y-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Contributions & Trust Index</span>
                    <div class="grid grid-cols-3 gap-2 text-center">
                      <div class="p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                        <div class="text-lg font-serif font-bold text-[#004343]">{{ member.oralStories }}</div>
                        <div class="text-[10px] text-[#6e7978]">Oral Stories</div>
                      </div>
                      <div class="p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                        <div class="text-lg font-serif font-bold text-[#004343]">{{ member.manuscripts }}</div>
                        <div class="text-[10px] text-[#6e7978]">Manuscripts</div>
                      </div>
                      <div class="p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                        <div class="text-lg font-serif font-bold text-[#9b4600]">{{ member.trustScore }}</div>
                        <div class="text-[10px] text-[#6e7978]">Trust Score</div>
                      </div>
                    </div>
                  </div>

                  <!-- Active Youth Apprentices -->
                  @if (member.apprentices && member.apprentices.length > 0) {
                    <div class="space-y-2">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Active Youth Apprentices</span>
                      <div class="space-y-1.5">
                        @for (app of member.apprentices; track app.name) {
                          <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                            <div class="flex items-center gap-2">
                              <span [ngClass]="app.bg" class="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px]">
                                {{ app.initial }}
                              </span>
                              <div>
                                <div class="text-xs font-bold text-[#191c1c]">{{ app.name }}</div>
                                <div class="text-[10px] text-[#6e7978]">{{ app.role }}</div>
                              </div>
                            </div>
                            <button (click)="openChatModal(app.name)" class="p-1 rounded text-[#004343] hover:bg-white transition-colors" title="Message Apprentice">
                              <span class="material-symbols-outlined text-base">chat</span>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Tamper-Evident Ledger Seal -->
                  <div class="p-4 rounded-xl bg-[#0f5c5c] text-white space-y-2 shadow-sm">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#aceeee]">
                        <span class="material-symbols-outlined text-sm">lock</span>
                        <span>Tamper-Evident Ledger Seal</span>
                      </div>
                      <span class="text-[10px] text-[#90d2d1] font-mono">SHA-256</span>
                    </div>
                    <div class="font-mono text-[10px] break-all text-white/90 bg-[#004343]/60 p-2 rounded-lg border border-emerald-400/20 select-all">
                      {{ member.ledgerHash }}
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-[#90d2d1]">
                      <span>Physical Biometric Verified</span>
                      <span>Recorded 2024-01-14 09:22 LK</span>
                    </div>
                  </div>

                  <!-- Governance Actions -->
                  <div class="space-y-2 pt-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Moderation & Governance Actions</span>
                    
                    <div class="grid grid-cols-2 gap-2">
                      <button (click)="assignApprentice()"
                              class="px-3 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#e6e9e8] text-[#191c1c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                        <span class="material-symbols-outlined text-sm text-[#004343]">person_add_alt</span>
                        <span>Assign Apprentice</span>
                      </button>
                      
                      <button (click)="reviewConsent()"
                              class="px-3 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#e6e9e8] text-[#191c1c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                        <span class="material-symbols-outlined text-sm text-[#004343]">audio_file</span>
                        <span>Review Consent</span>
                      </button>
                    </div>

                    <button (click)="grantFastTrackAccess()"
                            class="w-full px-3 py-2.5 rounded-xl bg-[#004343] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#003131] transition-all shadow-sm shadow-[#004343]/20">
                      <span class="material-symbols-outlined text-sm">bolt</span>
                      <span>Grant Fast-Track Ingestion Access</span>
                    </button>

                    <button (click)="restrictRegistryAccess()"
                            class="w-full px-3 py-2 rounded-xl bg-red-50 text-[#ba1a1a] hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-200">
                      <span class="material-symbols-outlined text-sm">block</span>
                      <span>Restrict / Suspend Registry Access</span>
                    </button>
                  </div>

                </div>

                <!-- Divisional Field Hub Card -->
                <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Divisional Field Hub</span>
                    <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#3f4948] text-[10px] font-bold">Central Province</span>
                  </div>

                  <div class="w-full h-28 rounded-xl overflow-hidden relative shadow-inner bg-gradient-to-tr from-[#004343] to-[#0f5c5c] flex items-end p-3">
                    <div class="w-full bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-between text-xs shadow-md">
                      <span class="font-bold text-[#191c1c]">{{ member.fieldOffice }}</span>
                      <span class="text-[#004343] font-bold text-[11px]">{{ member.hubDistance }}</span>
                    </div>
                  </div>
                </div>

              </div>
            }

          </div>

        </main>
      </div>

    </div>
  `
})
export class ProfileManagementComponent {
  toastMessage = signal<string | null>(null);

  // Filter Signals
  selectedCategoryTab = signal<string>('ALL');
  selectedRoleDropdown = signal<string>('ALL');
  selectedDistrictDropdown = signal<string>('ALL');
  selectedStatusDropdown = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Members dataset
  members = signal<CommunityMember[]>([
    {
      id: 'tikiri',
      code: '#LK-KDY-014',
      name: 'Master K. G. Tikiri Banda',
      nic: '541902441V',
      role: 'ELDER',
      roleTag: 'Elder Master',
      tier: 'Tier 1 Custodian',
      specialty: 'Dumbara Handloom Weaving',
      guild: 'Talagune Ancestral Guild',
      district: 'Kandy',
      hub: 'Medadumbara Hub',
      outputCount: '42 Stories',
      outputDetail: '98.4 Audio hrs',
      status: 'VERIFIED_MASTER',
      statusDisplay: 'Verified Master',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBs88kf5LE9XElHZF7eysxKbyVqZfTgpRgBIbz6qWRFqVurPJ0pwaIrO-xfrPqOaV7ot7rRl5CJVzTR2GGPFKj_QgJUn5e8pbk8iSP-bRDy3m2zUO4ftN2IwPRYyBML542yPe6HpE1oHrAXtCiUCCIAPgHogv8BNll0AZOZum_Sh45gH6Gf_-aG0r8cjocRTaG7fLSU3npffFDnk9hQ6sg4K9pCxdPxGzMNnMsJ4n-u5B3ajIdluzkj',
      bio: 'Traditional Handloom Master with a 4th-generation verified heritage lineage rooted in the ancestral Talagune weaver guild. Accredited by the National Crafts Council (NCC-8209). Grama Niladhari identity confirmation letter sealed on 14 Jan 2024.',
      language: 'Sinhala (Voice)',
      phone: '+94 77 289 ****',
      contactProxy: 'Son Proxy: Sunil B.',
      oralStories: 42,
      manuscripts: 12,
      trustScore: '4.98',
      ledgerHash: 'e7b8f94c03ba8821d3f95e5428a1ce7b9df210b488319e04bcfe3401fa99c2b4',
      apprentices: [
        { name: 'Sanduni Jayawardena', role: 'Field Video Producer · Galle', initial: 'S', bg: 'bg-[#004343]' },
        { name: 'Tharindu Wickramasinghe', role: 'Audio Field Scout · Ratnapura', initial: 'T', bg: 'bg-[#9b4600]' }
      ],
      fieldOffice: 'Medadumbara GN Office',
      hubDistance: 'Hub Distance: 4.2 km'
    },
    {
      id: 'sanduni',
      code: '#LK-GAL-302',
      name: 'Sanduni Jayawardena',
      nic: '199854201944',
      role: 'YOUTH_ARCHIVIST',
      roleTag: 'Youth Archivist',
      tier: 'Field Lead',
      specialty: 'Beeralu Lace & Maritime Songs',
      guild: 'Southern Coastal Guild',
      district: 'Galle',
      hub: 'Fort Heritage Center',
      outputCount: '18 Docs',
      outputDetail: '4.92★ Field Rating',
      status: 'BIO_ATTESTED',
      statusDisplay: 'Bio-Attested',
      statusClass: 'bg-[#f2f4f3] text-[#3f4948] border-[#dde3eb]',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA86m3vgehweo9O0n87zaEXaFIk_40m2H4H137v_Cyj68Gp5QB_wvS5fIubKe4d3wmrLWBZ6tp9oAD8ZzmDgLESmyVEuUWw5FDok6U2rxMGsQj5gR4OnJh74WCst4RJ4AkrSvPceXoqFOcjdG4CrcBIAb5ZewHGk72p-onYG5bokWBTRb9nvrAW2QUeJ1P_lEWIjB6ssGsmFRGLBNp_TvjfxNkGNgEGlL3g7XaXj6yNwt9ASgjLSWK1',
      bio: 'Documentary archivist and field lead specializing in Southern maritime lore and Dutch colonial lace craft. Coordinates youth recording camps across Galle, Matara, and Tangalle.',
      language: 'Sinhala & English',
      phone: '+94 71 884 ****',
      contactProxy: 'Self (Field Lead)',
      oralStories: 18,
      manuscripts: 4,
      trustScore: '4.92',
      ledgerHash: 'b4a1ce7b9df210b488319e04bcfe3401fa99c2b4e7b8f94c03ba8821d3f95e54',
      apprentices: [
        { name: 'Kavindu Silva', role: 'Camera Scout · Galle Fort', initial: 'K', bg: 'bg-[#0f5c5c]' }
      ],
      fieldOffice: 'Galle Fort Cultural Secretariat',
      hubDistance: 'Hub Distance: 1.8 km'
    },
    {
      id: 'selvaratnam',
      code: '#LK-JAF-089',
      name: 'P. Selvaratnam',
      nic: '480112940V',
      role: 'ELDER',
      roleTag: 'Elder Master',
      tier: 'Vocal Custodian',
      specialty: 'Carnatic Temple Thevarams',
      guild: 'Nallur Musical Lineage',
      district: 'Jaffna',
      hub: 'Nallur GN Division',
      outputCount: '28 Recs',
      outputDetail: '64 Audio hrs',
      status: 'GN_CERTIFIED',
      statusDisplay: 'GN Certified',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB43eF5Pe_9eLXb00VYe0b-cIjCGDiojZ58eyg0jvm9sS-EWIQQzqmjyKTOeiS6SsIAjsYCXWq3a0XufLXHIpqZotWmmpz7R0dcOxnb_fUzmIJnTi_FZ-wz7EpxtUKpcD_1ZxoKDeRd3mAq_ttONPW9tXiAsqq2r8iEc2lffM8eMEYiYqATCFsZjtZ1qDNNvTWqx6pGGzJHxxax3l7osZiCrt4_VhbTCE0hZuFNQ5GaptS2IcPp2f_0',
      bio: 'Eminent Carnatic vocal master and keeper of oral temple hymns recited continuously across 5 decades at Nallur Kandaswamy Kovil. Biometrically registered under Northern Heritage Board mandate.',
      language: 'Tamil (Voice)',
      phone: '+94 21 222 ****',
      contactProxy: 'Trustee Proxy: K. Rajan',
      oralStories: 28,
      manuscripts: 19,
      trustScore: '4.96',
      ledgerHash: '9df210b488319e04bcfe3401fa99c2b4e7b8f94c03ba8821d3f95e5428a1ce7b',
      apprentices: [
        { name: 'Tharindu Wickramasinghe', role: 'Audio Field Scout · Ratnapura', initial: 'T', bg: 'bg-[#9b4600]' }
      ],
      fieldOffice: 'Nallur Divisional Secretariat',
      hubDistance: 'Hub Distance: 2.1 km'
    },
    {
      id: 'tharindu',
      code: '#LK-RAT-412',
      name: 'Tharindu Wickramasinghe',
      nic: '200114002311',
      role: 'FIELD_SCOUT',
      roleTag: 'Field Scout',
      tier: 'Apprentice Level II',
      specialty: 'Gem Miners’ Folk Ballads',
      guild: 'Oral Poetry Traditions',
      district: 'Ratnapura',
      hub: 'Pelmadulla Hub',
      outputCount: '12 Sessions',
      outputDetail: '31.2 hrs tape',
      status: 'VERIFIED_SCOUT',
      statusDisplay: 'Verified Scout',
      statusClass: 'bg-[#f2f4f3] text-[#3f4948] border-[#dde3eb]',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMZkXov2C97eXzQqVONW1TP1GxiB54oYrhGnxZZlKE8YbL6LB6_ujvZOsLU0wzneIt2163fmv8gtWIjVUj8pxoQgfqxqoI1gkGWxvRg7GaMEFivBz1yjuyMoE1CmkpcJCuDcqhgfosjRhFXNqTqh7lQrZt9lFOAqxU38A4e4LeBthpxB5HCerj7YUmN_6GB_G_2ut6uJjBipFzoI_mSlVXJ2ipWtmx9di9bIxkfx3ve2xF1G9Tk330',
      bio: 'Acoustic engineer and folk ballad recorder gathering endangered working songs from traditional pit gem miners in Sabaragamuwa river basins.',
      language: 'Sinhala (Spoken)',
      phone: '+94 76 991 ****',
      contactProxy: 'Self',
      oralStories: 12,
      manuscripts: 2,
      trustScore: '4.85',
      ledgerHash: 'fe3401fa99c2b4e7b8f94c03ba8821d3f95e5428a1ce7b9df210b488319e04bc',
      apprentices: [],
      fieldOffice: 'Pelmadulla Heritage Hub',
      hubDistance: 'Hub Distance: 6.5 km'
    },
    {
      id: 'malini',
      code: '#LK-KAL-118',
      name: 'Mrs. Malini Senanayake',
      nic: '518340109V',
      role: 'ELDER_APPLICANT',
      roleTag: 'Elder Applicant',
      tier: 'Lineage Ingestion',
      specialty: 'Ayurvedic Botany & Decoctions',
      guild: 'Helavedakama Tradition',
      district: 'Kalutara',
      hub: 'Horana Division',
      outputCount: '3 Drafts',
      outputDetail: 'Needs Audio QA',
      status: 'REVIEW_PENDING',
      statusDisplay: 'Review Pending',
      statusClass: 'bg-[#ffdbc9] text-[#672c00] border-[#fe893e]/40',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWbAciNUMzSDtObBuvOG81YEmSMOI7ScKFY_zu0PN0yLd-sym6Rq7bEGbk8YKJ4KTD1YPbJsZD4xXT-AeGtX9yF-ThlDSP4pvbouZWOIKixZnjy8L3rulza4yQ6DELkkBiY96jGe5VscsawcJts3wd6B_Ad2unrdBet6OSy8lSrZGZBMipX9knyZIpKr8fby2QjYSGylUqFmD19PuiJapBjYW8E6dyjO8PSyQqCTjnVZ0J45S701O_',
      bio: 'Elder herbal healer from Horana with documented formulas for indigenous wound balms and snakebite treatments. Lineage currently undergoing divisional Grama Niladhari corroboration.',
      language: 'Sinhala (Oral)',
      phone: '+94 34 225 ****',
      contactProxy: 'Daughter Proxy: Chandra S.',
      oralStories: 3,
      manuscripts: 8,
      trustScore: '4.70',
      ledgerHash: '3ba8821d3f95e5428a1ce7b9df210b488319e04bcfe3401fa99c2b4e7b8f94c0',
      apprentices: [],
      fieldOffice: 'Horana GN Liaison Centre',
      hubDistance: 'Hub Distance: 3.4 km'
    },
    {
      id: 'dilshan',
      code: '#LK-COL-891',
      name: 'Dilshan Perera',
      nic: '199920194820',
      role: 'DIGITAL_MODELER',
      roleTag: '3D Digital Modeler',
      tier: 'Spatial Recreator',
      specialty: 'Temple Murals & Woodcarvings',
      guild: 'Photogrammetry Guild',
      district: 'Colombo',
      hub: 'Western Urban Center',
      outputCount: '6 Spatial Renders',
      outputDetail: '4.88 Community Trust',
      status: 'BIO_ATTESTED',
      statusDisplay: 'Bio-Attested',
      statusClass: 'bg-[#f2f4f3] text-[#3f4948] border-[#dde3eb]',
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYTvIyC1fD4JHpWPS1qOJ9mjKMWCZZntBnALyjBbcKWKcZrr3ZFbjUAyQLAIMr9x9GqHBAFDWCFpePKKoFeQeu1zaXwguvi4qTeFpivXz48L_806otddTkXi0XBwXrDMvR5oymMCQGrWTi7xRK5FVrwHgDRT1nfniBRXYC5u48DYTCsMdN0pK8Lgyl9QieRjxWgmdT12sVXv3TXtenkNqf3cpOI4mnH4gRScPDdw4Jbaaln0-PBPcm',
      bio: 'Specialist in high-density LiDAR mesh recreation and texture preservation of fading Kandyan temple ceiling frescos.',
      language: 'English & Sinhala',
      phone: '+94 77 123 ****',
      contactProxy: 'Self',
      oralStories: 6,
      manuscripts: 0,
      trustScore: '4.88',
      ledgerHash: '88319e04bcfe3401fa99c2b4e7b8f94c03ba8821d3f95e5428a1ce7b9df210b4',
      apprentices: [],
      fieldOffice: 'National Museum Colombo Lab',
      hubDistance: 'Hub Distance: 0.9 km'
    }
  ]);

  selectedMember = signal<CommunityMember | null>(this.members()[0]);

  filteredMembers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.selectedCategoryTab();
    const roleDrop = this.selectedRoleDropdown();
    const districtDrop = this.selectedDistrictDropdown();
    const statusDrop = this.selectedStatusDropdown();

    return this.members().filter(m => {
      // Query filter
      const matchesQuery = !query ||
        m.name.toLowerCase().includes(query) ||
        m.nic.toLowerCase().includes(query) ||
        m.specialty.toLowerCase().includes(query) ||
        m.district.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query);

      // Tab filter
      let matchesTab = true;
      if (tab === 'ELDERS') matchesTab = m.role === 'ELDER' || m.role === 'ELDER_APPLICANT';
      else if (tab === 'YOUTH') matchesTab = m.role === 'YOUTH_ARCHIVIST' || m.role === 'FIELD_SCOUT' || m.role === 'DIGITAL_MODELER';
      else if (tab === 'PENDING') matchesTab = m.status === 'REVIEW_PENDING';
      else if (tab === 'FLAGGED') matchesTab = false; // demo 0

      // Dropdown filters
      const matchesRole = roleDrop === 'ALL' || m.role === roleDrop;
      const matchesDistrict = districtDrop === 'ALL' || m.district === districtDrop;
      const matchesStatus = statusDrop === 'ALL' || m.status === statusDrop;

      return matchesQuery && matchesTab && matchesRole && matchesDistrict && matchesStatus;
    });
  });

  constructor(private router: Router, private authService: AuthService) {}

  selectMember(member: CommunityMember): void {
    this.selectedMember.set(member);
    this.toastMessage.set(`Loaded live dossier for: ${member.name}`);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  getMemberRoleBadge(role: CommunityMember['role']): string {
    switch (role) {
      case 'ELDER': return 'bg-[#004343] text-white';
      case 'YOUTH_ARCHIVIST': return 'bg-[#fe893e]/20 text-[#672c00]';
      case 'FIELD_SCOUT': return 'bg-[#ffdbc9] text-[#763300]';
      case 'ELDER_APPLICANT': return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'DIGITAL_MODELER': return 'bg-[#f2f4f3] text-[#191c1c] border border-[#dde3eb]';
      default: return 'bg-[#f2f4f3] text-[#3f4948]';
    }
  }

  clearFilters(): void {
    this.selectedCategoryTab.set('ALL');
    this.selectedRoleDropdown.set('ALL');
    this.selectedDistrictDropdown.set('ALL');
    this.selectedStatusDropdown.set('ALL');
    this.searchQuery.set('');
    this.toastMessage.set('Filters reset to default.');
    setTimeout(() => this.toastMessage.set(null), 2000);
  }

  exportRegistry(): void {
    this.toastMessage.set('Exporting National Community & Creator Registry (CSV)...');
    setTimeout(() => {
      this.toastMessage.set('Community Registry successfully exported.');
    }, 1200);
  }

  openRegisterElderModal(): void {
    this.toastMessage.set('Opening New Elder Knowledge Keeper Registration Flow...');
  }

  openChatModal(name: string): void {
    this.toastMessage.set(`Connecting secure dispatch channel to apprentice: ${name}...`);
  }

  assignApprentice(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.toastMessage.set(`Assigning field apprentice to ${member.name}...`);
  }

  reviewConsent(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.toastMessage.set(`Opening signed consent letters and audio waivers for ${member.name}...`);
  }

  grantFastTrackAccess(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.toastMessage.set(`Fast-track ingestion token issued for ${member.name}. Priority bandwidth allocated.`);
  }

  restrictRegistryAccess(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.toastMessage.set(`Access status for ${member.name} flagged for review.`);
  }
}

