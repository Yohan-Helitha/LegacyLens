import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { AuthService } from '../../app/core/services/auth.service';

export interface AdminRecord {
  id: string;
  fullName: string;
  phoneNumber: string;
  phoneVerified: boolean;
  nicNumber: string;
  dateOfBirth: string;
  profilePhotoUrl: string;
  accountStatus: string;
  cityName: string;
  cityRegion: string;
  fingerprintEnabled: boolean;
  failedPinAttempts: number;
  roleType: string;
  roleStatus: string;
  activatedAt: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = 'http://localhost:8081/api/admin/management/admins';
const VERIFICATIONS_API = 'http://localhost:8081/api/admin/verifications';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent, DatePipe],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">

      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce transition-all duration-300">
          <span class="material-symbols-outlined text-emerald-300 text-xl">{{ isErrorToast() ? 'error' : 'check_circle' }}</span>
          <div class="text-xs font-semibold max-w-xs">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs cursor-pointer">✕</button>
        </div>
      }

      <app-sidebar></app-sidebar>

      <main class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

        <app-header pageTitle="Admin Management" section="Administration"
  searchPlaceholder="Search by name, phone, NIC, or city..."
  [searchQuery]="searchQuery()"
  (searchQueryChange)="searchQuery.set($event)">
</app-header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-3 text-[#6f7978]">
                <span class="material-symbols-outlined text-4xl animate-spin text-[#004343]">cached</span>
                <span class="text-sm font-medium">Loading administrators...</span>
              </div>
            </div>
          }

          <!-- Error State -->
          @if (hasError() && !isLoading()) {
            <div class="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <span class="material-symbols-outlined text-xl">warning</span>
              <span>Backend unreachable — please try again later.</span>
            </div>
          }

          @if (!isLoading()) {
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">Admin Management</h1>
              <p class="text-xs text-[#3f4948] max-w-2xl leading-relaxed">
                View and manage platform administrators. Only users with the ADMIN role are shown below.
              </p>
            </div>
            <div class="flex items-center gap-3 flex-wrap self-start xl:self-auto">
              <button (click)="loadAdmins()" [disabled]="isLoading()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50">
                <span class="material-symbols-outlined text-base">refresh</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Metrics -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978] mb-2">Total Admins</div>
              <div class="text-2xl font-serif font-bold text-[#191c1c]">{{ admins().length }}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978] mb-2">Active</div>
              <div class="text-2xl font-serif font-bold text-emerald-700">{{ activeAdmins().length }}</div>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-[#dde3eb] shadow-sm">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[#6e7978] mb-2">Suspended / Deactivated</div>
              <div class="text-2xl font-serif font-bold text-red-700">{{ inactiveAdmins().length }}</div>
            </div>
          </div>

          <!-- Main Body: Table + Inspector -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

            <!-- LEFT: Table (7 cols) -->
            <div class="xl:col-span-7 space-y-5">
              <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden">
                <div class="p-4 border-b border-[#dde3eb] bg-[#f8faf9] flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg text-[#004343]">admin_panel_settings</span>
                    <h2 class="text-sm font-serif font-bold text-[#191c1c]">Administrator Registry</h2>
                  </div>
                  <span class="text-[10px] text-[#6e7978]">{{ admins().length }} records</span>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs">
                    <thead>
                      <tr class="bg-[#f8faf9] text-[#6e7978] uppercase tracking-wider text-[10px]">
                        <th class="px-5 py-3 text-left font-bold">Administrator</th>
                        <th class="px-5 py-3 text-left font-bold">NIC</th>
                        <th class="px-5 py-3 text-left font-bold">Role Status</th>
                        <th class="px-5 py-3 text-left font-bold">City</th>
                        <th class="px-5 py-3 text-left font-bold">Account</th>
                        <th class="px-5 py-3 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#f2f4f3]">
                      @for (admin of filteredAdmins(); track admin.id) {
                        <tr (click)="selectAdmin(admin)"
                            [ngClass]="selectedAdmin()?.id === admin.id ? 'bg-[#004343]/10 border-l-4 border-l-[#004343]' : 'hover:bg-[#f8faf9]'"
                            class="transition-colors cursor-pointer">
                          <td class="px-5 py-3.5">
                            <div class="font-bold text-[#191c1c] text-xs">{{ admin.fullName }}</div>
                            <div class="text-[10px] text-[#6e7978] font-mono">{{ admin.phoneNumber }}</div>
                          </td>
                          <td class="px-5 py-3.5 font-mono text-[#6e7978] text-[10px]">{{ admin.nicNumber }}</td>
                          <td class="px-5 py-3.5">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                  [ngClass]="getRoleStatusBadge(admin.roleStatus)">
                              {{ admin.roleStatus || 'ACTIVE' }}
                            </span>
                          </td>
                          <td class="px-5 py-3.5 text-[#3f4948] text-[10px]">{{ admin.cityName || '—' }}</td>
                          <td class="px-5 py-3.5">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                  [ngClass]="getAccountStatusBadge(admin.accountStatus)">
                              {{ admin.accountStatus || 'ACTIVE' }}
                            </span>
                          </td>
                          <td class="px-5 py-3.5 text-right" (click)="$event.stopPropagation()">
                            <div class="flex items-center justify-end gap-1">
                              <button (click)="openEditModal(admin)" title="Edit"
                                class="p-1.5 rounded-lg hover:bg-[#f2f4f3] text-[#004343] transition-colors cursor-pointer">
                                <span class="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button (click)="toggleSuspend(admin)" title="Suspend / Reactivate"
                                class="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
                                <span class="material-symbols-outlined text-base">{{ admin.accountStatus === 'SUSPENDED' || admin.accountStatus === 'DEACTIVATED' ? 'lock_open' : 'lock' }}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                @if (filteredAdmins().length === 0) {
                  <div class="p-10 text-center text-xs text-[#6e7978]">
                    <span class="material-symbols-outlined text-3xl text-gray-300 block mb-2">admin_panel_settings</span>
                    <p>No administrators found.</p>
                  </div>
                }
              </div>
            </div>

            <!-- RIGHT: Inspector (5 cols) -->
            <div class="xl:col-span-5 sticky top-0 space-y-4">
              @if (selectedAdmin(); as admin) {
                <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-sm p-5 space-y-5">
                  <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                    <div>
                      <h3 class="text-sm font-bold text-[#191c1c]">Administrator Profile</h3>
                      <p class="text-[10px] text-[#6e7978] font-mono mt-0.5">ID: {{ admin.id }}</p>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          [ngClass]="getAccountStatusBadge(admin.accountStatus)">
                      {{ admin.accountStatus || 'ACTIVE' }}
                    </span>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">Full Name</div>
                      <div class="text-xs font-bold text-[#191c1c]">{{ admin.fullName }}</div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">Phone</div>
                        <div class="text-xs font-mono text-[#191c1c]">{{ admin.phoneNumber }}</div>
                        <div class="text-[10px] text-[#004343] font-semibold">{{ admin.phoneVerified ? 'Verified' : 'Unverified' }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">NIC</div>
                        <div class="text-xs font-mono text-[#191c1c]">{{ admin.nicNumber }}</div>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">City</div>
                        <div class="text-xs text-[#191c1c]">{{ admin.cityName || '—' }}</div>
                        <div class="text-[10px] text-[#6e7978]">{{ admin.cityRegion || '' }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">Date of Birth</div>
                        <div class="text-xs text-[#191c1c]">{{ admin.dateOfBirth }}</div>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">Admin Role Status</div>
                        <div class="text-xs font-bold text-[#191c1c]">{{ admin.roleStatus || 'ACTIVE' }}</div>
                        <div class="text-[10px] text-[#6e7978]">Activated: {{ admin.activatedAt ? (admin.activatedAt | date:'medium') : '—' }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] uppercase font-bold text-[#6e7978] mb-1">2FA</div>
                        <div class="text-xs text-[#191c1c]">{{ admin.fingerprintEnabled ? 'Enabled' : 'Disabled' }}</div>
                        <div class="text-[10px] text-[#6e7978]">Failed PINs: {{ admin.failedPinAttempts }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="pt-3 border-t border-[#f2f4f3] flex items-center gap-2">
                    <button (click)="openEditModal(admin)" class="flex-1 px-3 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#e6e9e8] text-[#191c1c] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                      <span class="material-symbols-outlined text-sm text-[#004343]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button (click)="toggleSuspend(admin)" class="flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border"
                      [ngClass]="admin.accountStatus === 'SUSPENDED' || admin.accountStatus === 'DEACTIVATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'">
                      <span class="material-symbols-outlined text-sm">{{ admin.accountStatus === 'SUSPENDED' || admin.accountStatus === 'DEACTIVATED' ? 'lock_open' : 'lock' }}</span>
                      <span>{{ admin.accountStatus === 'SUSPENDED' || admin.accountStatus === 'DEACTIVATED' ? 'Reactivate' : 'Suspend' }}</span>
                    </button>
                  </div>

                  <div class="pt-3 border-t border-[#f2f4f3] text-[10px] text-[#6e7978] font-mono space-y-1">
                    <div>Created: {{ admin.createdAt | date:'medium' }}</div>
                    <div>Updated: {{ admin.updatedAt | date:'medium' }}</div>
                  </div>
                </div>
              }
            </div>

          </div>
          }
        </div>
      </main>

      <!-- Edit Administrator Modal -->
      @if (showEditModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#dde3eb] overflow-hidden">
            <div class="p-6 border-b border-[#dde3eb] flex items-center justify-between bg-[#f8faf9]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                  <span class="material-symbols-outlined text-2xl">edit</span>
                </div>
                <div>
                  <h3 class="text-base font-serif font-bold text-[#191c1c]">Edit Administrator</h3>
                  <p class="text-xs text-[#6e7978]">Update admin profile details</p>
                </div>
              </div>
              <button (click)="closeEditModal()" class="text-[#6e7978] hover:text-[#191c1c] text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form (ngSubmit)="submitEdit()" class="p-6 space-y-4 text-xs">
              <div>
                <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Full Name</label>
                <input type="text" [(ngModel)]="editForm.fullName" name="fullName" required
                  class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Phone Number</label>
                  <input type="text" [(ngModel)]="editForm.phoneNumber" name="phoneNumber" required
                    class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">NIC Number</label>
                  <input type="text" [(ngModel)]="editForm.nicNumber" name="nicNumber" required
                    class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">City</label>
                  <input type="text" [(ngModel)]="editForm.cityName" name="cityName"
                    class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
                <div>
                  <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Region</label>
                  <input type="text" [(ngModel)]="editForm.cityRegion" name="cityRegion"
                    class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]" />
                </div>
              </div>
              <div>
                <label class="block font-bold text-[#3e4948] uppercase tracking-wider text-[10px] mb-1">Account Status</label>
                <select [(ngModel)]="editForm.accountStatus" name="accountStatus"
                  class="w-full px-3.5 py-2.5 bg-[#f8faf9] border border-[#c2c8c7] rounded-xl focus:bg-white focus:outline-none focus:border-[#004343]">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>
              <div class="pt-3 border-t border-[#dde3eb] flex items-center justify-end gap-3">
                <button type="button" (click)="closeEditModal()" class="px-4 py-2 bg-white border border-[#c2c8c7] rounded-xl font-semibold text-[#3e4948] hover:bg-[#f2f4f7] cursor-pointer">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-[#004343] hover:bg-[#003131] text-white rounded-xl font-semibold flex items-center gap-1.5 shadow-sm shadow-[#004343]/20 cursor-pointer">
                  <span class="material-symbols-outlined text-sm">save</span>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AdminManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    const user = this.authService.currentUser();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (user) {
      headers = headers.set('X-Admin-Id', user.id);
      headers = headers.set('X-Admin-Name', user.fullName);
    }
    return headers;
  }

  toastMessage = signal<string | null>(null);
  isErrorToast = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  admins = signal<AdminRecord[]>([]);
  selectedAdmin = signal<AdminRecord | null>(null);
  searchQuery = signal<string>('');
  showEditModal = signal<boolean>(false);
  editForm: AdminRecord = this.emptyEditForm();

  filteredAdmins = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.admins();
    return this.admins().filter(a =>
      a.fullName.toLowerCase().includes(query) ||
      a.phoneNumber.includes(query) ||
      a.nicNumber.toLowerCase().includes(query) ||
      (a.cityName && a.cityName.toLowerCase().includes(query))
    );
  });

  activeAdmins = computed(() =>
    this.admins().filter(a => a.accountStatus === 'ACTIVE')
  );

  inactiveAdmins = computed(() =>
    this.admins().filter(a => a.accountStatus === 'SUSPENDED' || a.accountStatus === 'DEACTIVATED')
  );

  ngOnInit(): void {
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.isLoading.set(true);
    this.http.get<any>(API_BASE, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const list = Array.isArray(data) ? data : [];
        this.admins.set(list.map((item: any) => ({
          id: String(item.id),
          fullName: item.fullName,
          phoneNumber: item.phoneNumber,
          phoneVerified: item.phoneVerified,
          nicNumber: item.nicNumber,
          dateOfBirth: item.dateOfBirth ? String(item.dateOfBirth) : '',
          profilePhotoUrl: item.profilePhotoUrl,
          accountStatus: item.accountStatus,
          cityName: item.cityName,
          cityRegion: item.cityRegion,
          fingerprintEnabled: item.fingerprintEnabled,
          failedPinAttempts: item.failedPinAttempts,
          roleType: item.roleType,
          roleStatus: item.roleStatus,
          activatedAt: item.activatedAt ? String(item.activatedAt) : '',
          createdAt: item.createdAt ? String(item.createdAt) : '',
          updatedAt: item.updatedAt ? String(item.updatedAt) : ''
        })));
        if (this.admins().length > 0 && !this.selectedAdmin()) {
          this.selectedAdmin.set(this.admins()[0]);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.message ?? 'Failed to load administrators.';
        this.showToast(msg, true);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  selectAdmin(admin: AdminRecord): void {
    this.selectedAdmin.set(admin);
    this.toastMessage.set(`Loaded profile: ${admin.fullName}`);
    setTimeout(() => this.toastMessage.set(null), 2500);
  }

  openEditModal(admin: AdminRecord): void {
    this.editForm = { ...admin };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editForm = this.emptyEditForm();
  }

  submitEdit(): void {
    if (!this.editForm.id) return;
    const payload = {
      fullName: this.editForm.fullName,
      phoneNumber: this.editForm.phoneNumber,
      nicNumber: this.editForm.nicNumber,
      accountStatus: this.editForm.accountStatus,
      cityName: this.editForm.cityName,
      cityRegion: this.editForm.cityRegion
    };
    this.http.patch<any>(`${API_BASE}/${this.editForm.id}`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showToast('Administrator updated successfully.');
        this.closeEditModal();
        this.loadAdmins();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to update administrator.';
        this.showToast(msg, true);
      }
    });
  }

  toggleSuspend(admin: AdminRecord): void {
    if (!admin.id) return;
    const isSuspended = admin.accountStatus === 'SUSPENDED' || admin.accountStatus === 'DEACTIVATED';
    const endpoint = isSuspended ? `${VERIFICATIONS_API}/${admin.id}/reactivate` : `${VERIFICATIONS_API}/${admin.id}/suspend`;
    const body = isSuspended ? {} : { reason: 'Suspended by admin management' };
    this.http.post<any>(endpoint, body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showToast(isSuspended ? 'Administrator reactivated.' : 'Administrator suspended.');
        this.loadAdmins();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to update administrator status.';
        this.showToast(msg, true);
      }
    });
  }

  getRoleStatusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'INACTIVE': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-[#f2f4f3] text-[#6e7978] border-[#dde3eb]';
    }
  }

  getAccountStatusBadge(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-300';
      case 'DEACTIVATED': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-[#f2f4f3] text-[#6e7978] border-[#dde3eb]';
    }
  }

  private emptyEditForm(): AdminRecord {
    return {
      id: '',
      fullName: '',
      phoneNumber: '',
      phoneVerified: false,
      nicNumber: '',
      dateOfBirth: '',
      profilePhotoUrl: '',
      accountStatus: 'ACTIVE',
      cityName: '',
      cityRegion: '',
      fingerprintEnabled: false,
      failedPinAttempts: 0,
      roleType: '',
      roleStatus: '',
      activatedAt: '',
      createdAt: '',
      updatedAt: ''
    };
  }

  private showToast(msg: string, isError = false): void {
    this.isErrorToast.set(isError);
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4500);
  }
}
