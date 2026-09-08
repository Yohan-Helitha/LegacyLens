import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface HeritageMarker {
  id: string;
  name: string;
  district: string;
  category: 'Crafts' | 'Sacred' | 'Rituals' | 'Legends';
  categoryLabel: string;
  lat: string;
  lng: string;
  topPct: string;
  leftPct: string;
  description: string;
  storiesCount: number;
  audioCount: number;
  videoCount: number;
  status: 'Public' | 'Verification';
  icon: string;
  attachedMedia: {
    id: string;
    type: 'audio' | 'video' | 'mic';
    title: string;
    detail: string;
  }[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden">
      
      <!-- Toast Alert Notification -->
      <div 
        *ngIf="toastMessage()" 
        [class]="isDestructiveToast() ? 'bg-red-800' : 'bg-[#004343]'"
        class="fixed top-5 right-6 z-50 flex items-center gap-3 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 transition-all duration-300 animate-bounce">
        <span class="material-symbols-outlined text-xl">{{ isDestructiveToast() ? 'delete_forever' : 'check_circle' }}</span>
        <div class="text-sm font-medium">{{ toastMessage() }}</div>
        <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-sm">✕</button>
      </div>

      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Common Top Header Navigation -->
        <app-header 
          pageTitle="Cultural Map Management" 
          section="Console"
          searchPlaceholder="Search coordinates, heritage markers, lore..."
          [searchQuery]="searchQuery"
          (searchQueryChange)="searchQuery = $event">
        </app-header>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Top Executive Bar -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full bg-[#004343]/10 text-[#004343] text-xs font-bold uppercase tracking-wider">
                  Geographic Engine • Province Tier 1
                </span>
                <span class="inline-flex items-center gap-1 text-xs text-[#6f7978]">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#fe893e]"></span>
                  Synchronized to Archive Cluster v4.1
                </span>
              </div>
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Sri Lanka Cultural Atlas & Spatial Archive
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Manage geolocated living heritage, sacred sites, craft traditions, and folklore beacons. Modifying nodes updates student spatial discovery paths across all O/L interactive modules.
              </p>
            </div>

            <!-- Action Triggers -->
            <div class="flex items-center gap-3 self-start xl:self-auto">
              <button 
                (click)="showMetricsToast()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base text-[#363c42]">analytics</span>
                <span>Atlas Metrics</span>
              </button>
              <button 
                (click)="switchToNewMode()"
                class="px-4 py-2.5 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base">add_location_alt</span>
                <span>Add Heritage Pin</span>
              </button>
            </div>
          </div>

          <!-- 4 Metric Strip Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Active Markers</span>
                <span class="material-symbols-outlined text-[#004343] text-lg">pin_drop</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">{{ markers.length }}</span>
                <span class="text-xs text-[#9b4600] font-semibold">+12 this term</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#004343] h-full rounded-full" style="width: 78%;"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Living Legends</span>
                <span class="material-symbols-outlined text-[#9b4600] text-lg">record_voice_over</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#9b4600]">42</span>
                <span class="text-xs text-[#6f7978]">Jaffna & Galle</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#fe893e] h-full rounded-full" style="width: 64%;"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Audio Archival Feeds</span>
                <span class="material-symbols-outlined text-[#363c42] text-lg">graphic_eq</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#191c1c]">512</span>
                <span class="text-xs text-emerald-700 font-semibold">99.4% Verified</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-600 h-full rounded-full" style="width: 92%;"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Province Coverage</span>
                <span class="material-symbols-outlined text-[#0f5c5c] text-lg">map</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">9 / 9</span>
                <span class="text-xs text-[#9b4600] font-semibold">Complete</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#0f5c5c] h-full rounded-full" style="width: 100%;"></div>
              </div>
            </div>

          </div>

          <!-- Dual Core Workspace Matrix -->
          <div class="grid grid-cols-12 gap-6 items-start">
            
            <!-- LEFT PANE: Interactive Visual Map & Quick Region Navigator (7 cols) -->
            <div class="col-span-12 lg:col-span-7 flex flex-col gap-5">
              
              <!-- Spatial Filter Hub -->
              <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="text-xs font-bold text-[#004343]">Filter Classification:</span>
                  <span class="text-xs text-[#6f7978]">Viewing {{ filteredMarkers().length }} of {{ markers.length }} pinned points</span>
                </div>

                <!-- Filter Chips -->
                <div class="flex flex-wrap gap-2">
                  <button 
                    (click)="activeCategory.set('all')"
                    [class]="activeCategory() === 'all' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="px-3 py-1 rounded-full text-xs transition-all">
                    All Layers ({{ markers.length }})
                  </button>
                  <button 
                    (click)="activeCategory.set('Crafts')"
                    [class]="activeCategory() === 'Crafts' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="px-3 py-1 rounded-full text-xs transition-all">
                    Crafts & Guilds (1)
                  </button>
                  <button 
                    (click)="activeCategory.set('Sacred')"
                    [class]="activeCategory() === 'Sacred' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="px-3 py-1 rounded-full text-xs transition-all">
                    Sacred Sites (1)
                  </button>
                  <button 
                    (click)="activeCategory.set('Rituals')"
                    [class]="activeCategory() === 'Rituals' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="px-3 py-1 rounded-full text-xs transition-all">
                    Rituals & Rites (1)
                  </button>
                  <button 
                    (click)="activeCategory.set('Legends')"
                    [class]="activeCategory() === 'Legends' ? 'bg-[#004343] text-white font-bold shadow-xs' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#dde3eb]'"
                    class="px-3 py-1 rounded-full text-xs transition-all">
                    Living Legends (1)
                  </button>
                </div>
              </div>

              <!-- Main Interactive Cartography Container -->
              <div class="relative w-full h-[580px] rounded-2xl overflow-hidden shadow-md bg-[#004343] border border-[#dde3eb] group select-none">
                
                <!-- Satellite Map Canvas Background -->
                <div 
                  class="w-full h-full bg-cover bg-center transition-transform duration-700 opacity-90 group-hover:scale-102"
                  style="background-image: url('https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80')">
                </div>

                <!-- Oceanic Gradient Scrim -->
                <div class="absolute inset-0 bg-gradient-to-t from-[#004343]/90 via-[#004343]/40 to-transparent pointer-events-none"></div>

                <!-- Compass Rose & Datum Overlay -->
                <div class="absolute top-4 left-4 p-3 rounded-xl bg-white/90 backdrop-blur-md shadow-md flex items-center gap-3 text-[#004343] border border-white/40">
                  <span class="material-symbols-outlined text-2xl">explore</span>
                  <div>
                    <p class="text-xs font-bold leading-tight">Sri Lanka Spatial Datum</p>
                    <p class="text-[10px] text-[#6f7978]">SLD99 Grid • EPSG 5235</p>
                  </div>
                </div>

                <!-- Quick Geographic Viewport Jump Anchors -->
                <div class="absolute top-4 right-4 flex flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-white/40">
                  <button 
                    (click)="jumpToRegion('Jaffna')"
                    class="px-3 py-1 text-left rounded-lg hover:bg-[#004343] hover:text-white text-[#3f4948] transition-all text-xs font-medium flex items-center justify-between gap-3">
                    <span>Northern Jaffna</span>
                    <span class="font-mono text-[10px] opacity-75">9.66N</span>
                  </button>
                  <button 
                    (click)="jumpToRegion('Kandy')"
                    class="px-3 py-1 text-left rounded-lg hover:bg-[#004343] hover:text-white text-[#3f4948] transition-all text-xs font-medium flex items-center justify-between gap-3">
                    <span>Central Kandy</span>
                    <span class="font-mono text-[10px] opacity-75">7.29N</span>
                  </button>
                  <button 
                    (click)="jumpToRegion('Galle')"
                    class="px-3 py-1 text-left rounded-lg hover:bg-[#004343] hover:text-white text-[#3f4948] transition-all text-xs font-medium flex items-center justify-between gap-3">
                    <span>Southern Galle</span>
                    <span class="font-mono text-[10px] opacity-75">6.05N</span>
                  </button>
                  <button 
                    (click)="jumpToRegion('Batticaloa')"
                    class="px-3 py-1 text-left rounded-lg hover:bg-[#004343] hover:text-white text-[#3f4948] transition-all text-xs font-medium flex items-center justify-between gap-3">
                    <span>Eastern Batticaloa</span>
                    <span class="font-mono text-[10px] opacity-75">7.71N</span>
                  </button>
                </div>

                <!-- Interactive Map Pins -->
                <div 
                  *ngFor="let m of filteredMarkers()"
                  (click)="selectMarker(m)"
                  [style.top]="m.topPct"
                  [style.left]="m.leftPct"
                  class="absolute -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-20">
                  
                  <div class="relative flex items-center justify-center">
                    <span 
                      *ngIf="selectedMarker()?.id === m.id" 
                      class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-[#fe893e] opacity-75"></span>
                    
                    <div 
                      [class]="selectedMarker()?.id === m.id ? 'bg-[#fe893e] text-[#672c00] ring-4 ring-white scale-110' : 'bg-[#004343] text-white'"
                      class="w-10 h-10 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-125 border-2 border-white">
                      <span class="material-symbols-outlined text-lg">{{ m.icon }}</span>
                    </div>

                    <!-- Pin Tooltip on hover -->
                    <div class="absolute left-12 top-0 hidden group-hover/pin:flex flex-col bg-white p-3 rounded-xl shadow-2xl w-60 z-30 pointer-events-none border border-[#dde3eb]">
                      <span class="text-[10px] uppercase font-bold text-[#9b4600]">{{ m.categoryLabel }}</span>
                      <span class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343] leading-snug">{{ m.name }}</span>
                      <span class="text-[10px] text-[#6f7978] mt-1">{{ m.lat }}° N, {{ m.lng }}° E • {{ m.storiesCount }} Stories</span>
                    </div>
                  </div>
                </div>

                <!-- Bottom Status Bar inside Map -->
                <div class="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/95 backdrop-blur-md shadow-md flex items-center justify-between text-xs text-[#191c1c] border border-white/50">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#9b4600] text-lg">layers</span>
                    <span>Overlay: <strong class="text-[#004343]">All Cultural Heritage Tiers</strong></span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[#6f7978] hidden sm:flex">
                    <span class="material-symbols-outlined text-sm">touch_app</span>
                    <span>Click any node to inspect or edit spatial coordinates</span>
                  </div>
                </div>

              </div>

              <!-- Heritage Coordinates Directory Table -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-['Source_Serif_4',serif] text-base font-bold text-[#004343]">Heritage Coordinates Directory</h3>
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-[#6f7978]">District:</span>
                    <select [(ngModel)]="districtFilter" class="p-1.5 rounded-lg bg-[#f2f4f3] border border-[#dde3eb] text-xs font-medium focus:outline-none">
                      <option value="all">All Districts (25)</option>
                      <option value="Kandy">Kandy</option>
                      <option value="Jaffna">Jaffna</option>
                      <option value="Galle">Galle</option>
                      <option value="Batticaloa">Batticaloa</option>
                    </select>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs text-[#191c1c]">
                    <thead>
                      <tr class="bg-[#f8faf9] text-[#6f7978] uppercase text-[10px] font-bold tracking-wider border-b border-[#dde3eb]">
                        <th class="p-3 rounded-l-lg">Marker Identifier</th>
                        <th class="p-3">Coordinates</th>
                        <th class="p-3">Category</th>
                        <th class="p-3">Linked Stories</th>
                        <th class="p-3">Status</th>
                        <th class="p-3 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#eceeed]">
                      <tr 
                        *ngFor="let row of tableMarkers()"
                        (click)="selectMarker(row)"
                        [class]="selectedMarker()?.id === row.id ? 'bg-[#004343]/5 font-semibold' : 'hover:bg-[#f8faf9]'"
                        class="transition-colors cursor-pointer">
                        <td class="p-3 font-bold text-[#004343] flex items-center gap-2">
                          <span class="w-2.5 h-2.5 rounded-full bg-[#004343]"></span>
                          <span>{{ row.name }}</span>
                        </td>
                        <td class="p-3 font-mono text-[11px] text-[#6f7978]">
                          {{ row.lat }}° N, {{ row.lng }}° E ({{ row.district }})
                        </td>
                        <td class="p-3">
                          <span class="px-2 py-0.5 rounded-full bg-[#004343]/10 text-[#004343] font-bold text-[10px]">
                            {{ row.category }}
                          </span>
                        </td>
                        <td class="p-3 text-[#3f4948]">
                          <strong>{{ row.storiesCount }} Archives</strong> ({{ row.audioCount }} Audio / {{ row.videoCount }} Video)
                        </td>
                        <td class="p-3">
                          <span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> {{ row.status }}
                          </span>
                        </td>
                        <td class="p-3 text-right space-x-1" (click)="$event.stopPropagation()">
                          <button (click)="selectMarker(row)" class="p-1 rounded hover:bg-[#f2f4f3] text-[#004343]" title="Edit Marker">
                            <span class="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button (click)="openDeleteModal(row)" class="p-1 rounded hover:bg-red-50 text-red-700" title="Delete Marker">
                            <span class="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <!-- RIGHT PANE: Flowchart Decision Engine / Marker Editor (5 cols) -->
            <div class="col-span-12 lg:col-span-5 flex flex-col gap-5">
              
              <!-- Editor Card -->
              <div class="p-5 rounded-2xl bg-white border border-[#dde3eb] shadow-xs space-y-4">
                
                <!-- Header Mode Indicator -->
                <div class="flex items-center justify-between border-b pb-3 border-[#eceeed]">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-[#004343] text-white flex items-center justify-center">
                      <span class="material-symbols-outlined text-lg">{{ isEditMode() ? 'edit_location' : 'add_location_alt' }}</span>
                    </div>
                    <div>
                      <h3 class="font-['Source_Serif_4',serif] text-sm font-bold text-[#004343]">
                        {{ isEditMode() ? 'Modify Heritage Marker' : 'Create New Heritage Pin' }}
                      </h3>
                      <p class="text-[10px] text-[#6f7978]">
                        {{ isEditMode() ? 'Editing Registry Node: ' + selectedMarker()?.id : 'Spatial coordinate entry & media linkage' }}
                      </p>
                    </div>
                  </div>

                  <button 
                    (click)="toggleMode()"
                    class="text-xs text-[#004343] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">{{ isEditMode() ? 'add_circle' : 'edit' }}</span>
                    <span>{{ isEditMode() ? 'Switch to Add' : 'Switch to Edit' }}</span>
                  </button>
                </div>

                <!-- Form Fields -->
                <form (ngSubmit)="saveMarker()" class="space-y-3.5">
                  
                  <!-- Field 1: Marker Title -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-[#004343]">Heritage Site / Tradition Name</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.name" 
                      name="name"
                      required
                      placeholder="e.g. Embekke Woodcarvers Guild" 
                      class="w-full p-2.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]"
                    />
                  </div>

                  <!-- Field 2: District & Category -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-xs font-bold text-[#004343]">Province & District</label>
                      <select 
                        [(ngModel)]="formData.district" 
                        name="district"
                        class="w-full p-2.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                        <option value="Kandy">Central • Kandy</option>
                        <option value="Jaffna">Northern • Jaffna</option>
                        <option value="Galle">Southern • Galle</option>
                        <option value="Batticaloa">Eastern • Batticaloa</option>
                        <option value="Anuradhapura">North Central • Anuradhapura</option>
                        <option value="Kurunegala">North Western • Kurunegala</option>
                      </select>
                    </div>

                    <div class="space-y-1">
                      <label class="text-xs font-bold text-[#004343]">Classification</label>
                      <select 
                        [(ngModel)]="formData.category" 
                        name="category"
                        class="w-full p-2.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343]">
                        <option value="Crafts">Crafts & Guilds</option>
                        <option value="Sacred">Sacred Sites</option>
                        <option value="Rituals">Rituals & Performance</option>
                        <option value="Legends">Living Legends & Oral</option>
                      </select>
                    </div>
                  </div>

                  <!-- Field 3: Latitude / Longitude Coordinates -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-[#004343]">Precision Geographic Pin</label>
                      <button 
                        (click)="detectGPS()" 
                        type="button" 
                        class="text-[#9b4600] text-[11px] font-bold flex items-center gap-1 hover:underline cursor-pointer">
                        <span class="material-symbols-outlined text-xs">my_location</span>
                        <span>Pin from Canvas Center</span>
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="relative">
                        <span class="absolute left-2.5 top-2.5 text-[#6f7978] font-mono text-[10px]">LAT</span>
                        <input 
                          type="text" 
                          [(ngModel)]="formData.lat" 
                          name="lat"
                          required
                          class="w-full pl-9 pr-2.5 py-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs font-mono text-[#191c1c] focus:outline-none focus:border-[#004343]"
                        />
                      </div>
                      <div class="relative">
                        <span class="absolute left-2.5 top-2.5 text-[#6f7978] font-mono text-[10px]">LNG</span>
                        <input 
                          type="text" 
                          [(ngModel)]="formData.lng" 
                          name="lng"
                          required
                          class="w-full pl-9 pr-2.5 py-2 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs font-mono text-[#191c1c] focus:outline-none focus:border-[#004343]"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Field 4: Description -->
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-[#004343]">Pedagogical Description (O/L Reference)</label>
                    <textarea 
                      [(ngModel)]="formData.description" 
                      name="description"
                      rows="3" 
                      placeholder="Historical background and archival relevance..." 
                      class="w-full p-2.5 bg-[#f8faf9] border border-[#dde3eb] rounded-xl text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] resize-none"></textarea>
                  </div>

                  <!-- Field 5: Associated Media Feeds -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-[#004343]">Linked Multimedia Stories ({{ formData.attachedMedia.length }} Attached)</label>
                      <button 
                        (click)="attachSampleMedia()" 
                        type="button" 
                        class="text-[#9b4600] text-[11px] font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                        <span class="material-symbols-outlined text-xs">link</span>
                        <span>Attach from Archive</span>
                      </button>
                    </div>

                    <div class="space-y-1.5 max-h-36 overflow-y-auto">
                      <div 
                        *ngFor="let item of formData.attachedMedia; let i = index"
                        class="p-2.5 rounded-lg bg-[#f8faf9] border border-[#dde3eb] flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 overflow-hidden">
                          <span class="material-symbols-outlined text-[#004343] text-base">
                            {{ item.type === 'audio' ? 'audiotrack' : (item.type === 'video' ? 'videocam' : 'mic') }}
                          </span>
                          <div class="truncate">
                            <p class="text-xs font-medium text-[#191c1c] truncate">{{ item.title }}</p>
                            <p class="text-[10px] text-[#6f7978]">{{ item.detail }}</p>
                          </div>
                        </div>
                        <button (click)="removeAttachedMedia(i)" type="button" class="text-[#6f7978] hover:text-red-600 font-bold px-1">✕</button>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="pt-2 flex items-center justify-between gap-3 border-t border-[#eceeed]">
                    <button 
                      *ngIf="isEditMode() && selectedMarker()"
                      (click)="openDeleteModal(selectedMarker()!)" 
                      type="button"
                      class="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                      <span class="material-symbols-outlined text-base">delete_forever</span>
                      <span>Delete Pin</span>
                    </button>

                    <div class="flex items-center gap-2 ml-auto">
                      <button 
                        (click)="cancelEdit()" 
                        type="button"
                        class="px-4 py-2 rounded-xl bg-[#f2f4f3] hover:bg-[#dde3eb] text-[#191c1c] text-xs font-bold transition-colors cursor-pointer">
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        class="px-5 py-2 rounded-xl bg-[#004343] hover:bg-[#0f5c5c] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-base">save</span>
                        <span>{{ isEditMode() ? 'Update Marker' : 'Save Marker' }}</span>
                      </button>
                    </div>
                  </div>

                </form>
              </div>

              <!-- Active Spatial Storyteller Showcase Card -->
              <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#004343]">Active Spatial Storyteller</span>
                  <span class="px-2 py-0.5 rounded-full bg-[#fe893e]/20 text-[#9b4600] text-[10px] font-bold">Curator Endorsed</span>
                </div>
                
                <div class="flex gap-3 items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=60" 
                    alt="Master Siriwardena" 
                    class="w-14 h-14 rounded-xl object-cover shadow-2xs shrink-0"
                  />
                  <div>
                    <h4 class="font-['Source_Serif_4',serif] text-xs font-bold text-[#202426]">Master Siriwardena (Age 79)</h4>
                    <p class="text-[11px] text-[#3f4948] line-clamp-2 mt-0.5">
                      Direct descendant of royal temple carvers at Embekke. Linked to 4 primary audio recordings.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      <!-- Delete Confirmation Modal -->
      <div 
        *ngIf="markerToDelete()"
        class="fixed inset-0 z-50 bg-[#202426]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
        <div class="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-[#dde3eb] space-y-4">
          <div class="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div>
            <h3 class="font-['Source_Serif_4',serif] text-lg font-bold text-[#202426]">
              Delete "{{ markerToDelete()?.name }}"?
            </h3>
            <p class="text-xs text-[#3f4948] mt-1 leading-relaxed">
              This will permanently unlink <strong class="text-red-700">{{ markerToDelete()?.storiesCount }} linked audio and video stories</strong> from geographic lookups. Students will no longer find this heritage point on their spatial timeline.
            </p>
          </div>
          <div class="p-3 rounded-xl bg-[#f8faf9] border border-[#dde3eb] text-xs text-[#6f7978] flex items-center gap-2">
            <span class="material-symbols-outlined text-sm text-[#004343]">info</span>
            <span>Original media remains archived in Legacy Lens Master Repository.</span>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2">
            <button (click)="markerToDelete.set(null)" class="px-4 py-2 rounded-xl bg-[#f2f4f3] text-xs font-bold text-[#191c1c]">
              Keep Marker
            </button>
            <button (click)="confirmDelete()" class="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold shadow-md hover:bg-red-800 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">delete_forever</span>
              <span>Delete from Atlas</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class MapComponent {
  user = this.authService.currentUser;

  // Search & Filter state
  searchQuery = '';
  activeCategory = signal<'all' | 'Crafts' | 'Sacred' | 'Rituals' | 'Legends'>('all');
  districtFilter = 'all';

  // Mode: edit or create
  isEditMode = signal<boolean>(true);

  // Toast
  toastMessage = signal<string | null>(null);
  isDestructiveToast = signal<boolean>(false);

  // Delete modal target
  markerToDelete = signal<HeritageMarker | null>(null);

  // Markers Master Database
  markers: HeritageMarker[] = [
    {
      id: 'kandy-1',
      name: 'Embekke Woodcarvers Guild & Pillar Carvings',
      district: 'Kandy',
      category: 'Crafts',
      categoryLabel: 'Crafts Guild',
      lat: '7.195000',
      lng: '80.564500',
      topPct: '54%',
      leftPct: '49%',
      description: 'Historical wood carving techniques preserved from the 14th century Gampola Kingdom. Master artisan lineages continue ritual floral relief works.',
      storiesCount: 7,
      audioCount: 2,
      videoCount: 5,
      status: 'Public',
      icon: 'handyman',
      attachedMedia: [
        {
          id: 'm1',
          type: 'audio',
          title: 'Audio: Master Ekanayake on Jackfruit Timber Grain',
          detail: 'Sinhala • 08:42 mins • Rec. 1982'
        },
        {
          id: 'm2',
          type: 'video',
          title: 'Visual: 128 Pillar Relief Motifs of Embekke Devalaya',
          detail: '4K Archival Scan • 3.2 GB'
        },
        {
          id: 'm3',
          type: 'mic',
          title: 'Oral Lore: The Swan (Hansa Puttuwa) Mythic Symbolism',
          detail: 'Sinhala/Tamil • 14:10 mins'
        }
      ]
    },
    {
      id: 'jaffna-1',
      name: 'Nallur Kandaswamy Kovil Oral Archive',
      district: 'Jaffna',
      category: 'Sacred',
      categoryLabel: 'Sacred Site & Song',
      lat: '9.674800',
      lng: '80.029800',
      topPct: '16%',
      leftPct: '44%',
      description: 'Sacred Tamil Shaivite devotional hymn traditions and Carnatic nagaswaram performance masters documented across the Northern Peninsula.',
      storiesCount: 4,
      audioCount: 3,
      videoCount: 1,
      status: 'Public',
      icon: 'temple_hindu',
      attachedMedia: [
        {
          id: 'm4',
          type: 'audio',
          title: 'Morning Thevaram Invocations at Nallur',
          detail: 'Tamil • 11:20 mins'
        }
      ]
    },
    {
      id: 'galle-1',
      name: 'Ambalangoda Mask Making & Kolam',
      district: 'Galle',
      category: 'Rituals',
      categoryLabel: 'Living Ritual',
      lat: '6.235900',
      lng: '80.054300',
      topPct: '82%',
      leftPct: '36%',
      description: 'Kaduru wood carving traditions used in classical Southern Sri Lankan ritual comedy and healing demon dance dramas.',
      storiesCount: 5,
      audioCount: 2,
      videoCount: 3,
      status: 'Public',
      icon: 'theater_comedy',
      attachedMedia: [
        {
          id: 'm5',
          type: 'video',
          title: 'Kolam Dancer Initiation & Gara Yuma',
          detail: 'Video • 16:30 mins'
        }
      ]
    },
    {
      id: 'batticaloa-1',
      name: 'Kallady Singing Fish Acoustic Lore',
      district: 'Batticaloa',
      category: 'Legends',
      categoryLabel: 'Oral Tradition',
      lat: '7.717000',
      lng: '81.700100',
      topPct: '58%',
      leftPct: '72%',
      description: 'The ancient auditory folklore phenomenon in Batticaloa lagoon during full moon nights, narrated by veteran lagoon fishermen.',
      storiesCount: 3,
      audioCount: 3,
      videoCount: 0,
      status: 'Verification',
      icon: 'graphic_eq',
      attachedMedia: [
        {
          id: 'm6',
          type: 'audio',
          title: 'Hydrophone Lagoon Recordings & Fisherman Commentary',
          detail: 'Audio • 09:15 mins'
        }
      ]
    }
  ];

  selectedMarker = signal<HeritageMarker | null>(this.markers[0]);

  // Form State
  formData = {
    name: this.markers[0].name,
    district: this.markers[0].district,
    category: this.markers[0].category,
    lat: this.markers[0].lat,
    lng: this.markers[0].lng,
    description: this.markers[0].description,
    attachedMedia: [...this.markers[0].attachedMedia]
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  filteredMarkers(): HeritageMarker[] {
    return this.markers.filter(m => {
      if (this.activeCategory() !== 'all' && m.category !== this.activeCategory()) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesDist = m.district.toLowerCase().includes(q);
        if (!matchesName && !matchesDist) return false;
      }
      return true;
    });
  }

  tableMarkers(): HeritageMarker[] {
    return this.markers.filter(m => {
      if (this.districtFilter !== 'all' && m.district !== this.districtFilter) {
        return false;
      }
      return true;
    });
  }

  selectMarker(m: HeritageMarker): void {
    this.selectedMarker.set(m);
    this.isEditMode.set(true);
    this.formData = {
      name: m.name,
      district: m.district,
      category: m.category,
      lat: m.lat,
      lng: m.lng,
      description: m.description,
      attachedMedia: [...m.attachedMedia]
    };
    this.showToast(`Focusing map node: "${m.name}"`);
  }

  switchToNewMode(): void {
    this.isEditMode.set(false);
    this.selectedMarker.set(null);
    this.formData = {
      name: '',
      district: 'Kandy',
      category: 'Crafts',
      lat: '7.873100',
      lng: '80.771800',
      description: '',
      attachedMedia: []
    };
    this.showToast('Atlas input docked for new coordinate entry.');
  }

  toggleMode(): void {
    if (this.isEditMode()) {
      this.switchToNewMode();
    } else {
      if (this.markers.length > 0) {
        this.selectMarker(this.markers[0]);
      }
    }
  }

  cancelEdit(): void {
    if (this.selectedMarker()) {
      this.selectMarker(this.selectedMarker()!);
    } else {
      this.switchToNewMode();
    }
  }

  detectGPS(): void {
    this.formData.lat = (6.0 + Math.random() * 3).toFixed(6);
    this.formData.lng = (80.0 + Math.random() * 1.5).toFixed(6);
    this.showToast('Centered coordinates captured from active map canvas.');
  }

  attachSampleMedia(): void {
    const newMedia = {
      id: 'm_' + Date.now(),
      type: 'audio' as const,
      title: 'Historical Oral Commentary #' + (this.formData.attachedMedia.length + 1),
      detail: 'Recorded 48kHz • Master Lineage Audio'
    };
    this.formData.attachedMedia.push(newMedia);
    this.showToast('Attached archival asset from media repository.');
  }

  removeAttachedMedia(index: number): void {
    this.formData.attachedMedia.splice(index, 1);
    this.showToast('Detached media story from marker.');
  }

  saveMarker(): void {
    if (this.isEditMode() && this.selectedMarker()) {
      const curr = this.selectedMarker()!;
      curr.name = this.formData.name;
      curr.district = this.formData.district;
      curr.category = this.formData.category;
      curr.lat = this.formData.lat;
      curr.lng = this.formData.lng;
      curr.description = this.formData.description;
      curr.attachedMedia = [...this.formData.attachedMedia];
      curr.storiesCount = curr.attachedMedia.length;
      this.showToast(`Updated node: "${curr.name}" successfully.`);
    } else {
      const newPin: HeritageMarker = {
        id: 'node-' + Date.now(),
        name: this.formData.name || 'New Heritage Pin',
        district: this.formData.district,
        category: this.formData.category,
        categoryLabel: this.formData.category,
        lat: this.formData.lat,
        lng: this.formData.lng,
        topPct: '45%',
        leftPct: '52%',
        description: this.formData.description,
        storiesCount: this.formData.attachedMedia.length,
        audioCount: 1,
        videoCount: 0,
        status: 'Public',
        icon: 'place',
        attachedMedia: [...this.formData.attachedMedia]
      };
      this.markers.push(newPin);
      this.selectMarker(newPin);
      this.showToast(`Added new heritage pin: "${newPin.name}" to atlas!`);
    }
  }

  openDeleteModal(m: HeritageMarker): void {
    this.markerToDelete.set(m);
  }

  confirmDelete(): void {
    const target = this.markerToDelete();
    if (target) {
      const idx = this.markers.findIndex(m => m.id === target.id);
      if (idx !== -1) {
        this.markers.splice(idx, 1);
      }
      this.markerToDelete.set(null);
      this.showToast(`Marker "${target.name}" removed from Cultural Atlas.`, true);
      if (this.markers.length > 0) {
        this.selectMarker(this.markers[0]);
      } else {
        this.switchToNewMode();
      }
    }
  }

  jumpToRegion(region: string): void {
    const match = this.markers.find(m => m.district.toLowerCase() === region.toLowerCase());
    if (match) {
      this.selectMarker(match);
    } else {
      this.showToast(`Shifting map viewport to ${region.toUpperCase()} region.`);
    }
  }

  showMetricsToast(): void {
    this.showToast('Atlas telemetry: 184 active nodes across 9 provinces with 99.4% verification rate.');
  }

  private showToast(message: string, isDestructive: boolean = false): void {
    this.toastMessage.set(message);
    this.isDestructiveToast.set(isDestructive);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

