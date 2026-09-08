import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <header class="h-16 bg-[#ffffff]/95 backdrop-blur-xl border-b border-[#dde3eb] flex items-center justify-between px-6 shrink-0 z-40 selection:bg-[#004343]/20 selection:text-[#004343]">
      
      <!-- Left Breadcrumb Section -->
      <div class="flex items-center gap-2 sm:gap-3 text-xs text-[#6f7978] overflow-hidden whitespace-nowrap">
        <a routerLink="/dashboard" class="flex items-center hover:text-[#004343] transition-colors" title="Home">
          <span class="material-symbols-outlined text-base">home</span>
        </a>
        <span class="text-[#c2c8c7]">/</span>
        <span class="font-semibold text-[#191c1c] hidden sm:inline">{{ section }}</span>
        <span class="text-[#c2c8c7] hidden sm:inline">/</span>
        <span class="font-bold text-[#004343] truncate">{{ pageTitle }}</span>
      </div>

      <!-- Right Actions & User Area -->
      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        
        <!-- Search Bar (Optional) -->
        @if (showSearch) {
          <div class="relative w-48 sm:w-72 md:w-80 hidden md:block">
            <span class="material-symbols-outlined absolute left-3 top-2 text-[#6f7978] text-lg">search</span>
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

        <!-- Notification Bell Icon -->
        @if (showNotifications) {
          <a routerLink="/notifications" 
             title="Notifications" 
             class="relative p-2 rounded-xl text-[#3f4948] hover:bg-[#f2f4f3] hover:text-[#004343] transition-colors">
            <span class="material-symbols-outlined text-xl">notifications</span>
            @if (hasUnreadNotifications) {
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fe893e] ring-2 ring-white"></span>
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
export class HeaderComponent {
  private authService = inject(AuthService);

  @Input() pageTitle: string = 'Dashboard Overview';
  @Input() section: string = 'Console';
  @Input() searchPlaceholder: string = 'Search records, disputes, hashes...';
  @Input() searchQuery: string = '';
  @Input() showSearch: boolean = true;
  @Input() showNotifications: boolean = true;
  @Input() showUserProfile: boolean = true;
  @Input() hasUnreadNotifications: boolean = true;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  userName = computed(() => {
    const raw = this.authService.currentUser()?.fullName || 'E. Vance';
    return raw.split(' (')[0]; // Clean display name
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

  onSearchInput(val: string) {
    this.searchQuery = val;
    this.searchQueryChange.emit(val);
  }

  onSearchEnter(event: Event) {
    this.search.emit(this.searchQuery);
  }
}

