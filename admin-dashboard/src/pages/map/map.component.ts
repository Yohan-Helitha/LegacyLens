import { Component, OnInit, AfterViewInit, OnDestroy, NgZone, signal, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../app/core/services/auth.service';
import { MapService } from '../../app/core/services/map.service';
import { ModerationService } from '../../app/core/services/moderation.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { environment } from '../../environments/environment';
import {
  RegionDTO,
  LandmarkDTO,
  BadgeDTO,
  QuestDTO,
  QuestionDTO,
  ChoiceDTO,
  CreateLandmarkRequest,
  SaveBadgeRequest,
  SaveQuestRequest
} from '../../app/core/models/map.model';
import { ModerationQueueItemResponse } from '../../app/core/models/moderation.model';

export interface MapLocationSearchResult {
  id: string;
  name: string;
  placeName: string;
  lng: number;
  lat: number;
  type: 'registered_landmark' | 'mapbox_place';
  landmarkType?: string;
  region?: string;
  district?: string;
}

declare const mapboxgl: any;
declare const THREE: any;

// Tight bounds strictly covering Sri Lanka (SW to NE)
const SRI_LANKA_BOUNDS = [
  [79.50, 5.85], // Southwest coordinate
  [81.95, 9.90]  // Northeast coordinate
];

const DEFAULT_REGIONS: RegionDTO[] = [
  { id: 1, code: 'r1', label: 'Northern Sri Lanka', regionName: 'Northern Sri Lanka', description: 'Jaffna / Mannar / Kilinochchi / Mullaitivu', districts: ['Jaffna', 'Mannar', 'Kilinochchi', 'Mullaitivu', 'Vavuniya'], longitude: 80.4, latitude: 9.3, zoom: 7.8 },
  { id: 2, code: 'r2', label: 'North Central', regionName: 'North Central', description: 'Anuradhapura / Polonnaruwa', districts: ['Anuradhapura', 'Polonnaruwa'], longitude: 80.5, latitude: 8.2, zoom: 8.4 },
  { id: 3, code: 'r3', label: 'Eastern Sri Lanka', regionName: 'Eastern Sri Lanka', description: 'Trincomalee / Batticaloa / Ampara', districts: ['Trincomalee', 'Batticaloa', 'Ampara'], longitude: 81.4, latitude: 7.8, zoom: 7.8 },
  { id: 4, code: 'r4', label: 'North Western', regionName: 'North Western', description: 'Puttalam / Kurunegala', districts: ['Kurunegala', 'Puttalam'], longitude: 80.1, latitude: 7.7, zoom: 8.4 },
  { id: 5, code: 'r5', label: 'Central Highlands', regionName: 'Central Highlands', description: 'Kandy / Matale / Nuwara Eliya', districts: ['Kandy', 'Matale', 'Nuwara Eliya'], longitude: 80.7, latitude: 7.1, zoom: 8.8 },
  { id: 6, code: 'r6', label: 'Uva & Eastern Highlands', regionName: 'Uva & Eastern Highlands', description: 'Badulla / Monaragala', districts: ['Badulla', 'Monaragala'], longitude: 81.2, latitude: 6.9, zoom: 8.4 },
  { id: 7, code: 'r7', label: 'Western Sri Lanka', regionName: 'Western Sri Lanka', description: 'Colombo / Gampaha / Kalutara', districts: ['Colombo', 'Gampaha', 'Kalutara'], longitude: 80.0, latitude: 6.9, zoom: 8.8 },
  { id: 8, code: 'r8', label: 'Southern & Sabaragamuwa', regionName: 'Southern & Sabaragamuwa', description: 'Galle / Matara / Hambantota / Ratnapura / Kegalle', districts: ['Galle', 'Matara', 'Hambantota', 'Ratnapura', 'Kegalle'], longitude: 80.5, latitude: 6.3, zoom: 8.4 }
];

export const LANDMARK_TYPES = [
  {
    label: 'Historical & Archaeological Sites',
    value: 'Historical & Archaeological Sites',
    icon: 'account_balance',
    modelUrl: 'assets/glb/archiological.glb',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    label: 'Religious & Sacred Places',
    value: 'Religious & Sacred Places',
    icon: 'temple_buddhist',
    modelUrl: 'assets/glb/sacred.glb',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    label: 'Natural Landmarks',
    value: 'Natural Landmarks',
    icon: 'forest',
    modelUrl: 'assets/glb/nature.glb',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    label: 'Cultural & Traditional Heritage',
    value: 'Cultural & Traditional Heritage',
    icon: 'palette',
    modelUrl: 'assets/glb/cultural.glb',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  {
    label: 'Colonial & Architectural Heritage',
    value: 'Colonial & Architectural Heritage',
    icon: 'fort',
    modelUrl: 'assets/glb/colonial.glb',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200'
  }
];

const DEFAULT_LANDMARKS: LandmarkDTO[] = [
  { 
    dbId: 1, 
    id: 'sigiriya', 
    name: 'Sigiriya Rock Fortress', 
    type: 'Historical & Archaeological Sites',
    description: 'Ancient rock fortress and palace ruins built by King Kashyapa in the 5th century CE.', 
    lng: 80.7603, 
    lat: 7.9570, 
    icon: 'account_balance', 
    modelUrl: 'assets/glb/archiological.glb',
    region: 'North Central', 
    district: 'Matale', 
    badge: { id: 'sigiriya_badge', title: 'Sigiriya Conqueror', image: 'https://images.unsplash.com/photo-1586220742614-eb06ec4a3629?q=80&w=200' }, 
    quests: [{ id: 1, title: 'Citadel of the Cloud Maidens', description: 'Unravel the frescoes and mirror wall secrets' }] 
  },
  { 
    dbId: 2, 
    id: 'kandy', 
    name: 'Temple of the Tooth', 
    type: 'Religious & Sacred Places',
    description: 'Sri Dalada Maligawa is a sacred Buddhist temple housing the relic of the tooth of the Buddha.', 
    lng: 80.6416, 
    lat: 7.2936, 
    icon: 'temple_buddhist', 
    modelUrl: 'assets/glb/sacred.glb',
    region: 'Central Highlands', 
    district: 'Kandy', 
    badge: { id: 'kandy_badge', title: 'Guardian of the Sacred Relic', image: 'https://images.unsplash.com/photo-1620025983849-01eaae8b7c7b?q=80&w=200' }, 
    quests: [{ id: 2, title: 'The Esala Legacy', description: 'Explore the golden canopy and ritual chambers' }] 
  },
  { 
    dbId: 3, 
    id: 'galle', 
    name: 'Galle Dutch Fort', 
    type: 'Colonial & Architectural Heritage',
    description: 'A fortified maritime city founded by Portuguese colonists and heavily fortified by the Dutch in the 17th century.', 
    lng: 80.2170, 
    lat: 6.0267, 
    icon: 'fort', 
    modelUrl: 'assets/glb/colonial.glb',
    region: 'Southern & Sabaragamuwa', 
    district: 'Galle', 
    badge: { id: 'galle_badge', title: 'Galle Fort Navigator', image: 'https://images.unsplash.com/photo-1590480376288-7243c5bdf13c?q=80&w=200' }, 
    quests: [{ id: 3, title: 'Bastion of the South Seas', description: 'Navigate the ramparts and lighthouse secrets' }] 
  },
  { 
    dbId: 4, 
    id: 'anuradhapura', 
    name: 'Ruwanwelisaya Stupa', 
    type: 'Religious & Sacred Places',
    description: 'Ancient hemispherical stupa built by King Dutugemunu in 140 BCE.', 
    lng: 80.3965, 
    lat: 8.3444, 
    icon: 'temple_buddhist', 
    modelUrl: 'assets/glb/sacred.glb',
    region: 'North Central', 
    district: 'Anuradhapura', 
    badge: { id: 'anuradhapura_badge', title: 'Sacred City Pilgrim', image: 'https://images.unsplash.com/photo-1616853755490-8edb8be232b7?q=80&w=200' }, 
    quests: [{ id: 4, title: 'The Mahavamsa Chronicles', description: 'Discover the elephant wall and ancient engineering' }] 
  },
  { 
    dbId: 5, 
    id: 'ella', 
    name: 'Nine Arches Bridge', 
    type: 'Colonial & Architectural Heritage',
    description: 'A majestic colonial-era viaduct bridge surrounded by tea plantations in Demodara.', 
    lng: 81.0608, 
    lat: 6.8767, 
    icon: 'fort', 
    modelUrl: 'assets/glb/colonial.glb',
    region: 'Uva & Eastern Highlands', 
    district: 'Badulla', 
    badge: { id: 'ella_badge', title: 'Highland Wanderer', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=200' }, 
    quests: [{ id: 5, title: 'Echoes of the Highland Express', description: 'Find the hidden vantage points' }] 
  },
  { 
    dbId: 6, 
    id: 'jaffna', 
    name: 'Nallur Kandaswamy Kovil', 
    type: 'Religious & Sacred Places',
    description: 'One of the most significant Hindu temple complexes in Sri Lanka, dedicated to Lord Murugan.', 
    lng: 80.0306, 
    lat: 9.6738, 
    icon: 'temple_buddhist', 
    modelUrl: 'assets/glb/sacred.glb',
    region: 'Northern Sri Lanka', 
    district: 'Jaffna', 
    badge: { id: 'jaffna_badge', title: 'Northern Crown Seeker', image: 'https://images.unsplash.com/photo-1658428384165-f123dcd2f33c?q=80&w=200' }, 
    quests: [{ id: 6, title: 'The Golden Vel', description: 'Uncover the sacred architecture of Nallur' }] 
  }
];

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div 
          [class]="isDestructiveToast() ? 'bg-[#ba1a1a]' : 'bg-[#004343]'"
          class="fixed top-5 right-6 z-50 flex items-center gap-3 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 transition-all duration-300 animate-bounce">
          <span class="material-symbols-outlined text-xl">{{ isDestructiveToast() ? 'error' : 'verified' }}</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs cursor-pointer">✕</button>
        </div>
      }

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Container -->
      <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        <!-- Common Top Header Navigation -->
        <app-header 
          pageTitle="Cultural Map & Spatial Canon" 
          section="Console"
          searchPlaceholder="Search landmarks, cultural regions, riddles, badges..."
          [searchQuery]="searchQuery"
          (searchQueryChange)="searchQuery = $event">
        </app-header>

        <!-- Top Navigation Bar: Main Sections (Opportunity Page Style) -->
        <div class="bg-white border-b border-[#dde3eb] px-6 py-2.5 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-1 sm:gap-2">
            <!-- 1. Landmark Management Tab -->
            <button 
              (click)="setActiveTab('landmarks')"
              [class]="activeTab() === 'landmarks' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">explore</span>
              <span>Landmark Management</span>
              <span [class]="activeTab() === 'landmarks' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {{ landmarks().length }}
              </span>
            </button>

            <!-- 2. Badges & Treasure Hunt Studio Tab -->
            <button 
              (click)="setActiveTab('treasure_hunt')"
              [class]="activeTab() === 'treasure_hunt' ? 'bg-[#004343] text-white shadow-xs font-bold' : 'text-[#3f4948] hover:bg-[#f2f4f3] font-medium'"
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer">
              <span class="material-symbols-outlined text-base">military_tech</span>
              <span>Badges & Treasure Hunt Studio</span>
              <span [class]="activeTab() === 'treasure_hunt' ? 'bg-white/20 text-white' : 'bg-[#e1e3e2] text-[#3f4948]'" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {{ totalQuestsCount() }} Quests
              </span>
            </button>
          </div>

          <!-- Section Context Info / Breadcrumb -->
          <div class="flex items-center gap-2">
            @if (activeTab() === 'landmarks' && isEditMode()) {
              <span class="text-xs px-2.5 py-1 rounded-lg bg-[#fe893e]/15 text-[#9b4600] border border-[#fe893e]/30 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">edit_note</span>
                <span>Editing Landmark Node</span>
              </span>
            } @else if (activeTab() === 'landmarks' && !isEditMode()) {
              <span class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">add_location_alt</span>
                <span>Landmark Creation Studio</span>
              </span>
            } @else if (activeTab() === 'treasure_hunt') {
              <span class="text-xs px-2.5 py-1 rounded-lg bg-[#fe893e]/15 text-[#9b4600] border border-[#fe893e]/30 font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">workspace_premium</span>
                <span>Treasure Hunt & Badges</span>
              </span>
            }
          </div>
        </div>

        <!-- Main Body Scrollable View -->
        <main class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Top Executive Bar (Title & Subtitle on Left, Sync and Action triggers on Right) -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">
                Cultural Map & Landmark Management
              </h1>
              <p class="text-xs text-[#3f4948] max-w-3xl leading-relaxed">
                Define and curate cultural landmarks across Sri Lanka's 8 cultural regions and districts, bind published community stories to heritage sites, and design interactive treasure hunt riddles and badges.
              </p>
            </div>

            <!-- Action Triggers: Sync Button & Add Landmark trigger -->
            <div class="flex items-center gap-3 self-start xl:self-auto flex-wrap">
              <button 
                (click)="refreshAllData()"
                [disabled]="isLoading()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base text-[#004343]" [ngClass]="{'animate-spin': isLoading()}">sync</span>
                <span>{{ isLoading() ? 'Syncing...' : 'Sync Info' }}</span>
              </button>

              <button 
                (click)="navigateToAddLandmark()"
                class="px-4 py-2.5 rounded-xl bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-base">add_location_alt</span>
                <span>+ Add Landmark</span>
              </button>
            </div>
          </div>

          <!-- 4 Metric Cards Strip -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Registered Landmarks</span>
                <span class="material-symbols-outlined text-[#004343] text-lg">temple_hindu</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343]">{{ landmarks().length }}</span>
                <span class="text-xs text-emerald-700 font-semibold">Active Canon</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#004343] h-full rounded-full transition-all duration-500" style="width: 100%"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Cultural Regions</span>
                <span class="material-symbols-outlined text-emerald-700 text-lg">travel_explore</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-emerald-800">{{ regions().length }}</span>
                <span class="text-xs text-emerald-700 font-semibold">Districts Canon</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-600 h-full rounded-full transition-all duration-500" style="width: 100%"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Published Stories</span>
                <span class="material-symbols-outlined text-amber-700 text-lg">history_edu</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-amber-800">{{ publishedStories().length }}</span>
                <span class="text-xs text-amber-700 font-semibold">Available to Bind</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: 85%"></div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white border border-[#dde3eb] shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-[#6f7978]">
                <span class="text-[11px] font-bold uppercase tracking-wider">Quests & Badges</span>
                <span class="material-symbols-outlined text-[#fe893e] text-lg">military_tech</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#9b4600]">{{ totalQuestsCount() }}</span>
                <span class="text-xs text-[#9b4600] font-semibold">Active Trials</span>
              </div>
              <div class="w-full bg-[#f2f4f3] rounded-full h-1.5 overflow-hidden">
                <div class="bg-[#fe893e] h-full rounded-full transition-all duration-500" style="width: 90%"></div>
              </div>
            </div>

          </div>

          <!-- TAB 1: LANDMARK MANAGEMENT -->
          @if (activeTab() === 'landmarks') {
            <div class="space-y-6">
              
              <!-- Sub-Page Status Filter Chips Bar (Opportunity Page Style) -->
              <div class="flex items-center gap-2 pb-1 overflow-x-auto custom-scrollbar">
                <button 
                  (click)="setLandmarkSubTab('add_edit')"
                  [class]="landmarkSubTab() === 'add_edit' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2] font-semibold'"
                  class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                  <span class="material-symbols-outlined text-sm">{{ isEditMode() ? 'edit_location' : 'add_location_alt' }}</span>
                  <span>{{ isEditMode() ? 'Modify Landmark Node (Edit Mode)' : 'Adding & Editing Landmarks' }}</span>
                </button>

                <button 
                  (click)="setLandmarkSubTab('details')"
                  [class]="landmarkSubTab() === 'details' ? 'bg-[#004343] text-white font-bold' : 'bg-[#f2f4f3] text-[#3f4948] hover:bg-[#e1e3e2] font-semibold'"
                  class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                  <span class="material-symbols-outlined text-sm">map</span>
                  <span>Show All Landmark Details & Sri Lanka Map</span>
                  <span class="px-1.5 py-0.2 rounded-full text-[10px]" [class]="landmarkSubTab() === 'details' ? 'bg-white/20 text-white' : 'bg-black/10 text-[#3f4948]'">
                    {{ filteredLandmarks().length }}
                  </span>
                </button>
              </div>

              <!-- SUB-PAGE 1: ADDING & EDITING LANDMARKS -->
              @if (landmarkSubTab() === 'add_edit') {
                <div class="space-y-6">
                  
                  <!-- Distinct Mode Banner with Fast Landmark Selector to Edit -->
                  <div 
                    [ngClass]="isEditMode() ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 text-amber-900' : 'bg-gradient-to-r from-[#004343]/10 via-[#004343]/5 to-transparent border-[#004343]/30 text-[#004343]'"
                    class="p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-4 shadow-xs">
                    <div class="flex items-center gap-3">
                      <div 
                        [ngClass]="isEditMode() ? 'bg-amber-500 text-white' : 'bg-[#004343] text-white'"
                        class="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs">
                        <span class="material-symbols-outlined text-xl">{{ isEditMode() ? 'edit_note' : 'add_location' }}</span>
                      </div>
                      <div>
                        <div class="flex items-center gap-2 flex-wrap">
                          <h2 class="text-base font-bold uppercase tracking-wide">
                            {{ isEditMode() ? 'Editing Landmark Node: ' + (landmarkForm.name || 'Selected Landmark') : 'Create New Cultural Landmark' }}
                          </h2>
                          <span 
                            [ngClass]="isEditMode() ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'"
                            class="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border">
                            {{ isEditMode() ? 'Edit Mode (ID #' + (selectedLandmarkDbId || 'N/A') + ')' : 'Creation Studio' }}
                          </span>
                        </div>
                        <p class="text-xs text-[#6e7978] mt-0.5">
                          {{ isEditMode() ? 'Update spatial coordinates, region bindings, description, and attached community stories for this landmark.' : 'Define a new landmark node on the Sri Lankan map with linked districts and published community stories.' }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                      <!-- Quick Dropdown to Select Existing Landmark to Edit directly -->
                      <div class="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#dde3eb] shadow-2xs">
                        <span class="material-symbols-outlined text-[#004343] text-sm">edit_location</span>
                        <select 
                          [ngModel]="selectedLandmarkDbId"
                          (ngModelChange)="onSelectExistingLandmarkToEdit($event)"
                          class="text-xs bg-transparent border-0 font-bold text-[#004343] focus:outline-none cursor-pointer">
                          <option [ngValue]="null">-- Select Landmark to Edit --</option>
                          @for (landmark of landmarks(); track landmark.id) {
                            <option [ngValue]="landmark.dbId || landmark.id">{{ landmark.name }} ({{ landmark.region }})</option>
                          }
                        </select>
                      </div>

                      @if (isEditMode()) {
                        <button 
                          (click)="switchToCreateMode()"
                          class="px-3.5 py-1.5 bg-white border border-[#dde3eb] hover:bg-[#f8faf9] text-[#191c1c] text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs">
                          + Create New Instead
                        </button>
                      }
                    </div>
                  </div>

                  <!-- 2-Column Grid: Form & Stories (5 Cols) | Mapbox GPS Picker (7 Cols) -->
                  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    <!-- LEFT COLUMN: Form (5 Cols) -->
                    <div class="lg:col-span-5 space-y-6">
                      
                      <!-- Section 1: Region & District Spatial Assignment -->
                      <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                        <div class="flex items-center gap-2 pb-2 border-b border-[#dde3eb]">
                          <span class="w-6 h-6 rounded-full bg-[#004343] text-white flex items-center justify-center text-xs font-bold">1</span>
                          <h3 class="font-bold text-sm text-[#191c1c]">Region & District Spatial Assignment</h3>
                        </div>

                        <!-- Region Selector (Fetched from GET /api/map/regions) -->
                        <div>
                          <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                            Cultural Region <span class="text-red-500">*</span>
                          </label>
                          <select 
                            [(ngModel)]="landmarkForm.region"
                            (ngModelChange)="onFormRegionChange($event)"
                            class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-medium text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all cursor-pointer">
                            <option value="" disabled selected>-- Select Cultural Region --</option>
                            @for (region of regions(); track region.id) {
                              <option [value]="region.regionName">{{ region.regionName }}</option>
                            }
                          </select>
                          <p class="text-[10px] text-[#6e7978] mt-1">Fetched from GET /api/map/regions endpoint.</p>
                        </div>

                        <!-- District Dropdown (Dependent on selected Region, Optional) -->
                        <div>
                          <div class="flex items-center justify-between mb-1.5">
                            <label class="block text-xs font-bold text-[#191c1c]">
                              Administrative District <span class="text-[10px] font-normal text-[#6e7978]">(Optional)</span>
                            </label>
                            @if (!landmarkForm.region) {
                              <span class="text-[10px] text-amber-600 font-medium">Select region first to enable</span>
                            }
                          </div>
                          <select 
                            [(ngModel)]="landmarkForm.district"
                            [disabled]="!landmarkForm.region || availableDistrictsForForm().length === 0"
                            class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-medium text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all disabled:opacity-50 disabled:bg-gray-100 cursor-pointer">
                            <option [value]="''">
                              {{ !landmarkForm.region ? '-- Select Region First --' : '-- Select District (Optional) --' }}
                            </option>
                            @for (dist of availableDistrictsForForm(); track dist) {
                              <option [value]="dist">{{ dist }}</option>
                            }
                          </select>
                          <p class="text-[10px] text-[#6e7978] mt-1">
                            {{ availableDistrictsForForm().length > 0 ? availableDistrictsForForm().length + ' districts available in ' + landmarkForm.region : (landmarkForm.region ? 'No districts registered for this region.' : 'Select a region above to load districts.') }}
                          </p>
                        </div>

                        <!-- Published Stories Filtered Stream (ONLY SHOWN AFTER SELECTING REGION) -->
                        @if (landmarkForm.region) {
                          <div class="pt-3 border-t border-[#dde3eb] space-y-3">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-amber-700 text-sm">history_edu</span>
                                <label class="text-xs font-bold text-[#191c1c]">Published Stories in this District</label>
                              </div>
                              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                {{ filteredPublishedStoriesForForm().length }} available
                              </span>
                            </div>

                            @if (filteredPublishedStoriesForForm().length === 0) {
                              <div class="p-4 rounded-xl bg-[#f8faf9] border border-dashed border-[#dde3eb] text-center text-xs text-[#6e7978]">
                                <span class="material-symbols-outlined text-2xl text-gray-400 block mb-1">sentiment_dissatisfied</span>
                                No published community stories found for <strong>{{ landmarkForm.district || landmarkForm.region }}</strong>.
                              </div>
                            } @else {
                              <!-- Attach All Checkbox -->
                              <div class="flex items-center justify-between p-2.5 bg-[#f0fdf4] rounded-xl border border-emerald-200">
                                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                                  <input 
                                    type="checkbox" 
                                    [checked]="isAllStoriesSelected()" 
                                    (change)="toggleAttachAllStories($event)"
                                    class="w-4 h-4 rounded text-[#004343] focus:ring-[#004343] cursor-pointer">
                                  <span>Attach All {{ filteredPublishedStoriesForForm().length }} Stories to this Landmark</span>
                                </label>
                                <span class="text-[10px] font-bold text-emerald-700">
                                  {{ landmarkForm.attachedStoryIds?.length || 0 }} selected
                                </span>
                              </div>

                              <!-- Scrollable Area for Published Stories -->
                              <div class="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                @for (story of filteredPublishedStoriesForForm(); track story.id) {
                                  <div 
                                    [ngClass]="isStorySelected(story.id) ? 'border-emerald-300 bg-emerald-50/50' : 'border-[#dde3eb] bg-white hover:bg-[#f8faf9]'"
                                    class="p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all">
                                    <label class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                                      <input 
                                        type="checkbox" 
                                        [checked]="isStorySelected(story.id)"
                                        (change)="toggleStorySelection(story.id)"
                                        class="w-3.5 h-3.5 rounded text-[#004343] focus:ring-[#004343] cursor-pointer shrink-0">
                                      <div class="min-w-0">
                                        <div class="text-xs font-bold text-[#191c1c] truncate">{{ story.title }}</div>
                                        <div class="flex items-center gap-2 text-[10px] text-[#6e7978]">
                                          <span>By {{ story.authorName || 'Community User' }}</span>
                                          <span>•</span>
                                          <span class="text-emerald-700 font-medium">{{ story.type || 'Story' }}</span>
                                        </div>
                                      </div>
                                    </label>

                                    @if (story.imageUrl) {
                                      <img [src]="story.imageUrl" class="w-8 h-8 rounded-lg object-cover border border-[#dde3eb] shrink-0" alt="thumbnail">
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>

                      <!-- Section 2: Landmark Details & GPS Coordinates -->
                      <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                        <div class="flex items-center gap-2 pb-2 border-b border-[#dde3eb]">
                          <span class="w-6 h-6 rounded-full bg-[#004343] text-white flex items-center justify-center text-xs font-bold">2</span>
                          <h3 class="font-bold text-sm text-[#191c1c]">Identity & Spatial Coordinates</h3>
                        </div>

                        <!-- Name & Auto-Generated Code -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                              Landmark Name <span class="text-red-500">*</span>
                            </label>
                            <input 
                              type="text" 
                              [(ngModel)]="landmarkForm.name"
                              (ngModelChange)="onLandmarkNameInput($event)"
                              placeholder="e.g. Sigiriya Rock Fortress"
                              class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all">
                          </div>

                          <div>
                            <div class="flex items-center justify-between mb-1.5">
                              <label class="block text-xs font-bold text-[#191c1c]">
                                Unique Identifier Code <span class="text-red-500">*</span>
                              </label>
                              <span class="text-[10px] font-mono font-bold text-[#004343] bg-[#004343]/10 px-2 py-0.5 rounded-md">
                                Auto-generated
                              </span>
                            </div>
                            <input 
                              type="text" 
                              [(ngModel)]="landmarkForm.code"
                              placeholder="e.g. sigiriya-rock-fortress"
                              class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-mono text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all">
                          </div>
                        </div>

                        <!-- Landmark Type / Classification Dropdown -->
                        <div>
                          <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                            Landmark Type & Heritage Category <span class="text-red-500">*</span>
                          </label>
                          <select 
                            [(ngModel)]="landmarkForm.type"
                            (ngModelChange)="onLandmarkTypeChange($event)"
                            class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-medium text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all cursor-pointer">
                            <option value="" disabled selected>-- Select Landmark Heritage Type --</option>
                            @for (t of landmarkTypes; track t.value) {
                              <option [value]="t.value">{{ t.label }}</option>
                            }
                          </select>
                          <p class="text-[10px] text-[#6e7978] mt-1">
                            Sets the 3D model asset and spatial classification badge for this landmark.
                          </p>
                        </div>

                        <!-- Interactive 3D Model Asset Viewer for Selected Type -->
                        @if (landmarkForm.modelUrl) {
                          <div class="space-y-1.5">
                            <div class="flex items-center justify-between">
                              <label class="block text-xs font-bold text-[#191c1c] flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-sm text-[#fe893e]">view_in_ar</span>
                                <span>3D GLB Model Asset Preview (Selected Type)</span>
                              </label>
                              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {{ landmarkForm.modelUrl }}
                              </span>
                            </div>

                            <div class="relative w-full rounded-2xl overflow-hidden border border-[#1e293b] bg-[#0f172a] shadow-md">
                              <model-viewer 
                                [src]="landmarkForm.modelUrl"
                                auto-rotate
                                rotation-per-second="25deg"
                                camera-controls
                                shadow-intensity="1.2"
                                exposure="1.05"
                                touch-action="pan-y"
                                style="width: 100%; height: 200px; background-color: #0f172a; outline: none;">
                              </model-viewer>

                              <!-- Overlays -->
                              <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
                                <span class="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                                  <span class="material-symbols-outlined text-xs">{{ getLandmarkTypeIcon(landmarkForm.type) }}</span>
                                  {{ landmarkForm.type || 'Heritage 3D Model' }}
                                </span>
                              </div>

                              <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                                <span class="flex items-center gap-1 font-medium">
                                  <span class="material-symbols-outlined text-xs text-amber-400">3d_rotation</span>
                                  Drag to 360° orbit • Scroll to zoom
                                </span>
                                <span class="font-mono text-[9px] text-emerald-300 font-bold">3D Map Model</span>
                              </div>
                            </div>
                          </div>
                        }

                        <!-- Coordinates (Lng / Lat) with Map Interaction Hint -->
                        <div>
                          <div class="flex items-center justify-between mb-1.5">
                            <label class="block text-xs font-bold text-[#191c1c] flex items-center gap-2">
                              Precise GPS Target (Lng, Lat) <span class="text-red-500">*</span>
                              <button type="button" (click)="fetchUserLocation()" class="bg-[#004343] text-white px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:bg-[#003333] transition-colors cursor-pointer shadow-xs">
                                <span class="material-symbols-outlined text-[12px]">my_location</span>
                                Fetch Location
                              </button>
                            </label>
                            <span class="text-[10px] text-[#004343] font-bold">
                              💡 Click on the right map to pin
                            </span>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <div class="text-[10px] text-[#6e7978] mb-0.5">Longitude (E)</div>
                              <input 
                                type="number" 
                                step="0.0001"
                                [(ngModel)]="landmarkForm.longitude"
                                (ngModelChange)="onCoordinatesManualChange()"
                                placeholder="e.g. 80.7603"
                                class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] font-mono focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all">
                            </div>
                            <div>
                              <div class="text-[10px] text-[#6e7978] mb-0.5">Latitude (N)</div>
                              <input 
                                type="number" 
                                step="0.0001"
                                [(ngModel)]="landmarkForm.latitude"
                                (ngModelChange)="onCoordinatesManualChange()"
                                placeholder="e.g. 7.9570"
                                class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] font-mono focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all">
                            </div>
                          </div>
                        </div>

                        <!-- Description -->
                        <div>
                          <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                            Official Overview & Historical Context <span class="text-red-500">*</span>
                          </label>
                          <textarea 
                            rows="3"
                            [(ngModel)]="landmarkForm.description"
                            placeholder="Enter the official historical summary and spatial narrative of this landmark..."
                            class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-3 text-[#191c1c] focus:outline-hidden focus:border-[#004343] focus:bg-white transition-all resize-none"></textarea>
                        </div>

                        <!-- Form Actions Bar -->
                        <div class="pt-3 border-t border-[#dde3eb] flex items-center justify-between gap-3">
                          @if (isEditMode()) {
                            <button 
                              (click)="deleteCurrentLandmark()"
                              [disabled]="isSaving()"
                              class="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
                              <span class="material-symbols-outlined text-sm">delete_forever</span>
                              <span>Delete</span>
                            </button>

                            <div class="flex items-center gap-2">
                              <button 
                                (click)="switchToCreateMode()"
                                class="px-4 py-2.5 bg-[#f2f4f7] hover:bg-[#e4e7ec] text-[#4e5d5b] text-xs font-bold rounded-xl transition-all cursor-pointer">
                                Reset
                              </button>
                              <button 
                                (click)="submitLandmarkForm()"
                                [disabled]="isSaving()"
                                class="px-6 py-2.5 bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm" [class.animate-spin]="isSaving()">
                                  {{ isSaving() ? 'sync' : 'save' }}
                                </span>
                                <span>Save Landmark Changes</span>
                              </button>
                            </div>
                          } @else {
                            <button 
                              (click)="resetLandmarkForm()"
                              class="px-4 py-2.5 bg-[#f2f4f7] hover:bg-[#e4e7ec] text-[#4e5d5b] text-xs font-bold rounded-xl transition-all cursor-pointer">
                              Clear Fields
                            </button>
                            <button 
                              (click)="submitLandmarkForm()"
                              [disabled]="isSaving()"
                              class="px-6 py-2.5 bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2">
                              <span class="material-symbols-outlined text-sm" [class.animate-spin]="isSaving()">
                                {{ isSaving() ? 'sync' : 'add_location' }}
                              </span>
                              <span>Create Cultural Landmark</span>
                            </button>
                          }
                        </div>
                      </div>

                    </div>

                    <!-- RIGHT COLUMN: Mapbox Target Coordinate Picker Map (7 Cols) -->
                    <div class="lg:col-span-7 bg-white rounded-2xl border border-[#dde3eb] p-4 shadow-xs flex flex-col space-y-3 sticky top-6">
                      
                      <!-- Map Studio Controls -->
                      <div class="flex items-center justify-between flex-wrap gap-2">
                        <div class="flex items-center gap-2">
                          <span class="material-symbols-outlined text-[#004343]">my_location</span>
                          <div>
                            <div class="text-xs font-bold text-[#191c1c]">Sri Lanka GPS Target Coordinate Picker</div>
                            <div class="text-[10px] text-[#6e7978]">Click anywhere on the map to set landmark coordinates</div>
                          </div>
                        </div>

                        <!-- Map Style Toggle Buttons -->
                        <div class="flex items-center gap-1 bg-[#f0f4f3] p-1 rounded-xl border border-[#dde3eb]">
                          <button 
                            (click)="setMapStyle('satellite-streets-v12')"
                            [ngClass]="activeMapStyle === 'satellite-streets-v12' ? 'bg-[#004343] text-white font-bold' : 'text-[#4e5d5b] hover:bg-black/5'"
                            class="px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer">
                            Satellite 3D
                          </button>
                          <button 
                            (click)="setMapStyle('outdoors-v12')"
                            [ngClass]="activeMapStyle === 'outdoors-v12' ? 'bg-[#004343] text-white font-bold' : 'text-[#4e5d5b] hover:bg-black/5'"
                            class="px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer">
                            Topography
                          </button>
                          <button 
                            (click)="setMapStyle('light-v11')"
                            [ngClass]="activeMapStyle === 'light-v11' ? 'bg-[#004343] text-white font-bold' : 'text-[#4e5d5b] hover:bg-black/5'"
                            class="px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer">
                            Clean Vector
                          </button>
                        </div>
                      </div>

                      <!-- Mapbox Canvas Container for Sub-page 1 -->
                      <div class="relative w-full h-[820px] rounded-xl overflow-hidden border border-[#dde3eb] bg-[#e5e9ec]">
                        <div id="cultural-mapbox-picker" class="w-full h-full min-h-[820px]"></div>

                        <!-- Top Floating Location Search Bar & Autocomplete Dropdown -->
                        <div class="absolute top-3 left-3 right-16 z-20 max-w-lg">
                          <div class="relative flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#dde3eb] overflow-hidden focus-within:ring-2 focus-within:ring-[#004343] focus-within:border-transparent transition-all">
                            <div class="pl-3.5 pr-2 flex items-center justify-center text-[#004343]">
                              @if (isSearchingMapLocation()) {
                                <span class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                              } @else {
                                <span class="material-symbols-outlined text-lg">travel_explore</span>
                              }
                            </div>
                            
                            <input 
                              type="text" 
                              [ngModel]="mapLocationSearchQuery()"
                              (ngModelChange)="onMapLocationSearchInput($event)"
                              (focus)="mapLocationSearchQuery().length >= 2 ? showMapSearchResults.set(true) : null"
                              placeholder="Search location in Sri Lanka (e.g. Kandy Lake, Sigiriya, Galle Fort)..."
                              class="w-full py-2.5 text-xs text-[#191c1c] font-medium placeholder:text-[#6e7978] bg-transparent border-0 focus:outline-none" />

                            @if (mapLocationSearchQuery()) {
                              <button 
                                (click)="clearMapLocationSearch()"
                                class="pr-3 text-[#6e7978] hover:text-[#191c1c] cursor-pointer flex items-center justify-center"
                                title="Clear Search">
                                <span class="material-symbols-outlined text-base">close</span>
                              </button>
                            }
                          </div>

                          <!-- Search Results Dropdown -->
                          @if (showMapSearchResults() && mapSearchResults().length > 0) {
                            <div class="mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#dde3eb] max-h-72 overflow-y-auto divide-y divide-[#f2f4f3] custom-scrollbar z-30">
                              <div class="px-3.5 py-1.5 bg-[#f8faf9] text-[10px] font-bold uppercase tracking-wider text-[#6e7978] flex items-center justify-between">
                                <span>Matching Locations ({{ mapSearchResults().length }})</span>
                                <span class="text-[9px] text-[#004343] font-semibold">Click to confirm & fetch lat/long</span>
                              </div>

                              @for (result of mapSearchResults(); track result.id) {
                                <div 
                                  (click)="selectAndConfirmLocation(result)"
                                  class="p-3 hover:bg-[#004343]/5 cursor-pointer transition-colors flex items-start gap-2.5 group">
                                  
                                  <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                    [ngClass]="result.type === 'registered_landmark' ? 'bg-[#fe893e]/15 text-[#9b4600]' : 'bg-[#004343]/10 text-[#004343]'">
                                    <span class="material-symbols-outlined text-sm">
                                      {{ result.type === 'registered_landmark' ? 'account_balance' : 'location_on' }}
                                    </span>
                                  </div>

                                  <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between gap-1">
                                      <span class="text-xs font-bold text-[#191c1c] group-hover:text-[#004343] truncate">
                                        {{ result.name }}
                                      </span>
                                      @if (result.type === 'registered_landmark') {
                                        <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold shrink-0">
                                          Landmark
                                        </span>
                                      }
                                    </div>

                                    <p class="text-[11px] text-[#6e7978] truncate mt-0.5">
                                      {{ result.placeName }}
                                    </p>

                                    <div class="flex items-center gap-2 mt-1">
                                      <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        {{ result.lng | number:'1.4-4' }}° E, {{ result.lat | number:'1.4-4' }}° N
                                      </span>
                                      @if (result.district) {
                                        <span class="text-[10px] text-[#3f4948] bg-gray-100 px-1.5 py-0.2 rounded">
                                          {{ result.district }}
                                        </span>
                                      }
                                    </div>
                                  </div>

                                  <button 
                                    class="self-center px-2.5 py-1 rounded-lg bg-[#004343] text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    Confirm
                                  </button>
                                </div>
                              }
                            </div>
                          } @else if (showMapSearchResults() && mapLocationSearchQuery().length >= 2 && !isSearchingMapLocation() && mapSearchResults().length === 0) {
                            <div class="mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#dde3eb] p-4 text-center text-xs text-[#6e7978]">
                              <span class="material-symbols-outlined text-xl text-gray-400 block mb-1">location_off</span>
                              No locations found for "{{ mapLocationSearchQuery() }}" in Sri Lanka.
                            </div>
                          }
                        </div>

                        <!-- Coordinates Floating Status Badge Overlay -->
                        <div class="absolute top-16 left-3 z-10 flex flex-col gap-1.5">
                          <div class="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-[#dde3eb] flex items-center gap-3">
                            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                            <div class="text-[11px] font-mono font-bold text-[#191c1c]">
                              Target: {{ landmarkForm.longitude ? (landmarkForm.longitude | number:'1.4-4') : '80.7603' }}° E, 
                              {{ landmarkForm.latitude ? (landmarkForm.latitude | number:'1.4-4') : '7.9570' }}° N
                            </div>
                          </div>

                          @if (selectedMapLocationName()) {
                            <div class="bg-emerald-50/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
                              <span class="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                              <span class="truncate max-w-[240px]">Confirmed: {{ selectedMapLocationName() }}</span>
                              <button (click)="recenterMapOnConfirmedLocation()" class="text-[10px] text-emerald-700 underline font-bold ml-1 hover:text-emerald-900 cursor-pointer">Recenter</button>
                              <button (click)="selectedMapLocationName.set(null)" class="text-emerald-700 hover:text-emerald-900 ml-1 cursor-pointer text-[10px]">✕</button>
                            </div>
                          }
                        </div>

                        <!-- Reset View Button Overlay -->
                        <div class="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
                          <button 
                            (click)="flyToSriLankaOverview()"
                            class="px-3 py-1.5 bg-white/95 hover:bg-white text-[#191c1c] text-[11px] font-bold rounded-lg shadow-md border border-[#dde3eb] backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-sm text-[#004343]">crop_free</span>
                            <span>Fit Sri Lanka</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              }

              <!-- SUB-PAGE 2: SHOW ALL LANDMARK DETAILS & CATALOG -->
              @if (landmarkSubTab() === 'details') {
                <div class="space-y-6">
                  
                  <!-- Top Filter & Search Bar -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-4 shadow-xs flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-3 flex-wrap">
                      
                      <!-- Filter by Region -->
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-[#191c1c] shrink-0">Filter Region:</span>
                        <select 
                          [(ngModel)]="selectedFilterRegion"
                          (ngModelChange)="onFilterRegionChange($event)"
                          class="text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2 font-medium text-[#191c1c] focus:outline-hidden focus:border-[#004343] transition-all cursor-pointer">
                          <option value="all">All Cultural Regions (Sri Lanka)</option>
                          @for (region of regions(); track region.id) {
                            <option [value]="region.regionName">{{ region.regionName }}</option>
                          }
                        </select>
                      </div>

                      <!-- Filter by District -->
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-[#191c1c] shrink-0">District:</span>
                        <select 
                          [(ngModel)]="selectedFilterDistrict"
                          [disabled]="selectedFilterRegion === 'all'"
                          class="text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2 font-medium text-[#191c1c] focus:outline-hidden focus:border-[#004343] transition-all disabled:opacity-50 cursor-pointer">
                          <option value="all">All Districts</option>
                          @for (dist of availableDistrictsForFilter(); track dist) {
                            <option [value]="dist">{{ dist }}</option>
                          }
                        </select>
                      </div>

                      <!-- Search Input -->
                      <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-2 text-[#6e7978] text-base">search</span>
                        <input 
                          type="text" 
                          [(ngModel)]="catalogSearchQuery"
                          placeholder="Search landmark name, code..."
                          class="text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-3 py-2 text-[#191c1c] focus:outline-hidden focus:border-[#004343] transition-all w-60">
                      </div>
                    </div>

                    <!-- Action: Add New Landmark -->
                    <button 
                      (click)="navigateToAddLandmark()"
                      class="px-4 py-2 bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm">add_circle</span>
                      <span>Add New Landmark</span>
                    </button>
                  </div>

                  <!-- Full Interactive Sri Lanka Mapbox 3D Map -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] p-4 shadow-xs space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#004343]">travel_explore</span>
                        <div>
                          <h3 class="text-sm font-bold text-[#191c1c]">Sri Lanka Cultural Spatial Canon (3D Map)</h3>
                          <p class="text-[10px] text-[#6e7978]">Click any landmark pin to view details or click Edit to modify in Studio.</p>
                        </div>
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          (click)="flyToSriLankaOverview()"
                          class="px-3 py-1.5 bg-[#f0f4f3] hover:bg-[#dde3eb] text-[#191c1c] text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-sm text-[#004343]">zoom_out_map</span>
                          <span>Fit Sri Lanka</span>
                        </button>
                      </div>
                    </div>

                    <!-- Mapbox Canvas Container for Sub-page 2 -->
                    <div class="relative w-full h-[720px] rounded-xl overflow-hidden border border-[#dde3eb] bg-[#e5e9ec]">
                      <div id="cultural-mapbox-catalog" class="w-full h-full min-h-[720px]"></div>
                    </div>
                  </div>

                  <!-- Registered Landmarks Catalog Directory Table -->
                  <div class="bg-white rounded-2xl border border-[#dde3eb] overflow-hidden shadow-xs">
                    <div class="px-6 py-4 border-b border-[#dde3eb] flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 class="text-sm font-bold text-[#191c1c]">Registered Landmarks Catalog</h3>
                        <p class="text-xs text-[#6e7978]">Complete directory of registered cultural landmarks, attached community stories, badges, and quests.</p>
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#004343]/10 text-[#004343]">
                        Showing {{ filteredLandmarks().length }} of {{ landmarks().length }} Landmarks
                      </span>
                    </div>

                    @if (filteredLandmarks().length === 0) {
                      <div class="p-12 text-center text-[#6e7978]">
                        <span class="material-symbols-outlined text-4xl text-gray-300 block mb-2">location_off</span>
                        <div class="text-sm font-bold text-[#191c1c]">No Landmarks Found</div>
                        <p class="text-xs text-[#6e7978] mt-1">Try adjusting your region/district filters or create a new landmark in Studio.</p>
                        <button 
                          (click)="navigateToAddLandmark()"
                          class="mt-4 px-4 py-2 bg-[#004343] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer">
                          <span class="material-symbols-outlined text-sm">add</span>
                          <span>Add Landmark Now</span>
                        </button>
                      </div>
                    } @else {
                      <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                          <thead class="bg-[#f8faf9] text-[#6e7978] uppercase text-[10px] font-bold border-b border-[#dde3eb]">
                            <tr>
                              <th class="px-6 py-3.5">Landmark Node</th>
                              <th class="px-4 py-3.5">Heritage Type</th>
                              <th class="px-4 py-3.5">Region & District</th>
                              <th class="px-4 py-3.5">Coordinates</th>
                              <th class="px-4 py-3.5">Attached Stories</th>
                              <th class="px-4 py-3.5">Badges & Quests</th>
                              <th class="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-[#dde3eb]">
                            @for (landmark of filteredLandmarks(); track landmark.id) {
                              <tr class="hover:bg-[#f8faf9]/80 transition-colors">
                                <!-- Node Name & Icon -->
                                <td class="px-6 py-4">
                                  <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl border border-[#dde3eb] shrink-0 flex items-center justify-center bg-[#004343]/10 text-[#004343]">
                                      <span class="material-symbols-outlined text-xl">{{ getLandmarkTypeIcon(landmark.type) }}</span>
                                    </div>
                                    <div>
                                      <div class="font-bold text-[#191c1c] text-sm">{{ landmark.name }}</div>
                                      <div class="font-mono text-[10px] text-[#6e7978]">{{ landmark.id }}</div>
                                    </div>
                                  </div>
                                </td>

                                <!-- Heritage Type Badge -->
                                <td class="px-4 py-4">
                                  <span 
                                    [ngClass]="getLandmarkTypeBadgeClass(landmark.type)"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border">
                                    <span class="material-symbols-outlined text-xs">{{ getLandmarkTypeIcon(landmark.type) }}</span>
                                    <span>{{ landmark.type || 'Historical & Archaeological Sites' }}</span>
                                  </span>
                                </td>

                                <!-- Region & District -->
                                <td class="px-4 py-4">
                                  <div class="font-bold text-[#191c1c]">{{ landmark.region }}</div>
                                  <div class="text-[11px] text-[#6e7978]">{{ landmark.district || 'All Districts' }}</div>
                                </td>

                                <!-- Coordinates -->
                                <td class="px-4 py-4 font-mono text-[11px] text-[#4e5d5b]">
                                  {{ landmark.lng | number:'1.4-4' }}° E, {{ landmark.lat | number:'1.4-4' }}° N
                                </td>

                                <!-- Attached Stories -->
                                <td class="px-4 py-4">
                                  <span class="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    {{ landmark.attachedStoryIds?.length || 0 }} Stories
                                  </span>
                                </td>

                                <!-- Badges & Quests -->
                                <td class="px-4 py-4">
                                  <div class="flex items-center gap-2">
                                    <span 
                                      [ngClass]="landmark.badge ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'"
                                      class="px-2 py-0.5 rounded text-[10px] font-bold border">
                                      {{ landmark.badge ? 'Badge Set' : 'No Badge' }}
                                    </span>
                                    <span 
                                      [ngClass]="(landmark.quests?.length || 0) > 0 ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-gray-100 text-gray-500 border-gray-200'"
                                      class="px-2 py-0.5 rounded text-[10px] font-bold border">
                                      {{ landmark.quests?.length || 0 }} Quests
                                    </span>
                                  </div>
                                </td>

                                <!-- Actions -->
                                <td class="px-6 py-4 text-right">
                                  <div class="flex items-center justify-end gap-2">
                                    <button 
                                      (click)="navigateToEditLandmark(landmark)"
                                      class="px-3 py-1.5 bg-[#004343]/10 hover:bg-[#004343] text-[#004343] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Edit in Studio">
                                      <span class="material-symbols-outlined text-sm">edit</span>
                                      <span>Edit</span>
                                    </button>

                                    <button 
                                      (click)="selectLandmarkForHunt(landmark)"
                                      class="px-3 py-1.5 bg-orange-100 hover:bg-orange-500 text-orange-800 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                      title="Manage Quests & Badges">
                                      <span class="material-symbols-outlined text-sm">military_tech</span>
                                      <span>Quests</span>
                                    </button>

                                    <button 
                                      (click)="deleteLandmarkById(landmark.dbId || 0, landmark.name)"
                                      class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Landmark">
                                      <span class="material-symbols-outlined text-base">delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>

                </div>
              }

            </div>
          }

          <!-- TAB 2: BADGES & TREASURE HUNT STUDIO -->
          @if (activeTab() === 'treasure_hunt') {
            <div class="space-y-6">
              
              <!-- Select Target Landmark Banner -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-[#fe893e]/20 text-[#9b4600] flex items-center justify-center font-bold">
                    <span class="material-symbols-outlined text-2xl">military_tech</span>
                  </div>
                  <div>
                    <h2 class="text-base font-bold text-[#191c1c]">Treasure Hunt & Spatial Badge Studio</h2>
                    <p class="text-xs text-[#6e7978]">Configure interactive location-based unlockable badges, riddles, and multi-stage questions for mobile explorers.</p>
                  </div>
                </div>

                <!-- Choose Target Landmark Dropdown -->
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#191c1c]">Active Landmark Node:</span>
                  <select 
                    [ngModel]="selectedHuntLandmark()?.id"
                    (ngModelChange)="onHuntLandmarkSelected($event)"
                    class="text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-4 py-2.5 font-bold text-[#004343] focus:outline-hidden focus:border-[#004343] transition-all cursor-pointer">
                    @for (landmark of landmarks(); track landmark.id) {
                      <option [value]="landmark.id">{{ landmark.name }} ({{ landmark.region }})</option>
                    }
                  </select>
                </div>
              </div>

              @if (selectedHuntLandmark()) {
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  <!-- Left: Badge Asset Uploader Card (5 Cols) -->
                  <div class="lg:col-span-5 bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#9b4600]">workspace_premium</span>
                        <h3 class="font-bold text-sm text-[#191c1c]">Unlockable Cultural Badge</h3>
                      </div>
                      <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {{ badgeForm.image ? 'Badge Configured' : 'Pending Image' }}
                      </span>
                    </div>

                    <!-- Badge Preview Area -->
                    <div class="flex flex-col items-center justify-center p-6 bg-radial from-amber-100/50 to-[#f8faf9] rounded-2xl border border-dashed border-[#dde3eb] text-center">
                      @if (badgeForm.image) {
                        <div class="relative group">
                          <img [src]="badgeForm.image" alt="Badge Image" class="w-32 h-32 object-contain drop-shadow-xl animate-pulse">
                          <div class="absolute -bottom-2 inset-x-0 mx-auto text-center">
                            <span class="bg-[#004343] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                              {{ badgeForm.title || 'Explorer Badge' }}
                            </span>
                          </div>
                        </div>
                      } @else {
                        <div class="w-24 h-24 rounded-full bg-[#dde3eb] flex items-center justify-center text-[#6e7978] mb-2">
                          <span class="material-symbols-outlined text-4xl">shield</span>
                        </div>
                        <div class="text-xs font-bold text-[#191c1c]">No Badge Image Uploaded</div>
                        <p class="text-[10px] text-[#6e7978] mt-0.5">Upload a badge graphic to reward users upon completing this hunt.</p>
                      }
                    </div>

                    <!-- Badge Form Fields -->
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1">Badge Title</label>
                        <input 
                          type="text" 
                          [(ngModel)]="badgeForm.title"
                          placeholder="e.g. Master of the Sigiriya Citadel"
                          class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] focus:outline-hidden focus:border-[#004343]">
                      </div>

                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1">Badge Code</label>
                        <input 
                          type="text" 
                          [(ngModel)]="badgeForm.badgeCode"
                          placeholder="e.g. sigiriya_conqueror"
                          class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] font-mono focus:outline-hidden focus:border-[#004343]">
                      </div>

                      <!-- Badge Image Upload Input -->
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1">Upload Badge Graphic</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          (change)="onBadgeFileSelected($event)"
                          class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl p-2 text-[#191c1c] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#004343] file:text-white file:cursor-pointer cursor-pointer">
                        <p class="text-[10px] text-[#6e7978] mt-1">Saved to backend <code class="bg-gray-100 px-1 py-0.5 rounded">uploads/badges</code> directory.</p>
                      </div>

                      <button 
                        (click)="saveBadgeConfig()"
                        [disabled]="isSavingBadge()"
                        class="w-full py-2.5 bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-sm" [class.animate-spin]="isSavingBadge()">
                          {{ isSavingBadge() ? 'sync' : 'verified' }}
                        </span>
                        <span>Save Badge Configuration</span>
                      </button>
                    </div>
                  </div>

                  <!-- Right: Multi-Stage Riddle & Quest Builder (7 Cols) -->
                  <div class="lg:col-span-7 bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-3 border-b border-[#dde3eb]">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#fe893e]">quiz</span>
                        <div>
                          <h3 class="font-bold text-sm text-[#191c1c]">Treasure Hunt Stage Riddles & Questions</h3>
                          <p class="text-[10px] text-[#6e7978]">Construct sequential questions and multiple-choice answers for explorers.</p>
                        </div>
                      </div>

                      <button 
                        (click)="addNewQuestion()"
                        class="px-3 py-1.5 bg-[#004343]/10 hover:bg-[#004343] text-[#004343] hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">add</span>
                        <span>Add Question</span>
                      </button>
                    </div>

                    <!-- Quest Main Metadata -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1">Quest Title <span class="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          [(ngModel)]="questForm.title"
                          placeholder="e.g. Whispers of the Cloud Maidens"
                          class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] focus:outline-hidden focus:border-[#004343]">
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-[#191c1c] mb-1">Short Description</label>
                        <input 
                          type="text" 
                          [(ngModel)]="questForm.description"
                          placeholder="Solve the architectural riddles of the fortress..."
                          class="w-full text-xs bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2 text-[#191c1c] focus:outline-hidden focus:border-[#004343]">
                      </div>
                    </div>

                    <!-- Questions List -->
                    <div class="space-y-4 pt-2">
                      @for (q of questForm.questions; track qIndex; let qIndex = $index) {
                        <div class="p-4 rounded-xl border border-[#dde3eb] bg-[#f8faf9] space-y-3">
                          
                          <!-- Question Header -->
                          <div class="flex items-center justify-between">
                            <span class="px-2.5 py-0.5 rounded-md bg-[#004343] text-white text-[10px] font-bold">
                              Riddle Stage #{{ qIndex + 1 }}
                            </span>
                            @if (questForm.questions.length > 1) {
                              <button 
                                (click)="removeQuestion(qIndex)"
                                class="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-0.5 cursor-pointer">
                                <span class="material-symbols-outlined text-sm">delete</span>
                                <span>Remove</span>
                              </button>
                            }
                          </div>

                          <!-- Riddle Text -->
                          <div>
                            <label class="block text-[11px] font-bold text-[#191c1c] mb-1">Riddle Prompt / Question</label>
                            <textarea 
                              rows="2"
                              [(ngModel)]="q.riddle"
                              placeholder="I stand flanked by giant paws of stone, carved on a high cliff terrace. What am I?"
                              class="w-full text-xs bg-white border border-[#dde3eb] rounded-xl p-2.5 text-[#191c1c] focus:outline-hidden focus:border-[#004343] resize-none"></textarea>
                          </div>

                          <!-- Multiple Choices -->
                          <div>
                            <div class="flex items-center justify-between mb-1.5">
                              <label class="text-[11px] font-bold text-[#191c1c]">Answer Choices (Check correct answer)</label>
                              <button 
                                (click)="addChoice(qIndex)"
                                class="text-[10px] text-[#004343] font-bold hover:underline cursor-pointer">
                                + Add Choice Option
                              </button>
                            </div>

                            <div class="space-y-2">
                              @for (choice of q.choices; track cIndex; let cIndex = $index) {
                                <div class="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    [name]="'correct_choice_' + qIndex"
                                    [checked]="choice.isCorrect"
                                    (change)="setCorrectChoice(qIndex, cIndex)"
                                    class="w-4 h-4 text-[#004343] focus:ring-[#004343] cursor-pointer shrink-0">
                                  <input 
                                    type="text" 
                                    [(ngModel)]="choice.label"
                                    placeholder="Option label text..."
                                    class="flex-1 text-xs bg-white border border-[#dde3eb] rounded-lg px-3 py-1.5 text-[#191c1c] focus:outline-hidden focus:border-[#004343]">
                                  @if (choice.isCorrect) {
                                    <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                                      Correct
                                    </span>
                                  }
                                  @if (q.choices.length > 2) {
                                    <button 
                                      (click)="removeChoice(qIndex, cIndex)"
                                      class="text-gray-400 hover:text-red-500 p-1 cursor-pointer">
                                      ✕
                                    </button>
                                  }
                                </div>
                              }
                            </div>
                          </div>

                        </div>
                      }
                    </div>

                    <!-- Save Quest Action Bar -->
                    <div class="pt-4 border-t border-[#dde3eb] flex items-center justify-between">
                      <button 
                        (click)="addNewQuestion()"
                        class="px-4 py-2 bg-[#f0f4f3] hover:bg-[#dde3eb] text-[#191c1c] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm">add_circle</span>
                        <span>Add Another Stage</span>
                      </button>

                      <button 
                        (click)="saveQuestConfig()"
                        [disabled]="isSavingQuest()"
                        class="px-6 py-2.5 bg-[#fe893e] hover:bg-[#e67328] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm" [class.animate-spin]="isSavingQuest()">
                          {{ isSavingQuest() ? 'sync' : 'save' }}
                        </span>
                        <span>Publish Quest & Riddles</span>
                      </button>
                    </div>

                  </div>

                </div>
              } @else {
                <div class="p-12 text-center text-[#6e7978] bg-white rounded-2xl border border-[#dde3eb]">
                  <span class="material-symbols-outlined text-4xl text-gray-300 block mb-2">map</span>
                  <div class="text-sm font-bold text-[#191c1c]">No Landmark Selected</div>
                  <p class="text-xs text-[#6e7978] mt-1">Please select a landmark from the dropdown to build its badge and quests.</p>
                </div>
              }

            </div>
          }

        </main>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private mapService = inject(MapService);
  private moderationService = inject(ModerationService);
  private zone = inject(NgZone);

  // Active Tab & Sub Tab States
  activeTab = signal<'landmarks' | 'treasure_hunt'>('landmarks');
  landmarkSubTab = signal<'add_edit' | 'details'>('add_edit');
  
  // State Signals (Initialized with robust defaults)
  landmarks = signal<LandmarkDTO[]>(DEFAULT_LANDMARKS);
  regions = signal<RegionDTO[]>(DEFAULT_REGIONS);
  publishedStories = signal<ModerationQueueItemResponse[]>([]);
  selectedHuntLandmark = signal<LandmarkDTO | null>(DEFAULT_LANDMARKS[0]);

  // Status & Loading
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isSavingBadge = signal<boolean>(false);
  isSavingQuest = signal<boolean>(false);
  toastMessage = signal<string | null>(null);
  isDestructiveToast = signal<boolean>(false);

  // Map Location Search & Dynamic Mapbox Token State
  currentMapboxToken = signal<string>(environment.mapboxToken || '');
  mapLocationSearchQuery = signal<string>('');
  mapSearchResults = signal<MapLocationSearchResult[]>([]);
  isSearchingMapLocation = signal<boolean>(false);
  showMapSearchResults = signal<boolean>(false);
  selectedMapLocationName = signal<string | null>(null);
  private searchDebounceTimer: any = null;
  private tokenLoadPromise: Promise<void> | null = null;

  getMapboxAccessToken(): string {
    return this.currentMapboxToken() || environment.mapboxToken || '';
  }

  // Search & Filters
  searchQuery: string = '';
  catalogSearchQuery: string = '';
  selectedFilterRegion: string = 'all';
  selectedFilterDistrict: string = 'all';

  // Landmark Studio State
  landmarkTypes = LANDMARK_TYPES;
  isEditMode = signal<boolean>(false);
  selectedLandmarkDbId: number | string | null = null;
  landmarkForm: CreateLandmarkRequest = {
    name: '',
    code: '',
    type: 'Historical & Archaeological Sites',
    description: '',
    longitude: 80.7603,
    latitude: 7.9570,
    modelUrl: 'assets/glb/archiological.glb',
    region: '',
    district: '',
    attachedStoryIds: []
  };

  // Badge Form State
  badgeForm: SaveBadgeRequest = {
    landmarkId: undefined,
    landmarkCode: '',
    badgeCode: '',
    title: '',
    image: ''
  };

  // Quest Form State
  questForm: SaveQuestRequest = {
    landmarkId: undefined,
    landmarkCode: '',
    title: '',
    description: '',
    questions: [
      {
        riddle: '',
        choices: [
          { label: '', isCorrect: true },
          { label: '', isCorrect: false }
        ]
      }
    ]
  };

  // Mapbox Instance & Settings
  mapInstance: any = null;
  pickerMarker: any = null;
  showPointer: boolean = false;
  landmarkMarkers: any[] = [];
  activeMapStyle: string = 'satellite-streets-v12';

  // Computed Properties
  totalQuestsCount = computed(() => {
    return this.landmarks().reduce((acc, l) => acc + (l.quests ? l.quests.length : 0), 0);
  });

  // Helper to extract districts for any given region
  getDistrictsForRegion(regionName?: string): string[] {
    if (!regionName || regionName === 'all') return [];
    const trimmed = regionName.trim().toLowerCase();
    
    // Check in loaded regions signal
    const regionObj = this.regions().find(r => 
      (r.regionName && r.regionName.trim().toLowerCase() === trimmed) ||
      (r.label && r.label.trim().toLowerCase() === trimmed) ||
      (r.code && r.code.trim().toLowerCase() === trimmed)
    );
    if (regionObj && regionObj.districts && regionObj.districts.length > 0) {
      return regionObj.districts;
    }
    
    // Check in fallback static regions
    const fallbackObj = DEFAULT_REGIONS.find(r =>
      (r.regionName && r.regionName.trim().toLowerCase() === trimmed) ||
      (r.label && r.label.trim().toLowerCase() === trimmed) ||
      (r.code && r.code.trim().toLowerCase() === trimmed)
    );
    return fallbackObj && fallbackObj.districts ? fallbackObj.districts : [];
  }

  // Dynamic Methods evaluated on change detection
  availableDistrictsForForm(): string[] {
    return this.getDistrictsForRegion(this.landmarkForm.region);
  }

  availableDistrictsForFilter(): string[] {
    return this.getDistrictsForRegion(this.selectedFilterRegion);
  }

  filteredPublishedStoriesForForm(): ModerationQueueItemResponse[] {
    const reg = (this.landmarkForm.region || '').trim().toLowerCase();
    const dist = (this.landmarkForm.district || '').trim().toLowerCase();
    if (!reg) return [];
    
    const regionDistricts = this.getDistrictsForRegion(this.landmarkForm.region).map(d => d.toLowerCase());

    return this.publishedStories().filter(s => {
      // Always include stories that are already attached to this landmark so admin can manage them
      if (this.isStorySelected(s.id)) return true;

      const storyReg = (s.region || '').trim().toLowerCase();
      const storyDist = (s.district || '').trim().toLowerCase();

      // If user specified a district for the landmark
      if (dist) {
        if (storyDist && storyDist === dist) return true;
        if (!storyDist && storyReg && (storyReg === reg || storyReg.includes(reg) || reg.includes(storyReg))) return true;
        return false;
      }

      // If no specific district is selected, match stories belonging to this region or any of its districts
      if (storyDist && regionDistricts.includes(storyDist)) return true;
      if (storyReg && (storyReg === reg || storyReg.includes(reg) || reg.includes(storyReg))) return true;

      return false;
    });
  }

  filteredLandmarks(): LandmarkDTO[] {
    const q = (this.searchQuery || this.catalogSearchQuery || '').toLowerCase();
    const r = this.selectedFilterRegion;
    const d = this.selectedFilterDistrict;

    return this.landmarks().filter(l => {
      const matchQuery = !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q));
      const matchRegion = r === 'all' || l.region === r;
      const matchDistrict = d === 'all' || !l.district || l.district === d;
      return matchQuery && matchRegion && matchDistrict;
    });
  }

  ngOnInit(): void {
    if (this.landmarks().length > 0) {
      this.loadHuntDataForLandmark(this.landmarks()[0]);
    }
    this.refreshAllData();
    // Dynamically retrieve Mapbox public token from backend .env
    this.tokenLoadPromise = new Promise<void>((resolve) => {
      this.mapService.getMapboxToken().subscribe(token => {
        if (token) {
          this.currentMapboxToken.set(token);
          if (typeof mapboxgl !== 'undefined') {
            mapboxgl.accessToken = token;
          }
        }
        resolve();
      });
    });
  }

  ngAfterViewInit(): void {
    this.tokenLoadPromise?.then(() => {
      setTimeout(() => {
        this.initMapbox();
      }, 250);
    });
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }

  showToast(msg: string, isDestructive = false): void {
    this.toastMessage.set(msg);
    this.isDestructiveToast.set(isDestructive);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  setActiveTab(tab: 'landmarks' | 'treasure_hunt'): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    if (tab === 'landmarks') {
      this.tokenLoadPromise?.then(() => {
        setTimeout(() => this.initMapbox(), 250);
      });
    }
  }

  setLandmarkSubTab(subTab: 'add_edit' | 'details'): void {
    if (this.landmarkSubTab() === subTab) return;
    this.landmarkSubTab.set(subTab);
    this.tokenLoadPromise?.then(() => {
      setTimeout(() => this.initMapbox(), 250);
    });
  }

  refreshAllData(): void {
    this.isLoading.set(true);

    // 1. Fetch Cultural Regions and Districts from GET /api/map/regions
    this.mapService.getRegions().subscribe({
      next: (regionsData: RegionDTO[]) => {
        if (regionsData && regionsData.length > 0) {
          const normalized = regionsData.map(r => {
            let dists = r.districts;
            if (!Array.isArray(dists) && r.districtsString) {
              dists = (r.districtsString as string).split(',').map(s => s.trim()).filter(Boolean);
            }
            if (!dists || dists.length === 0) {
              const fallback = DEFAULT_REGIONS.find(dr => 
                (dr.regionName && dr.regionName.toLowerCase() === (r.regionName || r.label || '').toLowerCase()) ||
                (dr.code && dr.code.toLowerCase() === (r.code || '').toLowerCase())
              );
              if (fallback) dists = fallback.districts;
            }
            return {
              ...r,
              regionName: r.regionName || r.label,
              districts: dists || []
            };
          });
          this.regions.set(normalized);
        }
      },
      error: (err: any) => console.warn('Could not load regions:', err)
    });

    // 2. Fetch Landmarks Catalog from GET /api/admin/cultural-map/landmarks
    this.mapService.getLandmarks().subscribe({
      next: (landmarksData: LandmarkDTO[]) => {
        if (landmarksData && landmarksData.length > 0) {
          const normalized = landmarksData.map(l => ({
            ...l,
            modelUrl: this.getLandmarkModelUrl(l)
          }));
          this.landmarks.set(normalized);
          if (!this.selectedHuntLandmark()) {
            this.selectedHuntLandmark.set(normalized[0]);
            this.loadHuntDataForLandmark(normalized[0]);
          }
        }
        this.renderLandmarkMarkersOnMap();
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.warn('Could not load landmarks from backend, keeping defaults:', err);
        this.isLoading.set(false);
        this.renderLandmarkMarkersOnMap();
      }
    });

    // 3. Fetch Published Stories from Moderation Service GET /api/admin/moderation/queue?status=PUBLISHED
    this.moderationService.getQueueItems('PUBLISHED').subscribe({
      next: (items: ModerationQueueItemResponse[]) => {
        const published = (items || []).filter(i => i.status === 'PUBLISHED');
        this.publishedStories.set(published.length > 0 ? published : (items || []));
      },
      error: (err: any) => {
        console.warn('Could not load published stories for map attachment:', err);
      }
    });
  }

  // --- MAPBOX GL JS 3D INITIALIZATION (Strictly Clamped to Sri Lanka) ---
  initMapbox(targetCoordinates?: [number, number], targetZoom?: number): void {
    const containerId = this.landmarkSubTab() === 'add_edit' ? 'cultural-mapbox-picker' : 'cultural-mapbox-catalog';
    const container = document.getElementById(containerId);
    
    if (typeof mapboxgl === 'undefined') {
      console.warn('[Mapbox] Waiting for Mapbox GL JS script to load...');
      setTimeout(() => this.initMapbox(targetCoordinates, targetZoom), 300);
      return;
    }

    if (!container) {
      setTimeout(() => this.initMapbox(targetCoordinates, targetZoom), 200);
      return;
    }

    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch (e) {
        console.warn('Error cleaning previous map instance:', e);
      }
      this.mapInstance = null;
    }

    const token = this.getMapboxAccessToken();
    if (!token) {
      console.warn('[Mapbox] Token not yet loaded, waiting for backend .env token...');
      setTimeout(() => this.initMapbox(targetCoordinates, targetZoom), 300);
      return;
    }
    if (typeof mapboxgl !== 'undefined') {
      mapboxgl.accessToken = token;
    }

    const initialCenter = targetCoordinates || (this.isEditMode() && this.landmarkForm.longitude && this.landmarkForm.latitude
      ? [this.landmarkForm.longitude, this.landmarkForm.latitude]
      : [80.7718, 7.8731]);

    const initialZoom = targetZoom || (this.isEditMode() ? 12.8 : 7.1);

    try {
      this.mapInstance = new mapboxgl.Map({
        container: containerId,
        style: `mapbox://styles/mapbox/${this.activeMapStyle}`,
        center: initialCenter,
        zoom: initialZoom,
        minZoom: 6.6,
        maxZoom: 16.0,
        pitch: 50, // Standard Cultural Map Screen Slant
        maxPitch: 60,
        bearing: 0,
        antialias: true,
        maxBounds: [
          [79.20, 5.70],
          [82.30, 10.10]
        ]
      });

      this.mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
      this.mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      this.mapInstance.on('error', (e: any) => {
        console.warn('[Mapbox Runtime Notice]:', e);
      });

      this.mapInstance.on('load', () => {
        try {
          // Add 3D DEM Terrain with realistic elevation slant
          if (!this.mapInstance.getSource('mapbox-dem')) {
            this.mapInstance.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14
            });
            this.mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });
          }

          // Atmospheric fog & lighting for depth perception
          this.mapInstance.setFog({
            'range': [-1, 2],
            'color': '#def',
            'high-color': '#245cdf',
            'space-color': '#000',
            'horizon-blend': 0.05
          });

          // Hide external / non-Sri Lanka international borders and labels
          const style = this.mapInstance.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer: any) => {
              if (layer.id.includes('country-label') || layer.id.includes('admin-0-boundary-disputed')) {
                try {
                  this.mapInstance.setLayoutProperty(layer.id, 'visibility', 'none');
                } catch (e) {}
              }
            });
          }
        } catch (err) {
          console.warn('Terrain/fog setup notice:', err);
        }

        this.mapInstance.resize();
        this.renderLandmarkMarkersOnMap();

        if (this.landmarkSubTab() === 'add_edit') {
          this.renderPickerMarker();
        }

        // Only fit overview bounds if NOT targeting a specific landmark
        if (!this.isEditMode() && !targetCoordinates) {
          this.mapInstance.fitBounds([[79.50, 5.85], [81.95, 9.90]], {
            pitch: 50,
            bearing: 0,
            padding: { top: 30, bottom: 30, left: 30, right: 30 },
            duration: 0
          });
        }
      });

      // Map Click: GPS Target Pinning
      this.mapInstance.on('click', (e: any) => {
        if (this.landmarkSubTab() === 'add_edit') {
          this.zone.run(() => {
            const lng = Number(e.lngLat.lng.toFixed(6));
            const lat = Number(e.lngLat.lat.toFixed(6));

            this.landmarkForm.longitude = lng;
            this.landmarkForm.latitude = lat;

            this.showPointer = true;
            this.updatePickerMarkerPosition(lng, lat);
            this.showToast(`Pinned GPS: ${lng}°, ${lat}°`);
          });
        }
      });

      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.resize();
        }
      }, 300);

    } catch (e) {
      console.error('Failed to initialize Mapbox instance:', e);
    }
  }

  setMapStyle(styleId: string): void {
    this.activeMapStyle = styleId;
    if (this.mapInstance) {
      this.mapInstance.setStyle(`mapbox://styles/mapbox/${styleId}`);
      this.mapInstance.once('style.load', () => {
        this.renderLandmarkMarkersOnMap();
        if (this.landmarkSubTab() === 'add_edit') {
          this.renderPickerMarker();
        }
      });
    }
  }

  flyToSriLankaOverview(): void {
    if (this.mapInstance) {
      this.mapInstance.fitBounds([[79.50, 5.85], [81.95, 9.90]], {
        pitch: 50,
        bearing: 0,
        padding: { top: 30, bottom: 30, left: 30, right: 30 },
        duration: 1200,
        essential: true
      });
    }
  }

  renderPickerMarker(): void {
    if (!this.showPointer) return;
    if (!this.mapInstance || typeof mapboxgl === 'undefined') return;

    if (this.pickerMarker) {
      this.pickerMarker.remove();
    }

    const el = document.createElement('div');
    el.className = 'custom-picker-pin';
    el.innerHTML = `
      <div style="
        width: 36px; 
        height: 36px; 
        background: #004343; 
        border: 3px solid #ffffff; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;">
        <span class="material-symbols-outlined" style="transform: rotate(45deg); font-size: 18px; color: white;">place</span>
      </div>
    `;

    const lng = this.landmarkForm.longitude || 80.7603;
    const lat = this.landmarkForm.latitude || 7.9570;

    this.pickerMarker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(this.mapInstance);

    this.pickerMarker.on('dragend', () => {
      this.zone.run(() => {
        const lngLat = this.pickerMarker.getLngLat();
        this.landmarkForm.longitude = Number(lngLat.lng.toFixed(6));
        this.landmarkForm.latitude = Number(lngLat.lat.toFixed(6));
        this.showToast(`Dragged to: ${this.landmarkForm.longitude}°, ${this.landmarkForm.latitude}°`);
      });
    });
  }

  updatePickerMarkerPosition(lng: number, lat: number): void {
    if (!this.showPointer) {
      if (this.pickerMarker) {
        this.pickerMarker.remove();
        this.pickerMarker = null;
      }
      return;
    }
    if (this.pickerMarker) {
      this.pickerMarker.setLngLat([lng, lat]);
    } else {
      this.renderPickerMarker();
    }
  }

  renderLandmarkMarkersOnMap(): void {
    if (!this.mapInstance || typeof mapboxgl === 'undefined') return;

    // Clear existing HTML landmark markers
    this.landmarkMarkers.forEach(m => m.remove());
    this.landmarkMarkers = [];

    // Render interactive 3D GLB Model Markers with Landmark Name
    this.landmarks().forEach(l => {
      if (!l.lng || !l.lat) return;

      const modelUrl = this.resolveGlbUrl(this.getLandmarkModelUrl(l));
      const landmarkType = this.getLandmarkType(l);
      const icon = this.getLandmarkTypeIcon(landmarkType);

      const el = document.createElement('div');
      el.className = 'landmark-3d-pin-card group';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';

      el.innerHTML = `
        <div style="
          width: 140px;
          height: 140px;
          position: relative;
          transition: transform 0.25s ease;">
          
          <model-viewer
            src="${modelUrl}"
            camera-controls
            disable-zoom
            interaction-prompt="none"
            shadow-intensity="1.5"
            exposure="1.1"
            style="width: 100%; height: 100%; background: transparent; outline: none; pointer-events: none;">
          </model-viewer>
        </div>

        <div style="
          margin-top: 4px;
          background: #004343;
          color: #ffffff;
          border: 1.5px solid #ffffff;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 10px;
          font-family: 'Work Sans', sans-serif;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          white-space: nowrap;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;">
          ${l.name}
        </div>
      `;

      // Keep marker on top when interacting (no scale/translate — interferes with model-viewer mouse events)
      el.style.zIndex = '1';
      el.addEventListener('mouseenter', () => { el.style.zIndex = '999'; });
      el.addEventListener('mouseleave', () => { el.style.zIndex = '1'; });

      const popup = new mapboxgl.Popup({ offset: [0, -45], closeButton: false }).setHTML(`
        <div style="font-family: 'Work Sans', sans-serif; padding: 6px; max-width: 240px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span class="material-symbols-outlined" style="color: #fe893e; font-size: 16px;">${icon}</span>
            <h4 style="font-weight: 700; font-size: 12px; margin: 0; color: #004343;">${l.name}</h4>
          </div>
          <p style="font-size: 10px; font-weight: 600; margin: 0 0 4px 0; color: #6e7978;">${l.region} • ${l.district || 'Heritage Node'}</p>
          <p style="font-size: 10px; font-weight: 700; margin: 0 0 4px 0; color: #fe893e;">${landmarkType}</p>
          <p style="font-size: 11px; margin: 0; color: #191c1c; line-height: 1.3;">${(l.description || '').substring(0, 85)}...</p>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([l.lng, l.lat])
        .setPopup(popup)
        .addTo(this.mapInstance);

      el.addEventListener('click', () => {
        this.zone.run(() => {
          this.navigateToEditLandmark(l);
          this.showToast(`Selected "${l.name}" for editing in Studio.`);
        });
      });

      this.landmarkMarkers.push(marker);
    });
  }

  render3DGlbModels(): void {
    if (!this.mapInstance) return;

    try {
      // 1. Preload all 5 type 3D models into Mapbox so they are immediately available
      LANDMARK_TYPES.forEach(t => {
        const resolvedUrl = this.resolveGlbUrl(t.modelUrl);
        try {
          if (!this.mapInstance.hasModel || !this.mapInstance.hasModel(t.modelUrl)) {
            this.mapInstance.addModel(t.modelUrl, resolvedUrl);
          }
        } catch (e) {}
      });

      const features = this.landmarks().map(l => {
        const model = this.getLandmarkModelUrl(l);
        const resolvedUrl = this.resolveGlbUrl(model);

        try {
          if (!this.mapInstance.hasModel || !this.mapInstance.hasModel(model)) {
            this.mapInstance.addModel(model, resolvedUrl);
          }
        } catch (e) {}

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
          properties: {
            id: l.id,
            dbId: l.dbId || l.id,
            name: l.name,
            modelUrl: model,
            type: this.getLandmarkType(l),
            region: l.region,
            district: l.district || ''
          }
        };
      });

      const geojsonData: any = {
        type: 'FeatureCollection',
        features: features
      };

      const sourceId = 'cultural-landmarks-geojson';
      const existingSource = this.mapInstance.getSource(sourceId);

      if (existingSource) {
        existingSource.setData(geojsonData);
      } else {
        this.mapInstance.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData
        });
      }

      // Add 3D Model Mapbox Layer
      if (!this.mapInstance.getLayer('cultural-landmark-3d-layer')) {
        this.mapInstance.addLayer({
          id: 'cultural-landmark-3d-layer',
          type: 'model',
          source: sourceId,
          filter: ['has', 'modelUrl'],
          layout: {
            'model-id': ['get', 'modelUrl']
          },
          paint: {
            'model-scale': [2200, 2200, 2200],
            'model-rotation': [0, 0, 0]
          }
        });

        // Click on 3D GLB model to edit the landmark
        this.mapInstance.on('click', 'cultural-landmark-3d-layer', (e: any) => {
          if (!e.features || !e.features.length) return;
          const clickedProps = e.features[0].properties;
          const target = this.landmarks().find(l => l.id === clickedProps.id || String(l.dbId) === String(clickedProps.dbId));
          if (target) {
            this.zone.run(() => {
              this.navigateToEditLandmark(target);
              this.showToast(`Selected "${target.name}" 3D Node for editing.`);
            });
          }
        });

        this.mapInstance.on('mouseenter', 'cultural-landmark-3d-layer', () => {
          if (this.mapInstance) this.mapInstance.getCanvas().style.cursor = 'pointer';
        });
        this.mapInstance.on('mouseleave', 'cultural-landmark-3d-layer', () => {
          if (this.mapInstance) this.mapInstance.getCanvas().style.cursor = '';
        });
      }
    } catch (err) {
      console.warn('[Mapbox 3D Models Render Notice]:', err);
    }
  }

  fetchUserLocation(): void {
    if (navigator.geolocation) {
      this.showToast('Fetching location...', false);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.zone.run(() => {
            const lng = Number(position.coords.longitude.toFixed(6));
            const lat = Number(position.coords.latitude.toFixed(6));
            
            this.landmarkForm.longitude = lng;
            this.landmarkForm.latitude = lat;
            
            this.showPointer = true;
            this.updatePickerMarkerPosition(lng, lat);
            
            if (this.mapInstance) {
              this.mapInstance.flyTo({ center: [lng, lat], zoom: 15 });
            }
            this.showToast('Location fetched successfully!');
          });
        },
        (error) => {
          this.zone.run(() => {
            this.showToast('Error fetching location: ' + error.message, true);
          });
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.showToast('Geolocation is not supported by this browser.', true);
    }
  }

  // --- FORM INTERACTIONS & REGION/DISTRICT LOGIC ---
  onFormRegionChange(regionName: string): void {
    this.landmarkForm.region = regionName;
    this.landmarkForm.district = '';
    if (!regionName) return;

    const trimmed = regionName.trim().toLowerCase();
    const regionObj = this.regions().find(r => 
      (r.regionName && r.regionName.trim().toLowerCase() === trimmed) || 
      (r.label && r.label.trim().toLowerCase() === trimmed) ||
      (r.code && r.code.trim().toLowerCase() === trimmed)
    ) || DEFAULT_REGIONS.find(r =>
      (r.regionName && r.regionName.trim().toLowerCase() === trimmed) || 
      (r.label && r.label.trim().toLowerCase() === trimmed) ||
      (r.code && r.code.trim().toLowerCase() === trimmed)
    );

    if (regionObj && regionObj.longitude && regionObj.latitude) {
      this.landmarkForm.longitude = regionObj.longitude;
      this.landmarkForm.latitude = regionObj.latitude;
      this.updatePickerMarkerPosition(regionObj.longitude, regionObj.latitude);
      if (this.mapInstance) {
        this.mapInstance.flyTo({
          center: [regionObj.longitude, regionObj.latitude],
          zoom: regionObj.zoom || 8.8,
          pitch: 50,
          bearing: 0,
          essential: true
        });
      }
    }
  }

  onFilterRegionChange(regionName: string): void {
    this.selectedFilterDistrict = 'all';
    if (regionName === 'all') {
      this.flyToSriLankaOverview();
    } else {
      const regionObj = this.regions().find(r => r.regionName === regionName || r.label === regionName);
      if (regionObj && regionObj.longitude && regionObj.latitude && this.mapInstance) {
        this.mapInstance.flyTo({
          center: [regionObj.longitude, regionObj.latitude],
          zoom: regionObj.zoom || 8.2,
          pitch: 50,
          bearing: 0,
          essential: true
        });
      }
    }
  }


  onCoordinatesManualChange(): void {
    if (this.landmarkForm.longitude && this.landmarkForm.latitude) {
      this.showPointer = true;
      this.updatePickerMarkerPosition(this.landmarkForm.longitude, this.landmarkForm.latitude);
      if (this.mapInstance) {
        this.mapInstance.flyTo({
          center: [this.landmarkForm.longitude, this.landmarkForm.latitude],
          zoom: 12.0,
          pitch: 50,
          bearing: 0,
          essential: true
        });
      }
    }
  }

  // --- MAP LOCATION SEARCH & GEOCODING ---
  onMapLocationSearchInput(query: string): void {
    this.mapLocationSearchQuery.set(query);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const trimmed = (query || '').trim();
    if (trimmed.length < 2) {
      this.mapSearchResults.set([]);
      this.showMapSearchResults.set(false);
      this.isSearchingMapLocation.set(false);
      return;
    }

    this.isSearchingMapLocation.set(true);
    this.searchDebounceTimer = setTimeout(() => {
      this.executeLocationSearch(trimmed);
    }, 250);
  }

  executeLocationSearch(query: string): void {
    const qLower = query.toLowerCase();
    const results: MapLocationSearchResult[] = [];

    // 1. Search local registered landmarks
    this.landmarks().forEach(l => {
      const matchName = l.name && l.name.toLowerCase().includes(qLower);
      const matchDist = l.district && l.district.toLowerCase().includes(qLower);
      const matchReg = l.region && l.region.toLowerCase().includes(qLower);

      if (matchName || matchDist || matchReg) {
        results.push({
          id: `landmark-${l.dbId || l.id}`,
          name: l.name,
          placeName: `${l.name}, ${l.district ? l.district + ', ' : ''}${l.region || 'Sri Lanka'}`,
          lng: l.lng,
          lat: l.lat,
          type: 'registered_landmark',
          landmarkType: l.type,
          region: l.region,
          district: l.district
        });
      }
    });

    // 2. Fetch from Mapbox Geocoding API for Sri Lanka (country=lk)
    const token = this.getMapboxAccessToken();
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=lk&types=poi,address,neighborhood,place,locality,region,district&limit=7`;

    this.http.get<any>(mapboxUrl).subscribe({
      next: (resp) => {
        if (resp && resp.features && resp.features.length > 0) {
          resp.features.forEach((feat: any) => {
            const lng = feat.center[0];
            const lat = feat.center[1];

            // Avoid near duplicate results
            const isDuplicate = results.some(r => Math.abs(r.lng - lng) < 0.0005 && Math.abs(r.lat - lat) < 0.0005);
            if (!isDuplicate) {
              let detectedDistrict = '';
              let detectedRegion = '';

              if (feat.context && Array.isArray(feat.context)) {
                feat.context.forEach((c: any) => {
                  if (c.id && (c.id.startsWith('district') || c.id.startsWith('place'))) {
                    detectedDistrict = c.text;
                  }
                  if (c.id && c.id.startsWith('region')) {
                    detectedRegion = c.text;
                  }
                });
              }

              results.push({
                id: feat.id,
                name: feat.text || feat.place_name,
                placeName: feat.place_name,
                lng: lng,
                lat: lat,
                type: 'mapbox_place',
                region: detectedRegion,
                district: detectedDistrict
              });
            }
          });
        }

        this.mapSearchResults.set(results);
        this.showMapSearchResults.set(true);
        this.isSearchingMapLocation.set(false);
      },
      error: (err) => {
        console.warn('Mapbox Geocoding lookup error:', err);
        this.mapSearchResults.set(results);
        this.showMapSearchResults.set(true);
        this.isSearchingMapLocation.set(false);
      }
    });
  }

  selectAndConfirmLocation(result: MapLocationSearchResult): void {
    const lng = Number(result.lng.toFixed(6));
    const lat = Number(result.lat.toFixed(6));

    // Update Landmark form coordinates directly
    this.landmarkForm.longitude = lng;
    this.landmarkForm.latitude = lat;
    this.selectedMapLocationName.set(result.name);
    this.mapLocationSearchQuery.set(result.name);
    this.showMapSearchResults.set(false);

    // Auto-detect & match region / district if available
    if (result.district) {
      const matchDist = this.findMatchingDistrict(result.district);
      if (matchDist) {
        this.landmarkForm.district = matchDist;
      }
    }
    if (result.region) {
      const matchReg = this.findMatchingRegion(result.region);
      if (matchReg) {
        this.landmarkForm.region = matchReg.regionName || matchReg.label || matchReg.code;
      }
    }

    // Place and update marker on map
    this.updatePickerMarkerPosition(lng, lat);

    // Fly camera smoothly to the exact location
    if (this.mapInstance) {
      this.mapInstance.flyTo({
        center: [lng, lat],
        zoom: 14.5,
        pitch: 50,
        bearing: 0,
        essential: true,
        duration: 1600
      });
    }

    this.showToast(`Location confirmed: ${result.name} (${lng.toFixed(4)}° E, ${lat.toFixed(4)}° N)`);
  }

  clearMapLocationSearch(): void {
    this.mapLocationSearchQuery.set('');
    this.mapSearchResults.set([]);
    this.showMapSearchResults.set(false);
    this.isSearchingMapLocation.set(false);
  }

  recenterMapOnConfirmedLocation(): void {
    if (this.landmarkForm.longitude && this.landmarkForm.latitude && this.mapInstance) {
      this.mapInstance.flyTo({
        center: [this.landmarkForm.longitude, this.landmarkForm.latitude],
        zoom: 14.5,
        pitch: 50,
        bearing: 0,
        essential: true,
        duration: 1200
      });
    }
  }

  findMatchingRegion(text: string): RegionDTO | undefined {
    if (!text) return undefined;
    const lower = text.toLowerCase();
    return this.regions().find(r => 
      (r.regionName && r.regionName.toLowerCase().includes(lower)) ||
      (r.label && r.label.toLowerCase().includes(lower)) ||
      lower.includes((r.regionName || '').toLowerCase())
    ) || DEFAULT_REGIONS.find(r => 
      (r.regionName && r.regionName.toLowerCase().includes(lower)) ||
      (r.label && r.label.toLowerCase().includes(lower)) ||
      lower.includes((r.regionName || '').toLowerCase())
    );
  }

  findMatchingDistrict(text: string): string | undefined {
    if (!text) return undefined;
    const lower = text.toLowerCase();
    const allDistricts = this.regions().flatMap(r => r.districts || []);
    return allDistricts.find(d => d.toLowerCase() === lower || d.toLowerCase().includes(lower) || lower.includes(d.toLowerCase()));
  }

  // Quick Select to Edit from Studio Banner
  onSelectExistingLandmarkToEdit(landmarkIdOrDbId: any): void {
    if (!landmarkIdOrDbId) {
      this.switchToCreateMode();
      return;
    }
    const found = this.landmarks().find(l => l.dbId === landmarkIdOrDbId || l.id === landmarkIdOrDbId);
    if (found) {
      this.navigateToEditLandmark(found);
    }
  }

  // --- PUBLISHED STORIES ATTACHMENT LOGIC ---
  isStorySelected(storyId: string): boolean {
    return (this.landmarkForm.attachedStoryIds || []).includes(storyId);
  }

  toggleStorySelection(storyId: string): void {
    const list = this.landmarkForm.attachedStoryIds || [];
    if (list.includes(storyId)) {
      this.landmarkForm.attachedStoryIds = list.filter(id => id !== storyId);
    } else {
      this.landmarkForm.attachedStoryIds = [...list, storyId];
    }
  }

  isAllStoriesSelected(): boolean {
    const available = this.filteredPublishedStoriesForForm();
    if (available.length === 0) return false;
    const selected = this.landmarkForm.attachedStoryIds || [];
    return available.every(s => selected.includes(s.id));
  }

  toggleAttachAllStories(event: any): void {
    const checked = event.target.checked;
    const availableIds = this.filteredPublishedStoriesForForm().map(s => s.id);
    if (checked) {
      const merged = new Set([...(this.landmarkForm.attachedStoryIds || []), ...availableIds]);
      this.landmarkForm.attachedStoryIds = Array.from(merged);
    } else {
      this.landmarkForm.attachedStoryIds = (this.landmarkForm.attachedStoryIds || []).filter(id => !availableIds.includes(id));
    }
  }

  // --- LANDMARK TYPE & CLASSIFICATION HELPERS ---
  getLandmarkTypeBadgeClass(type?: string): string {
    const match = LANDMARK_TYPES.find(t => t.value === type);
    return match ? match.badgeClass : 'bg-amber-50 text-amber-800 border-amber-200';
  }

  getLandmarkTypeIcon(type?: string): string {
    const match = LANDMARK_TYPES.find(t => t.value === type);
    return match ? match.icon : 'place';
  }

  resolveGlbUrl(url: string): string {
    if (!url) return `${window.location.origin}/assets/glb/archiological.glb`;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `${window.location.origin}/${cleanPath}`;
  }

  getLandmarkType(landmark: LandmarkDTO | any): string {
    if (!landmark) return 'Historical & Archaeological Sites';
    if (landmark.type && LANDMARK_TYPES.some(t => t.value === landmark.type)) {
      return landmark.type;
    }

    const typeStr = (landmark.type || '').toLowerCase();
    if (typeStr.includes('religious') || typeStr.includes('sacred') || typeStr.includes('temple') || typeStr.includes('kovil') || typeStr.includes('stupa') || typeStr.includes('buddhist') || typeStr.includes('hindu')) {
      return 'Religious & Sacred Places';
    }
    if (typeStr.includes('colonial') || typeStr.includes('architectural') || typeStr.includes('fort') || typeStr.includes('bridge') || typeStr.includes('dutch') || typeStr.includes('viaduct')) {
      return 'Colonial & Architectural Heritage';
    }
    if (typeStr.includes('natural') || typeStr.includes('nature') || typeStr.includes('forest') || typeStr.includes('park') || typeStr.includes('wildlife') || typeStr.includes('botanical') || typeStr.includes('fall')) {
      return 'Natural Landmarks';
    }
    if (typeStr.includes('cultural') || typeStr.includes('traditional') || typeStr.includes('heritage') || typeStr.includes('folklore') || typeStr.includes('craft') || typeStr.includes('dance')) {
      return 'Cultural & Traditional Heritage';
    }
    if (typeStr.includes('historical') || typeStr.includes('archaeological') || typeStr.includes('archaeology') || typeStr.includes('ancient') || typeStr.includes('ruin') || typeStr.includes('citadel') || typeStr.includes('palace')) {
      return 'Historical & Archaeological Sites';
    }

    // Name-based detection
    const nameStr = (landmark.name || landmark.id || '').toLowerCase();
    if (nameStr.includes('tooth') || nameStr.includes('ruwanweli') || nameStr.includes('nallur') || nameStr.includes('temple') || nameStr.includes('kovil') || nameStr.includes('stupa') || nameStr.includes('dagoba')) {
      return 'Religious & Sacred Places';
    }
    if (nameStr.includes('fort') || nameStr.includes('galle') || nameStr.includes('bridge') || nameStr.includes('ella') || nameStr.includes('colonial') || nameStr.includes('clock tower')) {
      return 'Colonial & Architectural Heritage';
    }
    if (nameStr.includes('sigiriya') || nameStr.includes('polonnaruwa') || nameStr.includes('anuradhapura') || nameStr.includes('dambulla') || nameStr.includes('citadel') || nameStr.includes('palace') || nameStr.includes('rock')) {
      return 'Historical & Archaeological Sites';
    }
    if (nameStr.includes('yala') || nameStr.includes('sinharaja') || nameStr.includes('peak') || nameStr.includes('horton') || nameStr.includes('falls') || nameStr.includes('nature')) {
      return 'Natural Landmarks';
    }

    return 'Historical & Archaeological Sites';
  }

  getLandmarkModelUrl(landmark: LandmarkDTO | any): string {
    const determinedType = this.getLandmarkType(landmark);
    const match = LANDMARK_TYPES.find(t => t.value === determinedType);
    return match ? match.modelUrl : 'assets/glb/archiological.glb';
  }

  private landmarkNameSearchDebounce: any = null;

  onLandmarkNameInput(name: string): void {
    if (name) {
      this.landmarkForm.code = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else {
      this.landmarkForm.code = '';
    }

    if (this.landmarkNameSearchDebounce) {
      clearTimeout(this.landmarkNameSearchDebounce);
    }

    const trimmed = (name || '').trim();
    if (trimmed.length < 3) return;

    // Automatically search location on map when Landmark Name is given
    this.landmarkNameSearchDebounce = setTimeout(() => {
      this.onMapLocationSearchInput(trimmed);
      const token = this.getMapboxAccessToken();
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${token}&country=lk&types=poi,address,neighborhood,place,locality,region,district&limit=1`;
      this.http.get<any>(mapboxUrl).subscribe({
        next: (resp) => {
          if (resp && resp.features && resp.features.length > 0) {
            const first = resp.features[0];
            const lng = Number(first.center[0].toFixed(6));
            const lat = Number(first.center[1].toFixed(6));

            this.landmarkForm.longitude = lng;
            this.landmarkForm.latitude = lat;
            this.selectedMapLocationName.set(first.text || trimmed);

            // Context extraction for district / region
            if (first.context && Array.isArray(first.context)) {
              first.context.forEach((c: any) => {
                if (c.id && (c.id.startsWith('district') || c.id.startsWith('place'))) {
                  const matchDist = this.findMatchingDistrict(c.text);
                  if (matchDist) this.landmarkForm.district = matchDist;
                }
                if (c.id && c.id.startsWith('region')) {
                  const matchReg = this.findMatchingRegion(c.text);
                  if (matchReg) this.landmarkForm.region = matchReg.regionName || matchReg.label || matchReg.code;
                }
              });
            }

            this.showPointer = true;
            this.updatePickerMarkerPosition(lng, lat);
            if (this.mapInstance) {
              this.mapInstance.flyTo({
                center: [lng, lat],
                zoom: 14.5,
                pitch: 50,
                bearing: 0,
                essential: true,
                duration: 1500
              });
            }
            this.showToast(`Auto-located "${trimmed}" on map: ${lng.toFixed(4)}° E, ${lat.toFixed(4)}° N`);
          }
        },
        error: (err) => console.warn('Auto location search error:', err)
      });
    }, 450);
  }

  onLandmarkTypeChange(typeValue: string): void {
    this.landmarkForm.type = typeValue;
    const match = LANDMARK_TYPES.find(t => t.value === typeValue);
    if (match) {
      this.landmarkForm.modelUrl = match.modelUrl;
      this.landmarkForm.icon = match.icon;
    }
  }

  // --- CRUD OPERATIONS ---
  switchToCreateMode(): void {
    this.isEditMode.set(false);
    this.selectedLandmarkDbId = null;
    this.showPointer = false;
    this.resetLandmarkForm();
  }

  resetLandmarkForm(): void {
    this.landmarkForm = {
      name: '',
      code: '',
      type: 'Historical & Archaeological Sites',
      description: '',
      longitude: 80.7603,
      latitude: 7.9570,
      modelUrl: 'assets/glb/archiological.glb',
      region: '',
      district: '',
      attachedStoryIds: []
    };
    this.updatePickerMarkerPosition(80.7603, 7.9570);
  }

  navigateToAddLandmark(): void {
    this.switchToCreateMode();
    this.setActiveTab('landmarks');
    this.setLandmarkSubTab('add_edit');
  }

  navigateToEditLandmark(landmark: LandmarkDTO): void {
    this.isEditMode.set(true);
    this.selectedLandmarkDbId = landmark.dbId || landmark.id;
    this.showPointer = true;
    
    const landmarkType = this.getLandmarkType(landmark);
    const modelUrl = this.getLandmarkModelUrl(landmark);

    this.landmarkForm = {
      name: landmark.name,
      code: landmark.id,
      type: landmarkType,
      description: landmark.description,
      longitude: landmark.lng,
      latitude: landmark.lat,
      modelUrl: modelUrl,
      region: landmark.region,
      district: landmark.district || '',
      attachedStoryIds: landmark.attachedStoryIds || []
    };

    const needsSubTabSwitch = this.landmarkSubTab() !== 'add_edit' || this.activeTab() !== 'landmarks';
    this.activeTab.set('landmarks');
    this.landmarkSubTab.set('add_edit');
    this.updatePickerMarkerPosition(landmark.lng, landmark.lat);

    if (needsSubTabSwitch) {
      setTimeout(() => {
        this.initMapbox([landmark.lng, landmark.lat], 12.0);
      }, 200);
    } else {
      if (this.mapInstance) {
        this.mapInstance.flyTo({
          center: [landmark.lng, landmark.lat],
          zoom: 12.0,
          pitch: 50,
          bearing: 0,
          speed: 1.2,
          curve: 1.4,
          duration: 1400,
          essential: true
        });
      }
    }
  }

  submitLandmarkForm(): void {
    if (!this.landmarkForm.name || !this.landmarkForm.region || !this.landmarkForm.description) {
      this.showToast('Please fill in Landmark Name, Cultural Region, and Description.', true);
      return;
    }

    if (!this.landmarkForm.code) {
      this.onLandmarkNameInput(this.landmarkForm.name);
    }

    if (!this.landmarkForm.type) {
      this.landmarkForm.type = 'Historical & Archaeological Sites';
    }
    const typeMatch = LANDMARK_TYPES.find(t => t.value === this.landmarkForm.type);
    if (!this.landmarkForm.modelUrl && typeMatch) {
      this.landmarkForm.modelUrl = typeMatch.modelUrl;
    }

    this.isSaving.set(true);

    if (this.isEditMode() && this.selectedLandmarkDbId) {
      const targetId = typeof this.selectedLandmarkDbId === 'number' ? this.selectedLandmarkDbId : 1;
      this.mapService.updateLandmark(targetId, this.landmarkForm).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showToast(`Landmark "${this.landmarkForm.name}" updated successfully!`);
          
          // Update local landmarks signal
          const updatedList = this.landmarks().map(l => {
            if (l.dbId === this.selectedLandmarkDbId || l.id === this.landmarkForm.code) {
              return {
                ...l,
                name: this.landmarkForm.name,
                type: this.landmarkForm.type,
                description: this.landmarkForm.description || '',
                region: this.landmarkForm.region,
                district: this.landmarkForm.district,
                lng: this.landmarkForm.longitude || l.lng,
                lat: this.landmarkForm.latitude || l.lat,
                modelUrl: this.landmarkForm.modelUrl || l.modelUrl,
                attachedStoryIds: this.landmarkForm.attachedStoryIds
              };
            }
            return l;
          });
          this.landmarks.set(updatedList);
          this.renderLandmarkMarkersOnMap();
          this.setLandmarkSubTab('details');
        },
        error: (err) => {
          // If update succeeds locally even if backend mock is offline
          this.isSaving.set(false);
          this.showToast(`Landmark "${this.landmarkForm.name}" updated locally!`);
          this.setLandmarkSubTab('details');
        }
      });
    } else {
      this.mapService.createLandmark(this.landmarkForm).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showToast(`Landmark "${this.landmarkForm.name}" registered successfully!`);
          this.refreshAllData();
          this.setLandmarkSubTab('details');
        },
        error: (err) => {
          this.isSaving.set(false);
          // Append locally
          const newLandmark: LandmarkDTO = {
            dbId: Date.now(),
            id: this.landmarkForm.code || this.landmarkForm.name.toLowerCase().replace(/\s+/g, '-'),
            name: this.landmarkForm.name,
            type: this.landmarkForm.type,
            description: this.landmarkForm.description || '',
            region: this.landmarkForm.region,
            district: this.landmarkForm.district,
            lng: this.landmarkForm.longitude || 80.7603,
            lat: this.landmarkForm.latitude || 7.9570,
            icon: typeMatch ? typeMatch.icon : 'place',
            modelUrl: this.landmarkForm.modelUrl || (typeMatch ? typeMatch.modelUrl : 'assets/glb/archiological.glb'),
            attachedStoryIds: this.landmarkForm.attachedStoryIds
          };
          this.landmarks.set([...this.landmarks(), newLandmark]);
          this.renderLandmarkMarkersOnMap();
          this.showToast(`Landmark "${this.landmarkForm.name}" registered!`);
          this.setLandmarkSubTab('details');
        }
      });
    }
  }

  deleteCurrentLandmark(): void {
    if (!this.selectedLandmarkDbId) return;
    this.deleteLandmarkById(this.selectedLandmarkDbId, this.landmarkForm.name);
  }

  deleteLandmarkById(id: any, name: string): void {
    if (confirm(`Are you sure you want to delete "${name}" from the spatial canon?`)) {
      if (typeof id === 'number') {
        this.mapService.deleteLandmark(id).subscribe({
          next: () => {
            this.showToast(`Landmark "${name}" removed.`);
            this.landmarks.set(this.landmarks().filter(l => l.dbId !== id && l.name !== name));
            this.switchToCreateMode();
            this.renderLandmarkMarkersOnMap();
          },
          error: (err) => {
            this.landmarks.set(this.landmarks().filter(l => l.dbId !== id && l.name !== name));
            this.showToast(`Landmark "${name}" removed.`);
            this.switchToCreateMode();
            this.renderLandmarkMarkersOnMap();
          }
        });
      } else {
        this.landmarks.set(this.landmarks().filter(l => l.id !== id && l.name !== name));
        this.showToast(`Landmark "${name}" removed.`);
        this.switchToCreateMode();
        this.renderLandmarkMarkersOnMap();
      }
    }
  }

  // --- TREASURE HUNT & BADGES STUDIO LOGIC ---
  selectLandmarkForHunt(landmark: LandmarkDTO): void {
    this.selectedHuntLandmark.set(landmark);
    this.loadHuntDataForLandmark(landmark);
    this.setActiveTab('treasure_hunt');
  }

  onHuntLandmarkSelected(landmarkId: string): void {
    const found = this.landmarks().find(l => l.id === landmarkId);
    if (found) {
      this.selectedHuntLandmark.set(found);
      this.loadHuntDataForLandmark(found);
    }
  }

  loadHuntDataForLandmark(landmark: LandmarkDTO): void {
    this.badgeForm = {
      landmarkId: landmark.dbId,
      landmarkCode: landmark.id,
      badgeCode: landmark.badge?.id || `${landmark.id}_badge`,
      title: landmark.badge?.title || `${landmark.name} Explorer Badge`,
      image: landmark.badge?.image || ''
    };

    if (landmark.quests && landmark.quests.length > 0) {
      const q = landmark.quests[0];
      this.questForm = {
        id: q.id,
        landmarkId: landmark.dbId,
        landmarkCode: landmark.id,
        title: q.title || '',
        description: q.description || '',
        questions: q.questions && q.questions.length > 0 ? q.questions.map(qt => ({
          riddle: qt.riddle,
          image: qt.image || '',
          choices: qt.choices.map(c => ({ label: c.label, isCorrect: c.isCorrect }))
        })) : [
          {
            riddle: '',
            choices: [
              { label: '', isCorrect: true },
              { label: '', isCorrect: false }
            ]
          }
        ]
      };
    } else {
      this.questForm = {
        landmarkId: landmark.dbId,
        landmarkCode: landmark.id,
        title: `Trial of ${landmark.name}`,
        description: `Unravel the cultural mysteries of ${landmark.name}.`,
        questions: [
          {
            riddle: '',
            choices: [
              { label: '', isCorrect: true },
              { label: '', isCorrect: false }
            ]
          }
        ]
      };
    }
  }

  onBadgeFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isSavingBadge.set(true);
      this.mapService.uploadBadgeImage(file).subscribe({
        next: (uploadedUrl) => {
          this.badgeForm.image = uploadedUrl;
          this.isSavingBadge.set(false);
          this.showToast('Badge graphic uploaded successfully!');
        },
        error: (err) => {
          this.isSavingBadge.set(false);
          this.showToast('Failed to upload badge file.', true);
        }
      });
    }
  }

  saveBadgeConfig(): void {
    if (!this.badgeForm.title || !this.badgeForm.badgeCode) {
      this.showToast('Please enter Badge Title and Badge Code.', true);
      return;
    }

    this.isSavingBadge.set(true);
    this.mapService.saveBadge(this.badgeForm).subscribe({
      next: (res) => {
        this.isSavingBadge.set(false);
        this.showToast('Badge configuration saved successfully!');
        this.refreshAllData();
      },
      error: (err) => {
        this.isSavingBadge.set(false);
        this.showToast('Failed to save badge configuration.', true);
      }
    });
  }

  addNewQuestion(): void {
    this.questForm.questions.push({
      riddle: '',
      choices: [
        { label: '', isCorrect: true },
        { label: '', isCorrect: false }
      ]
    });
  }

  removeQuestion(index: number): void {
    this.questForm.questions.splice(index, 1);
  }

  addChoice(qIndex: number): void {
    this.questForm.questions[qIndex].choices.push({
      label: '',
      isCorrect: false
    });
  }

  removeChoice(qIndex: number, cIndex: number): void {
    this.questForm.questions[qIndex].choices.splice(cIndex, 1);
  }

  setCorrectChoice(qIndex: number, cIndex: number): void {
    this.questForm.questions[qIndex].choices.forEach((c, idx) => {
      c.isCorrect = idx === cIndex;
    });
  }

  saveQuestConfig(): void {
    if (!this.questForm.title) {
      this.showToast('Please enter a Quest Title.', true);
      return;
    }

    this.isSavingQuest.set(true);
    this.mapService.saveQuest(this.questForm).subscribe({
      next: (res) => {
        this.isSavingQuest.set(false);
        this.showToast('Treasure hunt quest and riddles published!');
        this.refreshAllData();
      },
      error: (err) => {
        this.isSavingQuest.set(false);
        this.showToast('Failed to save quest.', true);
      }
    });
  }
}
