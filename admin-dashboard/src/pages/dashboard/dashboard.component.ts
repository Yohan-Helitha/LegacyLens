import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import {
  DashboardService,
  DashboardStats,
  ModerationItem
} from '../../app/core/services/dashboard.service';


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
            <a 
              routerLink="/dashboard"
              class="border-[#004343] text-[#004343] font-bold bg-[#004343]/5 flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">dashboard</span>
              <span>Overview</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#004343] text-white">Live</span>
            </a>

            <!-- Tab 2: Platform Analytics & Ingestion -->
            <a 
              routerLink="/analytics"
              class="border-transparent text-[#6f7978] hover:text-[#191c1c] hover:bg-[#f2f4f3] font-medium flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">analytics</span>
              <span>Analytics & Intake</span>
            </a>
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
        <!-- OVERVIEW PAGE CONTENT (REAL DATA) -->
        <!-- ====================================================================== -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6 animate-in fade-in duration-200">

          <!-- Page Header + Sync Button -->
          <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div class="space-y-1">
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Admin Dashboard Overview
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Live platform metrics aggregated from moderation, user verification, and admin management systems.
              </p>
            </div>
            <div class="flex items-center gap-2.5 bg-white border border-[#dde3eb] p-1.5 rounded-2xl shadow-xs self-start xl:self-auto flex-wrap">
              <button 
                (click)="refreshData()"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-sm" [class.animate-spin]="isLoading()">cached</span>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          <!-- ── Loading State ─────────────────────────────────────────────── -->
          @if (isLoading()) {
            <div class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-[#6f7978]">
                <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
                <span class="text-sm font-medium">Loading dashboard data…</span>
              </div>
            </div>
          }

          <!-- ── Error State ──────────────────────────────────────────────── -->
          @if (hasError() && !isLoading()) {
            <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span class="material-symbols-outlined text-xl">warning</span>
              <span>Backend unreachable — showing cached mock data. Real-time figures will appear once the API is online.</span>
            </div>
          }

          @if (!isLoading()) {
            <!-- ── ROW 1: 4 Stat Cards ──────────────────────────────────────── -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <!-- Total Users -->
              <a routerLink="/verification" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#004343] transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Users</span>
                  <div class="w-8 h-8 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-lg">group</span>
                  </div>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.totalUsers ?? '—' }}</span>
                  <span class="flex items-center text-xs font-bold text-[#004343]">
                    <span class="material-symbols-outlined text-sm">north_east</span> Community
                  </span>
                </div>
                <div class="text-[11px] text-[#6f7978]">Registered platform members</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#004343] h-full rounded-full" [style.width]="totalUsersBar()"></div>
                </div>
              </a>

              <!-- Pending Verifications -->
              <a routerLink="/verification" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#9b4600] transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Pending Verifications</span>
                  <div class="w-8 h-8 rounded-lg bg-[#fe893e]/20 flex items-center justify-center text-[#9b4600]">
                    <span class="material-symbols-outlined text-lg">verified_user</span>
                  </div>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.pendingVerifications ?? '—' }}</span>
                  <span class="flex items-center text-xs font-bold text-[#9b4600]">
                    <span class="material-symbols-outlined text-sm">priority_high</span> Awaiting
                  </span>
                </div>
                <div class="text-[11px] text-[#6f7978]">Elder & custodian dossiers</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#fe893e] h-full rounded-full" [style.width]="pendingVerifBar()"></div>
                </div>
              </a>

              <!-- Total Stories -->
              <a routerLink="/moderation" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#0f5c5c] transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Stories</span>
                  <div class="w-8 h-8 rounded-lg bg-[#004343]/10 flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-lg">auto_stories</span>
                  </div>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.totalStories ?? '—' }}</span>
                  <span class="flex items-center text-xs font-bold text-[#004343]">
                    <span class="material-symbols-outlined text-sm">library_books</span> Content
                  </span>
                </div>
                <div class="text-[11px] text-[#6f7978]">All submitted heritage content</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#0f5c5c] h-full rounded-full" [style.width]="'80%'"></div>
                </div>
              </a>

              <!-- Pending Moderation -->
              <a routerLink="/moderation" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-red-600 transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Pending Moderation</span>
                  <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                    <span class="material-symbols-outlined text-lg">flag</span>
                  </div>
                </div>
                <div class="flex items-baseline justify-between">
                  <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.pendingModeration ?? '—' }}</span>
                  <span class="flex items-center text-xs font-bold text-red-700">
                    <span class="material-symbols-outlined text-sm">trending_up</span> Review
                  </span>
                </div>
                <div class="text-[11px] text-[#6f7978]">Guideline checks & intake review</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-red-600 h-full rounded-full" [style.width]="pendingModerationBar()"></div>
                </div>
              </a>

            </div>

            <!-- ── ROW 2: 4 Stat Cards ──────────────────────────────────────── -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <!-- Published Stories -->
              <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Published Stories</span>
                  <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <span class="material-symbols-outlined text-lg">check_circle</span>
                  </div>
                </div>
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.publishedStories ?? '—' }}</span>
                <div class="text-[11px] text-[#6f7978]">Approved & live heritage content</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" [style.width]="publishedBar()"></div>
                </div>
              </div>

              <!-- Rejected Stories -->
              <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Rejected Stories</span>
                  <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                    <span class="material-symbols-outlined text-lg">cancel</span>
                  </div>
                </div>
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.rejectedStories ?? '—' }}</span>
                <div class="text-[11px] text-[#6f7978]">Failed content guidelines</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-red-500 h-full rounded-full" [style.width]="rejectedBar()"></div>
                </div>
              </div>

              <!-- Total Admins -->
              <a routerLink="/admin-management" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#004343] transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Admins</span>
                  <div class="w-8 h-8 rounded-lg bg-[#004343]/10 flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-lg">admin_panel_settings</span>
                  </div>
                </div>
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.totalAdmins ?? '—' }}</span>
                <div class="text-[11px] text-[#6f7978]">Platform administrators</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-[#004343] h-full rounded-full" style="width: 100%"></div>
                </div>
              </a>

              <!-- Active Admins -->
              <a routerLink="/admin-management" class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-3 group hover:border-[#004343] transition-colors cursor-pointer">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Active Admins</span>
                  <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <span class="material-symbols-outlined text-lg">manage_accounts</span>
                  </div>
                </div>
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">{{ stats()?.activeAdmins ?? '—' }}</span>
                <div class="text-[11px] text-[#6f7978]">Currently active admin accounts</div>
                <div class="w-full bg-[#f2f4f3] h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" [style.width]="activeAdminsBar()"></div>
                </div>
              </a>

            </div>

            <!-- ── TWO-COLUMN BREAKDOWN CHARTS ──────────────────────────────── -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <!-- Left: Moderation Breakdown Bar Chart -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-xs p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#004343] text-white flex items-center justify-center">
                      <span class="material-symbols-outlined text-xl">gavel</span>
                    </div>
                    <div>
                      <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Content Moderation Breakdown</h2>
                      <p class="text-[11px] text-[#6f7978]">Status distribution across all submissions</p>
                    </div>
                  </div>
                  <a routerLink="/moderation" class="text-xs text-[#004343] font-bold hover:underline flex items-center gap-0.5">
                    View all <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>

                <div class="space-y-3">
                  <!-- PENDING -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span>
                        <span class="font-medium text-[#191c1c]">Pending Review</span>
                      </span>
                      <span class="font-bold text-[#9b4600]">{{ stats()?.pendingModeration ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-[#fe893e] h-full rounded-full transition-all duration-700" [style.width]="pendingModerationBar()"></div>
                    </div>
                  </div>

                  <!-- PUBLISHED -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span class="font-medium text-[#191c1c]">Published</span>
                      </span>
                      <span class="font-bold text-emerald-700">{{ stats()?.publishedStories ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-emerald-500 h-full rounded-full transition-all duration-700" [style.width]="publishedBar()"></div>
                    </div>
                  </div>

                  <!-- REJECTED -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span class="font-medium text-[#191c1c]">Rejected</span>
                      </span>
                      <span class="font-bold text-red-700">{{ stats()?.rejectedStories ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-red-500 h-full rounded-full transition-all duration-700" [style.width]="rejectedBar()"></div>
                    </div>
                  </div>

                  <!-- ARCHIVED -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#6f7978]"></span>
                        <span class="font-medium text-[#191c1c]">Archived</span>
                      </span>
                      <span class="font-bold text-[#6f7978]">{{ stats()?.archivedStories ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-[#6f7978] h-full rounded-full transition-all duration-700" [style.width]="archivedBar()"></div>
                    </div>
                  </div>
                </div>

                <!-- Total label -->
                <div class="flex items-center justify-between text-xs text-[#6f7978] border-t border-[#eceeed] pt-2">
                  <span>Total submissions in system</span>
                  <span class="font-bold text-[#191c1c]">{{ stats()?.totalStories ?? 0 }}</span>
                </div>
              </div>

              <!-- Right: User Verification Status Breakdown -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-xs p-5 space-y-4">
                <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#fe893e] text-[#672c00] flex items-center justify-center">
                      <span class="material-symbols-outlined text-xl">verified_user</span>
                    </div>
                    <div>
                      <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">User Verification Status</h2>
                      <p class="text-[11px] text-[#6f7978]">Community member verification breakdown</p>
                    </div>
                  </div>
                  <a routerLink="/verification" class="text-xs text-[#004343] font-bold hover:underline flex items-center gap-0.5">
                    View all <span class="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>
                </div>

                <div class="space-y-3">
                  <!-- VERIFIED -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span class="font-medium text-[#191c1c]">Verified Users</span>
                      </span>
                      <span class="font-bold text-emerald-700">{{ stats()?.verifiedUsers ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-emerald-500 h-full rounded-full transition-all duration-700" [style.width]="verifiedUsersBar()"></div>
                    </div>
                  </div>

                  <!-- PENDING -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-[#fe893e]"></span>
                        <span class="font-medium text-[#191c1c]">Pending Verification</span>
                      </span>
                      <span class="font-bold text-[#9b4600]">{{ stats()?.pendingVerifications ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-[#fe893e] h-full rounded-full transition-all duration-700" [style.width]="pendingVerifBar()"></div>
                    </div>
                  </div>

                  <!-- SUSPENDED -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between text-xs">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span class="font-medium text-[#191c1c]">Suspended Accounts</span>
                      </span>
                      <span class="font-bold text-red-700">{{ stats()?.suspendedUsers ?? 0 }}</span>
                    </div>
                    <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                      <div class="bg-red-500 h-full rounded-full transition-all duration-700" [style.width]="suspendedBar()"></div>
                    </div>
                  </div>
                </div>

                <!-- Total label -->
                <div class="flex items-center justify-between text-xs text-[#6f7978] border-t border-[#eceeed] pt-2">
                  <span>Total community members</span>
                  <span class="font-bold text-[#191c1c]">{{ stats()?.totalUsers ?? 0 }}</span>
                </div>
              </div>

            </div>

            <!-- ── RECENT ACTIVITY TABLE ─────────────────────────────────────── -->
            <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-xs p-5 space-y-4">
              <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#363c42] text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">table_view</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#191c1c]">Recent Moderation Activity</h2>
                    <p class="text-[11px] text-[#6f7978]">Latest 10 content submissions across all statuses</p>
                  </div>
                </div>
                <a routerLink="/moderation" class="px-3 py-1.5 rounded-lg bg-[#f2f4f3] text-[#004343] text-xs font-bold hover:bg-[#004343] hover:text-white transition-colors flex items-center gap-1">
                  <span>Open Moderation Studio</span>
                  <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead>
                    <tr class="bg-[#f2f4f3] text-[#6f7978] font-bold uppercase tracking-wider text-[11px]">
                      <th class="px-4 py-3 rounded-l-lg">Title</th>
                      <th class="px-4 py-3">Contributor</th>
                      <th class="px-4 py-3">Type</th>
                      <th class="px-4 py-3">Status</th>
                      <th class="px-4 py-3 rounded-r-lg text-right">Submitted</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#f2f4f3]">
                    @for (item of recentItems(); track item.id) {
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <td class="px-4 py-3 font-medium text-[#191c1c] max-w-[200px] truncate">{{ item.title }}</td>
                        <td class="px-4 py-3 text-[#52605f]">{{ item.authorName || '—' }}</td>
                        <td class="px-4 py-3">
                          <span class="px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#004343] font-medium text-[11px] border border-[#dde3eb]">
                            {{ item.type }}
                          </span>
                        </td>
                        <td class="px-4 py-3">
                          @if (item.status === 'PUBLISHED') {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <span class="material-symbols-outlined text-sm">check_circle</span> Published
                            </span>
                          } @else if (item.status === 'PENDING') {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#fe893e]/20 text-[#9b4600] text-[11px] font-bold">
                              <span class="material-symbols-outlined text-sm">pending</span> Pending
                            </span>
                          } @else if (item.status === 'REJECTED') {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                              <span class="material-symbols-outlined text-sm">cancel</span> Rejected
                            </span>
                          } @else {
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                              <span class="material-symbols-outlined text-sm">inventory_2</span> Archived
                            </span>
                          }
                        </td>
                        <td class="px-4 py-3 text-right text-[#6f7978]">{{ formatDate(item.createdAt) }}</td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="px-4 py-8 text-center text-[#6f7978]">
                          No moderation items found.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

          } <!-- end @if (!isLoading()) -->

        </main>


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
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  // Real data signals
  stats = signal<DashboardStats | null>(null);
  recentItems = signal<ModerationItem[]>([]);

  // ── Computed bar widths ───────────────────────────────────────────────────
  totalUsersBar = computed(() => {
    const s = this.stats();
    return s && s.totalUsers > 0 ? Math.min(100, Math.round((s.totalUsers / 200) * 100)) + '%' : '0%';
  });
  pendingVerifBar = computed(() => {
    const s = this.stats();
    return s && s.totalUsers > 0 ? Math.min(100, Math.round((s.pendingVerifications / s.totalUsers) * 100)) + '%' : '0%';
  });
  pendingModerationBar = computed(() => {
    const s = this.stats();
    return s && s.totalStories > 0 ? Math.min(100, Math.round((s.pendingModeration / s.totalStories) * 100)) + '%' : '0%';
  });
  publishedBar = computed(() => {
    const s = this.stats();
    return s && s.totalStories > 0 ? Math.min(100, Math.round((s.publishedStories / s.totalStories) * 100)) + '%' : '0%';
  });
  rejectedBar = computed(() => {
    const s = this.stats();
    return s && s.totalStories > 0 ? Math.min(100, Math.round((s.rejectedStories / s.totalStories) * 100)) + '%' : '0%';
  });
  archivedBar = computed(() => {
    const s = this.stats();
    return s && s.totalStories > 0 ? Math.min(100, Math.round((s.archivedStories / s.totalStories) * 100)) + '%' : '0%';
  });
  verifiedUsersBar = computed(() => {
    const s = this.stats();
    return s && s.totalUsers > 0 ? Math.min(100, Math.round((s.verifiedUsers / s.totalUsers) * 100)) + '%' : '0%';
  });
  suspendedBar = computed(() => {
    const s = this.stats();
    return s && s.totalUsers > 0 ? Math.min(100, Math.round((s.suspendedUsers / s.totalUsers) * 100)) + '%' : '0%';
  });
  activeAdminsBar = computed(() => {
    const s = this.stats();
    return s && s.totalAdmins > 0 ? Math.min(100, Math.round((s.activeAdmins / s.totalAdmins) * 100)) + '%' : '0%';
  });

  // ── Static data for charts ─────────────────────────────────────────────────
  monthlyData = [
    { label: 'May', oral: 55, craft: 38, ritual: 24, current: false },
    { label: 'Jun', oral: 64, craft: 44, ritual: 32, current: false },
    { label: 'Jul', oral: 78, craft: 52, ritual: 45, current: false },
    { label: 'Aug', oral: 72, craft: 49, ritual: 48, current: false },
    { label: 'Sep', oral: 86, craft: 61, ritual: 55, current: false },
    { label: 'Oct', oral: 96, craft: 75, ritual: 68, current: true }
  ];

  provinces = [
    { name: 'Central Province', count: 3892, pct: 88, color: '#004343' },
    { name: 'Southern Province', count: 2914, pct: 74, color: '#0f5c5c' },
    { name: 'Northern Province', count: 2410, pct: 68, color: '#fe893e' },
    { name: 'Eastern Province', count: 1980, pct: 58, color: '#9b4600' }
  ];

  auditLogs = signal<AuditLog[]>([
    { id: '1', blockHash: '0x8F92...B310', hub: 'Central (Kandy Hub-01)', routine: 'Elder Signature Re-attestation', payloadType: 'Ola Leaf Manuscript', status: 'VERIFIED', timestamp: 'Just now (14:32:18)' },
    { id: '2', blockHash: '0x4C18...91EE', hub: 'Northern (Jaffna Hub-03)', routine: 'FLAC Multi-track Audio Hash', payloadType: 'Carnatic Temple Chants', status: 'VERIFIED', timestamp: '3 mins ago (14:29:02)' },
    { id: '3', blockHash: '0x11A0...76CD', hub: 'Southern (Galle Hub-02)', routine: 'Copyright Provenance Check', payloadType: 'Kolam Mask Carving Blueprint', status: 'RESOLVING', timestamp: '11 mins ago (14:21:44)' },
    { id: '4', blockHash: '0x992B...01F2', hub: 'Eastern (Trinco Hub-01)', routine: 'IPFS Cold-Storage Mirror Sync', payloadType: 'Maritime Folklore Records', status: 'VERIFIED', timestamp: '24 mins ago (14:08:12)' }
  ]);

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dashboardService: DashboardService
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

    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.dashboardService.loadAllDashboardData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        // Take last 10 sorted by date descending
        const sorted = [...data.recentModeration].sort((a, b) => {
          const da = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const db = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return db - da;
        });
        this.recentItems.set(sorted.slice(0, 10));
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  refreshData(): void {
    this.loadData();
    this.toastMessage.set('Refreshing dashboard data from all API endpoints…');
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  setActiveTab(tab: 'overview' | 'analytics'): void {
    this.activeTab.set(tab);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  syncCaches(): void {
    this.isSyncing.set(true);
    this.toastMessage.set('Re-synchronizing 9 Provincial Cold Caches…');
    setTimeout(() => {
      this.isSyncing.set(false);
      this.toastMessage.set('Provincial caches successfully synchronized.');
      setTimeout(() => this.toastMessage.set(null), 3500);
    }, 1200);
  }

  exportReport(): void {
    this.toastMessage.set('Exporting National Heritage Audit Report (CSV + SHA-256 certificate)…');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  approveElder(name: string): void {
    this.toastMessage.set(`Elder credentials for "${name}" approved & certified.`);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  broadcastAlert(): void {
    this.toastMessage.set('High-priority alert dispatched to all regional GN officers.');
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
