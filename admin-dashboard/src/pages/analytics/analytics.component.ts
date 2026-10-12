import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import {
  DashboardService,
  DashboardStats,
  ModerationItem
} from '../../app/core/services/dashboard.service';


@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
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
          section="Console">
        </app-header>

        <!-- Sub-Header Tabs Navigation (Overview | Analytics) -->
        <div class="bg-white border-b border-[#dde3eb] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none shadow-xs z-20 overflow-x-auto custom-scrollbar">
          <div class="flex items-center gap-1 sm:gap-2 min-w-max">
            <!-- Tab 1: Overview Console -->
            <a 
              routerLink="/dashboard"
              class="border-transparent text-[#6f7978] hover:text-[#191c1c] hover:bg-[#f2f4f3] font-medium flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">dashboard</span>
              <span>Overview</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">Live</span>
            </a>

            <!-- Tab 2: Platform Analytics & Ingestion -->
            <a 
              routerLink="/analytics"
              class="border-[#004343] text-[#004343] font-bold bg-[#004343]/5 flex items-center gap-2 py-3 px-4 text-xs sm:text-sm border-b-2 transition-all rounded-t-lg cursor-pointer">
              <span class="material-symbols-outlined text-lg">analytics</span>
              <span>Analytics & Intake</span>
            </a>
          </div>

          <!-- Quick Right Indicators -->
          <div class="hidden md:flex items-center gap-3 text-xs text-[#6f7978]">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-medium text-[#191c1c]">Systems Online</span>
            </span>
            <span class="font-mono text-[11px]">Block #4,192,801</span>
          </div>
        </div>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          <!-- Interactive Top Action & Live Telemetry Banner -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              
              <h1 class="font-['Source_Serif_4',serif] text-2xl md:text-3xl font-bold text-[#004343] tracking-tight">
                Platform Analytics
              </h1>
              <p class="text-xs text-[#52605f] max-w-2xl leading-relaxed">
                Live platform KPIs derived from moderation, user verification and admin management systems. Real-time counts fetched on load.
              </p>
            </div>

            <!-- Controls -->
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="flex items-center bg-[#f2f4f3] rounded-xl p-1 shadow-sm border border-[#dde3eb]">
                <button
                  (click)="activeRange.set('today')"
                  [ngClass]="activeRange() === 'today' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >Today</button>
                <button
                  (click)="activeRange.set('7d')"
                  [ngClass]="activeRange() === '7d' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >Last 7 Days</button>
                <button
                  (click)="activeRange.set('30d')"
                  [ngClass]="activeRange() === '30d' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >Last 30 Days</button>
                <button
                  (click)="activeRange.set('year')"
                  [ngClass]="activeRange() === 'year' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >This Year</button>
                <button
                  (click)="activeRange.set('all')"
                  [ngClass]="activeRange() === 'all' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#52605f] hover:text-[#191c1c]'"
                  class="px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                >All Time</button>
              </div>

              <button
                (click)="refreshData()"
                title="Refresh Analytics Data"
                class="p-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#004343] transition-colors border border-[#dde3eb] cursor-pointer"
              >
                <span class="material-symbols-outlined text-base" [class.animate-spin]="isLoading()">sync</span>
              </button>
            </div>
          </div>

          <!-- ── Loading / Error States ────────────────────────────────────────── -->
          @if (isLoading()) {
            <div class="flex items-center justify-center py-12">
              <div class="flex flex-col items-center gap-3 text-[#6f7978]">
                <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
                <span class="text-sm font-medium">Fetching live analytics data…</span>
              </div>
            </div>
          }

          @if (hasError() && !isLoading()) {
            <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span class="material-symbols-outlined text-xl">warning</span>
              <span>Backend unreachable — displaying estimated figures. Connect to the API for live data.</span>
            </div>
          }

          @if (!isLoading()) {

            <!-- ── 6 KPI Cards ──────────────────────────────────────────────────── -->
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

              <!-- KPI 1: Total Platform Users -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#004343]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Platform Users</span>
                    <div class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#004343] mt-1">{{ stats()?.totalUsers ?? '—' }}</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#e8f5f4] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">group</span>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between pt-1">
                  <div class="flex items-center gap-1 text-[#004343]">
                    <span class="material-symbols-outlined text-sm">trending_up</span>
                    <span class="text-xs font-bold">Community Members</span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5f4] text-[#004343] font-bold">Live</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004343]"></div>
              </div>

              <!-- KPI 2: Total Content Submissions -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#9b4600]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Content Submissions</span>
                    <div class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#004343] mt-1">{{ stats()?.totalStories ?? '—' }}</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-[#9b4600]">
                    <span class="material-symbols-outlined text-xl">auto_stories</span>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between pt-1">
                  <div class="flex items-center gap-1 text-[#9b4600]">
                    <span class="material-symbols-outlined text-sm">library_books</span>
                    <span class="text-xs font-semibold">Heritage Stories</span>
                  </div>
                  <span class="text-[10px] text-[#6f7978]">All statuses</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe893e]"></div>
              </div>

              <!-- KPI 3: Moderation Approval Rate -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Approval Rate</span>
                    <div class="flex items-baseline gap-1 mt-1">
                      <span class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#004343]">{{ approvalRate() }}</span>
                      <span class="text-sm text-[#6f7978]">%</span>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <span class="material-symbols-outlined text-xl">verified</span>
                  </div>
                </div>
                <div class="mt-4 space-y-1">
                  <div class="w-full bg-[#f2f4f3] h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-500 h-full rounded-full transition-all" [style.width]="approvalRate() + '%'"></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-[#6f7978]">
                    <span>Published / Total</span>
                    <span class="font-bold text-emerald-700">{{ stats()?.publishedStories ?? 0 }} / {{ stats()?.totalStories ?? 0 }}</span>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
              </div>

              <!-- KPI 4: Verified Users % -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#004343]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Verified Users</span>
                    <div class="flex items-baseline gap-1 mt-1">
                      <span class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#004343]">{{ verifiedPct() }}</span>
                      <span class="text-sm text-[#6f7978]">%</span>
                    </div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#004343]/10 flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                </div>
                <div class="mt-4 space-y-1">
                  <div class="w-full bg-[#f2f4f3] h-2 rounded-full overflow-hidden">
                    <div class="bg-[#004343] h-full rounded-full transition-all" [style.width]="verifiedPct() + '%'"></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-[#6f7978]">
                    <span>Verified / Total</span>
                    <span class="font-bold text-[#004343]">{{ stats()?.verifiedUsers ?? 0 }} / {{ stats()?.totalUsers ?? 0 }}</span>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004343]"></div>
              </div>

              <!-- KPI 5: Pending Actions -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#9b4600]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Total Pending Actions</span>
                    <div class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#9b4600] mt-1">{{ totalPending() }}</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#fe893e]/20 flex items-center justify-center text-[#9b4600]">
                    <span class="material-symbols-outlined text-xl">pending_actions</span>
                  </div>
                </div>
                <div class="mt-4 space-y-1 text-[11px] text-[#6f7978]">
                  <div class="flex items-center justify-between">
                    <span>Pending Verifications</span>
                    <span class="font-bold text-[#9b4600]">{{ stats()?.pendingVerifications ?? 0 }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Pending Moderation</span>
                    <span class="font-bold text-[#9b4600]">{{ stats()?.pendingModeration ?? 0 }}</span>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fe893e]"></div>
              </div>

              <!-- KPI 6: Active Admins -->
              <div class="p-5 rounded-xl bg-white border border-[#dde3eb] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#363c42]/40 transition-all">
                <div class="flex items-start justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Active Admins</span>
                    <div class="font-['Source_Serif_4',serif] text-3xl font-bold text-[#004343] mt-1">{{ stats()?.activeAdmins ?? '—' }}</div>
                  </div>
                  <div class="w-10 h-10 rounded-lg bg-[#f2f4f3] flex items-center justify-center text-[#004343]">
                    <span class="material-symbols-outlined text-xl">admin_panel_settings</span>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between pt-1">
                  <div class="flex items-center gap-1.5 text-[#3f4948]">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="text-[11px] font-semibold">of {{ stats()?.totalAdmins ?? 0 }} total admins</span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5f4] text-[#004343] font-bold">Platform Staff</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#363c42]"></div>
              </div>

            </div>

            <!-- ── MIDDLE: Two Columns (Content Type + User Role Distribution) ── -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <!-- Left: Content Type Distribution -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">Content Analytics</span>
                    <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Content Type Distribution</h2>
                  </div>
                  <span class="p-2 rounded-lg bg-[#f2f4f3] text-[#004343]">
                    <span class="material-symbols-outlined text-xl">pie_chart</span>
                  </span>
                </div>

                <!-- Visual CSS bar chart: content types derived from moderation items -->
                <div class="space-y-3">
                  @for (ct of contentTypeBreakdown(); track ct.type) {
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="ct.color"></span>
                          <span class="font-medium text-[#191c1c]">{{ ct.type }}</span>
                        </span>
                        <span class="font-bold" [style.color]="ct.color">{{ ct.count }} <span class="text-[#6f7978] font-normal">({{ ct.pct }}%)</span></span>
                      </div>
                      <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700" [style.width]="ct.pct + '%'" [style.background-color]="ct.color"></div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Stacked segment bar -->
                <div class="pt-2 space-y-1">
                  <div class="text-[11px] text-[#6f7978] font-medium">Overall composition</div>
                  <div class="w-full h-4 rounded-full overflow-hidden flex">
                    @for (ct of contentTypeBreakdown(); track ct.type) {
                      <div class="h-full transition-all" [style.width]="ct.pct + '%'" [style.background-color]="ct.color" [title]="ct.type + ': ' + ct.pct + '%'"></div>
                    }
                  </div>
                  <div class="flex flex-wrap gap-2 pt-1">
                    @for (ct of contentTypeBreakdown(); track ct.type) {
                      <span class="flex items-center gap-1 text-[11px] text-[#6f7978]">
                        <span class="w-2 h-2 rounded-full" [style.background-color]="ct.color"></span> {{ ct.type }}
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Right: User Verification Status Breakdown -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-[#6f7978]">User Analytics</span>
                    <h2 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">Verification Status Breakdown</h2>
                  </div>
                  <span class="p-2 rounded-lg bg-[#f2f4f3] text-[#004343]">
                    <span class="material-symbols-outlined text-xl">donut_large</span>
                  </span>
                </div>

                <div class="space-y-3">
                  @for (us of userStatusBreakdown(); track us.label) {
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-xs">
                        <span class="flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full" [style.background-color]="us.color"></span>
                          <span class="font-medium text-[#191c1c]">{{ us.label }}</span>
                        </span>
                        <span class="font-bold" [style.color]="us.color">{{ us.count }} <span class="text-[#6f7978] font-normal">({{ us.pct }}%)</span></span>
                      </div>
                      <div class="w-full bg-[#f2f4f3] h-3 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700" [style.width]="us.pct + '%'" [style.background-color]="us.color"></div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Summary callouts -->
                <div class="grid grid-cols-3 gap-2 pt-1">
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] text-center">
                    <div class="font-['Source_Serif_4',serif] text-lg font-bold text-[#004343]">{{ stats()?.verifiedUsers ?? 0 }}</div>
                    <div class="text-[10px] text-[#6f7978]">Verified</div>
                  </div>
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] text-center">
                    <div class="font-['Source_Serif_4',serif] text-lg font-bold text-[#9b4600]">{{ stats()?.pendingVerifications ?? 0 }}</div>
                    <div class="text-[10px] text-[#6f7978]">Pending</div>
                  </div>
                  <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] text-center">
                    <div class="font-['Source_Serif_4',serif] text-lg font-bold text-red-600">{{ stats()?.suspendedUsers ?? 0 }}</div>
                    <div class="text-[10px] text-[#6f7978]">Suspended</div>
                  </div>
                </div>
              </div>

            </div>

            <!-- ── BOTTOM: Timeline / Activity Feed ────────────────────────────── -->
            <div class="w-full rounded-2xl bg-white border border-[#dde3eb] shadow-sm p-5 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eceeed] pb-3">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-[#004343] text-white flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">timeline</span>
                  </div>
                  <div>
                    <h2 class="font-['Source_Serif_4',serif] text-base font-bold text-[#191c1c]">Recent Submission Timeline</h2>
                    <p class="text-[11px] text-[#6f7978]">Latest content submissions sorted by date — fetched live from moderation queue</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap text-xs">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Data
                  </span>
                </div>
              </div>

              <!-- Timeline items -->
              <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
                @for (item of timelineItems(); track item.id) {
                  <div class="flex items-start gap-3 p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] hover:bg-[#f2f4f3] transition-colors">
                    <!-- Type icon -->
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      [ngClass]="{
                        'bg-[#004343] text-white': item.type === 'VIDEO',
                        'bg-[#fe893e]/20 text-[#9b4600]': item.type === 'AUDIO',
                        'bg-sky-100 text-sky-700': item.type === 'BLOG',
                        'bg-gray-100 text-gray-600': item.type !== 'VIDEO' && item.type !== 'AUDIO' && item.type !== 'BLOG'
                      }">
                      <span class="material-symbols-outlined text-sm">
                        {{ item.type === 'VIDEO' ? 'videocam' : item.type === 'AUDIO' ? 'mic' : item.type === 'BLOG' ? 'article' : 'description' }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 flex-wrap">
                        <span class="text-xs font-bold text-[#191c1c] truncate">{{ item.title }}</span>
                        <div class="flex items-center gap-2 shrink-0">
                          <!-- Status badge -->
                          @if (item.status === 'PUBLISHED') {
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Published</span>
                          } @else if (item.status === 'PENDING') {
                            <span class="px-2 py-0.5 rounded-full bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">Pending</span>
                          } @else if (item.status === 'REJECTED') {
                            <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">Rejected</span>
                          } @else {
                            <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">Archived</span>
                          }
                          <span class="text-[10px] text-[#6f7978]">{{ formatDate(item.createdAt) }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 mt-0.5 text-[11px] text-[#6f7978]">
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">person</span> {{ item.authorName || 'Unknown' }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-xs">label</span>
                          <span class="px-1.5 py-0 rounded bg-[#f2f4f3] text-[#004343] font-medium">{{ item.type }}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center gap-2 py-8 text-[#6f7978]">
                    <span class="material-symbols-outlined text-3xl">inbox</span>
                    <span class="text-sm">No submissions found.</span>
                  </div>
                }
              </div>
            </div>

          } <!-- end @if (!isLoading()) -->

        </main>
      </div>

    </div>
  `
})
export class AnalyticsComponent implements OnInit {
  user = this.authService.currentUser;
  activeRange = signal<'today' | '7d' | '30d' | 'year' | 'all'>('30d');
  isLoading = signal(false);
  hasError = signal(false);
  toastMessage = signal<string | null>(null);

  // Real data
  stats = signal<DashboardStats | null>(null);
  moderationItems = signal<ModerationItem[]>([]);

  // ── Computed KPIs ─────────────────────────────────────────────────────────
  approvalRate = computed(() => {
    const s = this.stats();
    if (!s || s.totalStories === 0) return 0;
    return Math.round((s.publishedStories / s.totalStories) * 100);
  });

  verifiedPct = computed(() => {
    const s = this.stats();
    if (!s || s.totalUsers === 0) return 0;
    return Math.round((s.verifiedUsers / s.totalUsers) * 100);
  });

  totalPending = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return (s.pendingVerifications || 0) + (s.pendingModeration || 0);
  });

  // ── Content type breakdown ─────────────────────────────────────────────────
  contentTypeBreakdown = computed(() => {
    const items = this.moderationItems();
    if (!items.length) return [
      { type: 'VIDEO', count: 0, pct: 0, color: '#004343' },
      { type: 'AUDIO', count: 0, pct: 0, color: '#fe893e' },
      { type: 'BLOG', count: 0, pct: 0, color: '#3b82f6' }
    ];
    const total = items.length;
    const counts: Record<string, number> = {};
    for (const item of items) {
      const t = item.type?.toUpperCase() || 'OTHER';
      counts[t] = (counts[t] || 0) + 1;
    }
    const colorMap: Record<string, string> = {
      VIDEO: '#004343', AUDIO: '#fe893e', BLOG: '#3b82f6',
      IMAGE: '#9b4600', DOCUMENT: '#363c42', OTHER: '#6f7978'
    };
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / total) * 100),
        color: colorMap[type] || '#6f7978'
      }));
  });

  // ── User verification status breakdown ────────────────────────────────────
  userStatusBreakdown = computed(() => {
    const s = this.stats();
    if (!s || s.totalUsers === 0) return [];
    const total = s.totalUsers;
    return [
      { label: 'Verified', count: s.verifiedUsers, pct: Math.round((s.verifiedUsers / total) * 100), color: '#22c55e' },
      { label: 'Pending', count: s.pendingVerifications, pct: Math.round((s.pendingVerifications / total) * 100), color: '#fe893e' },
      { label: 'Suspended', count: s.suspendedUsers, pct: Math.round((s.suspendedUsers / total) * 100), color: '#ef4444' }
    ].filter(s => s.count > 0);
  });

  // ── Timeline items: last 20 submissions sorted by date desc ───────────────
  timelineItems = computed(() => {
    return [...this.moderationItems()]
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.submittedAt || 0).getTime();
        const db = new Date(b.createdAt || b.submittedAt || 0).getTime();
        return db - da;
      })
      .slice(0, 20);
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.dashboardService.loadAllDashboardData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.moderationItems.set(data.recentModeration);
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
    this.showToast('Refreshing analytics data from all API endpoints…');
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

  inspectManifest(): void {
    this.showToast('Ingest Manifest #UVA-DAMBANA-412 loaded with 412 acoustic tracks.');
  }

  viewChainOfCustody(): void {
    this.showToast('Chain of Custody: Chief Uruwarige Wanniya → Scout #892 → Central Coldvault verified.');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }
}
