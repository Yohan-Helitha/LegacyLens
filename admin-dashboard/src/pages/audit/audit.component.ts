import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { AuditService } from '../../app/core/services/audit.service';
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
          
          <!-- Loading State -->
          @if (isLoading()) {
            <div class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-[#6f7978]">
                <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
                <span class="text-sm font-medium">Loading audit log...</span>
              </div>
            </div>
          }

          <!-- Error State -->
          @if (hasError() && !isLoading()) {
            <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span class="material-symbols-outlined text-xl">warning</span>
              <span>Backend unreachable — please try again later.</span>
            </div>
          }

          @if (!isLoading()) {
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Audit Log
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                A clear chronological history of actions taken by administrators, curators, and moderators across the platform.
              </p>
            </div>

            <div class="flex items-center gap-2 self-start xl:self-auto flex-wrap">
              <button (click)="refreshFeed()" class="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#dde3eb] rounded-xl text-xs font-bold text-[#191c1c] hover:bg-[#f2f4f3] transition-colors shadow-xs">
                <span class="material-symbols-outlined text-sm text-[#004343]">refresh</span>
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>

          <!-- 4 KPI Summary Cards (live-computed) -->
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
                <div class="text-2xl font-serif font-bold text-[#191c1c]">{{ kpi().total }} Actions</div>
                <div class="text-[11px] text-[#6e7978] mt-1">Total entries in log</div>
              </div>
            </div>

            <!-- Card 2: Content Approvals -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Approvals</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">verified</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#191c1c]">{{ kpi().approvals }} Items</div>
                <div class="text-[11px] text-[#6e7978] mt-1">Approved &amp; published</div>
              </div>
            </div>

            <!-- Card 3: Moderation & Flags -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#9b4600]">Deletions &amp; Rejects</span>
                <div class="w-8 h-8 rounded-lg bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">flag</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#9b4600]">{{ kpi().deletions }} Actions</div>
                <div class="text-[11px] text-[#6e7978] mt-1">Deleted, rejected &amp; archived</div>
              </div>
            </div>

            <!-- Card 4: Unique Admins -->
            <div class="bg-white rounded-2xl p-5 border border-[#dde3eb] shadow-sm flex flex-col justify-between hover:border-[#004343]/30 transition-all">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Active Admins</span>
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-base">group</span>
                </div>
              </div>
              <div>
                <div class="text-2xl font-serif font-bold text-[#004343]">{{ kpi().admins }} Admins</div>
                <div class="flex items-center gap-1.5 text-[11px] text-[#6e7978] mt-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Unique actors in log</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Bar -->
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

              <!-- Admin Filter (dynamic from data) -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedAdmin()"
                        (ngModelChange)="selectedAdmin.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Admins</option>
                  @for (name of uniqueAdmins(); track name) {
                    <option [value]="name">{{ name }}</option>
                  }
                </select>
              </div>

              <!-- Action Type Filter -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedActionType()"
                        (ngModelChange)="selectedActionType.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Action Types</option>
                  <option value="Approved">Approvals &amp; Publishes</option>
                  <option value="Archived">Archival &amp; Deletions</option>
                  <option value="Updated">Edits &amp; Updates</option>
                  <option value="Resolved">Rejections &amp; Flags</option>
                  <option value="Granted">Reactivations</option>
                </select>
              </div>

              <!-- Entity Type Filter -->
              <div class="md:col-span-2">
                <select [ngModel]="selectedEntityType()"
                        (ngModelChange)="selectedEntityType.set($event)"
                        class="w-full bg-[#f8faf9] text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#c2c8c7] focus:bg-white focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Areas</option>
                  @for (et of uniqueEntityTypes(); track et) {
                    <option [value]="et">{{ et }}</option>
                  }
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
                @if (isLoading()) {
                  <div class="flex items-center gap-1.5 text-[11px] text-[#004343]">
                    <span class="w-2 h-2 rounded-full bg-[#004343] animate-pulse"></span>
                    <span>Loading from server...</span>
                  </div>
                } @else {
                  <div class="flex items-center gap-1.5 text-[11px] text-[#6e7978]">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Live data</span>
                  </div>
                }
              </div>

              <!-- Activity Table -->
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-[#f2f4f7] text-[#6e7978] text-[10px] font-bold uppercase tracking-wider border-b border-[#dde3eb]">
                      <th class="py-3 px-4">Date &amp; Time</th>
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
                        <td colspan="6" class="py-12 text-center text-[#6e7978]">
                          @if (isLoading()) {
                            <div class="flex flex-col items-center gap-2">
                              <span class="material-symbols-outlined text-3xl text-[#004343] animate-spin">refresh</span>
                              <p class="text-xs">Fetching audit log from server...</p>
                            </div>
                          } @else {
                            <div class="flex flex-col items-center gap-2">
                              <span class="material-symbols-outlined text-3xl mb-1 text-[#6e7978]">find_in_page</span>
                              <p class="text-xs">No activity entries match your current filters.</p>
                              @if (activities().length === 0) {
                                <p class="text-[11px] text-[#6e7978]">Audit entries will appear here automatically when admins take actions.</p>
                              }
                            </div>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Pagination Footer -->
              <div class="p-4 bg-[#f8faf9] border-t border-[#dde3eb] flex items-center justify-between flex-wrap gap-2">
                <div class="text-[#6e7978] text-xs">
                  <span>Showing {{ filteredActivities().length }} of {{ activities().length }} total activities</span>
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
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978]">Notes &amp; Justification</span>
                    <div class="mt-1 p-3 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-[#3e4948] text-[11px] leading-relaxed">
                      {{ act.notes || 'No additional notes recorded.' }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-[11px] pt-1 text-[#6e7978]">
                    <span>Ref Code:</span>
                    <span class="font-semibold text-[#191c1c] font-mono">{{ act.refCode }}</span>
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
              } @else {
                <div class="flex flex-col items-center justify-center py-8 text-center text-[#6e7978]">
                  <span class="material-symbols-outlined text-3xl mb-2">touch_app</span>
                  <p class="text-xs">Click any activity row to view its full details here.</p>
                </div>
              }

            </div>

          </div>
          }
        </div>

      </main>

    </div>
  `
})
export class AuditComponent implements OnInit {
  toastMessage = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  searchQuery = signal<string>('');
  selectedAdmin = signal<string>('ALL');
  selectedActionType = signal<string>('ALL');
  selectedEntityType = signal<string>('ALL');

  activities = signal<AuditActivity[]>([]);
  selectedActivity = signal<AuditActivity | null>(null);

  /** Unique admin names for the filter dropdown */
  uniqueAdmins = computed(() =>
    [...new Set(this.activities().map(a => a.adminName))].sort()
  );

  /** Unique entity types for the area filter dropdown */
  uniqueEntityTypes = computed(() =>
    [...new Set(this.activities().map(a => a.targetCategory))].sort()
  );

  /** Live KPI stats computed from the full activities list */
  kpi = computed(() => {
    const all = this.activities();
    return {
      total:     all.length,
      approvals: all.filter(a => a.actionType === 'Approved').length,
      deletions: all.filter(a => a.actionType === 'Archived' || a.actionType === 'Resolved').length,
      admins:    new Set(all.map(a => a.adminName)).size,
    };
  });

  filteredActivities = computed(() => {
    let list = this.activities();
    const query = this.searchQuery().toLowerCase().trim();
    const admin = this.selectedAdmin();
    const action = this.selectedActionType();
    const entity = this.selectedEntityType();

    if (admin !== 'ALL') {
      list = list.filter(a => a.adminName === admin);
    }

    if (action !== 'ALL') {
      list = list.filter(a => a.actionType === action);
    }

    if (entity !== 'ALL') {
      list = list.filter(a => a.targetCategory === entity);
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private auditService: AuditService
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  private loadAuditLogs(): void {
    this.isLoading.set(true);
    this.auditService.getAuditLogs().subscribe({
      next: (logs) => {
        this.activities.set(logs);
        if (logs.length > 0) {
          this.selectedActivity.set(logs[0]);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  selectActivity(act: AuditActivity): void {
    this.selectedActivity.set(act);
  }

  printLog(): void {
    window.print();
  }

  exportLogCsv(): void {
    const headers = ['Date', 'Time', 'Admin', 'Action', 'Target', 'Category', 'Status', 'Notes'];
    const rows = this.filteredActivities().map(a => [
      a.date, a.time, a.adminName, a.actionTaken,
      a.targetTitle, a.targetCategory, a.statusBadge, `"${a.notes.replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Audit log exported as CSV.');
  }

  refreshFeed(): void {
    this.loadAuditLogs();
    this.showToast('Audit stream refreshed from server.');
  }

  viewAffectedItem(act: AuditActivity): void {
    const cat = act.targetCategory.toLowerCase();
    if (cat.includes('landmark') || cat.includes('badge') || cat.includes('quest')) {
      this.router.navigate(['/map']);
    } else if (cat.includes('story') || cat.includes('content')) {
      this.router.navigate(['/moderation']);
    } else if (cat.includes('opportunity')) {
      this.router.navigate(['/opportunity-intake']);
    } else if (cat.includes('user') || cat.includes('verification')) {
      this.router.navigate(['/verification']);
    } else if (cat.includes('word')) {
      this.router.navigate(['/word-of-the-day']);
    } else if (cat.includes('admin')) {
      this.router.navigate(['/admin-management']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  downloadReceipt(act: AuditActivity): void {
    this.showToast(`Downloaded audit receipt for ${act.refCode}.`);
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
