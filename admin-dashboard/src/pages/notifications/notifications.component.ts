import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface AppNotification {
  id: string;
  category: 'Oral Histories' | 'Credentials' | 'Disputes & Reports' | 'System' | 'AI Taxonomy' | 'Bilingual Transcript';
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
  primaryActionType?: 'review_recording' | 'view_dispute' | 'review_credential' | 'review_tags' | 'inspect_transcript' | 'view_summary';
  secondaryActionLabel?: string;
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
                <button (click)="toggleNotificationSettings()"
                        class="p-2 bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#3e4948] rounded-xl transition-all border border-[#dde3eb]"
                        title="Notification Settings">
                  <span class="material-symbols-outlined text-lg">tune</span>
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

                <button (click)="activeCategory.set('Oral Histories')"
                        [ngClass]="activeCategory() === 'Oral Histories' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all">
                  Oral Histories
                </button>

                <button (click)="activeCategory.set('Credentials')"
                        [ngClass]="activeCategory() === 'Credentials' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all">
                  Credentials
                </button>

                <button (click)="activeCategory.set('Disputes & Reports')"
                        [ngClass]="activeCategory() === 'Disputes & Reports' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all">
                  Disputes & Reports
                </button>

                <button (click)="activeCategory.set('System')"
                        [ngClass]="activeCategory() === 'System' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                        class="px-3.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all">
                  System
                </button>
              </div>

              <div class="flex items-center gap-1.5 text-xs text-[#6e7978]">
                <span class="material-symbols-outlined text-sm">schedule</span>
                <span>Auto-updated just now</span>
              </div>
            </div>
          </div>

          <!-- Notification Feed List -->
          <div class="px-6 py-6 max-w-5xl space-y-6">

            <!-- Section: Today -->
            @if (todayNotifications().length > 0) {
              <div class="space-y-3">
                <div class="flex items-center justify-between px-1">
                  <h2 class="text-xs font-bold uppercase tracking-wider text-[#6e7978]">Today</h2>
                  <span class="text-xs text-[#6e7978]">{{ todayNotifications().length }} new notifications</span>
                </div>

                @for (item of todayNotifications(); track item.id) {
                  <div [ngClass]="[
                         item.borderClass || '',
                         item.unread ? 'bg-white border-l-4 border-l-[#004343]' : 'bg-white/75'
                       ]"
                       class="p-4 rounded-2xl border border-[#dde3eb] shadow-sm hover:shadow-md transition-all flex items-start gap-4">
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
                          <span class="text-[#6e7978] text-[11px]">{{ item.region }}</span>
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

                        @if (item.secondaryActionLabel) {
                          <button (click)="handleSecondaryAction(item)"
                                  class="px-3 py-1.5 rounded-lg bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#191c1c] text-xs font-semibold transition-all">
                            {{ item.secondaryActionLabel }}
                          </button>
                        }

                        <button (click)="dismissNotification(item)"
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
                  <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-sm hover:shadow-md transition-all flex items-start gap-4 opacity-95">
                    <div [ngClass]="[item.iconBg, item.iconColor]" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                    </div>

                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">
                            {{ item.categoryPill }}
                          </span>
                          <span class="text-[#6e7978] text-[11px]">{{ item.region }}</span>
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

                        @if (item.secondaryActionLabel) {
                          <button (click)="handleSecondaryAction(item)"
                                  class="px-3 py-1.5 rounded-lg bg-[#f2f4f7] hover:bg-[#e1e3e2] text-[#3e4948] text-xs font-semibold transition-all">
                            {{ item.secondaryActionLabel }}
                          </button>
                        }

                        <button (click)="dismissNotification(item)"
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
                  <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-sm flex items-start gap-4 opacity-85">
                    <div [ngClass]="[item.iconBg, item.iconColor]" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                    </div>

                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-[#6e7978]">
                            {{ item.categoryPill }}
                          </span>
                          <span class="text-[#6e7978] text-[11px]">{{ item.region }}</span>
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
                        <button (click)="dismissNotification(item)"
                                class="px-2.5 py-1.5 rounded-lg text-[#6e7978] hover:text-[#ba1a1a] text-xs font-semibold transition-all ml-auto">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }

            @if (filteredList().length === 0) {
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-12 text-center text-[#6e7978]">
                <span class="material-symbols-outlined text-4xl mb-2 text-[#004343]">notifications_off</span>
                <h3 class="text-base font-serif font-bold text-[#191c1c]">No Notifications Found</h3>
                <p class="text-xs text-[#6e7978] mt-1">There are no notifications matching your current filter selection.</p>
              </div>
            }

          </div>

        </div>

      </main>

    </div>
  `
})
export class NotificationsComponent {
  toastMessage = signal<string | null>(null);

  searchQuery = signal<string>('');
  activeCategory = signal<string>('ALL');

  notifications = signal<AppNotification[]>([
    {
      id: 'NOTIF-01',
      category: 'Oral Histories',
      categoryPill: 'Oral History Ingest',
      categoryPillClass: 'text-[#9b4600]',
      region: '• Matara Province',
      timeAgo: '15m ago',
      section: 'Today',
      title: 'New audio recording submitted: Mrs. Kamala Wijesinghe — Matara Folk Lullaby #082',
      body: 'Elder audio ingest reached staging (12m 48s, Sinhala Ruhuna dialect). Ready for secondary curator review and dialect signoff.',
      unread: true,
      icon: 'mic',
      iconBg: 'bg-[#004343]/10',
      iconColor: 'text-[#004343]',
      primaryActionLabel: 'Review Recording',
      primaryActionIcon: 'play_arrow',
      primaryActionType: 'review_recording',
      secondaryActionLabel: 'Assign to Curator'
    },
    {
      id: 'NOTIF-02',
      category: 'Disputes & Reports',
      categoryPill: 'Community Flag',
      categoryPillClass: 'text-[#ba1a1a]',
      region: '• Ambalangoda',
      timeAgo: '48m ago',
      section: 'Today',
      title: 'Lineage dispute submitted for "Mask Maker of Ambalangoda (Archive #AMB-2041)"',
      body: 'Two contributors flagged a historical lineage conflict citing the 1912 Guild Register. 3 witness notes attached for review.',
      unread: true,
      icon: 'flag',
      iconBg: 'bg-[#ba1a1a]/10',
      iconColor: 'text-[#ba1a1a]',
      primaryActionLabel: 'View Dispute Dossier',
      primaryActionType: 'view_dispute',
      secondaryActionLabel: 'See Witness Notes'
    },
    {
      id: 'NOTIF-03',
      category: 'Credentials',
      categoryPill: 'Elder Credential',
      categoryPillClass: 'text-[#004343]',
      region: '• Central Province',
      timeAgo: '2h ago',
      section: 'Today',
      title: 'Master K. G. Tikiri Banda uploaded elder verification credentials',
      body: 'Includes Grama Niladhari attestation seal and biometric match confirmation for Dumbara Loom Guild lineage documentation.',
      unread: true,
      icon: 'verified',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-800',
      primaryActionLabel: 'Review Application',
      primaryActionType: 'review_credential',
      secondaryActionLabel: 'View Document (PDF)'
    },
    {
      id: 'NOTIF-04',
      category: 'AI Taxonomy',
      categoryPill: 'AI Taxonomy',
      categoryPillClass: 'text-[#3e4948]',
      region: '• Galle Fort Heritage',
      timeAgo: 'Yesterday 4:10 PM',
      section: 'Yesterday',
      title: 'Automated cultural tags ready: "Beeralu Bobbin Lace Weaving"',
      body: '12 cultural taxonomy tags were generated by the audio-video contextual model and await curatorial approval.',
      unread: false,
      icon: 'auto_awesome',
      iconBg: 'bg-[#f2f4f7]',
      iconColor: 'text-[#3e4948]',
      primaryActionLabel: 'Review Tags',
      primaryActionType: 'review_tags',
      secondaryActionLabel: 'Quick Approve'
    },
    {
      id: 'NOTIF-05',
      category: 'Bilingual Transcript',
      categoryPill: 'Bilingual Transcript',
      categoryPillClass: 'text-[#3e4948]',
      region: '• Udunuwara Expedition',
      timeAgo: 'Yesterday 11:30 AM',
      section: 'Yesterday',
      title: 'Dual-language transcript generated: Dumbara Valley Weaving Chants',
      body: 'Kandyan Sinhala phonetic rhythm transcription and English glossary terms finished processing at 94.2% AI confidence.',
      unread: false,
      icon: 'translate',
      iconBg: 'bg-[#f2f4f7]',
      iconColor: 'text-[#3e4948]',
      primaryActionLabel: 'Inspect Transcript',
      primaryActionType: 'inspect_transcript',
      secondaryActionLabel: 'Publish to Archive'
    },
    {
      id: 'NOTIF-06',
      category: 'System',
      categoryPill: 'System Governance',
      categoryPillClass: 'text-[#3e4948]',
      region: '• Colombo Region',
      timeAgo: 'Oct 24, 6:15 PM',
      section: 'Earlier This Week',
      title: 'Western Province Quorum Met',
      body: '96% cataloging target reached across Colombo urban oral histories. All node signoffs confirmed.',
      unread: false,
      icon: 'info',
      iconBg: 'bg-[#f2f4f7]',
      iconColor: 'text-[#3e4948]',
      primaryActionLabel: 'View Summary',
      primaryActionType: 'view_summary'
    }
  ]);

  unreadCount = computed(() => this.notifications().filter(n => n.unread).length);

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
        n.body.toLowerCase().includes(query) ||
        n.region.toLowerCase().includes(query)
      );
    }

    return list;
  });

  todayNotifications = computed(() => this.filteredList().filter(n => n.section === 'Today'));
  yesterdayNotifications = computed(() => this.filteredList().filter(n => n.section === 'Yesterday'));
  earlierNotifications = computed(() => this.filteredList().filter(n => n.section === 'Earlier This Week'));

  constructor(private router: Router, private authService: AuthService) {}

  markAllAsRead(): void {
    this.notifications.update(items => items.map(n => ({ ...n, unread: false })));
    this.showToast('All notifications marked as read.');
  }

  toggleNotificationSettings(): void {
    this.showToast('Notification preferences: All channels active (Email, SMS & In-App Push).');
  }

  dismissNotification(item: AppNotification): void {
    this.notifications.update(items => items.filter(n => n.id !== item.id));
    this.showToast('Notification dismissed.');
  }

  handlePrimaryAction(item: AppNotification): void {
    item.unread = false;
    if (item.primaryActionType === 'review_recording' || item.primaryActionType === 'review_tags') {
      this.router.navigate(['/moderation']);
    } else if (item.primaryActionType === 'view_dispute') {
      this.router.navigate(['/disputes']);
    } else if (item.primaryActionType === 'review_credential') {
      this.router.navigate(['/verification']);
    } else if (item.primaryActionType === 'inspect_transcript') {
      this.router.navigate(['/moderation']);
    } else if (item.primaryActionType === 'view_summary') {
      this.router.navigate(['/analytics']);
    }
  }

  handleSecondaryAction(item: AppNotification): void {
    if (item.secondaryActionLabel === 'Assign to Curator') {
      this.showToast('Assigned to Senior Curator for expedited review.');
    } else if (item.secondaryActionLabel === 'See Witness Notes') {
      this.router.navigate(['/disputes']);
    } else if (item.secondaryActionLabel === 'View Document (PDF)') {
      this.showToast('Opening verified Grama Niladhari attestation document (PDF)...');
    } else if (item.secondaryActionLabel === 'Quick Approve') {
      this.showToast('Automated cultural tags approved & appended.');
    } else if (item.secondaryActionLabel === 'Publish to Archive') {
      this.showToast('Bilingual transcript published to Sovereign Heritage Archive.');
    }
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
