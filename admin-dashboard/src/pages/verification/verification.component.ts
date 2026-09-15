import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { VerificationService } from '../../app/core/services/verification.service';
import { AdminUserVerificationResponse, AdminUserRoleDto } from '../../app/core/models/verification.model';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export type VerificationTab = 'verification' | 'directory';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      <div 
        *ngIf="toastMessage()" 
        class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 transition-all duration-300 animate-bounce">
        <span class="material-symbols-outlined text-emerald-300 text-xl">verified_user</span>
        <div class="text-xs font-semibold">{{ toastMessage() }}</div>
        <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs cursor-pointer">✕</button>
      </div>

      <!-- Suspend Modal -->
      <div *ngIf="userToSuspend()" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div class="flex items-center gap-3 text-red-600">
            <span class="material-symbols-outlined text-3xl">gavel</span>
            <h3 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#202426]">Suspend User Account</h3>
          </div>
          <p class="text-xs text-[#3f4948]">
            Are you sure you want to suspend <strong class="text-[#202426]">{{ userToSuspend()?.fullName }}</strong>?
            All active roles will be deactivated and the account will be locked.
          </p>
          <div>
            <label class="block text-[11px] font-bold text-[#6f7978] uppercase mb-1">Reason for suspension</label>
            <input 
              type="text" 
              [(ngModel)]="suspendReason"
              placeholder="e.g. Terms violation, policy breach..." 
              class="w-full p-2.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-red-500"
            />
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button 
              (click)="userToSuspend.set(null)"
              class="px-4 py-2 rounded-xl text-xs font-bold text-[#3f4948] hover:bg-[#f2f4f3] cursor-pointer">
              Cancel
            </button>
            <button 
              (click)="confirmSuspend()"
              [disabled]="isActionLoading()"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              <span>{{ isActionLoading() ? 'Suspending...' : 'Confirm Suspension' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <div *ngIf="userToDelete()" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
          <div class="flex items-center gap-3 text-red-600">
            <span class="material-symbols-outlined text-3xl">delete_forever</span>
            <h3 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#202426]">Permanently Delete User</h3>
          </div>
          <p class="text-xs text-[#3f4948]">
            Are you sure you want to permanently delete <strong class="text-[#202426]">{{ userToDelete()?.fullName }}</strong>?
            This will permanently remove the user record and all associated role assignments from the database. This action cannot be undone.
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button 
              (click)="userToDelete.set(null)"
              class="px-4 py-2 rounded-xl text-xs font-bold text-[#3f4948] hover:bg-[#f2f4f3] cursor-pointer">
              Cancel
            </button>
            <button 
              (click)="confirmDelete()"
              [disabled]="isActionLoading()"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
              <span>{{ isActionLoading() ? 'Deleting...' : 'Delete Permanently' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <!-- Top Navigation Header -->
        <app-header 
          pageTitle="Profile Verification & Management" 
          section="Console">
        </app-header>

        <!-- Top Navigation Bar: Opportunity-Style Section Tabs -->
        <div class="bg-white border-b border-[#dde3eb] px-6 py-2.5 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-1 sm:gap-2">
            
            <!-- 1. Verification Queue Tab -->
            <button 
              (click)="switchTab('verification')"
              [class]="currentTab() === 'verification' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">verified_user</span>
              <span>Verification Queue</span>
              <span 
                [class]="currentTab() === 'verification' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" 
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {{ pendingCount() }}
              </span>
            </button>

            <!-- 2. Profile Management Tab -->
            <button 
              (click)="switchTab('directory')"
              [class]="currentTab() === 'directory' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">badge</span>
              <span>Profile Management</span>
              <span 
                [class]="currentTab() === 'directory' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" 
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {{ allCount() }}
              </span>
            </button>

          </div>

          <!-- Refresh CTA -->
          <div class="flex items-center gap-2">
            <button 
              (click)="loadVerifications()"
              [disabled]="isLoading()"
              title="Refresh from server"
              class="px-3 py-1.5 bg-[#f8faf9] hover:bg-[#eceeed] border border-[#dde3eb] text-[#004343] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
              <span class="material-symbols-outlined text-sm" [class.animate-spin]="isLoading()">refresh</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- ========================================================================= -->
        <!-- TAB 1: VERIFICATION QUEUE & ADJUDICATION WORKSPACE                         -->
        <!-- ========================================================================= -->
        <div *ngIf="currentTab() === 'verification'" class="flex-1 flex flex-col h-[calc(100vh-120px)] overflow-hidden bg-[#f8faf9]">
          
          <!-- Subheader Filter & Search Ribbon -->
          <div class="p-4 md:px-6 bg-white border-b border-[#dde3eb] flex flex-col gap-3 shrink-0">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] flex items-center gap-2">
                  <span>Community Verification Queue</span>
                </h2>
                <p class="text-xs text-[#6f7978]">Review identity documents, OTP confirmation, and activate assigned roles</p>
              </div>

              <!-- Search Bar -->
              <div class="relative w-full sm:w-80">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-[#6f7978] text-sm">search</span>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  placeholder="Search name, NIC, phone, city, ID..." 
                  class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-8 py-2 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all"
                />
                <button 
                  *ngIf="searchQuery" 
                  (click)="searchQuery = ''" 
                  class="absolute right-2.5 top-2.5 text-[#6f7978] hover:text-[#191c1c] text-xs cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <!-- Filter Controls Bar -->
            <div class="flex flex-col gap-3 pt-2 border-t border-[#eceeed]">
              
              <!-- Row 1: Status & Role Filter Chips -->
              <div class="flex items-center gap-64 overflow-x-auto pb-1 shrink-0">
                
                <!-- Status Filter Group -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mr-0.5">Status:</span>
                  
                  <button 
                    (click)="activeStatusFilter.set('PENDING')"
                    [class]="activeStatusFilter() === 'PENDING' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    Pending ({{ pendingCount() }})
                  </button>

                  <button 
                    (click)="activeStatusFilter.set('VERIFIED')"
                    [class]="activeStatusFilter() === 'VERIFIED' ? 'bg-emerald-700 text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    Verified ({{ verifiedCount() }})
                  </button>

                  <button 
                    (click)="activeStatusFilter.set('REJECTED')"
                    [class]="activeStatusFilter() === 'REJECTED' ? 'bg-red-700 text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    Rejected ({{ rejectedCount() }})
                  </button>

                  <button 
                    (click)="activeStatusFilter.set('ALL')"
                    [class]="activeStatusFilter() === 'ALL' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    All ({{ allCount() }})
                  </button>
                </div>

                <div class="h-4 w-px bg-[#dde3eb] shrink-0"></div>

                <!-- Role Filter Group -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978] mr-0.5">Role:</span>
                  
                  <button 
                    (click)="activeRoleFilter.set('ALL')"
                    [class]="activeRoleFilter() === 'ALL' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    All Roles
                  </button>

                  <button 
                    (click)="activeRoleFilter.set('ELDER')"
                    [class]="activeRoleFilter() === 'ELDER' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    Elders ({{ eldersCount() }})
                  </button>

                  <button 
                    (click)="activeRoleFilter.set('YOUTH_CREATOR')"
                    [class]="activeRoleFilter() === 'YOUTH_CREATOR' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer">
                    Youth Creators ({{ creatorsCount() }})
                  </button>
                </div>

              </div>

              <!-- Row 2: Date Selector Filter -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Date:</span>
                
                <div class="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-[#dde3eb]">
                  <button 
                    (click)="setDatePreset('all')"
                    [class]="activeDatePreset() === 'all' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    All Time
                  </button>
                  <button 
                    (click)="setDatePreset('today')"
                    [class]="activeDatePreset() === 'today' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    Today
                  </button>
                  <button 
                    (click)="setDatePreset('7days')"
                    [class]="activeDatePreset() === '7days' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    7 Days
                  </button>
                  <button 
                    (click)="setDatePreset('month')"
                    [class]="activeDatePreset() === 'month' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    Month
                  </button>
                </div>

                <div class="flex items-center gap-1.5">
                  <input 
                    type="date" 
                    [(ngModel)]="dateFrom" 
                    (change)="activeDatePreset.set('custom')"
                    title="From date"
                    class="p-1 bg-[#f8faf9] border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                  <span class="text-xs text-[#6f7978]">to</span>
                  <input 
                    type="date" 
                    [(ngModel)]="dateTo" 
                    (change)="activeDatePreset.set('custom')"
                    title="To date"
                    class="p-1 bg-[#f8faf9] border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>

                <button 
                  *ngIf="isAnyVerificationFilterActive()"
                  (click)="resetVerificationFilters()"
                  title="Reset verification filters"
                  class="px-2.5 py-1 bg-[#f2f4f3] hover:bg-red-50 hover:text-red-700 text-[11px] font-bold text-[#3f4948] rounded-xl border border-[#dde3eb] flex items-center gap-1 transition-colors cursor-pointer">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>Reset</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Loading Spinner -->
          <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-20 space-y-3">
            <div class="w-10 h-10 border-4 border-[#004343]/20 border-t-[#004343] rounded-full animate-spin"></div>
            <p class="text-xs text-[#6f7978] font-medium">Loading user profiles from database...</p>
          </div>

          <!-- 2-Column Split Workspace -->
          <div *ngIf="!isLoading()" class="flex-1 overflow-hidden p-6 grid grid-cols-12 gap-6">
            
            <!-- LEFT COLUMN: User Queue (4 cols) -->
            <div class="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden">
              <div class="flex items-center justify-between pb-2 px-1">
                <span class="text-xs font-bold text-[#202426]">Matching Applicants</span>
                <span class="text-xs font-semibold text-[#6f7978]">{{ filteredVerificationUsers().length }} of {{ users().length }}</span>
              </div>

              <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div *ngIf="filteredVerificationUsers().length === 0" class="bg-white p-8 rounded-2xl border border-[#dde3eb] text-center space-y-2">
                  <span class="material-symbols-outlined text-4xl text-[#6f7978]">person_search</span>
                  <p class="text-xs font-bold text-[#202426]">No matching applicants found</p>
                  <p class="text-[11px] text-[#6f7978]">Try resetting search or adjusting status / role filters.</p>
                  <button 
                    (click)="resetVerificationFilters()"
                    class="mt-2 text-xs text-[#004343] font-bold underline cursor-pointer">
                    Clear all filters
                  </button>
                </div>

                <div 
                  *ngFor="let u of filteredVerificationUsers()"
                  (click)="selectUser(u)"
                  [class]="selectedUser()?.id === u.id ? 'border-[#004343] bg-white ring-2 ring-[#004343]/30 shadow-md translate-x-1' : 'border-[#dde3eb] bg-white hover:border-[#6f7978]/40 shadow-xs'"
                  class="p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden">
                  
                  <div *ngIf="selectedUser()?.id === u.id" class="absolute left-0 top-0 bottom-0 w-1.5 bg-[#004343]"></div>

                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <img 
                          *ngIf="u.profilePhotoUrl"
                          [src]="u.profilePhotoUrl" 
                          [alt]="u.fullName"
                          class="w-11 h-11 rounded-xl object-cover shadow-xs"
                        />
                        <div 
                          *ngIf="!u.profilePhotoUrl"
                          class="w-11 h-11 rounded-xl bg-[#004343] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {{ getInitials(u.fullName) }}
                        </div>
                        <span *ngIf="hasRole(u, 'ELDER')" class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#fe893e] flex items-center justify-center text-white text-[10px] font-bold">★</span>
                      </div>

                      <div class="min-w-0">
                        <h4 class="font-bold text-xs text-[#202426] truncate">{{ u.fullName }}</h4>
                        <p class="text-[11px] text-[#6f7978] truncate">NIC: {{ u.nicNumber || 'N/A' }}</p>
                      </div>
                    </div>
                    
                    <span 
                      [class]="u.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : (u.verificationStatus === 'REJECTED' || u.verificationStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')"
                      class="px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                      {{ (u.verificationStatus === 'SUSPENDED' || u.verificationStatus === 'REJECTED') ? 'REJECTED' : u.verificationStatus }}
                    </span>
                  </div>

                  <div class="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-[#6f7978]">
                    <span *ngIf="u.cityName" class="inline-flex items-center gap-1 bg-[#f2f4f3] px-2 py-0.5 rounded text-[#3f4948]">
                      <span class="material-symbols-outlined text-[12px]">location_on</span>
                      {{ u.cityName }}
                    </span>
                    <span class="inline-flex items-center gap-1 bg-[#004343]/10 px-2 py-0.5 rounded text-[#004343] font-bold">
                      {{ u.applyingTitle }}
                    </span>
                    <span class="ml-auto text-[10px] text-[#6f7978]">
                      {{ u.createdAt ? (u.createdAt | date:'shortDate') : '' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: Detailed User Dossier (8 cols) -->
            <div class="col-span-12 lg:col-span-8 flex flex-col h-full overflow-y-auto space-y-5" *ngIf="selectedUser() as u">
              
              <!-- Dossier Header Card -->
              <div class="bg-white rounded-2xl shadow-xs border border-[#dde3eb] p-6 space-y-6">
                
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#eceeed]">
                  <div class="flex items-center gap-4">
                    <img 
                      *ngIf="u.profilePhotoUrl"
                      [src]="u.profilePhotoUrl" 
                      [alt]="u.fullName"
                      class="w-16 h-16 rounded-2xl object-cover shadow-sm ring-2 ring-[#004343]/20"
                    />
                    <div 
                      *ngIf="!u.profilePhotoUrl"
                      class="w-16 h-16 rounded-2xl bg-[#004343] text-white flex items-center justify-center font-bold text-xl shadow-sm ring-2 ring-[#004343]/20">
                      {{ getInitials(u.fullName) }}
                    </div>

                    <div class="space-y-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="font-['Source_Serif_4',serif] text-xl font-bold text-[#202426]">{{ u.fullName }}</h2>
                        <span 
                          [class]="u.accountStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : (u.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800')"
                          class="px-2.5 py-0.5 rounded-full text-xs font-bold">
                          Account: {{ u.accountStatus }}
                        </span>
                      </div>
                      <p class="text-xs text-[#6f7978]">
                        Phone: <span class="font-mono font-semibold text-[#202426]">{{ u.phoneNumber }}</span>
                        <span *ngIf="u.phoneVerified" class="text-emerald-700 font-bold ml-1">
                          ✓ Phone Verified
                        </span>
                        <span *ngIf="!u.phoneVerified" class="text-amber-700 font-bold ml-1">
                          ⚠ Unverified Phone
                        </span>
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-col md:items-end gap-1 text-xs">
                    <span class="text-[#6f7978]">User ID</span>
                    <span class="font-mono text-[11px] bg-[#f2f4f3] px-2.5 py-1 rounded text-[#202426] font-bold tracking-wider border border-[#dde3eb]">
                      {{ u.id }}
                    </span>
                    <span 
                      [class]="u.verificationStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-[#9b4600]'"
                      class="font-bold mt-0.5">
                      Status: {{ (u.verificationStatus === 'SUSPENDED' || u.verificationStatus === 'REJECTED') ? 'REJECTED' : u.verificationStatus }}
                    </span>
                  </div>
                </div>

                <!-- Identity & Account Data Grid -->
                <div>
                  <h3 class="text-xs uppercase tracking-wider text-[#202426] font-bold mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[#004343] text-base">badge</span>
                    <span>Identity & Account Data</span>
                  </h3>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    
                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">NIC Number</p>
                      <p class="text-xs font-bold text-[#202426] font-mono">{{ u.nicNumber || 'Not Provided' }}</p>
                    </div>

                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">Date of Birth</p>
                      <p class="text-xs font-bold text-[#202426]">{{ u.dateOfBirth || 'Not Provided' }}</p>
                    </div>

                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">City / Region</p>
                      <p class="text-xs font-bold text-[#202426]">
                        {{ u.cityName ? u.cityName + (u.cityRegion ? ', ' + u.cityRegion : '') : 'Not Assigned' }}
                      </p>
                    </div>

                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">Phone Verification</p>
                      <p class="text-xs font-bold" [class.text-emerald-700]="u.phoneVerified" [class.text-amber-700]="!u.phoneVerified">
                        {{ u.phoneVerified ? 'Verified via SMS OTP' : 'Pending OTP Verification' }}
                      </p>
                    </div>

                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">Biometric Auth</p>
                      <p class="text-xs font-bold text-[#202426]">
                        {{ u.fingerprintEnabled ? 'Fingerprint Enabled' : 'PIN Only' }}
                      </p>
                    </div>

                    <div class="p-3 bg-[#f8faf9] rounded-xl border border-[#dde3eb] space-y-0.5">
                      <p class="text-[10px] text-[#6f7978] uppercase font-bold">Member Since</p>
                      <p class="text-xs font-bold text-[#202426]">
                        {{ u.createdAt ? (u.createdAt | date:'mediumDate') : 'N/A' }}
                      </p>
                    </div>

                  </div>
                </div>

                <!-- Assigned User Roles -->
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs uppercase tracking-wider text-[#202426] font-bold flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-[#004343] text-base">shield_person</span>
                      <span>Assigned User Roles ({{ u.roleDetails ? u.roleDetails.length : 0 }})</span>
                    </h3>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      *ngFor="let role of u.roleDetails"
                      class="bg-[#f8faf9] p-3.5 rounded-xl border border-[#dde3eb] shadow-2xs flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center font-bold">
                          <span class="material-symbols-outlined text-base">
                            {{ role.roleType === 'ELDER' ? 'elderly' : (role.roleType === 'YOUTH_CREATOR' ? 'palette' : (role.roleType === 'ADMIN' ? 'shield' : 'person')) }}
                          </span>
                        </div>
                        <div>
                          <p class="text-xs font-bold text-[#202426]">{{ role.roleType }}</p>
                          <p class="text-[10px] text-[#6f7978]">
                            {{ role.activatedAt ? ('Activated: ' + (role.activatedAt | date:'mediumDate')) : 'Pending Activation' }}
                          </p>
                        </div>
                      </div>

                      <span 
                        [class]="role.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                        class="px-2.5 py-1 rounded-md text-[10px] font-bold">
                        {{ role.status }}
                      </span>
                    </div>

                    <div *ngIf="!u.roleDetails || u.roleDetails.length === 0" class="col-span-2 p-4 bg-[#f8faf9] rounded-xl text-center text-xs text-[#6f7978]">
                      No roles recorded for this user.
                    </div>
                  </div>
                </div>

              </div>

              <!-- Verification Adjudication & Action Card -->
              <div class="bg-white rounded-2xl shadow-xs border border-[#dde3eb] p-6 space-y-4">
                <div class="flex items-center justify-between border-b border-[#eceeed] pb-3">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#004343] text-xl">gavel</span>
                    <h3 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#202426]">Verification Actions</h3>
                  </div>
                  <span class="text-xs text-[#6f7978]">Admin: {{ adminName() }}</span>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  <!-- Action 1: Reject / Deactivate -->
                  <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] flex flex-col justify-between space-y-3">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#202426]">
                        <span class="material-symbols-outlined text-sm text-[#9b4600]">block</span>
                        <span>Reject / Deactivate</span>
                      </div>
                      <p class="text-xs text-[#6f7978]">
                        Deactivate assigned roles or reject verification request.
                      </p>
                      <input 
                        type="text" 
                        [(ngModel)]="rejectionReason" 
                        placeholder="Reason (e.g. NIC mismatch, invalid documents)..." 
                        class="w-full mt-1 p-2 bg-white border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                      />
                    </div>

                    <button 
                      (click)="rejectUser()"
                      [disabled]="isActionLoading()"
                      class="w-full py-2.5 rounded-lg bg-[#f2f4f3] hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent text-[#202426] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                      <span class="material-symbols-outlined text-sm">cancel</span>
                      <span>{{ isActionLoading() ? 'Updating...' : 'Reject / Deactivate' }}</span>
                    </button>
                  </div>

                  <!-- Action 2: Approve & Activate -->
                  <div class="p-4 rounded-xl bg-[#004343]/5 border border-[#004343]/20 flex flex-col justify-between space-y-3">
                    <div class="space-y-1.5">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-[#004343]">
                        <span class="material-symbols-outlined text-sm">verified_user</span>
                        <span>Approve & Activate Role</span>
                      </div>
                      <p class="text-xs text-[#3f4948]">
                        Sets user role status to ACTIVE in database and assigns verified standing.
                      </p>
                      <input 
                        type="text" 
                        [(ngModel)]="auditNote" 
                        placeholder="Audit note (optional)..." 
                        class="w-full p-2 bg-white border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                      />
                    </div>

                    <button 
                      (click)="approveUser()"
                      [disabled]="isActionLoading()"
                      class="w-full py-2.5 rounded-lg bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50">
                      <span class="material-symbols-outlined text-base">check_circle</span>
                      <span>{{ isActionLoading() ? 'Activating...' : 'Approve & Activate User' }}</span>
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- ========================================================================= -->
        <!-- TAB 2: PROFILE MANAGEMENT DIRECTORY & ROSTER                              -->
        <!-- ========================================================================= -->
        <div *ngIf="currentTab() === 'directory'" class="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8faf9]">
          
          <!-- Subheader Overview -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] flex items-center gap-2">
                <span>User Profile Directory & Roster</span>
              </h2>
              <p class="text-xs text-[#6f7978]">Comprehensive database roster of community members, elders, and youth creators</p>
            </div>
          </div>

          <!-- Quick KPI Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Total Registered Users</p>
                <p class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#202426] mt-1">{{ allCount() }}</p>
                <p class="text-[11px] text-emerald-700 font-semibold mt-0.5">Database User Records</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">groups</span>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Elder Keepers</p>
                <p class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#202426] mt-1">{{ eldersCount() }}</p>
                <p class="text-[11px] text-[#9b4600] font-semibold mt-0.5">Knowledge Custodians</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">elderly</span>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Youth Creators</p>
                <p class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#202426] mt-1">{{ creatorsCount() }}</p>
                <p class="text-[11px] text-[#004343] font-semibold mt-0.5">Artisans & Documenters</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">palette</span>
              </div>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-xs flex items-center justify-between">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Pending Review</p>
                <p class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#9b4600] mt-1">{{ pendingCount() }}</p>
                <p class="text-[11px] text-[#6f7978] mt-0.5">Awaiting Verification</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">pending_actions</span>
              </div>
            </div>

          </div>

          <!-- Directory Toolbar: Search + Role + Status + Date Filters -->
          <div class="bg-white p-4 rounded-2xl border border-[#dde3eb] shadow-xs flex flex-col gap-3">
            
            <!-- Row 1: Search Bar & Select Dropdowns -->
            <div class="flex flex-col md:flex-row items-center justify-between gap-3">
              <div class="relative flex-1 w-full">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
                <input 
                  type="text" 
                  [(ngModel)]="directorySearchQuery" 
                  placeholder="Filter directory by name, NIC, phone, city..." 
                  class="w-full pl-9 pr-8 py-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                />
                <button 
                  *ngIf="directorySearchQuery" 
                  (click)="directorySearchQuery = ''" 
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer">
                  ✕
                </button>
              </div>

              <div class="flex items-center gap-2 w-full md:w-auto">
                <!-- Roles (No Youth Learners) -->
                <select 
                  [(ngModel)]="directoryRoleFilter"
                  class="p-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Roles</option>
                  <option value="ELDER">Elders</option>
                  <option value="YOUTH_CREATOR">Youth Creators</option>
                  <option value="GENERAL_USER">General Users</option>
                </select>

                <select 
                  [(ngModel)]="directoryStatusFilter"
                  class="p-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] cursor-pointer">
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <!-- Row 2: Directory Date Selector Filter (Right-aligned) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#eceeed]">
              <div class="text-xs text-[#6f7978] font-medium hidden sm:block">
                Showing {{ filteredDirectoryUsers().length }} of {{ users().length }} records
              </div>

              <div class="flex items-center gap-2 flex-wrap ml-auto">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">Registered Date:</span>
                
                <div class="flex items-center gap-1 bg-[#f8faf9] p-1 rounded-xl border border-[#dde3eb]">
                  <button 
                    (click)="setDirectoryDatePreset('all')"
                    [class]="directoryDatePreset() === 'all' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    All Time
                  </button>
                  <button 
                    (click)="setDirectoryDatePreset('today')"
                    [class]="directoryDatePreset() === 'today' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    Today
                  </button>
                  <button 
                    (click)="setDirectoryDatePreset('7days')"
                    [class]="directoryDatePreset() === '7days' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    7 Days
                  </button>
                  <button 
                    (click)="setDirectoryDatePreset('month')"
                    [class]="directoryDatePreset() === 'month' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer">
                    Month
                  </button>
                </div>

                <div class="flex items-center gap-1.5">
                  <input 
                    type="date" 
                    [(ngModel)]="directoryDateFrom" 
                    (change)="directoryDatePreset.set('custom')"
                    title="From date"
                    class="p-1 bg-[#f8faf9] border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                  <span class="text-xs text-[#6f7978]">to</span>
                  <input 
                    type="date" 
                    [(ngModel)]="directoryDateTo" 
                    (change)="directoryDatePreset.set('custom')"
                    title="To date"
                    class="p-1 bg-[#f8faf9] border border-[#dde3eb] rounded-lg text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                  />
                </div>

                <button 
                  *ngIf="isAnyDirectoryFilterActive()"
                  (click)="resetDirectoryFilters()"
                  title="Reset directory filters"
                  class="px-2.5 py-1 bg-[#f2f4f3] hover:bg-red-50 hover:text-red-700 text-[11px] font-bold text-[#3f4948] rounded-xl border border-[#dde3eb] flex items-center gap-1 transition-colors cursor-pointer">
                  <span class="material-symbols-outlined text-sm">filter_alt_off</span>
                  <span>Reset</span>
                </button>
              </div>

            </div>

          </div>

          <!-- Directory Table -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-xs overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-[#f8faf9] border-b border-[#dde3eb] text-[10px] font-bold uppercase tracking-wider text-[#6f7978]">
                    <th class="p-3.5 pl-5">User Profile</th>
                    <th class="p-3.5">Contact / Phone</th>
                    <th class="p-3.5">Location</th>
                    <th class="p-3.5">Assigned Roles</th>
                    <th class="p-3.5">Verification</th>
                    <th class="p-3.5">Account Status</th>
                    <th class="p-3.5">Registered</th>
                    <th class="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#eceeed]">
                  <tr *ngFor="let u of filteredDirectoryUsers()" class="hover:bg-[#f8faf9] transition-colors">
                    
                    <!-- User Profile -->
                    <td class="p-3.5 pl-5">
                      <div class="flex items-center gap-3">
                        <img 
                          *ngIf="u.profilePhotoUrl"
                          [src]="u.profilePhotoUrl" 
                          [alt]="u.fullName"
                          class="w-9 h-9 rounded-xl object-cover shadow-xs"
                        />
                        <div 
                          *ngIf="!u.profilePhotoUrl"
                          class="w-9 h-9 rounded-xl bg-[#004343] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {{ getInitials(u.fullName) }}
                        </div>
                        <div>
                          <p class="font-bold text-[#202426]">{{ u.fullName }}</p>
                          <p class="text-[11px] text-[#6f7978] font-mono">NIC: {{ u.nicNumber || 'N/A' }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Contact -->
                    <td class="p-3.5">
                      <p class="font-mono font-medium text-[#202426]">{{ u.phoneNumber }}</p>
                      <span 
                        [class]="u.phoneVerified ? 'text-emerald-700' : 'text-amber-700'"
                        class="text-[10px] font-bold">
                        {{ u.phoneVerified ? '✓ OTP Verified' : '⚠ Unverified' }}
                      </span>
                    </td>

                    <!-- Location -->
                    <td class="p-3.5">
                      <p class="text-[#202426] font-medium">{{ u.cityName || 'Not Assigned' }}</p>
                      <p class="text-[10px] text-[#6f7978]">{{ u.cityRegion || '' }}</p>
                    </td>

                    <!-- Assigned Roles -->
                    <td class="p-3.5">
                      <div class="flex items-center gap-1 flex-wrap">
                        <span 
                          *ngFor="let role of u.roles"
                          [class]="role === 'ELDER' ? 'bg-amber-100 text-amber-800' : (role === 'YOUTH_CREATOR' ? 'bg-[#004343]/10 text-[#004343]' : 'bg-gray-100 text-gray-800')"
                          class="px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {{ role }}
                        </span>
                      </div>
                    </td>

                    <!-- Verification Status -->
                    <td class="p-3.5">
                      <span 
                        [class]="u.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : (u.verificationStatus === 'REJECTED' || u.verificationStatus === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')"
                        class="px-2.5 py-1 rounded-full text-[10px] font-bold">
                        {{ (u.verificationStatus === 'SUSPENDED' || u.verificationStatus === 'REJECTED') ? 'REJECTED' : u.verificationStatus }}
                      </span>
                    </td>

                    <!-- Account Status -->
                    <td class="p-3.5">
                      <span 
                        [class]="u.accountStatus === 'ACTIVE' ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'"
                        class="text-[11px]">
                        {{ u.accountStatus }}
                      </span>
                    </td>

                    <!-- Registered -->
                    <td class="p-3.5 text-[#6f7978] text-[11px]">
                      {{ u.createdAt ? (u.createdAt | date:'mediumDate') : 'N/A' }}
                    </td>

                    <!-- Actions -->
                    <td class="p-3.5 pr-5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button 
                          (click)="inspectUserInQueue(u)"
                          title="Inspect in verification queue"
                          class="px-2.5 py-1.5 bg-[#f2f4f3] hover:bg-[#004343] hover:text-white text-[#004343] font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1">
                          <span>Inspect</span>
                          <span class="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>

                        <button 
                          *ngIf="u.accountStatus !== 'SUSPENDED'"
                          (click)="openSuspendModal(u)"
                          title="Suspend user account"
                          class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-sm">gavel</span>
                          <span>Suspend</span>
                        </button>

                        <button 
                          *ngIf="u.accountStatus === 'SUSPENDED'"
                          (click)="reactivateUser(u)"
                          title="Reactivate suspended user account"
                          class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-0.5">
                          <span class="material-symbols-outlined text-sm">replay</span>
                          <span>Reactivate</span>
                        </button>

                        <button 
                          (click)="openDeleteModal(u)"
                          title="Delete user permanently"
                          class="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer">
                          <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr *ngIf="filteredDirectoryUsers().length === 0">
                    <td colspan="8" class="p-8 text-center text-[#6f7978]">
                      No users matching your directory search.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  `
})
export class VerificationComponent implements OnInit {
  private authService = inject(AuthService);
  private verificationService = inject(VerificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Top Section Tabs: 'verification' (Queue) vs 'directory' (Profile Management)
  currentTab = signal<VerificationTab>('verification');

  // Verification Tab Filters (Defaults: Status is PENDING)
  searchQuery = '';
  activeStatusFilter = signal<string>('PENDING'); // 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ALL'
  activeRoleFilter = signal<string>('ALL');       // 'ALL' | 'ELDER' | 'YOUTH_CREATOR'
  activeDatePreset = signal<string>('all');       // 'all' | 'today' | '7days' | 'month' | 'custom'
  dateFrom = signal<string>('');
  dateTo = signal<string>('');

  // Profile Management (Directory) Tab Filters (Defaults: Status is ALL)
  directorySearchQuery = '';
  directoryStatusFilter = signal<string>('ALL');  // 'ALL' | 'ACTIVE' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  directoryRoleFilter = signal<string>('ALL');    // 'ALL' | 'ELDER' | 'YOUTH_CREATOR' | 'GENERAL_USER'
  directoryDatePreset = signal<string>('all');    // 'all' | 'today' | '7days' | 'month' | 'custom'
  directoryDateFrom = signal<string>('');
  directoryDateTo = signal<string>('');

  // Loading state
  isLoading = signal<boolean>(false);
  isActionLoading = signal<boolean>(false);

  // Toast message
  toastMessage = signal<string | null>(null);

  // Action fields for single user adjudication
  rejectionReason = '';
  auditNote = 'Identity verified via official records.';

  // Modals for Directory Actions
  userToSuspend = signal<AdminUserVerificationResponse | null>(null);
  suspendReason = '';
  userToDelete = signal<AdminUserVerificationResponse | null>(null);

  // Users List from Database
  users = signal<AdminUserVerificationResponse[]>([]);
  selectedUser = signal<AdminUserVerificationResponse | null>(null);

  adminName = computed(() => this.authService.currentUser()?.fullName || 'Admin Overseer');

  allCount = computed(() => this.users().length);

  pendingCount = computed(() => 
    this.users().filter(u => u.verificationStatus === 'PENDING' || u.roleDetails?.some(r => r.status === 'INACTIVE' && r.roleType !== 'GENERAL_USER')).length
  );

  verifiedCount = computed(() => 
    this.users().filter(u => u.verificationStatus === 'VERIFIED').length
  );

  rejectedCount = computed(() => 
    this.users().filter(u => u.verificationStatus === 'REJECTED' || u.verificationStatus === 'SUSPENDED' || u.accountStatus === 'SUSPENDED').length
  );

  eldersCount = computed(() => 
    this.users().filter(u => u.roles?.includes('ELDER')).length
  );

  creatorsCount = computed(() => 
    this.users().filter(u => u.roles?.includes('YOUTH_CREATOR')).length
  );

  generalCount = computed(() => 
    this.users().filter(u => u.roles?.includes('GENERAL_USER')).length
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'directory' || params['tab'] === 'management') {
        this.currentTab.set('directory');
      } else {
        this.currentTab.set('verification');
      }
    });
    this.loadVerifications();
  }

  switchTab(tab: VerificationTab): void {
    this.currentTab.set(tab);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  loadVerifications(): void {
    this.isLoading.set(true);
    this.verificationService.getAllVerifications().subscribe({
      next: (data) => {
        this.isLoading.set(false);
        this.users.set(data);

        if (data.length > 0) {
          const currentId = this.selectedUser()?.id;
          const found = data.find(u => u.id === currentId);
          this.selectedUser.set(found || data[0]);
        } else {
          this.selectedUser.set(null);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load user verifications from backend:', err);
        this.toastMessage.set('Could not fetch user verifications from server.');
        setTimeout(() => this.toastMessage.set(null), 4000);
      }
    });
  }

  inspectUserInQueue(u: AdminUserVerificationResponse): void {
    this.selectedUser.set(u);
    this.switchTab('verification');
  }

  setDatePreset(preset: 'all' | 'today' | '7days' | 'month'): void {
    this.activeDatePreset.set(preset);
    const now = new Date();

    if (preset === 'all') {
      this.dateFrom.set('');
      this.dateTo.set('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      this.dateFrom.set(todayStr);
      this.dateTo.set(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.dateFrom.set(past.toISOString().split('T')[0]);
      this.dateTo.set(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.dateFrom.set(firstDay.toISOString().split('T')[0]);
      this.dateTo.set(now.toISOString().split('T')[0]);
    }
  }

  isAnyVerificationFilterActive(): boolean {
    return (
      this.activeStatusFilter() !== 'PENDING' ||
      this.activeRoleFilter() !== 'ALL' ||
      this.activeDatePreset() !== 'all' ||
      !!this.dateFrom() ||
      !!this.dateTo() ||
      !!this.searchQuery.trim()
    );
  }

  resetVerificationFilters(): void {
    this.activeStatusFilter.set('PENDING');
    this.activeRoleFilter.set('ALL');
    this.activeDatePreset.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.searchQuery = '';
  }

  setDirectoryDatePreset(preset: 'all' | 'today' | '7days' | 'month'): void {
    this.directoryDatePreset.set(preset);
    const now = new Date();

    if (preset === 'all') {
      this.directoryDateFrom.set('');
      this.directoryDateTo.set('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      this.directoryDateFrom.set(todayStr);
      this.directoryDateTo.set(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.directoryDateFrom.set(past.toISOString().split('T')[0]);
      this.directoryDateTo.set(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      this.directoryDateFrom.set(firstDay.toISOString().split('T')[0]);
      this.directoryDateTo.set(now.toISOString().split('T')[0]);
    }
  }

  isAnyDirectoryFilterActive(): boolean {
    return (
      this.directoryStatusFilter() !== 'ALL' ||
      this.directoryRoleFilter() !== 'ALL' ||
      this.directoryDatePreset() !== 'all' ||
      !!this.directoryDateFrom() ||
      !!this.directoryDateTo() ||
      !!this.directorySearchQuery.trim()
    );
  }

  resetDirectoryFilters(): void {
    this.directoryStatusFilter.set('ALL');
    this.directoryRoleFilter.set('ALL');
    this.directoryDatePreset.set('all');
    this.directoryDateFrom.set('');
    this.directoryDateTo.set('');
    this.directorySearchQuery = '';
  }

  filteredVerificationUsers(): AdminUserVerificationResponse[] {
    return this.users().filter(u => {
      // 1. Status Filter
      if (this.activeStatusFilter() === 'PENDING') {
        const isPending = u.verificationStatus === 'PENDING' || u.roleDetails?.some(r => r.status === 'INACTIVE' && r.roleType !== 'GENERAL_USER');
        if (!isPending) return false;
      } else if (this.activeStatusFilter() === 'VERIFIED') {
        if (u.verificationStatus !== 'VERIFIED') return false;
      } else if (this.activeStatusFilter() === 'REJECTED') {
        const isRejected = u.verificationStatus === 'REJECTED' || u.verificationStatus === 'SUSPENDED' || u.accountStatus === 'SUSPENDED';
        if (!isRejected) return false;
      }

      // 2. Role Filter
      if (this.activeRoleFilter() !== 'ALL') {
        if (!u.roles?.includes(this.activeRoleFilter())) {
          return false;
        }
      }

      // 3. Date Filters (based on createdAt)
      if (u.createdAt) {
        const userDate = new Date(u.createdAt);
        if (this.dateFrom()) {
          const from = new Date(this.dateFrom() + 'T00:00:00');
          if (userDate < from) return false;
        }
        if (this.dateTo()) {
          const to = new Date(this.dateTo() + 'T23:59:59');
          if (userDate > to) return false;
        }
      }

      // 4. Search Query Filter
      const query = (this.searchQuery || '').trim().toLowerCase();
      if (query) {
        const matchesName = u.fullName?.toLowerCase().includes(query);
        const matchesNic = u.nicNumber?.toLowerCase().includes(query);
        const matchesPhone = u.phoneNumber?.toLowerCase().includes(query);
        const matchesCity = u.cityName?.toLowerCase().includes(query);
        const matchesRegion = u.cityRegion?.toLowerCase().includes(query);
        const matchesId = u.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesNic && !matchesPhone && !matchesCity && !matchesRegion && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }

  filteredDirectoryUsers(): AdminUserVerificationResponse[] {
    return this.users().filter(u => {
      // 1. Status Filter
      const statusF = this.directoryStatusFilter();
      if (statusF === 'ACTIVE') {
        if (u.accountStatus !== 'ACTIVE') return false;
      } else if (statusF === 'PENDING') {
        const isPending = u.verificationStatus === 'PENDING' || u.roleDetails?.some(r => r.status === 'INACTIVE' && r.roleType !== 'GENERAL_USER');
        if (!isPending) return false;
      } else if (statusF === 'VERIFIED') {
        if (u.verificationStatus !== 'VERIFIED') return false;
      } else if (statusF === 'REJECTED') {
        if (u.verificationStatus !== 'REJECTED') return false;
      } else if (statusF === 'SUSPENDED') {
        if (u.accountStatus !== 'SUSPENDED') return false;
      }

      // 2. Role Filter
      const roleF = this.directoryRoleFilter();
      if (roleF !== 'ALL') {
        if (!u.roles?.includes(roleF)) {
          return false;
        }
      }

      // 3. Date Filter (based on createdAt)
      if (u.createdAt) {
        const userDate = new Date(u.createdAt);
        if (this.directoryDateFrom()) {
          const from = new Date(this.directoryDateFrom() + 'T00:00:00');
          if (userDate < from) return false;
        }
        if (this.directoryDateTo()) {
          const to = new Date(this.directoryDateTo() + 'T23:59:59');
          if (userDate > to) return false;
        }
      }

      // 4. Search Query Filter
      const query = (this.directorySearchQuery || '').trim().toLowerCase();
      if (query) {
        const matchesName = u.fullName?.toLowerCase().includes(query);
        const matchesNic = u.nicNumber?.toLowerCase().includes(query);
        const matchesPhone = u.phoneNumber?.toLowerCase().includes(query);
        const matchesCity = u.cityName?.toLowerCase().includes(query);
        const matchesRegion = u.cityRegion?.toLowerCase().includes(query);
        const matchesId = u.id?.toLowerCase().includes(query);
        if (!matchesName && !matchesNic && !matchesPhone && !matchesCity && !matchesRegion && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }

  selectUser(u: AdminUserVerificationResponse): void {
    this.selectedUser.set(u);
  }

  hasRole(u: AdminUserVerificationResponse, role: string): boolean {
    return !!u.roles?.includes(role);
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  approveUser(): void {
    const current = this.selectedUser();
    if (!current) return;

    this.isActionLoading.set(true);
    this.verificationService.approveUser(current.id, this.auditNote).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.toastMessage.set(`User "${current.fullName}" verified and roles activated successfully!`);
        this.loadVerifications();
        setTimeout(() => this.toastMessage.set(null), 4500);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to approve user:', err);
        this.toastMessage.set(`Failed to approve "${current.fullName}". Please try again.`);
        setTimeout(() => this.toastMessage.set(null), 4500);
      }
    });
  }

  rejectUser(): void {
    const current = this.selectedUser();
    if (!current) return;

    this.isActionLoading.set(true);
    this.verificationService.rejectUser(current.id, this.rejectionReason || 'Rejected by Admin').subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.toastMessage.set(`Verification rejected for "${current.fullName}".`);
        this.loadVerifications();
        setTimeout(() => this.toastMessage.set(null), 4500);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to reject user:', err);
        this.toastMessage.set(`Failed to update status for "${current.fullName}". Please try again.`);
        setTimeout(() => this.toastMessage.set(null), 4500);
      }
    });
  }

  openSuspendModal(u: AdminUserVerificationResponse): void {
    this.userToSuspend.set(u);
    this.suspendReason = '';
  }

  confirmSuspend(): void {
    const u = this.userToSuspend();
    if (!u) return;

    this.isActionLoading.set(true);
    this.verificationService.suspendUser(u.id, this.suspendReason || 'Suspended by Administrator').subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.userToSuspend.set(null);
        this.toastMessage.set(`Account for "${u.fullName}" has been suspended.`);
        this.loadVerifications();
        setTimeout(() => this.toastMessage.set(null), 4500);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to suspend user:', err);
        this.toastMessage.set(`Failed to suspend "${u.fullName}". Please try again.`);
        setTimeout(() => this.toastMessage.set(null), 4500);
      }
    });
  }

  reactivateUser(u: AdminUserVerificationResponse): void {
    this.isActionLoading.set(true);
    this.verificationService.reactivateUser(u.id).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.toastMessage.set(`Account for "${u.fullName}" reactivated successfully.`);
        this.loadVerifications();
        setTimeout(() => this.toastMessage.set(null), 4500);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to reactivate user:', err);
        this.toastMessage.set(`Failed to reactivate "${u.fullName}". Please try again.`);
        setTimeout(() => this.toastMessage.set(null), 4500);
      }
    });
  }

  openDeleteModal(u: AdminUserVerificationResponse): void {
    this.userToDelete.set(u);
  }

  confirmDelete(): void {
    const u = this.userToDelete();
    if (!u) return;

    this.isActionLoading.set(true);
    this.verificationService.deleteUser(u.id).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.userToDelete.set(null);
        this.toastMessage.set(`User "${u.fullName}" was permanently deleted.`);
        this.loadVerifications();
        setTimeout(() => this.toastMessage.set(null), 4500);
      },
      error: (err) => {
        this.isActionLoading.set(false);
        console.error('Failed to delete user:', err);
        this.toastMessage.set(`Failed to delete "${u.fullName}". Please try again.`);
        setTimeout(() => this.toastMessage.set(null), 4500);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
