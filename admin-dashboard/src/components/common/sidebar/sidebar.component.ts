import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-[#ffffff] border-r border-[#dde3eb] flex flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30 font-sans shadow-sm">
      
      <!-- Top Section: Brand + Navigation Links -->
      <div class="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
        
        <!-- Brand Logo Header -->
        <div class="p-5 flex items-center gap-3 border-b border-[#eceeed] bg-white sticky top-0 z-10">
          <div class="w-10 h-10 rounded-xl bg-[#004343] flex items-center justify-center text-white shadow-md shadow-[#004343]/20">
            <span class="material-symbols-outlined text-2xl">history_edu</span>
          </div>
          <div>
            <h1 class="font-serif font-bold text-lg text-[#004343] leading-none tracking-tight">LegacyLens</h1>
            <p class="text-[10px] font-semibold text-[#6f7978] tracking-widest uppercase mt-1">Admin Console</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="p-3 space-y-1 text-sm flex-1">
          
          <!-- Core Operations Section Header -->
          <div class="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8b9695]">
            Core Operations
          </div>

          <!-- 1. Overview + Analytics -->
          <a routerLink="/dashboard"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             [routerLinkActiveOptions]="{ exact: false }"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">dashboard</span>
              <span>Overview + Analytics</span>
            </div>
          </a>

          <!-- 2. Moderation Queue -->
          <a routerLink="/moderation"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">fact_check</span>
              <span>Moderation Queue</span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 badge-pill">28</span>
          </a>

          <!-- 2.1 Opportunity Intake -->
          <a routerLink="/opportunity-intake"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">input</span>
              <span>Opportunity Intake</span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 badge-pill">42</span>
          </a>

          <!-- 3. Profile Verification -->
          <a routerLink="/verification"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">verified_user</span>
              <span>Profile Verification</span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#fe893e]/20 text-[#9b4600] badge-pill">14</span>
          </a>

          <!-- 4. Dispute Resolution -->
          <a routerLink="/disputes"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">gavel</span>
              <span>Dispute Resolution</span>
            </div>
            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 badge-pill">3</span>
          </a>

          <!-- 5. Cultural Map Management -->
          <a routerLink="/map"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">travel_explore</span>
              <span>Cultural Map Management</span>
            </div>
          </a>

          <!-- 6. Word of the day -->
          <a routerLink="/word-of-the-day"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">auto_stories</span>
              <span>Word of the day</span>
            </div>
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          </a>

          <!-- Administration Section Header -->
          <div class="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8b9695]">
            Administration
          </div>

          <!-- 7. Admins Management -->
          <a routerLink="/admin-management"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">manage_accounts</span>
              <span>Admins Management</span>
            </div>
          </a>

          <!-- 8. Profile Management -->
          <a routerLink="/profile-management"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">badge</span>
              <span>Profile Management</span>
            </div>
          </a>

          <!-- 9. Audit Log -->
          <a routerLink="/audit"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">receipt_long</span>
              <span>Audit Log</span>
            </div>
          </a>

          <!-- 10. Admin Profile -->
          <a routerLink="/admin-profile"
             routerLinkActive="bg-[#004343] text-white shadow-sm font-semibold active-link"
             [routerLinkActiveOptions]="{ exact: true }"
             class="flex items-center justify-between px-3 py-2.5 rounded-lg text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-all group">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-xl text-[#6f7978] group-hover:text-[#004343] transition-colors nav-icon">shield_person</span>
              <span>Admin Profile</span>
            </div>
          </a>

        </nav>
      </div>

      <!-- Bottom Section: Sign Out Only -->
      <div class="p-4 border-t border-[#eceeed] bg-[#f8faf9] shrink-0">
        <button 
          (click)="onSignOut()" 
          title="Sign Out" 
          class="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[#ba1a1a] hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition-colors cursor-pointer">
          <span>Sign Out</span>
          <span class="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #dde3eb;
      border-radius: 4px;
    }
    .active-link .nav-icon {
      color: #ffffff !important;
    }
    .active-link .badge-pill {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: #ffffff !important;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userName = computed(() => {
    return this.authService.currentUser()?.fullName || 'E. Vance';
  });

  userRole = computed(() => {
    const roles = this.authService.currentUser()?.roles;
    if (roles && roles.length > 0) {
      return roles.includes('SUPER_ADMIN') ? 'Super Overseer' : 'Lead Overseer';
    }
    return 'Lead Overseer';
  });

  userInitials = computed(() => {
    const name = this.userName();
    if (!name) return 'EV';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  onSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
