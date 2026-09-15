import { Component, computed, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside 
      [class.w-64]="isExpanded()"
      [class.w-20]="!isExpanded()"
      class="legacy-sidebar flex flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30 font-sans shadow-xl transition-all duration-300">
      
      <!-- Top Section: Brand + Navigation Links -->
      <div 
        #sidebarScroll
        (scroll)="onSidebarScroll($event)"
        class="flex flex-col flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        
        <!-- Brand Header (No logo icon) -->
        <div class="legacy-sidebar-header p-4 flex items-center justify-between sticky top-0 z-10">
          @if (isExpanded()) {
            <div class="min-w-0 transition-opacity duration-200 pl-1">
              <h1 class="font-serif font-bold text-lg text-white leading-none tracking-tight truncate">LegacyLens</h1>
              <p class="text-[10px] font-semibold text-emerald-300/80 tracking-widest uppercase mt-1">Admin Console</p>
            </div>
            <button 
              (click)="toggleSidebar()" 
              title="Collapse Sidebar"
              class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0">
              <span class="material-symbols-outlined text-xl">menu_open</span>
            </button>
          } @else {
            <button 
              (click)="toggleSidebar()" 
              title="Expand Sidebar"
              class="w-full py-1.5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-xl">menu</span>
            </button>
          }
        </div>

        <!-- Navigation Links -->
        <nav class="p-3 space-y-1.5 text-sm flex-1">
          
          <!-- Core Operations Section Header -->
          @if (isExpanded()) {
            <div class="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
              Core Operations
            </div>
          } @else {
            <div class="h-px bg-white/15 my-2"></div>
          }

          <!-- 1. Overview + Analytics -->
          <a routerLink="/dashboard"
             routerLinkActive="active-link"
             [routerLinkActiveOptions]="{ exact: false }"
             [title]="isExpanded() ? '' : 'Overview + Analytics'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">dashboard</span>
              @if (isExpanded()) {
                <span class="truncate">Overview + Analytics</span>
              }
            </div>
          </a>

          <!-- 2. Moderation Queue -->
          <a routerLink="/moderation"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Moderation Queue'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">fact_check</span>
              @if (isExpanded()) {
                <span class="truncate">Moderation Queue</span>
              }
            </div>
          </a>

          <!-- 2.1 Opportunity Intake -->
          <a routerLink="/opportunity-intake"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Opportunity Intake'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">input</span>
              @if (isExpanded()) {
                <span class="truncate">Opportunity Intake</span>
              }
            </div>
          </a>

          <!-- 3. Profile Verification -->
          <a routerLink="/verification"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Profile Verification'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">verified_user</span>
              @if (isExpanded()) {
                <span class="truncate">Profile Verification</span>
              }
            </div>
          </a>

          <!-- 4. Dispute Resolution -->
          <a routerLink="/disputes"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Dispute Resolution'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">gavel</span>
              @if (isExpanded()) {
                <span class="truncate">Dispute Resolution</span>
              }
            </div>
          </a>

          <!-- 5. Cultural Map Management -->
          <a routerLink="/map"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Cultural Map Management'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">travel_explore</span>
              @if (isExpanded()) {
                <span class="truncate">Cultural Map Management</span>
              }
            </div>
          </a>

          <!-- 6. Word of the day -->
          <a routerLink="/word-of-the-day"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Word of the day'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">auto_stories</span>
              @if (isExpanded()) {
                <span class="truncate">Word of the day</span>
              }
            </div>
          </a>

          <!-- Administration Section Header -->
          @if (isExpanded()) {
            <div class="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
              Administration
            </div>
          } @else {
            <div class="h-px bg-white/15 my-2"></div>
          }

          <!-- 7. Admins Management -->
          <a routerLink="/admin-management"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Admins Management'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">manage_accounts</span>
              @if (isExpanded()) {
                <span class="truncate">Admins Management</span>
              }
            </div>
          </a>


          <!-- 9. Audit Log -->
          <a routerLink="/audit"
             routerLinkActive="active-link"
             [title]="isExpanded() ? '' : 'Audit Log'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">receipt_long</span>
              @if (isExpanded()) {
                <span class="truncate">Audit Log</span>
              }
            </div>
          </a>

          <!-- 10. Admin Profile -->
          <a routerLink="/admin-profile"
             routerLinkActive="active-link"
             [routerLinkActiveOptions]="{ exact: true }"
             [title]="isExpanded() ? '' : 'Admin Profile'"
             class="sidebar-nav-item flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <span class="material-symbols-outlined text-xl nav-icon shrink-0">shield_person</span>
              @if (isExpanded()) {
                <span class="truncate">Admin Profile</span>
              }
            </div>
          </a>

        </nav>
      </div>

      <!-- Bottom Section: Sign Out Only -->
      <div class="legacy-sidebar-footer p-3 shrink-0">
        <button 
          (click)="onSignOut()" 
          [title]="isExpanded() ? 'Sign Out of Console' : 'Sign Out'" 
          class="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/25 hover:text-red-100 hover:border-red-400/40 border border-transparent rounded-xl transition-all cursor-pointer">
          @if (isExpanded()) {
            <span>Sign Out</span>
          }
          <span class="material-symbols-outlined text-lg" [class.mx-auto]="!isExpanded()">logout</span>
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
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
  `]
})
export class SidebarComponent implements AfterViewInit {
  @ViewChild('sidebarScroll') sidebarScrollRef!: ElementRef<HTMLDivElement>;

  private authService = inject(AuthService);
  private router = inject(Router);

  // Sidebar expanded / collapsed state (persisted in localStorage)
  isExpanded = signal<boolean>(
    typeof window !== 'undefined' 
      ? localStorage.getItem('sidebar_expanded') !== 'false' 
      : true
  );

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

  toggleSidebar(): void {
    const nextState = !this.isExpanded();
    this.isExpanded.set(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_expanded', nextState.toString());
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.sidebarScrollRef?.nativeElement) {
        const container = this.sidebarScrollRef.nativeElement;
        const savedPos = sessionStorage.getItem('sidebar_scroll_top');
        if (savedPos !== null) {
          container.scrollTop = parseInt(savedPos, 10);
        }

        // Check if active link is scrolled into view; if not, scroll into view
        const activeLink = container.querySelector('.active-link') as HTMLElement;
        if (activeLink) {
          const linkRect = activeLink.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (linkRect.bottom > containerRect.bottom || linkRect.top < containerRect.top) {
            activeLink.scrollIntoView({ block: 'nearest', behavior: 'instant' as any });
          }
        }
      }
    }, 10);
  }

  onSidebarScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target) {
      sessionStorage.setItem('sidebar_scroll_top', target.scrollTop.toString());
    }
  }

  onSignOut(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
