import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface ClearanceDelegation {
  title: string;
  scope: string;
  status: string;
  icon: string;
  badgeClass: string;
}

export interface CustodianAdmin {
  id: string;
  name: string;
  title: string;
  email: string;
  nic: string;
  badgeId: string;
  clearanceLevel: number;
  clearanceLevelName: string;
  roleBadgeClass: string;
  hub: string;
  tokenType: string;
  tokenStatus: string;
  tokenIcon: string;
  tokenIconClass: string;
  activityText: string;
  sessionNode: string;
  sessionIp: string;
  sessionDuration: string;
  tlsHandshake: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'RESTRICTED';
  statusBadgeClass: string;
  initials: string;
  avatarBg: string;
  keycardId: string;
  delegations: ClearanceDelegation[];
}

export interface AuditStreamEvent {
  id: string;
  title: string;
  details: string;
  timeAgo: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  blockHash: string;
}

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#004343]/20 selection:text-[#004343]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">verified_user</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Reusable Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navbar Header -->
        <app-header 
          pageTitle="Admin & Access Governance" 
          section="Administration"
          searchPlaceholder="Search admins, NIC, node IP..."
          [searchQuery]="searchQuery()"
          (searchQueryChange)="searchQuery.set($event)">
          <div class="flex items-center gap-2">
            <button (click)="exportAuditLog()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] hover:border-[#004343]/40 transition-all shadow-sm">
              <span class="material-symbols-outlined text-base text-[#004343]">download</span>
              <span class="hidden sm:inline">Export Audit</span>
            </button>

            <button (click)="openOneTimeKeyModal()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] hover:border-[#9b4600]/40 transition-all shadow-sm">
              <span class="material-symbols-outlined text-base text-[#9b4600]">key</span>
              <span class="hidden sm:inline">One-Time Key</span>
            </button>

            <button (click)="openGrantModal()"
                    class="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#004343] hover:bg-[#003131] text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-[#004343]/20">
              <span class="material-symbols-outlined text-base">person_add</span>
              <span>Grant Admin</span>
            </button>
          </div>
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Page Header Banner -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-xl font-serif font-bold text-[#191c1c]">Admin & Access Governance</h1>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#004343]/10 text-[#004343] border border-[#004343]/20">
                  Tier-IV HSM
                </span>
              </div>
              <p class="text-xs text-[#6e7978]">
                Department of Cultural Authentication, Audit Protocol V-4.1 • Sovereign Cloud Governance
              </p>
            </div>
            
            <div class="flex items-center gap-2.5">
              <button (click)="exportAuditLog()"
                      class="flex items-center gap-1.5 px-3.5 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-white hover:border-[#004343]/40 transition-all shadow-sm">
                <span class="material-symbols-outlined text-base text-[#004343]">download</span>
                <span>Export Audit Log</span>
              </button>

              <button (click)="openOneTimeKeyModal()"
                      class="flex items-center gap-1.5 px-3.5 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-white hover:border-[#9b4600]/40 transition-all shadow-sm">
                <span class="material-symbols-outlined text-base text-[#9b4600]">key</span>
                <span>Generate Key</span>
              </button>

              <button (click)="openGrantModal()"
                      class="flex items-center gap-1.5 px-4 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-[#004343]/20">
                <span class="material-symbols-outlined text-base">person_add</span>
                <span>Grant New Admin</span>
              </button>
            </div>
          </div>
          
          <!-- Telemetry Metrics Cards (4 items) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- Metric 1: Total Active Staff -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">Total Active Staff</span>
                <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">badge</span>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-serif font-bold text-[#191c1c]">42 Staff</span>
                <span class="text-[11px] font-bold text-emerald-700">+3 this month</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-[#f2f4f7] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#004343] h-full rounded-full w-[84%]"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-[#6e7978] mt-1.5 font-medium">
                  <span>100% 2FA Enforced</span>
                  <span>Cap: 50 Max</span>
                </div>
              </div>
            </div>

            <!-- Metric 2: Pending Approvals -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">Pending Approvals</span>
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">pending_actions</span>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-serif font-bold text-[#9b4600]">4 Invites</span>
                <span class="text-[11px] font-bold text-amber-700">2 Expiring Soon</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-[#f2f4f7] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full w-[45%]"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-[#6e7978] mt-1.5 font-medium">
                  <span>Avg turnaround: 14h</span>
                  <span>Quorum Required</span>
                </div>
              </div>
            </div>

            <!-- Metric 3: Clearance Tiers -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">Clearance Tiers</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">shield_with_heart</span>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-serif font-bold text-[#191c1c]">3 Tiers</span>
                <span class="text-[11px] font-bold text-[#004343]">Tier IV Sovereign</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-[#f2f4f7] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full w-[70%]"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-[#6e7978] mt-1.5 font-medium">
                  <span>3 Super • 14 Curators</span>
                  <span>25 Field Leads</span>
                </div>
              </div>
            </div>

            <!-- Metric 4: Hardware Key Integrity -->
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">Hardware Key Integrity</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">token</span>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-serif font-bold text-emerald-700">18 Sessions</span>
                <span class="text-[11px] font-bold text-emerald-600">0 Anomalies</span>
              </div>
              <div class="mt-3">
                <div class="w-full bg-[#f2f4f7] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full w-[95%]"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-[#6e7978] mt-1.5 font-medium">
                  <span>12 FIDO2 • 6 SmartID</span>
                  <span>PKI Active</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Controls Bar (Search, Tier Filter, Hub Filter, Status Filter & View Toggle) -->
          <div class="bg-white p-4 rounded-2xl border border-[#dde3eb] shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
            
            <div class="relative w-full lg:w-96">
              <span class="material-symbols-outlined absolute left-3.5 top-2.5 text-[#6e7978] text-lg">search</span>
              <input type="text"
                     [ngModel]="searchQuery()"
                     (ngModelChange)="searchQuery.set($event)"
                     placeholder="Search by name, NIC, email, or badge ID..."
                     class="w-full text-xs pl-10 pr-4 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors" />
            </div>

            <div class="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <!-- Tier Filter -->
              <select [ngModel]="selectedTierFilter()"
                      (ngModelChange)="selectedTierFilter.set($event)"
                      class="text-xs font-semibold px-3 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors">
                <option value="ALL">All Clearance Tiers</option>
                <option value="4">Level 4 (Super Overseer)</option>
                <option value="3">Level 3 (Senior Curator)</option>
                <option value="2">Level 2 (Field Lead / Curator)</option>
                <option value="1">Level 1 (Field Moderator)</option>
                <option value="COUNSEL">Auditing Counsel</option>
              </select>

              <!-- Jurisdiction Hub Filter -->
              <select [ngModel]="selectedHubFilter()"
                      (ngModelChange)="selectedHubFilter.set($event)"
                      class="text-xs font-semibold px-3 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors">
                <option value="ALL">All Jurisdictions</option>
                <option value="Western">Western Province (Colombo HQ)</option>
                <option value="Central">Central Province (Kandy Vault)</option>
                <option value="Southern">Southern Province (Galle Maritime)</option>
                <option value="Northern">Northern Province (Jaffna Archives)</option>
                <option value="Eastern">Eastern Province (Batticaloa Node)</option>
              </select>

              <!-- Status Filter -->
              <select [ngModel]="selectedStatusFilter()"
                      (ngModelChange)="selectedStatusFilter.set($event)"
                      class="text-xs font-semibold px-3 py-2 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors">
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending Activation</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="RESTRICTED">Restricted</option>
              </select>

              <!-- View Mode Switch -->
              <div class="flex items-center bg-[#f2f4f7] p-1 rounded-xl border border-[#dde3eb]">
                <button (click)="viewMode.set('list')"
                        [ngClass]="viewMode() === 'list' ? 'bg-white text-[#004343] shadow-sm font-bold' : 'text-[#6e7978]'"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all">
                  <span class="material-symbols-outlined text-sm">view_list</span>
                  <span>Directory</span>
                </button>
                <button (click)="viewMode.set('matrix')"
                        [ngClass]="viewMode() === 'matrix' ? 'bg-white text-[#004343] shadow-sm font-bold' : 'text-[#6e7978]'"
                        class="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all">
                  <span class="material-symbols-outlined text-sm">grid_view</span>
                  <span>Matrix</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Split View Layout: Left Column (8 Cols) & Right Column (4 Cols Sticky Inspector) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- LEFT COLUMN (8 Cols): Institutional Custodians Directory Table -->
            <div class="lg:col-span-8 space-y-4">
              <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden">
                
                <div class="p-4 border-b border-[#dde3eb] bg-[#f8faf9] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg text-[#004343]">account_tree</span>
                    <h2 class="text-sm font-serif font-bold text-[#191c1c]">Institutional Custodians Roster</h2>
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#004343]/10 text-[#004343]">
                      {{ filteredCustodians().length }} Active Keys
                    </span>
                  </div>
                  <span class="text-xs text-[#6e7978]">Click row to inspect live HSM security parameters</span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-[#f8faf9] border-b border-[#dde3eb] text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">
                      <tr>
                        <th class="px-5 py-3.5">Administrator</th>
                        <th class="px-4 py-3.5">Clearance & Role</th>
                        <th class="px-4 py-3.5">Jurisdiction Hub</th>
                        <th class="px-4 py-3.5">Security Token</th>
                        <th class="px-4 py-3.5">Activity</th>
                        <th class="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#dde3eb]">
                      @for (custodian of filteredCustodians(); track custodian.id) {
                        <tr (click)="selectCustodian(custodian)"
                            [ngClass]="selectedCustodian()?.id === custodian.id ? 'bg-[#004343]/5 border-l-4 border-l-[#004343]' : 'hover:bg-[#f8faf9]/80'"
                            class="cursor-pointer transition-colors">
                          
                          <!-- Admin Info -->
                          <td class="px-5 py-4">
                            <div class="flex items-center gap-3">
                              <div [ngClass]="custodian.avatarBg" class="w-10 h-10 rounded-xl text-white font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {{ custodian.initials }}
                              </div>
                              <div>
                                <div class="font-bold text-[#191c1c] text-xs flex items-center gap-1.5">
                                  {{ custodian.name }}
                                  @if (custodian.clearanceLevel === 4) {
                                    <span class="material-symbols-outlined text-amber-600 text-sm" title="Tier-IV Super Overseer">workspace_premium</span>
                                  }
                                </div>
                                <div class="text-[10px] text-[#6e7978] font-mono mt-0.5">
                                  {{ custodian.email }}
                                </div>
                                <div class="text-[9px] text-[#6e7978] font-mono">
                                  NIC: {{ custodian.nic }} • {{ custodian.badgeId }}
                                </div>
                              </div>
                            </div>
                          </td>

                          <!-- Clearance & Role -->
                          <td class="px-4 py-4">
                            <div class="space-y-1">
                              <span [ngClass]="custodian.roleBadgeClass" class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border">
                                {{ custodian.clearanceLevelName }}
                              </span>
                              <div class="text-[10px] text-[#3e4948] font-medium">{{ custodian.title }}</div>
                            </div>
                          </td>

                          <!-- Jurisdiction Hub -->
                          <td class="px-4 py-4">
                            <div class="text-xs font-semibold text-[#191c1c] flex items-center gap-1">
                              <span class="material-symbols-outlined text-xs text-[#004343]">location_city</span>
                              {{ custodian.hub }}
                            </div>
                            <div class="text-[10px] text-[#6e7978]">Provincial Node Enclave</div>
                          </td>

                          <!-- Security Token -->
                          <td class="px-4 py-4">
                            <div class="flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-xs" [ngClass]="custodian.tokenIconClass">
                                {{ custodian.tokenIcon }}
                              </span>
                              <span class="text-xs font-semibold text-[#3e4948]">{{ custodian.tokenType }}</span>
                            </div>
                            <div class="text-[10px] text-emerald-700 font-mono">{{ custodian.tokenStatus }}</div>
                          </td>

                          <!-- Activity & Status -->
                          <td class="px-4 py-4">
                            <div class="flex items-center gap-1.5">
                              @if (custodian.status === 'ACTIVE') {
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span class="text-xs font-bold text-emerald-800">Active</span>
                              } @else if (custodian.status === 'PENDING') {
                                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span class="text-xs font-bold text-amber-800">Pending</span>
                              } @else {
                                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                                <span class="text-xs font-bold text-red-800">Suspended</span>
                              }
                            </div>
                            <div class="text-[10px] text-[#6e7978] font-mono mt-0.5">{{ custodian.activityText }}</div>
                          </td>

                          <!-- Actions -->
                          <td class="px-5 py-4 text-right" (click)="$event.stopPropagation()">
                            <div class="flex items-center justify-end gap-1">
                              <button (click)="selectCustodian(custodian)"
                                      title="Inspect Cryptographic Key"
                                      class="p-1.5 text-[#6e7978] hover:text-[#004343] hover:bg-[#f2f4f7] rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-base">visibility</span>
                              </button>
                              
                              <button (click)="rotateCustodianKey(custodian)"
                                      title="Rotate Keycard"
                                      class="p-1.5 text-[#6e7978] hover:text-[#9b4600] hover:bg-amber-50 rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-base">vpn_key</span>
                              </button>
                              
                              <button (click)="toggleCustodianLock(custodian)"
                                      [title]="custodian.status === 'ACTIVE' ? 'Lock Access' : 'Unlock Access'"
                                      class="p-1.5 text-[#6e7978] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                <span class="material-symbols-outlined text-base">{{ custodian.status === 'ACTIVE' ? 'lock' : 'lock_open' }}</span>
                              </button>
                            </div>
                          </td>

                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Table Footer -->
                <div class="p-4 bg-[#f8faf9] border-t border-[#dde3eb] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6e7978]">
                  <span>Showing {{ filteredCustodians().length }} of {{ custodians().length }} institutional administrators</span>
                  <div class="flex items-center gap-3">
                    <span class="text-[10px] font-mono font-bold text-[#004343] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      PKI Integrity: 100% OK
                    </span>
                    <button (click)="refreshRoster()" class="hover:text-[#004343] font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">refresh</span>
                      Sync Roster
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- RIGHT COLUMN (4 Cols - Sticky Selected Custodian Inspector Drawer) -->
            <div class="lg:col-span-4 space-y-4">
              @if (selectedCustodian(); as sel) {
                <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-sm space-y-5 sticky top-4">
                  
                  <!-- Selected Custodian Profile Header -->
                  <div class="flex items-start justify-between pb-4 border-b border-[#dde3eb]">
                    <div class="flex items-center gap-3.5">
                      <div [ngClass]="sel.avatarBg" class="w-12 h-12 rounded-2xl text-white font-serif font-bold text-lg flex items-center justify-center shadow-md">
                        {{ sel.initials }}
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <h3 class="text-sm font-bold text-[#191c1c]">{{ sel.name }}</h3>
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <p class="text-[11px] text-[#6e7978]">{{ sel.title }}</p>
                        <div class="text-[10px] font-mono text-[#004343] mt-0.5">ID: {{ sel.badgeId }}</div>
                      </div>
                    </div>
                    <span [ngClass]="sel.statusBadgeClass" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border">
                      {{ sel.status }}
                    </span>
                  </div>

                  <!-- Active Terminal & Live Session Card -->
                  <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-[10px] uppercase font-bold text-[#6e7978] tracking-wider">Active Terminal Node</span>
                      <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        {{ sel.tlsHandshake }}
                      </span>
                    </div>
                    <div class="text-xs font-bold text-[#191c1c] flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[#004343] text-sm">terminal</span>
                      {{ sel.sessionNode }}
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-[#6e7978] font-mono pt-1 border-t border-[#dde3eb]/60">
                      <span>IP: {{ sel.sessionIp }}</span>
                      <span>{{ sel.sessionDuration }}</span>
                    </div>
                  </div>

                  <!-- Granular Clearance Matrix / Cryptographic Delegations -->
                  <div>
                    <div class="flex items-center justify-between mb-2.5">
                      <span class="text-[11px] uppercase font-bold text-[#6e7978] tracking-wider">Cryptographic Delegations</span>
                      <span class="text-[10px] font-bold text-[#004343]">Level {{ sel.clearanceLevel }} Scope</span>
                    </div>
                    <div class="space-y-2">
                      @for (del of sel.delegations; track del.title) {
                        <div class="p-2.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between">
                          <div class="flex items-center gap-2.5">
                            <span class="material-symbols-outlined text-[#004343] text-base">{{ del.icon }}</span>
                            <div>
                              <div class="text-[11px] font-bold text-[#191c1c]">{{ del.title }}</div>
                              <div class="text-[9px] text-[#6e7978]">{{ del.scope }}</div>
                            </div>
                          </div>
                          <span [ngClass]="del.badgeClass" class="text-[9px] font-bold px-2 py-0.5 rounded-full border">
                            {{ del.status }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Security Keycard Management Widget -->
                  <div class="p-3.5 rounded-xl bg-[#191c1c] text-white space-y-3 shadow-inner">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span class="material-symbols-outlined text-sm">credit_card</span>
                        <span>Keycard Serial ID</span>
                      </div>
                      <button (click)="copyKeyFingerprint(sel.keycardId)" class="text-[10px] text-emerald-300 hover:underline flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    </div>

                    <div class="font-mono text-[10px] text-emerald-300 bg-black/40 p-2.5 rounded-lg border border-emerald-900/40 break-all select-all">
                      {{ sel.keycardId }}
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1">
                      <button (click)="rotateCustodianKey(sel)"
                              class="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-sm text-amber-400">sync</span>
                        <span>Rotate Key</span>
                      </button>

                      <button (click)="toggleCustodianLock(sel)"
                              [ngClass]="sel.status === 'ACTIVE' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'"
                              class="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-sm">{{ sel.status === 'ACTIVE' ? 'lock' : 'lock_open' }}</span>
                        <span>{{ sel.status === 'ACTIVE' ? 'Lock Access' : 'Unlock' }}</span>
                      </button>
                    </div>
                  </div>

                  <!-- Immutable Activity Log Link -->
                  <div class="pt-2 text-center">
                    <button (click)="viewCustodianHistory(sel)" class="text-xs font-bold text-[#004343] hover:underline flex items-center justify-center gap-1 mx-auto">
                      <span class="material-symbols-outlined text-sm">history</span>
                      <span>View Immutable Activity Log</span>
                    </button>
                  </div>

                </div>
              }
            </div>

          </div>

          <!-- Live Cryptographic Audit Trail Stream (Bottom Section) -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#dde3eb]">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-xl">security</span>
                </div>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Live Cryptographic Audit Trail Stream</h3>
                  <p class="text-xs text-[#6e7978]">Synchronized Block #1,894,204 • 3 State Replicas Validated</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Stream Connected
                </span>
                <button (click)="exportAuditLog()" class="text-xs font-bold text-[#004343] hover:underline flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">open_in_new</span>
                  Audit Registry
                </button>
              </div>
            </div>

            <!-- 3 Event Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              @for (evt of auditEvents(); track evt.id) {
                <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:border-[#004343]/30 transition-all flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div [ngClass]="[evt.iconBg, evt.iconColor]" class="w-7 h-7 rounded-lg flex items-center justify-center">
                          <span class="material-symbols-outlined text-sm">{{ evt.icon }}</span>
                        </div>
                        <span class="text-xs font-bold text-[#191c1c]">{{ evt.title }}</span>
                      </div>
                      <span class="text-[10px] text-[#6e7978] font-mono">{{ evt.timeAgo }}</span>
                    </div>
                    <p class="text-xs text-[#3e4948] leading-relaxed">{{ evt.details }}</p>
                  </div>
                  <div class="mt-3 pt-2.5 border-t border-[#dde3eb]/60 flex items-center justify-between text-[10px] font-mono text-[#6e7978]">
                    <span>Block: {{ evt.blockHash }}</span>
                    <span class="text-emerald-700 font-bold">SHA-256 Valid</span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>

      </main>

      <!-- Grant New Administrator Modal -->
      @if (showGrantModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#dde3eb] overflow-hidden animate-in fade-in zoom-in duration-150">
            
            <div class="p-6 border-b border-[#dde3eb] flex items-center justify-between bg-[#f8faf9]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl">person_add</span>
                </div>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Grant New Administrator</h3>
                  <p class="text-xs text-[#6e7978]">Provision cryptographic identity and clearance mandate</p>
                </div>
              </div>
              <button (click)="closeGrantModal()" class="text-[#6e7978] hover:text-[#191c1c] text-lg font-bold">✕</button>
            </div>

            <form (ngSubmit)="submitGrantAdministrator()" class="p-6 space-y-4 text-xs">
              
              <div>
                <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Full Legal Name</label>
                <input type="text"
                       [(ngModel)]="newAdminForm.fullName"
                       name="fullName"
                       required
                       placeholder="e.g. Dr. Priyantha Dissanayake"
                       class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">NIC / Passport Number</label>
                  <input type="text"
                         [(ngModel)]="newAdminForm.nic"
                         name="nic"
                         required
                         placeholder="198012300456V"
                         class="w-full font-mono px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Staff / Badge ID</label>
                  <input type="text"
                         [(ngModel)]="newAdminForm.badgeId"
                         name="badgeId"
                         required
                         placeholder="CUST-LK-2026-99"
                         class="w-full font-mono px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
              </div>

              <div>
                <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Institutional Email</label>
                <input type="email"
                       [(ngModel)]="newAdminForm.email"
                       name="email"
                       required
                       placeholder="name@heritage.gov.lk"
                       class="w-full font-mono px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Clearance Tier</label>
                  <select [(ngModel)]="newAdminForm.clearanceLevel"
                          name="clearanceLevel"
                          class="w-full font-semibold px-3 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]">
                    <option [ngValue]="4">Level 4 (Super Overseer)</option>
                    <option [ngValue]="3">Level 3 (Senior Curator)</option>
                    <option [ngValue]="2">Level 2 (Field Lead)</option>
                    <option [ngValue]="1">Level 1 (Field Moderator)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Jurisdiction Hub</label>
                  <select [(ngModel)]="newAdminForm.hub"
                          name="hub"
                          class="w-full font-semibold px-3 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]">
                    <option value="Western & Central Hub (Colombo HQ)">Western & Central Hub (Colombo HQ)</option>
                    <option value="Central Province (Kandy Vault)">Central Province (Kandy Vault)</option>
                    <option value="Northern Province (Jaffna Archives)">Northern Province (Jaffna Archives)</option>
                    <option value="Southern Province (Galle Maritime)">Southern Province (Galle Maritime)</option>
                    <option value="Eastern Province (Batticaloa Node)">Eastern Province (Batticaloa Node)</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">2FA Security Token Requirement</label>
                <select [(ngModel)]="newAdminForm.mfaRequirement"
                        name="mfaRequirement"
                        class="w-full font-semibold px-3 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]">
                  <option value="FIDO2">FIDO2 Hardware Keycard (Mandatory for L3 & L4)</option>
                  <option value="GovPKI">GovPKI SmartID Card</option>
                  <option value="Passkey">Biometric TouchID / FaceID Passkey</option>
                </select>
              </div>

              <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                <input type="checkbox" id="enclaveToken" [(ngModel)]="newAdminForm.issueEnclaveToken" name="issueEnclaveToken" class="mt-0.5 rounded text-[#004343] focus:ring-[#004343]">
                <label for="enclaveToken" class="text-[11px] text-emerald-950 font-medium">
                  Issue Hardware Enclave Token & generate initial SHA-256 curatorial key pair immediately upon registration.
                </label>
              </div>

              <div class="pt-3 border-t border-[#dde3eb] flex items-center justify-end gap-3">
                <button type="button" (click)="closeGrantModal()" class="px-4 py-2 bg-white border border-[#c2c8c7] rounded-xl font-semibold text-[#3e4948] hover:bg-[#f2f4f7]">
                  Cancel
                </button>
                <button type="submit" class="px-5 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm shadow-[#004343]/20">
                  <span class="material-symbols-outlined text-sm">vpn_key</span>
                  <span>Cryptographically Issue Grant</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      }

    </div>
  `,
  styles: []
})
export class AdminManagementComponent {
  
  // View mode
  viewMode = signal<'list' | 'matrix'>('list');
  
  // Search & Filters
  searchQuery = signal<string>('');
  selectedTierFilter = signal<string>('ALL');
  selectedHubFilter = signal<string>('ALL');
  selectedStatusFilter = signal<string>('ALL');

  // Toast
  toastMessage = signal<string | null>(null);

  // Modal toggle
  showGrantModal = signal<boolean>(false);

  // Form for new admin
  newAdminForm = {
    fullName: '',
    nic: '',
    badgeId: '',
    email: '',
    clearanceLevel: 2,
    hub: 'Western & Central Hub (Colombo HQ)',
    mfaRequirement: 'FIDO2',
    issueEnclaveToken: true
  };

  // Custodians Directory Data
  custodians = signal<CustodianAdmin[]>([
    {
      id: 'cust-01',
      name: 'Dr. Samantha Senanayake',
      title: 'Senior Curatorial Lead • Curatorial Council Chair',
      email: 'samantha.s@heritage.gov.lk',
      nic: '197884200192V',
      badgeId: 'CUST-LK-9042',
      clearanceLevel: 4,
      clearanceLevelName: 'Level 4 Super Overseer',
      roleBadgeClass: 'bg-[#9b4600]/10 text-[#9b4600] border-[#9b4600]/20',
      hub: 'Western & Central Hub',
      tokenType: 'FIDO2 YubiKey 5C',
      tokenStatus: 'SHA-256 Valid',
      tokenIcon: 'usb',
      tokenIconClass: 'text-emerald-600',
      activityText: 'Active Now (Col-04)',
      sessionNode: 'Colombo Core Vault Node #04',
      sessionIp: '192.248.32.14',
      sessionDuration: 'Live 4h 12m',
      tlsHandshake: 'TLS 1.3 SECP384R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: 'SS',
      avatarBg: 'bg-teal-800',
      keycardId: 'LK-GOV-9042-AUTH-SHA256-4096-PROV-WEST',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'Tier IV Sole Authority', status: 'Full Grant', icon: 'lock', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Unrestricted Lineage Signoff', status: 'Sovereign', icon: 'record_voice_over', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Cultural Map Cartography', scope: 'All 9 Provinces Signatory', status: 'Active', icon: 'map', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'State Quorum Signatory', status: 'Active', icon: 'verified', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      ]
    },
    {
      id: 'cust-02',
      name: 'Master Ananda Karunaratne',
      title: 'Senior Curator • Rare Manuscripts & Epigraphy',
      email: 'ananda.k@heritage.gov.lk',
      nic: '196521900341V',
      badgeId: 'CUST-LK-8119',
      clearanceLevel: 3,
      clearanceLevelName: 'Level 3 Senior Curator',
      roleBadgeClass: 'bg-[#004343]/10 text-[#004343] border-[#004343]/20',
      hub: 'Central Province (Kandy)',
      tokenType: 'FIDO2 YubiKey 5C',
      tokenStatus: 'Verified HSM',
      tokenIcon: 'usb',
      tokenIconClass: 'text-emerald-600',
      activityText: '24m ago (Kdy-01)',
      sessionNode: 'Kandy Heritage Vault Node #01',
      sessionIp: '192.248.88.22',
      sessionDuration: 'Active 1h 45m',
      tlsHandshake: 'TLS 1.3 SECP384R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: 'AK',
      avatarBg: 'bg-amber-900',
      keycardId: 'LK-GOV-8119-CUR-SHA256-4096-PROV-CNTR',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'Kandy & Matale Vault Read', status: 'Read Only', icon: 'lock', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Central Highland Lineages', status: 'Active', icon: 'record_voice_over', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Cultural Map Cartography', scope: 'Central & Uva Provinces', status: 'Active', icon: 'map', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'Highland Division', status: 'Quorum Sign', icon: 'verified', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' }
      ]
    },
    {
      id: 'cust-03',
      name: 'Fathima Rizwana',
      title: 'Field Ingestion Lead • Maritime & Eastern Heritage',
      email: 'fathima.r@heritage.gov.lk',
      nic: '198864100812V',
      badgeId: 'CUST-LK-7301',
      clearanceLevel: 2,
      clearanceLevelName: 'Level 2 Field Lead',
      roleBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      hub: 'Eastern & Northern Zone',
      tokenType: 'GovPKI SmartID',
      tokenStatus: 'Cert Active',
      tokenIcon: 'badge',
      tokenIconClass: 'text-indigo-600',
      activityText: '2h ago (Bti-02)',
      sessionNode: 'Batticaloa Heritage Node #02',
      sessionIp: '192.248.95.10',
      sessionDuration: 'Disconnected',
      tlsHandshake: 'TLS 1.3 SECP256R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: 'FR',
      avatarBg: 'bg-emerald-800',
      keycardId: 'LK-GOV-7301-FLD-SHA256-2048-PROV-EAST',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'Access Restricted', status: 'Restricted', icon: 'lock', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Eastern Coastal Lineages', status: 'Active', icon: 'record_voice_over', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Cultural Map Cartography', scope: 'Eastern Maritime Grid', status: 'Active', icon: 'map', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'Field Witness Only', status: 'Witness', icon: 'verified', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' }
      ]
    },
    {
      id: 'cust-04',
      name: 'K. Tharmarajah',
      title: 'Lead Curator • Epigraphy & Northern Inscriptions',
      email: 'tharmarajah.k@heritage.gov.lk',
      nic: '197210900452V',
      badgeId: 'CUST-LK-6490',
      clearanceLevel: 2,
      clearanceLevelName: 'Level 2 Lead Curator',
      roleBadgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      hub: 'Northern Province (Jaffna)',
      tokenType: 'TouchID Passkey',
      tokenStatus: 'Biometric OK',
      tokenIcon: 'fingerprint',
      tokenIconClass: 'text-indigo-600',
      activityText: '5h ago (Jaf-03)',
      sessionNode: 'Jaffna Archives Terminal #03',
      sessionIp: '192.248.112.5',
      sessionDuration: 'Disconnected',
      tlsHandshake: 'TLS 1.3 SECP384R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: 'KT',
      avatarBg: 'bg-indigo-900',
      keycardId: 'LK-GOV-6490-ARC-SHA256-4096-PROV-NTH',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'Northern Epigraphy Vault', status: 'Vault Lead', icon: 'lock', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Northern Tamil Lineages', status: 'Active', icon: 'record_voice_over', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Cultural Map Cartography', scope: 'Northern Province Grid', status: 'Active', icon: 'map', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'District Signatory', status: 'Active', icon: 'verified', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      ]
    },
    {
      id: 'cust-05',
      name: 'Tharushi Jayawardena',
      title: 'Field Moderator • Community Submissions Review',
      email: 'tharushi.j@heritage.gov.lk',
      nic: '199571200981V',
      badgeId: 'CUST-LK-5210',
      clearanceLevel: 1,
      clearanceLevelName: 'Level 1 Field Moderator',
      roleBadgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      hub: 'Southern Province (Galle)',
      tokenType: 'SMS + Authenticator',
      tokenStatus: 'Upgrade Required',
      tokenIcon: 'smartphone',
      tokenIconClass: 'text-amber-600',
      activityText: '1d ago',
      sessionNode: 'Galle Maritime Center #01',
      sessionIp: '192.248.74.8',
      sessionDuration: 'Offline',
      tlsHandshake: 'TLS 1.2 RSA2048',
      status: 'PENDING',
      statusBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      initials: 'TJ',
      avatarBg: 'bg-rose-900',
      keycardId: 'LK-GOV-5210-MOD-SHA256-2048-PROV-STH',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'No Authority', status: 'Restricted', icon: 'lock', badgeClass: 'bg-red-100 text-red-800 border-red-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Queue Review Only', status: 'Reviewer', icon: 'record_voice_over', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
        { title: 'Cultural Map Cartography', scope: 'Southern Heritage Points', status: 'Read/Submit', icon: 'map', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'No Signatory Authority', status: 'None', icon: 'verified', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' }
      ]
    },
    {
      id: 'cust-06',
      name: 'Niluka Bandara',
      title: 'Auditing Counsel • Legal & Statutory Compliance',
      email: 'niluka.b@heritage.gov.lk',
      nic: '198214500673V',
      badgeId: 'CUST-LK-4180',
      clearanceLevel: 3,
      clearanceLevelName: 'Auditing Counsel',
      roleBadgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
      hub: 'Western Province (Legal)',
      tokenType: 'FIDO2 YubiKey 5C',
      tokenStatus: 'SHA-256 Valid',
      tokenIcon: 'usb',
      tokenIconClass: 'text-emerald-600',
      activityText: '3d ago',
      sessionNode: 'Ministry Legal Enclave #02',
      sessionIp: '192.248.33.91',
      sessionDuration: 'Offline',
      tlsHandshake: 'TLS 1.3 SECP384R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: 'NB',
      avatarBg: 'bg-slate-800',
      keycardId: 'LK-GOV-4180-LGL-SHA256-4096-PROV-WEST',
      delegations: [
        { title: 'Archive Cold Vault & Purge', scope: 'Audit Log Read Compliance', status: 'Auditor', icon: 'lock', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
        { title: 'Elder Oral History Ingestion', scope: 'Statutory Ethics Audit', status: 'Auditor', icon: 'record_voice_over', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
        { title: 'Cultural Map Cartography', scope: 'Legal Territory Oversight', status: 'Full Audit', icon: 'map', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
        { title: 'Grama Niladhari Accreditation', scope: 'Gazette & State Review', status: 'Legal Review', icon: 'verified', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' }
      ]
    }
  ]);

  // Selected Custodian for right drawer
  selectedCustodian = signal<CustodianAdmin | null>(this.custodians()[0]);

  // Filtered custodians
  filteredCustodians = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tier = this.selectedTierFilter();
    const hub = this.selectedHubFilter();
    const status = this.selectedStatusFilter();

    return this.custodians().filter(c => {
      const matchesSearch = !query || 
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.nic.toLowerCase().includes(query) ||
        c.badgeId.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query);

      let matchesTier = true;
      if (tier === '4') matchesTier = c.clearanceLevel === 4;
      else if (tier === '3') matchesTier = c.clearanceLevel === 3 && !c.clearanceLevelName.includes('Counsel');
      else if (tier === '2') matchesTier = c.clearanceLevel === 2;
      else if (tier === '1') matchesTier = c.clearanceLevel === 1;
      else if (tier === 'COUNSEL') matchesTier = c.clearanceLevelName.includes('Counsel');

      const matchesHub = hub === 'ALL' || c.hub.toLowerCase().includes(hub.toLowerCase());
      const matchesStatus = status === 'ALL' || c.status === status;

      return matchesSearch && matchesTier && matchesHub && matchesStatus;
    });
  });

  // Audit Events Stream
  auditEvents = signal<AuditStreamEvent[]>([
    {
      id: 'aud-01',
      title: 'Elder Lineage Credential Approved',
      details: 'Dr. Samantha Senanayake ratified sacred lineage #LK-8821 via Level 4 curatorial key. 2-of-3 quorum validated.',
      timeAgo: '4m ago',
      icon: 'verified_user',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-800',
      blockHash: '0x8f2a...c910'
    },
    {
      id: 'aud-02',
      title: 'One-Time Hardware Token Generated',
      details: 'Master Ananda Karunaratne issued an ephemeral passkey for Jaffna branch archival digitization batch #4402.',
      timeAgo: '18m ago',
      icon: 'vpn_key',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-800',
      blockHash: '0x4e1c...10a9'
    },
    {
      id: 'aud-03',
      title: 'Sacred Boundary Re-anchored',
      details: 'Fathima Rizwana re-attested Anuradhapura Sacred Quadrilateral polygon boundary in Cultural Map Cartography.',
      timeAgo: '1h ago',
      icon: 'map',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-800',
      blockHash: '0x71ba...bb52'
    }
  ]);

  // Actions
  selectCustodian(custodian: CustodianAdmin) {
    this.selectedCustodian.set(custodian);
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  triggerHsmTelemetry() {
    this.showToast('Master HSM Telemetry: Latency 1.2ms, Zero Hardware Errors, All 3 Enclaves Healthy.');
  }

  exportAuditLog() {
    this.showToast('Compiling immutable audit log (SHA-256 signed CSV). Download will initiate shortly.');
  }

  openOneTimeKeyModal() {
    const key = 'OTK-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);
    this.showToast(`Generated One-Time Emergency Access Key: ${key} (Valid for 15 minutes).`);
  }

  openGrantModal() {
    this.showGrantModal.set(true);
  }

  closeGrantModal() {
    this.showGrantModal.set(false);
  }

  submitGrantAdministrator() {
    if (!this.newAdminForm.fullName || !this.newAdminForm.email || !this.newAdminForm.nic) {
      alert('Please fill in all required fields.');
      return;
    }

    const initials = this.newAdminForm.fullName
      .split(' ')
      .filter(n => n.length > 0)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');

    const newAdmin: CustodianAdmin = {
      id: 'cust-' + (this.custodians().length + 1).toString().padStart(2, '0'),
      name: this.newAdminForm.fullName,
      title: this.newAdminForm.clearanceLevel === 4 ? 'Super Overseer' : this.newAdminForm.clearanceLevel === 3 ? 'Senior Curator' : this.newAdminForm.clearanceLevel === 2 ? 'Field Lead' : 'Field Moderator',
      email: this.newAdminForm.email,
      nic: this.newAdminForm.nic,
      badgeId: this.newAdminForm.badgeId || `CUST-LK-${Math.floor(1000 + Math.random() * 9000)}`,
      clearanceLevel: this.newAdminForm.clearanceLevel,
      clearanceLevelName: `Level ${this.newAdminForm.clearanceLevel} ${this.newAdminForm.clearanceLevel === 4 ? 'Super Overseer' : this.newAdminForm.clearanceLevel === 3 ? 'Senior Curator' : this.newAdminForm.clearanceLevel === 2 ? 'Field Lead' : 'Field Moderator'}`,
      roleBadgeClass: this.newAdminForm.clearanceLevel === 4 ? 'bg-[#9b4600]/10 text-[#9b4600] border-[#9b4600]/20' : 'bg-[#004343]/10 text-[#004343] border-[#004343]/20',
      hub: this.newAdminForm.hub,
      tokenType: this.newAdminForm.mfaRequirement === 'FIDO2' ? 'FIDO2 YubiKey 5C' : this.newAdminForm.mfaRequirement === 'GovPKI' ? 'GovPKI SmartID' : 'TouchID Passkey',
      tokenStatus: 'Issued & Enrolled',
      tokenIcon: this.newAdminForm.mfaRequirement === 'FIDO2' ? 'usb' : this.newAdminForm.mfaRequirement === 'GovPKI' ? 'badge' : 'fingerprint',
      tokenIconClass: 'text-emerald-600',
      activityText: 'Just Enrolled',
      sessionNode: `${this.newAdminForm.hub.split(' ')[0]} Node #01`,
      sessionIp: '192.248.' + Math.floor(10 + Math.random() * 80) + '.1',
      sessionDuration: 'Provisioned',
      tlsHandshake: 'TLS 1.3 SECP384R1',
      status: 'ACTIVE',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      initials: initials || 'AD',
      avatarBg: 'bg-teal-900',
      keycardId: `LK-GOV-${Math.floor(1000 + Math.random() * 9000)}-AUTH-SHA256-4096-PROV`,
      delegations: [
        { title: 'Archive Cold Vault', scope: 'Standard Read Access', status: 'Active', icon: 'lock', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Oral History Submissions', scope: 'Regional Verification', status: 'Active', icon: 'record_voice_over', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        { title: 'Cultural Cartography', scope: 'Provincial Map Access', status: 'Active', icon: 'map', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      ]
    };

    this.custodians.update(list => [newAdmin, ...list]);
    this.selectedCustodian.set(newAdmin);
    this.closeGrantModal();
    this.showToast(`Administrator ${newAdmin.name} granted clearance successfully.`);
  }

  rotateCustodianKey(custodian: CustodianAdmin) {
    const newSerial = `LK-GOV-${Math.floor(1000 + Math.random() * 9000)}-AUTH-SHA256-4096-${Date.now().toString().slice(-4)}`;
    this.custodians.update(list => list.map(c => {
      if (c.id === custodian.id) {
        return { ...c, keycardId: newSerial, tokenStatus: 'Rotated & Valid' };
      }
      return c;
    }));
    if (this.selectedCustodian()?.id === custodian.id) {
      this.selectedCustodian.update(sel => sel ? { ...sel, keycardId: newSerial, tokenStatus: 'Rotated & Valid' } : null);
    }
    this.showToast(`Hardware Keycard rotated for ${custodian.name}. New serial: ${newSerial}`);
  }

  toggleCustodianLock(custodian: CustodianAdmin) {
    const nextStatus = custodian.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const badgeClass = nextStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300';
    
    this.custodians.update(list => list.map(c => {
      if (c.id === custodian.id) {
        return { ...c, status: nextStatus as any, statusBadgeClass: badgeClass };
      }
      return c;
    }));
    if (this.selectedCustodian()?.id === custodian.id) {
      this.selectedCustodian.update(sel => sel ? { ...sel, status: nextStatus as any, statusBadgeClass: badgeClass } : null);
    }
    this.showToast(`Administrator ${custodian.name} clearance status set to ${nextStatus}.`);
  }

  copyKeyFingerprint(fingerprint: string) {
    navigator.clipboard?.writeText(fingerprint);
    this.showToast(`Keycard fingerprint copied to clipboard.`);
  }

  viewCustodianHistory(custodian: CustodianAdmin) {
    this.showToast(`Filtering audit registry for administrator ${custodian.badgeId} (${custodian.name}).`);
  }

  refreshRoster() {
    this.showToast('Re-synchronizing PKI certificate roster with HSM cluster...');
  }
}
