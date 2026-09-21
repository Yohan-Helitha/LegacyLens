import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

interface ClearanceDelegation {
  title: string;
  scope: string;
  status: string;
  icon: string;
  badgeClass: string;
}

interface HardwareKey {
  id: string;
  name: string;
  type: string;
  serial: string;
  enrolledDate: string;
  icon: string;
  status: string;
}

interface AdminSession {
  id: string;
  terminal: string;
  location: string;
  ip: string;
  isCurrent: boolean;
  statusText: string;
  statusClass: string;
  lastActive: string;
  tlsInfo: string;
}

interface AuditLogEntry {
  id: string;
  title: string;
  details: string;
  timestamp: string;
  icon: string;
  type: string;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">check_circle</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Reusable Sidebar Component -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navbar Header -->
        <app-header 
          pageTitle="Admin Profile" 
          section="Administration"
          [showSearch]="false">
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Top Executive Bar -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                  Admin Profile & Security
                </h1>
                
              </div>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Personal administrative credentials, cryptographic key pairs, institutional clearance, and session security parameters.
              </p>
            </div>
            
            
          </div>

          <!-- Top Row: Administrator Details (7) + Recent Audit Actions (5) at matched height -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            <!-- LEFT: Administrator Details -->
            <div class="lg:col-span-7">
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm h-full flex flex-col">
                <div class="flex items-center justify-between mb-6 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">person_pin</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Administrator Details</h2>
                      <p class="text-[11px] text-[#6e7978]">Department of National Archives & Cultural Sovereign Cloud</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-mono font-semibold px-2 py-1 bg-[#f2f4f7] rounded text-[#3e4948]">
                    LK-GOV-9042-AUTH-SHA256
                  </span>
                </div>

                <!-- Avatar & Identity Summary -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6 p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                  <div class="relative">
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#004343] to-[#006666] text-white font-serif font-bold text-2xl flex items-center justify-center shadow-lg ring-4 ring-[#004343]/20">
                      {{ getInitials() }}
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active Clearance">
                      <span class="material-symbols-outlined text-xs">check</span>
                    </div>
                  </div>

                  <div class="flex-1 space-y-1">
                    <div class="flex items-center gap-2">
                      <h3 class="text-lg font-bold text-[#191c1c]">{{ authService.currentUser()?.fullName }}</h3>
                    </div>
                    <p class="text-xs text-[#3e4948]">
                      Senior Curatorial Lead • Ministry of Buddhasasana, Religious & Cultural Affairs
                    </p>
                    <div class="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#6e7978]">
                      <span class="flex items-center gap-1 font-mono">
                        <span class="material-symbols-outlined text-xs">badge</span> NIC: {{ authService.currentUser()?.nicNumber || 'N/A' }}
                      </span>
                      <span>•</span>
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">location_on</span> Western & Central Provincial Hub
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Admin Details Table -->
                <div class="overflow-hidden rounded-xl border border-[#dde3eb] flex-1">
                  <table class="w-full text-left text-xs">
                    <tbody class="divide-y divide-[#dde3eb] bg-white">
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider w-1/3 bg-[#f8faf9]">Admin ID</th>
                        <td class="px-4 py-3 text-[#191c1c] font-mono">{{ authService.currentUser()?.id || 'a88885d4-3ede-4c34-b2cc-d54a16affea5' }}</td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">Full Name</th>
                        <td class="px-4 py-3 text-[#191c1c] font-semibold">{{ authService.currentUser()?.fullName || 'Lakni Ranepura' }}</td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">Phone Number</th>
                        <td class="px-4 py-3 text-[#191c1c] font-mono">{{ authService.currentUser()?.phoneNumber || '0766939924' }} <span class="ml-2 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Verified</span></td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">NIC Number</th>
                        <td class="px-4 py-3 text-[#191c1c] font-mono">{{ authService.currentUser()?.nicNumber || '20016124201' }}</td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">City</th>
                        <td class="px-4 py-3 text-[#191c1c]">Gampaha <span class="text-[10px] text-[#6e7978] ml-1">(Western)</span></td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">Date of Birth</th>
                        <td class="px-4 py-3 text-[#191c1c]">2001-04-23</td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">Admin Role Status</th>
                        <td class="px-4 py-3 text-[#191c1c] font-bold">ACTIVE</td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">2FA Status</th>
                        <td class="px-4 py-3 text-[#191c1c]">Disabled <span class="text-[10px] text-[#6e7978] ml-2">Failed PINs: 0</span></td>
                      </tr>
                      <tr class="hover:bg-[#f8faf9] transition-colors">
                        <th class="px-4 py-3 font-bold text-[#6e7978] uppercase tracking-wider bg-[#f8faf9]">Account Timestamps</th>
                        <td class="px-4 py-3 text-[#6e7978] text-[10px] font-mono space-y-1">
                          <div>Created: Aug 22, 2026, 1:13:56 PM</div>
                          <div>Updated: Aug 22, 2026, 1:14:12 PM</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- RIGHT: Recent Audit Actions (matches height) -->
            <div class="lg:col-span-5">
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm h-full flex flex-col">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">history_edu</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Recent Audit Actions</h2>
                      <p class="text-[11px] text-[#6e7978]">Immutable Personal Audit Trail</p>
                    </div>
                  </div>
                  <button (click)="showAllAuditLogs()" class="text-xs font-bold text-[#004343] hover:underline">
                    Full Audit Log
                  </button>
                </div>

                <div class="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#dde3eb] flex-1 overflow-y-auto">
                  @for (action of recentActions(); track action.id) {
                    <div class="relative flex items-start gap-3.5 pl-1">
                      <div class="w-6 h-6 rounded-full bg-white border-2 border-[#004343] flex items-center justify-center text-[#004343] shrink-0 z-10">
                        <span class="material-symbols-outlined text-xs">{{ action.icon }}</span>
                      </div>
                      <div class="flex-1 bg-[#f8faf9] p-3 rounded-xl border border-[#dde3eb]">
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold text-[#191c1c]">{{ action.title }}</span>
                          <span class="text-[10px] font-mono text-[#6e7978]">{{ action.timestamp }}</span>
                        </div>
                        <p class="text-[11px] text-[#3e4948]">{{ action.details }}</p>
                        <div class="mt-1 text-[9px] font-mono text-[#6e7978]">Ref: {{ action.id }}</div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

          </div>

          <!-- Full-Width: Admin Roles & Permissions -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">shield</span>
                </div>
                <div>
                  <h2 class="text-base font-serif font-bold text-[#191c1c]">Admin Roles & Permissions</h2>
                  <p class="text-[11px] text-[#6e7978]">System Authorities & Capabilities</p>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              @for (item of clearanceDelegations(); track item.title) {
                <div class="flex items-center justify-between p-3.5 rounded-xl border border-[#dde3eb] bg-[#f8faf9] hover:bg-white hover:border-[#004343]/30 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-white border border-[#dde3eb] flex items-center justify-center text-[#004343] shrink-0">
                      <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[#191c1c]">{{ item.title }}</div>
                      <div class="text-[10px] text-[#6e7978]">{{ item.scope }}</div>
                    </div>
                  </div>
                  <span [ngClass]="item.badgeClass" class="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ml-2">
                    {{ item.status }}
                  </span>
                </div>
              }
            </div>
          </div>

        </div>

      </main>



    </div>
  `
})
export class AdminProfileComponent {
  toastMessage = signal<string | null>(null);

  // Certificate State
  certFingerprint = '9e:4b:21:fa:70:c8:33:1e:d4:bb:88:21:0a:3f:66:91:c0:9a:12:ef:43:dc:67:98:bb:33:a1:09:44:81:bc:ef';
  autoRenewCert = signal<boolean>(true);
  remainingEmergencyCodes = signal<number>(8);

  // Modals
  showRotateModal = signal<boolean>(false);
  showRegisterModal = signal<boolean>(false);
  newKeyName = 'Backup YubiKey 5Ci';
  newKeyType = 'FIDO2';

  // Clearance Delegations
  clearanceDelegations = signal<ClearanceDelegation[]>([
    {
      title: 'Archive Cold Vault & Cryptographic Purge',
      scope: 'Sole Overseer Level 4 Signatory Authority',
      status: 'Active • Sole Authority',
      icon: 'lock_open',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      title: 'Elder Oral History Canon Ingestion',
      scope: 'Verifying Grama Niladhari & Temple Lineage Witnesses',
      status: 'Active • Unrestricted',
      icon: 'record_voice_over',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      title: 'Cultural Map Sacred Boundary Anchoring',
      scope: 'Inter-Provincial GIS Boundary Adjustments',
      status: 'Active • Multi-Province',
      icon: 'share_location',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      title: 'Grama Niladhari & Lineage Attestation',
      scope: 'Issuing digital attestation seals for heritage custodians',
      status: 'Active • State Signatory',
      icon: 'history_edu',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  ]);

  // Hardware Keys
  hardwareKeys = signal<HardwareKey[]>([
    {
      id: 'key-1',
      name: 'YubiKey 5C NFC Primary',
      type: 'FIDO2',
      serial: 'LK-KEY-8812',
      enrolledDate: '14 Jan 2024',
      icon: 'usb',
      status: 'Primary FIDO2'
    },
    {
      id: 'key-2',
      name: 'Colombo Hub MacBook Pro TouchID Passkey',
      type: 'PASSKEY',
      serial: 'TERMINAL-#04-PASSKEY-09',
      enrolledDate: '02 Feb 2024',
      icon: 'fingerprint',
      status: 'Attested Passkey'
    }
  ]);

  // Active Sessions
  activeSessions = signal<AdminSession[]>([
    {
      id: 'sess-1',
      terminal: 'Current Session (Chrome / Windows)',
      location: 'Gampaha, Western Province',
      ip: '192.168.1.1',
      isCurrent: true,
      statusText: 'Active Now',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      lastActive: 'Aug 22, 2026, 1:13:52 PM',
      tlsInfo: 'TLS 1.3 • Secured Connection'
    }
  ]);

  // Recent Actions Audit Trail
  recentActions = signal<AuditLogEntry[]>([
    {
      id: 'ACT-9942',
      title: 'Edited Administrator Profile: John Doe',
      details: 'Updated contact information and region assignment via Admin Management.',
      timestamp: '2 hours ago',
      icon: 'admin_panel_settings',
      type: 'endorsement'
    },
    {
      id: 'ACT-9910',
      title: 'Reviewed and Published Oral History #102',
      details: 'Approved elder submission and generated AI Quiz in Moderation Queue.',
      timestamp: 'Yesterday, 16:40',
      icon: 'fact_check',
      type: 'cold_vault'
    },
    {
      id: 'ACT-9855',
      title: 'Suspended User Account: User404',
      details: 'Enforced account suspension due to suspicious activity in User Management.',
      timestamp: '3 days ago',
      icon: 'block',
      type: 'boundary'
    }
  ]);

  constructor(private router: Router, public authService: AuthService) {}

  getInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'User';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  saveProfileChanges(): void {
    this.toastMessage.set('Admin profile parameters successfully updated.');
    setTimeout(() => this.toastMessage.set(null), 4000);
  }

  exportCuratorialId(): void {
    this.toastMessage.set('Exporting Curatorial Identity Package (LK-GOV-9042.cid)...');
    setTimeout(() => {
      this.toastMessage.set('Curatorial ID & Public Cryptographic Keys exported.');
    }, 1500);
  }

  openRotateKeyModal(): void {
    this.showRotateModal.set(true);
  }

  confirmKeyRotation(): void {
    this.showRotateModal.set(false);
    this.certFingerprint = 'a1:7e:99:3c:52:d1:88:0b:fe:12:44:aa:66:90:bc:72:dd:33:14:e5:08:92:44:b1:cf:89:12:34:56:78:90:ab';
    this.toastMessage.set('Cryptographic Keys rotated. New RSA-4096 Curatorial Pair published.');
  }

  openRegisterKeyModal(): void {
    this.showRegisterModal.set(true);
  }

  confirmRegisterKey(): void {
    if (!this.newKeyName) return;
    const newKey: HardwareKey = {
      id: 'key-' + Date.now(),
      name: this.newKeyName,
      type: this.newKeyType,
      serial: 'LK-KEY-' + Math.floor(1000 + Math.random() * 9000),
      enrolledDate: 'Today',
      icon: this.newKeyType === 'FIDO2' ? 'usb' : 'fingerprint',
      status: 'Attested ' + this.newKeyType
    };
    this.hardwareKeys.update(keys => [...keys, newKey]);
    this.showRegisterModal.set(false);
    this.toastMessage.set(`Security token "${newKey.name}" enrolled successfully.`);
  }

  testKey(key: HardwareKey): void {
    this.toastMessage.set(`Hardware Challenge sent to ${key.name}. Challenge verified.`);
  }

  revokeKey(key: HardwareKey): void {
    this.hardwareKeys.update(keys => keys.filter(k => k.id !== key.id));
    this.toastMessage.set(`Hardware token "${key.name}" has been revoked.`);
  }

  regenerateEmergencyCodes(): void {
    this.remainingEmergencyCodes.set(10);
    this.toastMessage.set('10 New Emergency Offline Recovery Codes generated and sent to vault.');
  }

  terminateSession(session: AdminSession): void {
    this.activeSessions.update(sessions => sessions.filter(s => s.id !== session.id));
    this.toastMessage.set(`Session on ${session.terminal} terminated.`);
  }

  terminateAllOtherSessions(): void {
    this.activeSessions.update(sessions => sessions.filter(s => s.isCurrent));
    this.toastMessage.set('All other remote administrative sessions terminated.');
  }

  toggleAutoRenew(): void {
    this.autoRenewCert.update(v => !v);
    this.toastMessage.set(`Auto-renew via GovPKI set to ${this.autoRenewCert() ? 'Enabled' : 'Disabled'}.`);
  }

  copyFingerprint(): void {
    navigator.clipboard?.writeText(this.certFingerprint);
    this.toastMessage.set('Public SHA-256 Fingerprint copied to clipboard.');
  }

  downloadCertificate(): void {
    this.toastMessage.set('Downloading Public Curatorial Certificate (Dr_Senanayake_GovPKI.pem)...');
  }

  viewMandatePdf(): void {
    this.toastMessage.set('Opening National Heritage Council Statutory Mandate (PDF)...');
  }

  showAllAuditLogs(): void {
    this.router.navigate(['/audit']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

