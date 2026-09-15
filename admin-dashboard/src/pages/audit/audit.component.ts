import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface AuditActivity {
  id: string;
  refCode: string;
  date: string;
  time: string;
  adminName: string;
  adminRole: string;
  adminEmail: string;
  adminAvatar: string;
  adminAvatarBg: string;
  actionTaken: string;
  actionType: 'Approved' | 'Archived' | 'Updated' | 'Resolved' | 'Granted';
  targetTitle: string;
  targetCategory: string;
  statusBadge: string;
  statusBadgeClass: string;
  notes: string;
  location: string;
  blockHash?: string;
  rawPayload?: Record<string, any>;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">verified</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Reusable Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Top Navbar -->
        <app-header 
          pageTitle="Audit Log" 
          section="Console"
          searchPlaceholder="Search by admin name, ref code, or action...">
          <div class="hidden sm:flex items-center gap-2">
            <button (click)="printLog()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-xs">
              <span class="material-symbols-outlined text-base text-[#6e7978]">print</span>
              <span>Print</span>
            </button>

            <button (click)="exportLogCsv()"
                    class="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#004343] text-white rounded-xl text-xs font-semibold hover:bg-[#003131] transition-all shadow-xs shadow-[#004343]/20">
              <span class="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </button>
          </div>
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Hero Header Banner -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#dde3eb] shadow-sm">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#004343]">Console / Audit Log</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Live Activity Stream
                </span>
              </div>
              <h1 class="text-2xl font-serif font-bold text-[#191c1c]">Admin Activity & Audit Log</h1>
              <p class="text-xs text-[#6e7978] mt-0.5">
                A clear chronological history of actions taken by administrators, curators, and moderators across the platform.
              </p>
            </div>
            
            <div class="flex items-center gap-2">
              <button (click)="refreshFeed()" class="flex items-center gap-1.5 px-3 py-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-white transition-colors">
                <span class="material-symbols-outlined text-sm text-[#004343]">refresh</span>
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>

          <!-- 4 Practical KPI Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Card 1: Activities Today -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Activities Today</span>
                <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">history</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">148 Actions</div>
                <div class="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-1">
                  <span class="material-symbols-outlined text-sm">trending_up</span>
                  <span>+12% compared to yesterday</span>
                </div>
              </div>
            </div>

            <!-- Card 2: Content Approvals -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Content Approvals</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">verified</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">94 Items</div>
                <div class="text-[11px] text-[#6e7978] mt-1">
                  Stories, audio & sacred markers
                </div>
              </div>
            </div>

            <!-- Card 3: Moderation & Flags -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9b4600]">Moderation & Flags</span>
                <div class="w-8 h-8 rounded-lg bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">flag</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#9b4600]">12 Actions</div>
                <div class="text-[11px] text-[#6e7978] mt-1">
                  Resolved disputes & reviews
                </div>
              </div>
            </div>

            <!-- Card 4: Active Admins -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Staff Online</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">group</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#004343]">6 Online</div>
                <div class="flex items-center gap-1.5 text-[11px] text-[#6e7978] mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active council seats</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Clean Filter Bar -->
          <div class="bg-white rounded-2xl p-4 border border-[#dde3eb] shadow-sm">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <!-- Search Field -->
              <div class="relative md:col-span-6">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e7978] text-lg">search</span>
                <input type="text"
                       placeholder="Search by admin name, action, or target item..."
                       [ngModel]="searchQuery()"
                       (ngModelChange)="searchQuery.set($event)"
                       class="w-full bg-[#f8faf9] text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] transition-colors" />
              </div>

              <!-- Admin Filter -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedAdmin()"
                        (ngModelChange)="selectedAdmin.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Admins</option>
                  <option value="Dr. Samantha S.">Dr. Samantha S.</option>
                  <option value="E. Vance">E. Vance</option>
                  <option value="Master Karunaratne">Master Karunaratne</option>
                  <option value="Niluka Bandara">Niluka Bandara</option>
                  <option value="Tharushi J.">Tharushi J.</option>
                </select>
              </div>

              <!-- Action Type Filter -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedActionType()"
                        (ngModelChange)="selectedActionType.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Action Types</option>
                  <option value="Approved">Content Approvals</option>
                  <option value="Archived">Archival & Deletions</option>
                  <option value="Updated">Edits & Updates</option>
                  <option value="Resolved">Moderation & Flags</option>
                  <option value="Granted">Role & Badge Grants</option>
                </select>
              </div>

              <!-- Date Range Filter -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedDateRange()"
                        (ngModelChange)="selectedDateRange.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="TODAY">Today</option>
                  <option value="WEEK">Last 7 Days</option>
                  <option value="MONTH">Last 30 Days</option>
                  <option value="ALL">All Time</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Main Dual Section: Activity Table (8 Cols) + Inspector (4 Cols) -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            <!-- Left: Activity Table (8 Cols) -->
            <div class="xl:col-span-8 bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden flex flex-col">
              
              <!-- Table Header Status Bar -->
              <div class="p-4 bg-[#f8faf9] border-b border-[#dde3eb] flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-[#3e4948]">Recent Activities</span>
                  <span class="px-2.5 py-0.5 rounded-full bg-[#dde3eb] text-[#191c1c] text-[11px] font-bold">
                    Showing {{ filteredActivities().length }} Activities
                  </span>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-[#6e7978]">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Auto-refresh enabled</span>
                </div>
              </div>

              <!-- Plain English Activity Table -->
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-[#f2f4f7] text-[#6e7978] text-[10px] font-bold uppercase tracking-wider border-b border-[#dde3eb]">
                      <th class="py-3 px-4">Date & Time</th>
                      <th class="py-3 px-4">Administrator</th>
                      <th class="py-3 px-4">Action Taken</th>
                      <th class="py-3 px-4">Target / Item</th>
                      <th class="py-3 px-4">Status</th>
                      <th class="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#dde3eb] text-xs">
                    @for (act of filteredActivities(); track act.id) {
                      <tr (click)="selectActivity(act)"
                          [ngClass]="selectedActivity()?.id === act.id ? 'bg-[#004343]/5' : 'hover:bg-[#f8faf9]'"
                          class="cursor-pointer transition-colors">
                        <td class="py-3.5 px-4">
                          <div class="flex flex-col">
                            <span class="font-bold text-[#191c1c]">{{ act.date }}</span>
                            <span class="text-[10px] font-mono text-[#6e7978]">{{ act.time }}</span>
                          </div>
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="flex items-center gap-2.5">
                            <div [ngClass]="act.adminAvatarBg" class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                              {{ act.adminAvatar }}
                            </div>
                            <div class="flex flex-col min-w-0">
                              <span class="font-bold text-[#191c1c] truncate">{{ act.adminName }}</span>
                              <span class="text-[10px] text-[#6e7978] truncate">{{ act.adminRole }}</span>
                            </div>
                          </div>
                        </td>
                        <td class="py-3.5 px-4 font-medium text-[#191c1c]">
                          {{ act.actionTaken }}
                        </td>
                        <td class="py-3.5 px-4">
                          <div class="flex flex-col min-w-0 max-w-xs">
                            <span class="font-bold text-[#191c1c] truncate">{{ act.targetTitle }}</span>
                            <span class="text-[10px] text-[#6e7978] truncate">{{ act.targetCategory }}</span>
                          </div>
                        </td>
                        <td class="py-3.5 px-4">
                          <span [ngClass]="act.statusBadgeClass" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border">
                            {{ act.statusBadge }}
                          </span>
                        </td>
                        <td class="py-3.5 px-4 text-right">
                          <button class="p-1 rounded-lg hover:bg-[#dde3eb] text-[#6e7978] hover:text-[#004343] transition-colors" title="View Activity Details">
                            <span class="material-symbols-outlined text-base">chevron_right</span>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="py-8 text-center text-[#6e7978]">
                          <span class="material-symbols-outlined text-3xl mb-1 text-[#6e7978]">find_in_page</span>
                          <p class="text-xs">No activity entries match your current search filters.</p>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination Footer -->
              <div class="p-4 bg-[#f8faf9] border-t border-[#dde3eb] flex items-center justify-between flex-wrap gap-2">
                <div class="text-[#6e7978] text-xs">
                  <span>Showing {{ filteredActivities().length }} of 148 activities today</span>
                </div>
                <div class="flex items-center gap-1">
                  <button class="w-8 h-8 rounded-lg bg-white border border-[#c2c8c7] text-[#3e4948] flex items-center justify-center hover:bg-[#f2f4f7] text-xs shadow-sm">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span class="w-8 h-8 bg-[#004343] text-white text-xs font-bold rounded-lg flex items-center justify-center">1</span>
                  <button class="w-8 h-8 rounded-lg bg-white border border-[#c2c8c7] text-[#3e4948] flex items-center justify-center hover:bg-[#f2f4f7] text-xs shadow-sm">2</button>
                  <button class="w-8 h-8 rounded-lg bg-white border border-[#c2c8c7] text-[#3e4948] flex items-center justify-center hover:bg-[#f2f4f7] text-xs shadow-sm">3</button>
                  <button class="w-8 h-8 rounded-lg bg-white border border-[#c2c8c7] text-[#3e4948] flex items-center justify-center hover:bg-[#f2f4f7] text-xs shadow-sm">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

            </div>

            <!-- Right: Inspector Sidebar (4 Cols) -->
            <div class="xl:col-span-4 bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm flex flex-col gap-4 sticky top-6">
              
              <!-- Inspector Header -->
              <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                    <span class="material-symbols-outlined text-base">info</span>
                  </div>
                  <span class="text-sm font-serif font-bold text-[#191c1c]">Activity Details</span>
                </div>
                <span class="text-xs font-mono font-bold text-[#6e7978]">{{ selectedActivity()?.refCode }}</span>
              </div>

              @if (selectedActivity(); as act) {
                <!-- Admin Profile Mini Card -->
                <div class="p-3.5 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex items-center gap-3">
                  <div [ngClass]="act.adminAvatarBg" class="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {{ act.adminAvatar }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-bold text-[#191c1c] truncate">{{ act.adminName }}</span>
                    <span class="text-[11px] text-[#6e7978] truncate">{{ act.adminRole }}</span>
                    <span class="text-[10px] font-mono text-[#004343] truncate">{{ act.adminEmail }}</span>
                  </div>
                </div>

                <!-- Summary Field Rows -->
                <div class="space-y-3 text-xs">
                  <div class="pb-2 border-b border-[#dde3eb]">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Action Completed</span>
                    <div class="font-bold text-[#191c1c] mt-0.5">{{ act.actionTaken }}</div>
                  </div>

                  <div class="pb-2 border-b border-[#dde3eb]">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Timestamp</span>
                    <div class="text-[#3e4948] mt-0.5 font-mono">{{ act.date }} at {{ act.time }}</div>
                  </div>

                  <div class="pb-2 border-b border-[#dde3eb]">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Affected Item / Record</span>
                    <div class="font-bold text-[#004343] mt-0.5">{{ act.targetTitle }}</div>
                    <div class="text-[10px] text-[#6e7978]">{{ act.targetCategory }}</div>
                  </div>

                  <div class="pb-2 border-b border-[#dde3eb]">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Curatorial Notes & Justification</span>
                    <div class="mt-1 p-3 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-[#3e4948] text-[11px] leading-relaxed">
                      {{ act.notes }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[11px] pt-1 text-[#6e7978]">
                    <span>Session & Location:</span>
                    <span class="font-semibold text-[#191c1c]">{{ act.location }}</span>
                  </div>
                </div>

                <!-- Quick Action Buttons -->
                <div class="space-y-2 pt-2">
                  <button (click)="viewAffectedItem(act)"
                          class="w-full py-2.5 px-4 bg-[#004343] text-white hover:bg-[#003131] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#004343]/20">
                    <span class="material-symbols-outlined text-base">visibility</span>
                    <span>View Affected Item</span>
                  </button>

                  <button (click)="downloadReceipt(act)"
                          class="w-full py-2.5 px-4 bg-white border border-[#c2c8c7] hover:bg-[#f2f4f7] text-[#3e4948] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                    <span class="material-symbols-outlined text-base text-[#9b4600]">receipt</span>
                    <span>Download Audit Receipt</span>
                  </button>
                </div>
              }

            </div>

          </div>

        </div>

      </main>

    </div>
  `
})
export class AuditComponent {
  toastMessage = signal<string | null>(null);

  searchQuery = signal<string>('');
  selectedAdmin = signal<string>('ALL');
  selectedActionType = signal<string>('ALL');
  selectedDateRange = signal<string>('TODAY');

  activities = signal<AuditActivity[]>([
    {
      id: 'ACT-101',
      refCode: 'ID #ACT-101',
      date: 'Today',
      time: '11:42 AM',
      adminName: 'Dr. Samantha S.',
      adminRole: 'Senior Curator',
      adminEmail: 'samantha.s@legacylens.gov.lk',
      adminAvatar: 'SS',
      adminAvatarBg: 'bg-[#004343]',
      actionTaken: 'Approved Elder Submission',
      actionType: 'Approved',
      targetTitle: 'Master K. G. Tikiri Banda',
      targetCategory: 'Oral History Audio #014',
      statusBadge: 'Approved',
      statusBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      notes: 'Verified via Divisional Secretariat documentation, heritage lineage records, and national crafts registry interview.',
      location: 'Colombo Office • Chrome on macOS'
    },
    {
      id: 'ACT-102',
      refCode: 'ID #ACT-102',
      date: 'Today',
      time: '10:18 AM',
      adminName: 'E. Vance',
      adminRole: 'Content Director',
      adminEmail: 'e.vance@legacylens.gov.lk',
      adminAvatar: 'EV',
      adminAvatarBg: 'bg-[#9b4600]',
      actionTaken: 'Archived Outdated Post',
      actionType: 'Archived',
      targetTitle: 'Traditional Pottery in Kelaniya',
      targetCategory: 'Article #ART-2018',
      statusBadge: 'Archived',
      statusBadgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
      notes: 'Replaced with updated high-definition photographic essay #ART-2025. Redundant article moved to deep storage.',
      location: 'Kandy Outpost • Firefox on Linux'
    },
    {
      id: 'ACT-103',
      refCode: 'ID #ACT-103',
      date: 'Today',
      time: '09:05 AM',
      adminName: 'Master Karunaratne',
      adminRole: 'Geographic Lead',
      adminEmail: 'a.karuna@legacylens.gov.lk',
      adminAvatar: 'MK',
      adminAvatarBg: 'bg-[#363c42]',
      actionTaken: 'Updated Cultural Map Pin',
      actionType: 'Updated',
      targetTitle: 'Ambalangoda Mask Museum',
      targetCategory: 'Cultural Map GIS Pin',
      statusBadge: 'Updated',
      statusBadgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      notes: 'Adjusted GPS coordinates to exact entrance gate and updated traditional craftsman opening hours.',
      location: 'Galle Regional Station • Safari on iPad'
    },
    {
      id: 'ACT-104',
      refCode: 'ID #ACT-104',
      date: 'Yesterday',
      time: '06:20 PM',
      adminName: 'Niluka Bandara',
      adminRole: 'Moderator',
      adminEmail: 'niluka.b@legacylens.gov.lk',
      adminAvatar: 'NB',
      adminAvatarBg: 'bg-[#fe893e]',
      actionTaken: 'Resolved Community Flag',
      actionType: 'Resolved',
      targetTitle: 'Gem Miners Folk Song transcription',
      targetCategory: 'Ethics & Dispute Queue',
      statusBadge: 'Resolved',
      statusBadgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      notes: 'Community user reported typographical discrepancy in verse 3; verified with original sound recording and updated line.',
      location: 'Ratnapura Substation • Edge on Windows'
    },
    {
      id: 'ACT-105',
      refCode: 'ID #ACT-105',
      date: 'Yesterday',
      time: '03:45 PM',
      adminName: 'Tharushi J.',
      adminRole: 'Community Manager',
      adminEmail: 'tharushi@legacylens.gov.lk',
      adminAvatar: 'TJ',
      adminAvatarBg: 'bg-[#004343]',
      actionTaken: 'Granted Creator Badge',
      actionType: 'Granted',
      targetTitle: 'Sanduni Jayawardena',
      targetCategory: 'Apprentice Storyteller Role',
      statusBadge: 'Granted',
      statusBadgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      notes: 'Passed initial curation review after uploading 3 verified cultural folklore stories.',
      location: 'Colombo Office • Chrome on macOS'
    },
    {
      id: 'ACT-106',
      refCode: 'ID #ACT-106',
      date: '13 Oct 2025',
      time: '02:15 PM',
      adminName: 'Dr. Samantha S.',
      adminRole: 'Senior Curator',
      adminEmail: 'samantha.s@legacylens.gov.lk',
      adminAvatar: 'SS',
      adminAvatarBg: 'bg-[#004343]',
      actionTaken: 'Updated Security Policy',
      actionType: 'Updated',
      targetTitle: 'Two-Factor Authentication Requirement',
      targetCategory: 'Admin Access Settings',
      statusBadge: 'Updated',
      statusBadgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      notes: 'Mandated multi-factor authentication for all staff members with content publish permissions.',
      location: 'Colombo Office • Chrome on macOS'
    }
  ]);

  selectedActivity = signal<AuditActivity | null>(this.activities()[0]);

  filteredActivities = computed(() => {
    let list = this.activities();
    const query = this.searchQuery().toLowerCase().trim();
    const admin = this.selectedAdmin();
    const action = this.selectedActionType();

    if (admin !== 'ALL') {
      list = list.filter(a => a.adminName.toLowerCase().includes(admin.toLowerCase()));
    }

    if (action !== 'ALL') {
      list = list.filter(a => a.actionType === action);
    }

    if (query) {
      list = list.filter(a =>
        a.adminName.toLowerCase().includes(query) ||
        a.actionTaken.toLowerCase().includes(query) ||
        a.targetTitle.toLowerCase().includes(query) ||
        a.refCode.toLowerCase().includes(query) ||
        a.notes.toLowerCase().includes(query)
      );
    }

    return list;
  });

  constructor(private router: Router, private authService: AuthService) {}

  selectActivity(act: AuditActivity): void {
    this.selectedActivity.set(act);
  }

  printLog(): void {
    window.print();
  }

  exportLogCsv(): void {
    this.showToast('Exporting admin activity and audit trail as encrypted CSV...');
  }

  refreshFeed(): void {
    this.showToast('Audit stream synchronized with distributed nodes.');
  }

  viewAffectedItem(act: AuditActivity): void {
    if (act.actionType === 'Approved') {
      this.router.navigate(['/verification']);
    } else if (act.targetCategory.includes('Map')) {
      this.router.navigate(['/map']);
    } else if (act.actionType === 'Resolved') {
      this.router.navigate(['/disputes']);
    } else {
      this.router.navigate(['/moderation']);
    }
  }

  downloadReceipt(act: AuditActivity): void {
    this.showToast(`Downloaded cryptographic audit receipt for ${act.refCode}.`);
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
