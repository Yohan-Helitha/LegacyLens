import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { NotificationService } from '../../app/core/services/notification.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface AppNotification {
  id: string;
  originalId?: string;
  originalType?: string;
  category: 'Opportunities' | 'Moderation' | 'Disputes' | 'Verification' | 'System';
  categoryPill: string;
  categoryPillClass: string;
  region: string;
  timeAgo: string;
  section: 'Today' | 'Yesterday' | 'Earlier This Week';
  title: string;
  body: string;
  unread: boolean;
  icon: string;
  iconBg: string;
  iconColor: string;
  borderClass?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  primaryActionType?: 'review_recording' | 'view_dispute' | 'view_moderation' | 'view_verification' | 'view_dashboard';
  link?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">notifications_active</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Notifications" 
          section="Console"
          searchPlaceholder="Search archives, oral histories, elder records..."
          [searchQuery]="searchQuery()"
          (searchQueryChange)="searchQuery.set($event)">
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto">
          
          <!-- Page Header Banner -->
          <div class="bg-white border-b border-[#dde3eb] px-6 py-6 flex flex-col gap-4">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 text-xs text-[#6e7978] mb-1">
                  <span class="hover:text-[#004343] cursor-pointer" routerLink="/dashboard">Admin Console</span>
                  <span class="material-symbols-outlined text-xs">chevron_right</span>
                  <span class="text-[#004343] font-bold">Notifications</span>
                </div>
                <h1 class="text-2xl font-serif font-bold text-[#191c1c]">Notifications</h1>
                <p class="text-xs text-[#6e7978] mt-0.5">
                  Stay updated on recent submissions, credential verifications, and platform alerts.
                </p>
              </div>

              <div class="flex items-center gap-3">
                <button (click)="markAllAsRead()"
                        class="px-4 py-2 bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#191c1c] text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm border border-[#dde3eb]">
                  <span class="material-symbols-outlined text-base text-[#004343]">done_all</span>
                  <span>Mark all as read</span>
                </button>
              </div>
            </div>

            <!-- Filter Tabs Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div class="flex items-center gap-1.5 p-1 rounded-xl bg-[#f2f4f7] border border-[#dde3eb] overflow-x-auto">
                <button (click)="activeCategory.set('ALL')"
                        [ngClass]="activeCategory() === 'ALL' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>All</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                    {{ notifications().length }}
                  </span>
                </button>

                <button (click)="activeCategory.set('UNREAD')"
                        [ngClass]="activeCategory() === 'UNREAD' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>Unread</span>
                  @if (unreadCount() > 0) {
                    <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                  }
                </button>

                <button (click)="activeCategory.set('Opportunities')"
                        [ngClass]="activeCategory() === 'Opportunities' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>Opportunities</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                    {{ categoryCount('Opportunities') }}
                  </span>
                </button>

                <button (click)="activeCategory.set('Moderation')"
                        [ngClass]="activeCategory() === 'Moderation' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>Moderation</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#fe893e]/10 text-[#9b4600] font-bold text-[10px]">
                    {{ categoryCount('Moderation') }}
                  </span>
                </button>

                <button (click)="activeCategory.set('Disputes')"
                        [ngClass]="activeCategory() === 'Disputes' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>Disputes</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                    {{ categoryCount('Disputes') }}
                  </span>
                </button>

                <button (click)="activeCategory.set('Verification')"
                        [ngClass]="activeCategory() === 'Verification' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>Verification</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                    {{ categoryCount('Verification') }}
                  </span>
                </button>

                <button (click)="activeCategory.set('System')"
                        [ngClass]="activeCategory() === 'System' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all">
                  <span>System</span>
                  <span class="px-1.5 py-0.2 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                    {{ categoryCount('System') }}
                  </span>
                </button>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-[#6e7978]">
                <span class="material-symbols-outlined text-sm">schedule</span>
                <span>{{ lastUpdatedText() }}</span>
              </div>
            </div>
          </div>

          <!-- Notification Feed List -->
          <div class="px-6 py-6 w-full space-y-6">

            <!-- Loading & Error States -->
            @if (isLoading()) {
              <div class="flex items-center justify-center py-12">
                <div class="flex flex-col items-center gap-3 text-[#6e7978]">
                  <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
                  <span class="text-sm font-medium">Fetching notifications...</span>
                </div>
              </div>
            }

            @if (hasError() && !isLoading()) {
              <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                <span class="material-symbols-outlined text-xl">warning</span>
                <span>Failed to load notifications. Please try again.</span>
              </div>
            }

            @if (!isLoading() && !hasError()) {
              @if (filteredList().length === 0) {
                <div class="bg-white rounded-2xl border border-[#dde3eb] p-12 text-center text-[#6e7978]">
                  <span class="material-symbols-outlined text-4xl mb-2 text-[#004343]">notifications_off</span>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">No Notifications Found</h3>
                  <p class="text-xs text-[#6e7978] mt-1">There are no notifications matching your current filter selection.</p>
                </div>
              } @else {
                <!-- Section: Today -->
                @if (todayNotifications().length > 0) {
                  <div class="space-y-3">
                    <div class="flex items-center justify-between px-1">
                      <h2 class="text-xs font-bold uppercase tracking-wider text-[#6e7978]">Today</h2>
                      <span class="text-xs text-[#6e7978]">{{ todayNotifications().length }} new notifications</span>
                    </div>

                    @for (item of todayNotifications(); track item.id) {
                      <div (click)="handlePrimaryAction(item)"
                           [ngClass]="[
                             item.borderClass || '',
                             item.unread ? 'bg-[#f2f6f5] border-l-4 border-l-[#004343]' : 'bg-white/75'
                           ]"
                           class="cursor-pointer p-4 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                        <div [ngClass]="[item.iconBg, item.iconColor]" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                        </div>

                        <div class="flex-1 min-w-0 space-y-1">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              @if (item.unread) {
                                <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                              }
                              <span [ngClass]="item.categoryPillClass" class="text-[11px] font-bold uppercase tracking-wider">
                                {{ item.categoryPill }}
                              </span>
                            </div>
                            <span class="text-[11px] text-[#6e7978] font-mono">{{ item.timeAgo }}</span>
                          </div>

                          <h3 class="text-sm font-serif font-bold text-[#191c1c] leading-snug">
                            {{ item.title }}
                          </h3>
                          <p class="text-xs text-[#3e4948] leading-relaxed">
                            {{ item.body }}
                          </p>

                          <div class="flex flex-wrap items-center gap-2 pt-2">
                            @if (item.primaryActionLabel) {
                              <button (click)="handlePrimaryAction(item)"
                                      class="px-3.5 py-1.5 rounded-lg bg-[#004343] hover:bg-[#003131] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-[#004343]/20">
                                @if (item.primaryActionIcon) {
                                  <span class="material-symbols-outlined text-sm">{{ item.primaryActionIcon }}</span>
                                }
                                <span>{{ item.primaryActionLabel }}</span>
                              </button>
                            }

                            @if (item.unread) {
                              <button (click)="markSingleAsRead($event, item)"
                                      class="px-2.5 py-1.5 rounded-lg bg-[#004343]/10 hover:bg-[#004343]/20 text-[#004343] text-xs font-semibold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">done</span>
                                <span>Mark read</span>
                              </button>
                            } @else {
                              <span class="text-[11px] text-[#6e7978] flex items-center gap-1 font-medium px-2 py-1 bg-[#f2f4f7] rounded-md">
                                <span class="material-symbols-outlined text-sm text-emerald-600">done_all</span>
                                <span>Read</span>
                              </span>
                            }

                            <button (click)="dismissNotification($event, item)"
                                    class="px-2.5 py-1.5 rounded-lg text-[#6e7978] hover:text-[#ba1a1a] text-xs font-semibold transition-all ml-auto">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Section: Yesterday -->
                @if (yesterdayNotifications().length > 0) {
                  <div class="space-y-3 pt-2">
                    <div class="flex items-center justify-between px-1">
                      <h2 class="text-xs font-bold uppercase tracking-wider text-[#6e7978]">Yesterday</h2>
                    </div>

                    @for (item of yesterdayNotifications(); track item.id) {
                      <div (click)="handlePrimaryAction(item)"
                           [ngClass]="item.unread ? 'bg-[#f2f6f5] border-l-4 border-l-[#004343]' : 'bg-white'" class="cursor-pointer p-4 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-all flex items-start gap-4 opacity-95">
                        <div [ngClass]="[item.iconBg, item.iconColor]" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                        </div>

                        <div class="flex-1 min-w-0 space-y-1">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              @if (item.unread) {
                                <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                              }
                              <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">
                                {{ item.categoryPill }}
                              </span>
                            </div>
                            <span class="text-[11px] text-[#6e7978] font-mono">{{ item.timeAgo }}</span>
                          </div>

                          <h3 class="text-sm font-serif font-bold text-[#191c1c] leading-snug">
                            {{ item.title }}
                          </h3>
                          <p class="text-xs text-[#3e4948] leading-relaxed">
                            {{ item.body }}
                          </p>

                          <div class="flex flex-wrap items-center gap-2 pt-2">
                            @if (item.primaryActionLabel) {
                              <button (click)="handlePrimaryAction(item)"
                                      class="px-3 py-1.5 rounded-lg bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#191c1c] text-xs font-bold transition-all">
                                {{ item.primaryActionLabel }}
                              </button>
                            }

                            @if (item.unread) {
                              <button (click)="markSingleAsRead($event, item)"
                                      class="px-2.5 py-1.5 rounded-lg bg-[#004343]/10 hover:bg-[#004343]/20 text-[#004343] text-xs font-semibold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">done</span>
                                <span>Mark read</span>
                              </button>
                            } @else {
                              <span class="text-[11px] text-[#6e7978] flex items-center gap-1 font-medium px-2 py-1 bg-[#f2f4f7] rounded-md">
                                <span class="material-symbols-outlined text-sm text-emerald-600">done_all</span>
                                <span>Read</span>
                              </span>
                            }

                            <button (click)="dismissNotification($event, item)"
                                    class="px-2.5 py-1.5 rounded-lg text-[#6e7978] hover:text-[#ba1a1a] text-xs font-semibold transition-all ml-auto">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Section: Earlier This Week -->
                @if (earlierNotifications().length > 0) {
                  <div class="space-y-3 pt-2 pb-8">
                    <div class="flex items-center justify-between px-1">
                      <h2 class="text-xs font-bold uppercase tracking-wider text-[#6e7978]">Earlier This Week</h2>
                    </div>

                    @for (item of earlierNotifications(); track item.id) {
                      <div (click)="handlePrimaryAction(item)"
                           [ngClass]="item.unread ? 'bg-[#f2f6f5] border-l-4 border-l-[#004343]' : 'bg-white'" class="cursor-pointer p-4 rounded-2xl border border-[#dde3eb] shadow-sm flex items-start gap-4 opacity-85">
                        <div [ngClass]="[item.iconBg, item.iconColor]" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                        </div>

                        <div class="flex-1 min-w-0 space-y-1">
                          <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex items-center gap-2">
                              @if (item.unread) {
                                <span class="w-2 h-2 rounded-full bg-[#fe893e]"></span>
                              }
                              <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">
                                {{ item.categoryPill }}
                              </span>
                            </div>
                            <span class="text-[11px] text-[#6e7978] font-mono">{{ item.timeAgo }}</span>
                          </div>

                          <h3 class="text-sm font-serif font-bold text-[#191c1c] leading-snug">
                            {{ item.title }}
                          </h3>
                          <p class="text-xs text-[#3e4948] leading-relaxed">
                            {{ item.body }}
                          </p>

                          <div class="flex items-center gap-2 pt-2">
                            @if (item.primaryActionLabel) {
                              <button (click)="handlePrimaryAction(item)"
                                      class="px-3 py-1.5 rounded-lg bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#191c1c] text-xs font-semibold transition-all">
                                {{ item.primaryActionLabel }}
                              </button>
                            }

                            @if (item.unread) {
                              <button (click)="markSingleAsRead($event, item)"
                                      class="px-2.5 py-1.5 rounded-lg bg-[#004343]/10 hover:bg-[#004343]/20 text-[#004343] text-xs font-semibold transition-all flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm">done</span>
                                <span>Mark read</span>
                              </button>
                            } @else {
                              <span class="text-[11px] text-[#6e7978] flex items-center gap-1 font-medium px-2 py-1 bg-[#f2f4f7] rounded-md">
                                <span class="material-symbols-outlined text-sm text-emerald-600">done_all</span>
                                <span>Read</span>
                              </span>
                            }

                            <button (click)="dismissNotification($event, item)"
                                    class="px-2.5 py-1.5 rounded-lg text-[#6e7978] hover:text-[#ba1a1a] text-xs font-semibold transition-all ml-auto">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              }
            }

          </div>

        </div>

      </main>

    </div>
  `
})
export class NotificationsComponent implements OnInit {
  toastMessage = signal<string | null>(null);

  searchQuery = signal<string>('');
  activeCategory = signal<string>('ALL');
  lastUpdated = signal<Date>(new Date());

  notifications = signal<AppNotification[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  unreadCount = computed(() => this.notifications().filter(n => n.unread).length);

  categoryCount = (category: string) => this.notifications().filter(n => n.category === category && n.unread).length;

  filteredList = computed(() => {
    let list = this.notifications();
    const cat = this.activeCategory();
    const query = this.searchQuery().toLowerCase().trim();

    if (cat === 'UNREAD') {
      list = list.filter(n => n.unread);
    } else if (cat !== 'ALL') {
      list = list.filter(n => n.category === cat);
    }

    if (query) {
      list = list.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
      );
    }

    return list;
  });

  todayNotifications = computed(() => this.filteredList().filter(n => n.section === 'Today'));
  yesterdayNotifications = computed(() => this.filteredList().filter(n => n.section === 'Yesterday'));
  earlierNotifications = computed(() => this.filteredList().filter(n => n.section === 'Earlier This Week'));

  lastUpdatedText = computed(() => {
    const date = this.lastUpdated();
    return `Last updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  private notificationService = inject(NotificationService);

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.lastUpdated.set(new Date());
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        const mapped = data.map(n => this.mapToAppNotification(n));
        this.notifications.set(mapped);
        this.isLoading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  mapToAppNotification(n: any): AppNotification {
    const date = new Date(n.createdAt);
    const now = new Date();
    
    // Determine section based on date
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let section: 'Today' | 'Yesterday' | 'Earlier This Week' = 'Earlier This Week';
    if (diffDays === 0 && now.getDate() === date.getDate()) {
      section = 'Today';
    } else if (diffDays <= 1 || (diffDays === 1 && now.getDate() !== date.getDate())) {
      section = 'Yesterday';
    }

    // Time ago string
    let timeAgo = '';
    if (diffDays === 0) {
      const diffMins = Math.floor(diffTime / (1000 * 60));
      if (diffMins < 60) timeAgo = `${diffMins}m ago`;
      else timeAgo = `${Math.floor(diffMins / 60)}h ago`;
    } else {
      timeAgo = date.toLocaleDateString();
    }

    let category: AppNotification['category'] = 'System';
    let categoryPill = 'System';
    let categoryPillClass = 'text-[#6e7978]';
    let icon = 'info';
    let iconBg = 'bg-[#6e7978]/10';
    let iconColor = 'text-[#6e7978]';
    let primaryActionLabel: string | undefined;
    let primaryActionIcon: string | undefined;
    let primaryActionType: AppNotification['primaryActionType'] | undefined;
    let link: string | undefined;

    switch (n.type) {
      case 'opportunity':
        category = 'Opportunities';
        categoryPill = 'Opportunity';
        categoryPillClass = 'text-[#004343]';
        icon = 'mic';
        iconBg = 'bg-[#004343]/10';
        iconColor = 'text-[#004343]';
        primaryActionLabel = 'Review Recording';
        primaryActionIcon = 'play_arrow';
        primaryActionType = 'review_recording';
        link = '/opportunity-intake';
        break;
      case 'moderation':
        category = 'Moderation';
        categoryPill = 'Moderation';
        categoryPillClass = 'text-[#9b4600]';
        icon = 'flag';
        iconBg = 'bg-[#fe893e]/10';
        iconColor = 'text-[#9b4600]';
        primaryActionLabel = 'View Details';
        primaryActionIcon = 'visibility';
        primaryActionType = 'view_moderation';
        link = '/moderation';
        break;
      case 'dispute':
        category = 'Disputes';
        categoryPill = 'Dispute';
        categoryPillClass = 'text-[#ba1a1a]';
        icon = 'gavel';
        iconBg = 'bg-[#ba1a1a]/10';
        iconColor = 'text-[#ba1a1a]';
        primaryActionLabel = 'View Dispute';
        primaryActionIcon = 'visibility';
        primaryActionType = 'view_dispute';
        link = '/disputes';
        break;
      case 'credential':
        category = 'Verification';
        categoryPill = 'Verification';
        categoryPillClass = 'text-[#004343]';
        icon = 'verified';
        iconBg = 'bg-[#004343]/10';
        iconColor = 'text-[#004343]';
        primaryActionLabel = 'View Verification';
        primaryActionIcon = 'visibility';
        primaryActionType = 'view_verification';
        link = '/verification';
        break;
      case 'system':
        category = 'System';
        categoryPill = 'System';
        categoryPillClass = 'text-[#6e7978]';
        icon = 'settings';
        iconBg = 'bg-[#6e7978]/10';
        iconColor = 'text-[#6e7978]';
        primaryActionLabel = 'View Dashboard';
        primaryActionIcon = 'dashboard';
        primaryActionType = 'view_dashboard';
        link = '/dashboard';
        break;
      case 'other':
      default:
        category = 'System';
        categoryPill = 'System';
        categoryPillClass = 'text-[#6e7978]';
        icon = 'info';
        iconBg = 'bg-[#6e7978]/10';
        iconColor = 'text-[#6e7978]';
        primaryActionLabel = 'View Dashboard';
        primaryActionIcon = 'dashboard';
        primaryActionType = 'view_dashboard';
        link = '/dashboard';
        break;
    }

    const isRead = Boolean(
      n.read === true ||
      n.isRead === true ||
      (n.id && this.notificationService.isRead(n.id, n.type)) ||
      (n.originalId && this.notificationService.isRead(n.originalId, n.originalType))
    );

    return {
      id: `${n.type}-${n.id}`,
      originalId: n.id,
      originalType: n.type,
      category,
      categoryPill,
      categoryPillClass,
      region: '• System',
      timeAgo,
      section,
      title: n.title,
      body: n.body,
      unread: !isRead,
      icon,
      iconBg,
      iconColor,
      primaryActionLabel,
      primaryActionIcon,
      primaryActionType,
      link
    };
  }

  markAllAsRead(): void {
    const allIds = this.notifications().map(n => n.originalId || n.id).filter(Boolean) as string[];
    this.notifications.update(items => items.map(n => ({ ...n, unread: false })));
    this.notificationService.markAllAsRead(allIds).subscribe({
      next: () => {
        this.showToast('All notifications marked as read.');
      },
      error: (err) => {
        console.error('Failed to mark all as read:', err);
        this.showToast('Failed to mark all as read.');
      }
    });
  }

  markSingleAsRead(event: Event, item: any): void {
    event.stopPropagation();
    this.notifications.update(items => items.map(n => n.id === item.id ? { ...n, unread: false } : n));
    this.notificationService.markAsRead(item.originalType, item.originalId).subscribe({
      next: () => {
        this.showToast('Notification marked as read.');
      },
      error: () => {
        this.showToast('Notification marked as read.');
      }
    });
  }

  dismissNotification(event: Event, item: any): void {
    event.stopPropagation();
    this.notifications.update(items => items.filter(n => n.id !== item.id));
    this.notificationService.markAsRead(item.originalType, item.originalId).subscribe({
      next: () => {
        this.showToast('Notification dismissed.');
      },
      error: () => {
        this.showToast('Notification dismissed.');
      }
    });
  }

  handlePrimaryAction(item: any): void {
    if (item.unread) {
      this.notifications.update(items => items.map(n => n.id === item.id ? { ...n, unread: false } : n));
      this.notificationService.markAsRead(item.originalType, item.originalId).subscribe();
    }
    
    const link = item.link || '/dashboard';
    this.router.navigate([link]);
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



