import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface Complaint {
  id: number;
  subject: string;
  details: string;
  targetEntity: string;
  targetEntityId: string;
  reportedBy: string;
  status: string;
  priority: string;
  resolutionNotes: string;
  dateSubmitted: string;
  dateResolved: string;
}

export interface Feedback {
  id: number;
  category: string;
  rating: number;
  comments: string;
  submittedBy: string;
  status: string;
  dateSubmitted: string;
}

@Component({
  selector: 'app-disputes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
<div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
  <!-- Toast Alert Notification -->
  @if (toastMessage()) {
    <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
      <span class="material-symbols-outlined text-emerald-300 text-xl">info</span>
      <div>
        <div class="text-xs font-semibold">{{ toastMessage() }}</div>
      </div>
      <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
    </div>
  }

  <!-- Export PDF Modal -->
  @if (showExportPdfModal()) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-[#191c1c]/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl border border-[#dde3eb] w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-[#dde3eb] flex justify-between items-center bg-[#f8faf9]">
          <h2 class="text-lg font-bold text-[#004343] font-['Source_Serif_4',serif]">Export PDF Report</h2>
          <button (click)="showExportPdfModal.set(false)" class="text-[#6f7978] hover:text-[#191c1c] transition-colors cursor-pointer">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-[#3f4948]">Select a date range for the PDF export. Leave blank to export all current records.</p>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col space-y-1.5">
              <label class="text-xs font-bold text-[#3f4948]">From Date</label>
              <input type="date" [(ngModel)]="exportDateFrom" class="w-full px-3 py-2 border border-[#dde3eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004343]/20 focus:border-[#004343] transition-all bg-white" />
            </div>
            <div class="flex flex-col space-y-1.5">
              <label class="text-xs font-bold text-[#3f4948]">To Date</label>
              <input type="date" [(ngModel)]="exportDateTo" class="w-full px-3 py-2 border border-[#dde3eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004343]/20 focus:border-[#004343] transition-all bg-white" />
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-[#dde3eb] bg-[#f8faf9] flex justify-end gap-3">
          <button (click)="showExportPdfModal.set(false)" class="px-4 py-2 text-sm font-bold text-[#3f4948] hover:bg-[#e1e3e2] rounded-xl transition-colors cursor-pointer">
            Cancel
          </button>
          <button (click)="downloadPdf()" class="px-4 py-2 text-sm font-bold text-white bg-[#004343] hover:bg-[#004343]/90 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer">
            <span class="material-symbols-outlined text-sm">download</span>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Left Sidebar Navigation -->
  <app-sidebar></app-sidebar>

  <!-- Main Content Container -->
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    
    <!-- Common Top Header Navigation -->
    <app-header 
      pageTitle="Disputes & Feedback" 
      section="Console"
      searchPlaceholder="Search ID, user, or subject..."
      [searchQuery]="searchQuery()"
      (searchQueryChange)="searchQuery.set($event)">
    </app-header>

    <!-- Top Navigation Bar: ONLY Main Sections -->
    <div class="bg-white border-b border-[#dde3eb] px-6 py-2.5 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-1 sm:gap-2">
        <button 
          (click)="activeTab.set('complaints')"
          [class]="activeTab() === 'complaints' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">gavel</span>
          <span>Complaints</span>
          <span [class]="activeTab() === 'complaints' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
            {{ totalComplaints() }}
          </span>
        </button>

        <button 
          (click)="activeTab.set('feedbacks')"
          [class]="activeTab() === 'feedbacks' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
          <span class="material-symbols-outlined text-base">reviews</span>
          <span>Feedbacks</span>
          <span [class]="activeTab() === 'feedbacks' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
            {{ totalFeedbacks() }}
          </span>
        </button>
      </div>

      
    </div>

    <!-- Main Body Scrollable View -->
    <main class="flex-1 overflow-y-auto p-6 space-y-6">
      
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-3 text-[#6f7978]">
            <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
            <span class="text-sm font-medium">Loading disputes and feedback...</span>
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
            {{ activeTab() === 'complaints' ? 'Disputes & Complaints' : 'User Feedback' }}
          </h1>
          <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
            @if (activeTab() === 'complaints') {
              Review, manage and resolve user complaints to maintain the integrity of the LegacyLens platform.
            } @else {
              Review and act upon user feedback to improve the quality of the LegacyLens platform.
            }
          </p>
        </div>

        <!-- Action Triggers -->
        <div class="flex items-center gap-3 self-start xl:self-auto flex-wrap">
          <button 
            (click)="showExportPdfModal.set(true)"
            class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
            <span class="material-symbols-outlined text-base text-[#004343]">picture_as_pdf</span>
            <span>Export PDF</span>
          </button>
          <button 
            (click)="syncData()"
            [disabled]="isSyncing()"
            class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
            <span class="material-symbols-outlined text-base text-[#004343]" [ngClass]="{'animate-spin': isSyncing()}">sync</span>
            <span>{{ isSyncing() ? 'Syncing...' : 'Sync Data' }}</span>
          </button>
        </div>
      </div>

      <!-- Metric Cards Strip -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        @if (activeTab() === 'complaints') {
          <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between text-[#6f7978]">
              <span class="text-[11px] font-bold uppercase tracking-wider">Total Complaints</span>
              <span class="material-symbols-outlined text-[#004343] text-lg">gavel</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">{{ totalComplaints() }}</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between text-[#6f7978]">
              <span class="text-[11px] font-bold uppercase tracking-wider">Pending Complaints</span>
              <span class="material-symbols-outlined text-amber-700 text-lg">pending_actions</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-amber-700">{{ pendingComplaints() }}</span>
            </div>
          </div>
        }

        @if (activeTab() === 'feedbacks') {
          <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between text-[#6f7978]">
              <span class="text-[11px] font-bold uppercase tracking-wider">Total Feedbacks</span>
              <span class="material-symbols-outlined text-emerald-700 text-lg">reviews</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-emerald-800">{{ totalFeedbacks() }}</span>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
            <div class="flex items-center justify-between text-[#6f7978]">
              <span class="text-[11px] font-bold uppercase tracking-wider">New Feedbacks</span>
              <span class="material-symbols-outlined text-[#fe893e] text-lg">new_releases</span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#9b4600]">{{ newFeedbacks() }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Main Workspace -->
      <div class="bg-white border border-[#dde3eb] rounded-2xl shadow-xs flex flex-col overflow-hidden">

        <!-- Table Views -->
        <div class="overflow-x-auto min-h-[400px]">
          
          <!-- Complaints Table -->
          @if (activeTab() === 'complaints') {
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#f8faf9] border-b border-[#dde3eb] text-[#6e7978] text-[11px] uppercase tracking-wider font-bold">
                  <th class="p-4 font-bold">ID & Date</th>
                  <th class="p-4 font-bold">Subject</th>
                  <th class="p-4 font-bold">Target</th>
                  <th class="p-4 font-bold">Reporter</th>
                  <th class="p-4 font-bold">Priority</th>
                  <th class="p-4 font-bold">Status</th>
                  <th class="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#dde3eb]">
                @for (c of filteredComplaints(); track c.id) {
                  <tr class="hover:bg-[#f8faf9] transition-colors group">
                    <td class="p-4">
                      <div class="text-xs font-bold text-[#191c1c]">#{{ c.id }}</div>
                      <div class="text-[10px] text-[#6e7978]">{{ c.dateSubmitted | date:'mediumDate' }}</div>
                    </td>
                    <td class="p-4 max-w-[250px]">
                      <div class="text-xs font-bold text-[#191c1c] truncate" title="{{ c.subject }}">{{ c.subject }}</div>
                      <div class="text-[11px] text-[#6e7978] truncate" title="{{ c.details }}">{{ c.details }}</div>
                    </td>
                    <td class="p-4">
                      <div class="text-xs text-[#3e4948]"><span class="font-semibold">{{ c.targetEntity }}</span>: {{ c.targetEntityId }}</div>
                    </td>
                    <td class="p-4 text-xs font-medium text-[#004343]">
                      {{ c.reportedBy }}
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            [ngClass]="{
                              'bg-red-100 text-red-800': c.priority === 'High',
                              'bg-amber-100 text-amber-800': c.priority === 'Medium',
                              'bg-emerald-100 text-emerald-800': c.priority === 'Low'
                            }">
                        {{ c.priority }}
                      </span>
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            [ngClass]="{
                              'bg-[#f2f4f7] text-[#3e4948]': c.status === 'Pending',
                              'bg-amber-100 text-amber-800': c.status === 'Under Review',
                              'bg-emerald-100 text-emerald-800': c.status === 'Resolved',
                              'bg-gray-100 text-gray-800': c.status === 'Dismissed'
                            }">
                        {{ c.status }}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="updateComplaintStatus(c.id, 'Under Review')" title="Mark Under Review"
                                class="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">policy</span>
                        </button>
                        <button (click)="updateComplaintStatus(c.id, 'Resolved')" title="Resolve"
                                class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        </button>
                        <button (click)="updateComplaintStatus(c.id, 'Dismissed')" title="Dismiss"
                                class="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-red-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">cancel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-[#6e7978]">No complaints found.</td>
                  </tr>
                }
              </tbody>
            </table>
          }

          <!-- Feedbacks Table -->
          @if (activeTab() === 'feedbacks') {
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#f8faf9] border-b border-[#dde3eb] text-[#6e7978] text-[11px] uppercase tracking-wider font-bold">
                  <th class="p-4 font-bold">ID & Date</th>
                  <th class="p-4 font-bold">Category</th>
                  <th class="p-4 font-bold">User</th>
                  <th class="p-4 font-bold">Rating</th>
                  <th class="p-4 font-bold">Comments</th>
                  <th class="p-4 font-bold">Status</th>
                  <th class="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#dde3eb]">
                @for (f of filteredFeedbacks(); track f.id) {
                  <tr class="hover:bg-[#f8faf9] transition-colors group">
                    <td class="p-4">
                      <div class="text-xs font-bold text-[#191c1c]">#{{ f.id }}</div>
                      <div class="text-[10px] text-[#6e7978]">{{ f.dateSubmitted | date:'mediumDate' }}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#004343]/10 text-[#004343]">
                        {{ f.category }}
                      </span>
                    </td>
                    <td class="p-4 text-xs font-medium text-[#3e4948]">
                      {{ f.submittedBy }}
                    </td>
                    <td class="p-4">
                      <div class="flex items-center text-amber-500 text-sm">
                        @for (star of [1,2,3,4,5]; track star) {
                          <span class="material-symbols-outlined text-[16px]">
                            {{ star <= f.rating ? 'star' : 'star_border' }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="p-4 max-w-[300px]">
                      <div class="text-xs text-[#3e4948] line-clamp-2" title="{{ f.comments }}">{{ f.comments }}</div>
                    </td>
                    <td class="p-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                            [ngClass]="{
                              'bg-amber-100 text-amber-800': f.status === 'New',
                              'bg-blue-100 text-blue-800': f.status === 'Reviewed',
                              'bg-emerald-100 text-emerald-800': f.status === 'Implemented',
                              'bg-gray-100 text-gray-800': f.status === 'Archived'
                            }">
                        {{ f.status }}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="updateFeedbackStatus(f.id, 'Reviewed')" title="Mark as Reviewed"
                                class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button (click)="updateFeedbackStatus(f.id, 'Implemented')" title="Mark as Implemented"
                                class="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">build_circle</span>
                        </button>
                        <button (click)="updateFeedbackStatus(f.id, 'Archived')" title="Archive"
                                class="p-1.5 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer">
                          <span class="material-symbols-outlined text-[18px]">archive</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-[#6e7978]">No feedback found.</td>
                  </tr>
                }
              </tbody>
            </table>
          }

          </div>
        </div>
      } <!-- end @if (!isLoading()) -->
    </main>
  </div>
</div>
  `
})
export class DisputesComponent implements OnInit {
  // Search & Filter
  searchQuery = signal<string>('');
  activeTab = signal<'complaints' | 'feedbacks'>('complaints');
  isSyncing = signal<boolean>(false);
  
  // Export PDF Modal
  showExportPdfModal = signal<boolean>(false);
  exportDateFrom = '';
  exportDateTo = '';
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  complaintsList = signal<Complaint[]>([]);
  feedbacksList = signal<Feedback[]>([]);

  toastMessage = signal<string | null>(null);

  // Stats
  totalComplaints = computed(() => this.complaintsList().length);
  pendingComplaints = computed(() => this.complaintsList().filter(c => c.status === 'Pending').length);
  totalFeedbacks = computed(() => this.feedbacksList().length);
  newFeedbacks = computed(() => this.feedbacksList().filter(f => f.status === 'New').length);

  filteredComplaints = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.complaintsList().filter(c => 
      c.subject.toLowerCase().includes(q) || 
      c.reportedBy.toLowerCase().includes(q) || 
      c.id.toString().includes(q)
    );
  });

  filteredFeedbacks = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.feedbacksList().filter(f => 
      f.category.toLowerCase().includes(q) || 
      f.submittedBy.toLowerCase().includes(q) ||
      f.id.toString().includes(q)
    );
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  downloadPdf() {
    const doc = new jsPDF();
    const adminUser = this.authService.currentUser();
    const adminName = adminUser ? adminUser.fullName : 'Admin';

    doc.setFontSize(18);
    doc.text('LegacyLens - Disputes & Feedback Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated by: ${adminName}`, 14, 30);
    
    let dateText = 'Date Range: All Time';
    if (this.exportDateFrom && this.exportDateTo) {
      dateText = `Date Range: ${this.exportDateFrom} to ${this.exportDateTo}`;
    } else if (this.exportDateFrom) {
      dateText = `Date Range: From ${this.exportDateFrom}`;
    } else if (this.exportDateTo) {
      dateText = `Date Range: Until ${this.exportDateTo}`;
    }
    doc.text(dateText, 14, 36);

    const isComplaints = this.activeTab() === 'complaints';
    doc.text(`Report Type: ${isComplaints ? 'Complaints' : 'Feedback'}`, 14, 42);

    if (isComplaints) {
      const data = this.filteredComplaints().filter(c => {
        let match = true;
        const cDate = new Date(c.dateSubmitted).getTime();
        if (this.exportDateFrom) {
          match = match && cDate >= new Date(this.exportDateFrom).getTime();
        }
        if (this.exportDateTo) {
          match = match && cDate <= new Date(this.exportDateTo).getTime();
        }
        return match;
      });

      const body = data.map(c => [
        c.id.toString(),
        new Date(c.dateSubmitted).toLocaleDateString(),
        c.subject,
        c.reportedBy,
        c.priority,
        c.status
      ]);

      autoTable(doc, {
        startY: 48,
        head: [['ID', 'Date', 'Subject', 'Reporter', 'Priority', 'Status']],
        body: body,
      });
    } else {
      const data = this.filteredFeedbacks().filter(f => {
        let match = true;
        const fDate = new Date(f.dateSubmitted).getTime();
        if (this.exportDateFrom) {
          match = match && fDate >= new Date(this.exportDateFrom).getTime();
        }
        if (this.exportDateTo) {
          match = match && fDate <= new Date(this.exportDateTo).getTime();
        }
        return match;
      });

      const body = data.map(f => [
        f.id.toString(),
        new Date(f.dateSubmitted).toLocaleDateString(),
        f.category,
        f.submittedBy,
        f.rating.toString(),
        f.status
      ]);

      autoTable(doc, {
        startY: 48,
        head: [['ID', 'Date', 'Category', 'User', 'Rating', 'Status']],
        body: body,
      });
    }

    doc.save(`LegacyLens_${isComplaints ? 'Complaints' : 'Feedback'}_Report.pdf`);
    this.showExportPdfModal.set(false);
  }

  ngOnInit() {
    this.syncData();
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  syncData() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.isSyncing.set(true);

    let completed = 0;
    const total = 2;

    const checkComplete = () => {
      completed++;
      if (completed >= total) {
        this.isLoading.set(false);
        this.isSyncing.set(false);
      }
    };

    this.http.get<any>(`${environment.apiUrl}/api/disputes/complaints`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const data = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.complaintsList.set(data);
        checkComplete();
      },
      error: (err) => {
        console.warn('[Disputes] Failed to load complaints', err);
        this.complaintsList.set([]);
        this.hasError.set(true);
        checkComplete();
      }
    });

    this.http.get<any>(`${environment.apiUrl}/api/disputes/feedbacks`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const data = res && res.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        this.feedbacksList.set(data);
        checkComplete();
      },
      error: (err) => {
        console.warn('[Disputes] Failed to load feedbacks', err);
        this.feedbacksList.set([]);
        this.hasError.set(true);
        checkComplete();
      }
    });
  }

  updateComplaintStatus(id: number, status: string) {
    this.http.put<any>(`${environment.apiUrl}/api/disputes/complaints/${id}/status`, { status }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.toastMessage.set(`Complaint #${id} updated to ${status}`);
        this.syncData();
        setTimeout(() => this.toastMessage.set(null), 3000);
      },
      error: (err) => {
        console.warn('[Disputes] Failed to update complaint', err);
        this.complaintsList.update(list => list.map(c => c.id === id ? { ...c, status } : c));
        this.toastMessage.set(`Complaint #${id} updated to ${status}`);
        setTimeout(() => this.toastMessage.set(null), 3000);
      }
    });
  }

  updateFeedbackStatus(id: number, status: string) {
    this.http.put<any>(`${environment.apiUrl}/api/disputes/feedbacks/${id}/status`, { status }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.toastMessage.set(`Feedback #${id} updated to ${status}`);
        this.syncData();
        setTimeout(() => this.toastMessage.set(null), 3000);
      },
      error: (err) => {
        console.warn('[Disputes] Failed to update feedback', err);
        this.feedbacksList.update(list => list.map(f => f.id === id ? { ...f, status } : f));
        this.toastMessage.set(`Feedback #${id} updated to ${status}`);
        setTimeout(() => this.toastMessage.set(null), 3000);
      }
    });
  }
}
