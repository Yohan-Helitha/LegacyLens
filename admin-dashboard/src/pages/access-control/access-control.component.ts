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
  selector: 'app-access-control',
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

      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navbar Header -->
        <app-header 
          pageTitle="Admin Profile & Credentials" 
          section="Console"
          [showSearch]="false">
          <div class="flex items-center gap-2">
            <button (click)="openRotateKeyModal()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-base text-[#9b4600]">vpn_key</span>
              <span>Rotate Security Keys</span>
            </button>

            <button (click)="exportCuratorialId()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-sm">
              <span class="material-symbols-outlined text-base text-[#004343]">badge</span>
              <span>Export Curatorial ID</span>
            </button>

            <button (click)="saveProfileChanges()"
                    class="flex items-center gap-1.5 px-4 py-1.5 bg-[#004343] text-white rounded-lg text-xs font-semibold hover:bg-[#003131] transition-all shadow-sm shadow-[#004343]/20">
              <span class="material-symbols-outlined text-base">save</span>
              <span>Save Changes</span>
            </button>
          </div>
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Page Header Banner -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#dde3eb] shadow-sm">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl font-serif font-bold text-[#191c1c]">Admin Profile & Credentials</h1>
                <span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                  Active • Level 4 Super Overseer
                </span>
              </div>
              <p class="text-xs text-[#6e7978]">
                Manage personal administrative credentials, cryptographic key pairs, institutional clearance, and session security parameters.
              </p>
            </div>
            
            <div class="flex items-center gap-4 bg-[#f8faf9] px-4 py-2.5 rounded-xl border border-[#dde3eb]">
              <div class="text-right">
                <div class="text-[10px] uppercase font-bold text-[#6e7978] tracking-wider">Sovereign Signatory Status</div>
                <div class="text-xs font-bold text-[#004343]">Authenticated via YubiKey 5C NFC</div>
              </div>
              <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <span class="material-symbols-outlined text-lg">verified</span>
              </div>
            </div>
          </div>

          <!-- Main Dual Column Layout (7 Cols Left / 5 Cols Right) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <!-- LEFT COLUMN (7 Cols): Personal Info, Clearance & MFA -->
            <div class="lg:col-span-7 space-y-6">

              <!-- 1. Administrator Dossier Card -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-6 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">person_pin</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Administrator Dossier</h2>
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
                      SS
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active Clearance">
                      <span class="material-symbols-outlined text-xs">check</span>
                    </div>
                  </div>

                  <div class="flex-1 space-y-1">
                    <div class="flex items-center gap-2">
                      <h3 class="text-lg font-bold text-[#191c1c]">{{ profileName() }}</h3>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9b4600]/10 text-[#9b4600]">
                        Curatorial Council Chair
                      </span>
                    </div>
                    <p class="text-xs text-[#3e4948]">
                      Senior Curatorial Lead • Ministry of Buddhasasana, Religious & Cultural Affairs
                    </p>
                    <div class="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#6e7978]">
                      <span class="flex items-center gap-1 font-mono">
                        <span class="material-symbols-outlined text-xs">badge</span> NIC: 197884200192V
                      </span>
                      <span>•</span>
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">location_on</span> Western & Central Provincial Hub
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Form Fields Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-[#6e7978] mb-1.5">Official Name</label>
                    <input type="text" 
                           [ngModel]="profileName()" 
                           (ngModelChange)="profileName.set($event)"
                           class="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-[#6e7978] mb-1.5">Institutional Email</label>
                    <input type="email" 
                           [ngModel]="profileEmail()" 
                           (ngModelChange)="profileEmail.set($event)"
                           class="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors font-mono" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-[#6e7978] mb-1.5">Attestation Phone (Gov Secure)</label>
                    <input type="text" 
                           [ngModel]="profilePhone()" 
                           (ngModelChange)="profilePhone.set($event)"
                           class="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors font-mono" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-bold uppercase tracking-wider text-[#6e7978] mb-1.5">Jurisdictional Hub</label>
                    <select [ngModel]="profileHub()" 
                            (ngModelChange)="profileHub.set($event)"
                            class="w-full text-xs font-semibold px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343] transition-colors">
                      <option value="Western & Central Province Oversight">Western & Central Province Oversight</option>
                      <option value="Northern & Eastern Maritime Zone">Northern & Eastern Maritime Zone</option>
                      <option value="Southern & Sabaragamuwa Council">Southern & Sabaragamuwa Council</option>
                      <option value="North Central & Uva Heritage Grid">North Central & Uva Heritage Grid</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- 2. Institutional Clearance Matrix -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">shield</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Institutional Clearance Matrix</h2>
                      <p class="text-[11px] text-[#6e7978]">Executive Delegations & Statutory Authority</p>
                    </div>
                  </div>
                  <span class="text-[11px] font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs">group</span>
                    2-of-3 Quorum Signoff
                  </span>
                </div>

                <div class="space-y-3">
                  @for (item of clearanceDelegations(); track item.title) {
                    <div class="flex items-center justify-between p-3.5 rounded-xl border border-[#dde3eb] bg-[#f8faf9] hover:bg-white hover:border-[#004343]/30 transition-all">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-white border border-[#dde3eb] flex items-center justify-center text-[#004343]">
                          <span class="material-symbols-outlined text-lg">{{ item.icon }}</span>
                        </div>
                        <div>
                          <div class="text-xs font-bold text-[#191c1c]">{{ item.title }}</div>
                          <div class="text-[10px] text-[#6e7978]">{{ item.scope }}</div>
                        </div>
                      </div>
                      <span [ngClass]="item.badgeClass" class="text-[10px] font-bold px-2.5 py-1 rounded-full border">
                        {{ item.status }}
                      </span>
                    </div>
                  }
                </div>

                <div class="mt-4 pt-4 border-t border-[#dde3eb] flex items-center justify-between text-xs text-[#6e7978]">
                  <span>Mandate ratified under National Heritage Protection Act No. 24 of 1980</span>
                  <button (click)="viewMandatePdf()" class="text-[#004343] font-bold hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">open_in_new</span>
                    View Mandate PDF
                  </button>
                </div>
              </div>

              <!-- 3. Hardware Multi-Factor Authentication -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">token</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Hardware Multi-Factor Authentication</h2>
                      <p class="text-[11px] text-[#6e7978]">FIDO2 / WebAuthn Sovereign Hardware Cryptographic Keys</p>
                    </div>
                  </div>
                  <button (click)="openRegisterKeyModal()"
                          class="flex items-center gap-1 px-3 py-1 bg-[#004343]/10 text-[#004343] rounded-lg text-xs font-bold hover:bg-[#004343] hover:text-white transition-all">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Register Key
                  </button>
                </div>

                <div class="space-y-3">
                  @for (key of hardwareKeys(); track key.id) {
                    <div class="flex items-center justify-between p-4 rounded-xl border border-[#dde3eb] bg-[#f8faf9]">
                      <div class="flex items-center gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-white border border-[#dde3eb] flex items-center justify-center text-[#004343]">
                          <span class="material-symbols-outlined text-xl">{{ key.icon }}</span>
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-[#191c1c]">{{ key.name }}</span>
                            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              {{ key.status }}
                            </span>
                          </div>
                          <div class="text-[11px] text-[#6e7978] font-mono mt-0.5">
                            Serial: {{ key.serial }} • Enrolled {{ key.enrolledDate }}
                          </div>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        @if (key.type === 'FIDO2') {
                          <button (click)="testKey(key)"
                                  class="px-3 py-1.5 bg-white border border-[#c2c8c7] rounded-lg text-xs font-semibold text-[#3e4948] hover:bg-[#eceef0] transition-colors">
                            Test Key
                          </button>
                        } @else {
                          <button (click)="revokeKey(key)"
                                  class="px-3 py-1.5 bg-white border border-[#ba1a1a]/30 text-[#ba1a1a] rounded-lg text-xs font-semibold hover:bg-[#ba1a1a]/10 transition-colors">
                            Revoke
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Emergency Recovery Token Reserve -->
                <div class="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-amber-600 text-base">emergency</span>
                      <span class="text-xs font-bold text-[#191c1c]">Emergency Offline Recovery Codes</span>
                    </div>
                    <span class="text-xs font-bold text-amber-800">{{ remainingEmergencyCodes() }} of 10 Remaining</span>
                  </div>
                  <div class="w-full bg-[#dde3eb] h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-500 h-full rounded-full transition-all" [style.width.%]="(remainingEmergencyCodes() / 10) * 100"></div>
                  </div>
                  <div class="flex items-center justify-between mt-3 text-[11px] text-[#6e7978]">
                    <span>Stored in encrypted physical cold-safe deposit at Central Bank vault.</span>
                    <button (click)="regenerateEmergencyCodes()" class="text-[#9b4600] font-bold hover:underline">
                      Regenerate Codes
                    </button>
                  </div>
                </div>

              </div>

            </div>

            <!-- RIGHT COLUMN (5 Cols): Active Sessions, Certificate & Personal Actions -->
            <div class="lg:col-span-5 space-y-6">

              <!-- 4. Active Administrative Sessions -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">devices</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Active Sessions</h2>
                      <p class="text-[11px] text-[#6e7978]">Live Hardware & Network Endpoints</p>
                    </div>
                  </div>
                  <button (click)="terminateAllOtherSessions()"
                          class="text-[11px] font-bold text-[#ba1a1a] hover:underline flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">power_settings_new</span>
                    Terminate Other
                  </button>
                </div>

                <div class="space-y-3">
                  @for (session of activeSessions(); track session.id) {
                    <div class="p-4 rounded-xl border border-[#dde3eb] bg-[#f8faf9] space-y-2">
                      <div class="flex items-start justify-between">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-[#191c1c]">{{ session.terminal }}</span>
                            @if (session.isCurrent) {
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                This Device
                              </span>
                            }
                          </div>
                          <div class="text-[11px] text-[#6e7978] mt-0.5">
                            {{ session.location }} • IP: {{ session.ip }}
                          </div>
                        </div>
                        <span [ngClass]="session.statusClass" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">
                          {{ session.statusText }}
                        </span>
                      </div>

                      <div class="flex items-center justify-between text-[10px] text-[#6e7978] pt-1 border-t border-[#dde3eb]/60 font-mono">
                        <span>{{ session.tlsInfo }}</span>
                        @if (!session.isCurrent) {
                          <button (click)="terminateSession(session)" class="text-[#ba1a1a] font-bold hover:underline font-sans">
                            Revoke
                          </button>
                        } @else {
                          <span class="text-emerald-700 font-sans font-semibold">Active Now</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- 5. Curatorial Signing Certificate -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">workspace_premium</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Curatorial Certificate</h2>
                      <p class="text-[11px] text-[#6e7978]">X.509 Curatorial Seal (4096-bit RSA)</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Valid • 84 Days
                  </span>
                </div>

                <!-- Certificate Fingerprint Box -->
                <div class="space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] uppercase font-bold text-[#6e7978] tracking-wider">SHA-256 Public Fingerprint</span>
                      <button (click)="copyFingerprint()" class="text-[10px] font-bold text-[#004343] hover:underline flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs">content_copy</span>
                        Copy
                      </button>
                    </div>
                    <div class="p-3 bg-[#191c1c] text-emerald-400 font-mono text-[10px] rounded-xl break-all leading-relaxed border border-gray-800 shadow-inner select-all">
                      {{ certFingerprint }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb]">
                    <div>
                      <div class="text-xs font-bold text-[#191c1c]">Auto-Renew via GovPKI</div>
                      <div class="text-[10px] text-[#6e7978]">Automatically re-attest 14 days before expiration</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [checked]="autoRenewCert()" (change)="toggleAutoRenew()" class="sr-only peer">
                      <div class="w-10 h-5 bg-[#c2c8c7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#c2c8c7] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#004343]"></div>
                    </label>
                  </div>

                  <button (click)="downloadCertificate()"
                          class="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#c2c8c7] rounded-xl text-xs font-bold text-[#3e4948] hover:bg-[#f2f4f7] transition-colors shadow-sm">
                    <span class="material-symbols-outlined text-base text-[#004343]">file_download</span>
                    <span>Download Public Certificate (.pem)</span>
                  </button>
                </div>
              </div>

              <!-- 6. Recent Personal Actions Snapshot -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 shadow-sm">
                <div class="flex items-center justify-between mb-4 pb-4 border-b border-[#dde3eb]">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">history_edu</span>
                    </div>
                    <div>
                      <h2 class="text-base font-serif font-bold text-[#191c1c]">Recent Council Signoffs</h2>
                      <p class="text-[11px] text-[#6e7978]">Immutable Personal Audit Trail</p>
                    </div>
                  </div>
                  <button (click)="showAllAuditLogs()" class="text-xs font-bold text-[#004343] hover:underline">
                    Full Audit Log
                  </button>
                </div>

                <div class="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#dde3eb]">
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

        </div>

      </main>

      <!-- Key Rotation Modal -->
      @if (showRotateModal()) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#dde3eb] overflow-hidden animate-in fade-in zoom-in duration-150">
            <div class="p-6 border-b border-[#dde3eb] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#9b4600]/10 text-[#9b4600] flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl">vpn_key</span>
                </div>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Rotate Cryptographic Keys</h3>
                  <p class="text-xs text-[#6e7978]">Generate a new RSA-4096 Curatorial Key Pair</p>
                </div>
              </div>
              <button (click)="showRotateModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c]">✕</button>
            </div>

            <div class="p-6 space-y-4">
              <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Important Notice:</strong> Rotating your security key will invalidate existing active session tokens on other devices and prompt for immediate hardware attestation via your enrolled YubiKey.
              </div>

              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Hardware Key Confirmation</label>
                <div class="p-3 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl flex items-center justify-between text-xs">
                  <span>YubiKey 5C NFC (Serial: LK-KEY-8812)</span>
                  <span class="text-emerald-700 font-bold">Ready</span>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Passphrase Attestation</label>
                <input type="password" placeholder="Enter Council Overseer Passphrase"
                       class="w-full text-xs px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
              </div>
            </div>

            <div class="p-6 bg-[#f8faf9] border-t border-[#dde3eb] flex items-center justify-end gap-3">
              <button (click)="showRotateModal.set(false)"
                      class="px-4 py-2 border border-[#c2c8c7] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-white transition-colors">
                Cancel
              </button>
              <button (click)="confirmKeyRotation()"
                      class="px-5 py-2 bg-[#9b4600] text-white rounded-xl text-xs font-bold hover:bg-[#7e3800] transition-all shadow-md shadow-[#9b4600]/20">
                Confirm & Rotate Keys
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Register Hardware Key Modal -->
      @if (showRegisterModal()) {
        <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#dde3eb] overflow-hidden">
            <div class="p-6 border-b border-[#dde3eb] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl">token</span>
                </div>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Register Security Hardware Token</h3>
                  <p class="text-xs text-[#6e7978]">FIDO2 / WebAuthn Device Enrolment</p>
                </div>
              </div>
              <button (click)="showRegisterModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c]">✕</button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Device Nickname</label>
                <input type="text" [(ngModel)]="newKeyName" placeholder="e.g. Backup YubiKey 5Ci or Workstation Passkey"
                       class="w-full text-xs px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
              </div>

              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1">Key Type</label>
                <select [(ngModel)]="newKeyType"
                        class="w-full text-xs px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]">
                  <option value="FIDO2">YubiKey / FIDO2 Hardware NFC</option>
                  <option value="PASSKEY">macOS / Windows TouchID Passkey</option>
                  <option value="PKI">National Smart ID Card (GovPKI)</option>
                </select>
              </div>

              <div class="p-4 rounded-xl bg-[#f8faf9] border border-[#dde3eb] text-center space-y-2">
                <div class="w-12 h-12 rounded-full bg-[#004343]/10 text-[#004343] mx-auto flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl animate-pulse">contactless</span>
                </div>
                <div class="text-xs font-bold text-[#191c1c]">Insert your hardware token and touch the gold sensor</div>
                <div class="text-[10px] text-[#6e7978]">Follow the WebAuthn security prompt in your browser.</div>
              </div>
            </div>

            <div class="p-6 bg-[#f8faf9] border-t border-[#dde3eb] flex items-center justify-end gap-3">
              <button (click)="showRegisterModal.set(false)"
                      class="px-4 py-2 border border-[#c2c8c7] rounded-xl text-xs font-semibold text-[#3e4948] hover:bg-white transition-colors">
                Cancel
              </button>
              <button (click)="confirmRegisterKey()"
                      class="px-5 py-2 bg-[#004343] text-white rounded-xl text-xs font-bold hover:bg-[#003131] transition-all shadow-md">
                Complete Enrollment
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class AccessControlComponent {
  toastMessage = signal<string | null>(null);

  // Profile Signals
  profileName = signal<string>('Dr. Samantha Senanayake');
  profileEmail = signal<string>('s.senanayake@legacylens.gov.lk');
  profilePhone = signal<string>('+94 11 269 4111');
  profileHub = signal<string>('Western & Central Province Oversight');

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
      terminal: 'Colombo Core Terminal #04 (Chrome / macOS)',
      location: 'Colombo 07, Western Province',
      ip: '192.248.42.10 (SLT Fibre Gov-Gateway)',
      isCurrent: true,
      statusText: 'Active Now',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      lastActive: 'Just now',
      tlsInfo: 'TLS 1.3 • Hardware Attested Handshake'
    },
    {
      id: 'sess-2',
      terminal: 'Kandy Heritage Node Terminal 02 (Firefox / Linux)',
      location: 'Kandy, Central Province',
      ip: '192.248.88.5 (Central Gov Network)',
      isCurrent: false,
      statusText: 'Idle • 42m',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-300',
      lastActive: '42 minutes ago',
      tlsInfo: 'TLS 1.3 • Warning: Auto-locks in 18m'
    }
  ]);

  // Recent Actions Audit Trail
  recentActions = signal<AuditLogEntry[]>([
    {
      id: 'ACT-9942',
      title: 'Endorsed Elder Credential: Ven. Medankara',
      details: 'Signed attestation batch for 42 oral history recordings with YubiKey 5C.',
      timestamp: '2 hours ago',
      icon: 'verified',
      type: 'endorsement'
    },
    {
      id: 'ACT-9910',
      title: 'Unsealed Ola Leaf Manuscript Batch #411',
      details: 'Initiated 2-of-3 quorum signoff for British Museum restitution asset scans.',
      timestamp: 'Yesterday, 16:40',
      icon: 'auto_stories',
      type: 'cold_vault'
    },
    {
      id: 'ACT-9855',
      title: 'Anchored Sacred Geometry Boundary Seal',
      details: 'Published cryptographically verified GIS boundary for Sigiriya Foothills sanctuary.',
      timestamp: '3 days ago',
      icon: 'explore',
      type: 'boundary'
    }
  ]);

  constructor(private router: Router, private authService: AuthService) {}

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
    this.router.navigate(['/analytics']);
    this.router.navigate(['/audit']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
