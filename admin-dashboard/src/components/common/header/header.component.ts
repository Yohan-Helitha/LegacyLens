import { Component, Input, Output, EventEmitter, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';
import { NotificationService } from '../../../app/core/services/notification.service';
import { LayoutService } from '../../../app/core/services/layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <header class="h-16 bg-[#ffffff]/95 backdrop-blur-xl border-b border-[#dde3eb] flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 selection:bg-[#004343]/20 selection:text-[#004343]">
      
      <!-- Left Breadcrumb Section -->
      <div class="flex items-center gap-3 min-w-0">
        <!-- Mobile Sidebar Toggle -->
        <button 
          (click)="toggleMobileSidebar()" 
          class="md:hidden p-2 -ml-2 rounded-xl text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-colors focus:outline-none shrink-0"
          title="Open Menu">
          <span class="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div class="flex items-center gap-2 sm:gap-3 text-xs text-[#6f7978] overflow-hidden whitespace-nowrap">
          <span class="font-semibold text-[#191c1c] hidden sm:inline">{{ section }}</span>
          <span class="text-[#c2c8c7] hidden sm:inline">/</span>
          <span class="font-bold text-[#004343] truncate">{{ pageTitle }}</span>
        </div>
      </div>

      <!-- Right Actions & User Area -->
      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        
        <!-- Search Bar (Optional) -->
        @if (showSearch) {
          <div class="relative hidden md:block w-36 sm:w-60 md:w-80">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6f7978] text-lg">search</span>
            <input 
              type="text" 
              [placeholder]="searchPlaceholder" 
              [ngModel]="searchQuery"
              (ngModelChange)="onSearchInput($event)"
              (keyup.enter)="onSearchEnter($event)"
              class="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f2f4f3] border border-transparent rounded-xl focus:outline-none focus:border-[#004343] focus:bg-white text-[#191c1c] transition-all"
            />
          </div>
        }

        <!-- Custom Injected Actions (Buttons, status tags, etc.) -->
        <ng-content></ng-content>

        <!-- ── App Switcher: Gamified Learning Hub ── -->
        <a href="/learning-hub" 
           target="_blank"
           rel="noopener noreferrer"
           title="Open Gamified Learning Hub"
           class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fe893e] hover:bg-[#e87a35] text-white text-[11px] font-bold shadow-sm transition-all group cursor-pointer shrink-0">
          <span class="material-symbols-outlined text-[17px]">school</span>
          <span class="hidden lg:block whitespace-nowrap">Learning Hub</span>
          <span class="material-symbols-outlined text-[13px] opacity-70 group-hover:opacity-100 transition-opacity hidden lg:block">open_in_new</span>
        </a>

        <!-- Notification Bell Icon -->
        @if (showNotifications) {
          <a routerLink="/notifications" 
             title="Notifications" 
             class="relative p-2 rounded-xl text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-colors">
            <span class="material-symbols-outlined text-xl">notifications</span>
            @if (notificationService.unreadCount() > 0) {
              <span class="absolute top-0 right-0 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white bg-[#fe893e] rounded-full ring-2 ring-white">
                {{ notificationService.unreadCount() }}
              </span>
            }
          </a>
        }

        <!-- Vertical Divider -->
        @if (showUserProfile) {
          <div class="h-6 w-px bg-[#dde3eb]"></div>

          <!-- User Profile Quick Badge -->
          <a routerLink="/admin-profile" 
             title="My Admin Profile"
             class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#f2f4f3] transition-colors group cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-[#004343] text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
              {{ userInitials() }}
            </div>
            <div class="text-left hidden xl:block">
              <p class="text-xs font-semibold text-[#191c1c] leading-tight group-hover:text-[#004343] transition-colors">{{ userName() }}</p>
              <p class="text-[10px] text-[#6f7978]">{{ userRole() }}</p>
            </div>
          </a>
        }

      </div>
    </header>
  `,
  styles: []
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  layoutService = inject(LayoutService);

  @Input() pageTitle: string = 'Dashboard Overview';
  @Input() section: string = 'Console';
  @Input() searchPlaceholder: string = 'Search records, disputes, hashes...';
  @Input() searchQuery: string = '';
  @Input() showSearch: boolean = true;
  @Input() showNotifications: boolean = true;
  @Input() showUserProfile: boolean = true;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  toggleMobileSidebar() {
    this.layoutService.toggleMobileSidebar();
  }

  ngOnInit() {
    this.fetchUnreadCount();
  }

  fetchUnreadCount() {
    this.notificationService.getNotifications().subscribe();
  }

  userName = computed(() => {
    const raw = this.authService.currentUser()?.fullName || 'Admin User';
    return raw.split(' (')[0]; // Clean display name
  });

  userRole = computed(() => {
    const roles = this.authService.currentUser()?.roles;
    if (roles && roles.length > 0) {
      return 'Admin';
    }
    return 'Admin';
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

  onSearchInput(val: string) {
    this.searchQuery = val;
    this.searchQueryChange.emit(val);
  }

  onSearchEnter(event: Event) {
    this.search.emit(this.searchQuery);
  }
}

