import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';
import { AuthService } from '../../app/core/services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface WordEntry {
  id?: number;
  language: string;
  word: string;
  transliteration: string;
  definition: string;
  partOfSpeech: string;
  audioFilename: string;
  activeDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = 'http://localhost:8081/api/admin/word-of-the-day';

@Component({
  selector: 'app-word-of-the-day',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-['Work_Sans',sans-serif] overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">

      <!-- Toast -->
      @if (toastMessage()) {
        <div
          [class]="isErrorToast() ? 'bg-[#ba1a1a]' : 'bg-[#004343]'"
          class="fixed top-5 right-6 z-50 flex items-center gap-3 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-white/20 animate-bounce transition-all duration-300">
          <span class="material-symbols-outlined text-xl">{{ isErrorToast() ? 'error' : 'auto_stories' }}</span>
          <div class="text-xs font-semibold max-w-xs">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs cursor-pointer">✕</button>
        </div>
      }

      <!-- Export PDF Modal -->
      @if (showExportPdfModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#191c1c]/40 backdrop-blur-sm">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#dde3eb] animate-in fade-in zoom-in duration-200">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-[#f2f4f3] flex items-center justify-between bg-[#f8faf9]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <span class="material-symbols-outlined">picture_as_pdf</span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-[#191c1c]">Export Report</h3>
                  <p class="text-xs text-[#6e7978]">Download words list as PDF</p>
                </div>
              </div>
              <button (click)="showExportPdfModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c] transition-colors cursor-pointer">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-5">
              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1.5">From Date</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978] text-base pointer-events-none">event</span>
                  <input type="date" [(ngModel)]="exportDateFrom"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-[#191c1c] mb-1.5">To Date</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978] text-base pointer-events-none">event</span>
                  <input type="date" [(ngModel)]="exportDateTo"
                    class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                </div>
              </div>

              <div class="p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-2">
                <span class="material-symbols-outlined text-blue-600 text-base shrink-0">info</span>
                <p class="text-xs text-blue-800 leading-relaxed">
                  The PDF will include the <strong>{{ activeListTab() }}</strong> words currently visible in the table. Leave dates empty to export all dates.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-[#f8faf9] border-t border-[#f2f4f3] flex items-center justify-end gap-3">
              <button (click)="showExportPdfModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-bold text-[#6e7978] hover:text-[#191c1c] hover:bg-[#f2f4f3] transition-colors cursor-pointer">
                Cancel
              </button>
              <button (click)="downloadPdf()"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-[#004343] text-white hover:bg-[#003333] shadow-sm flex items-center gap-2 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-sm">download</span>
                Generate PDF
              </button>
            </div>
          </div>
        </div>
      }

      <app-sidebar></app-sidebar>

      <main class="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

        <app-header pageTitle="Word of the Day Studio" section="Console" [showSearch]="false"></app-header>

        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Page Title & Actions -->
          <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
            <div class="space-y-1">
              <h1 class="font-['Source_Serif_4',serif] text-2xl font-bold text-[#004343] tracking-tight">Word of the Day Studio</h1>
              <p class="text-xs text-[#3f4948] max-w-2xl leading-relaxed">
                Curate and schedule daily heritage vocabulary — Sinhala, Tamil, or English — for the LegacyLens mobile learning feed.
              </p>
            </div>
            <div class="flex items-center gap-3 flex-wrap self-start xl:self-auto">
              <button (click)="resetForm()" [disabled]="isSaving()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50">
                <span class="material-symbols-outlined text-base">restart_alt</span>
                <span>Reset</span>
              </button>
              <button (click)="saveWord('Draft')" [disabled]="isSaving()"
                class="px-4 py-2.5 rounded-xl bg-white border border-[#dde3eb] hover:bg-[#f2f4f3] text-[#191c1c] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50">
                <span class="material-symbols-outlined text-base text-[#6e7978]">draft</span>
                <span>Save as Draft</span>
              </button>
              <button (click)="saveWord('Scheduled')" [disabled]="isSaving()"
                class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50">
                <span class="material-symbols-outlined text-base">schedule</span>
                <span>Schedule</span>
              </button>
              <button (click)="saveWord('Published')" [disabled]="isSaving()"
                class="px-4 py-2.5 rounded-xl bg-[#004343] hover:bg-[#003333] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50">
                <span class="material-symbols-outlined text-base">publish</span>
                <span>{{ isSaving() ? 'Saving...' : (isEditMode() ? 'Update & Publish' : 'Publish') }}</span>
              </button>
            </div>
          </div>

          <!-- Edit Mode Banner -->
          @if (isEditMode()) {
            <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                <span class="material-symbols-outlined text-base">edit_note</span>
                <span>Editing — <strong>{{ form.word || 'untitled' }}</strong> (ID #{{ editingId() }})</span>
              </div>
              <button (click)="resetForm()" class="text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer">Cancel Edit</button>
            </div>
          }

          <!-- ── MAIN BODY: Form (left) + Preview (right) ── -->
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

            <!-- ── LEFT: 2-card form (7 cols) ── -->
            <div class="xl:col-span-7 space-y-5">

              <!-- Card 1: Language & Schedule -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                <div class="flex items-center gap-2 pb-2 border-b border-[#dde3eb]">
                  <span class="w-6 h-6 rounded-full bg-[#004343] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <h3 class="font-bold text-sm text-[#191c1c]">Language & Schedule</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Language tabs -->
                  <div>
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                      Language <span class="text-red-500">*</span>
                    </label>
                    <div class="flex items-center gap-1 bg-[#f2f4f7] p-1 rounded-xl border border-[#dde3eb]">
                      @for (lang of languages; track lang.value) {
                        <button (click)="form.language = lang.value"
                          [class]="form.language === lang.value
                            ? 'bg-white text-[#004343] font-bold shadow-xs'
                            : 'text-[#6e7978] hover:text-[#191c1c] font-medium'"
                          class="flex-1 px-2 py-1.5 rounded-lg text-xs transition-all cursor-pointer">
                          {{ lang.label }}
                        </button>
                      }
                    </div>
                    <p class="text-[10px] text-[#6e7978] mt-1">Determines script direction and card badge colour.</p>
                  </div>

                  <!-- Active Date -->
                  <div>
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                      Active Date <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7978] text-base pointer-events-none">calendar_today</span>
                      <input type="date" [(ngModel)]="form.activeDate"
                        class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                    </div>
                    <p class="text-[10px] text-[#6e7978] mt-1">One word per calendar day. Goes live at 06:30 AM.</p>
                  </div>
                </div>
              </div>

              <!-- Card 2: Word, Phonetics & Definition -->
              <div class="bg-white rounded-2xl border border-[#dde3eb] p-5 shadow-xs space-y-4">
                <div class="flex items-center gap-2 pb-2 border-b border-[#dde3eb]">
                  <span class="w-6 h-6 rounded-full bg-[#004343] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <h3 class="font-bold text-sm text-[#191c1c]">Word, Phonetics & Definition</h3>
                </div>

                <!-- Row: native word + transliteration -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                      Word (Native Script) <span class="text-red-500">*</span>
                    </label>
                    <input type="text" [(ngModel)]="form.word"
                      [placeholder]="form.language === 'Tamil' ? 'e.g. ஒற்றுமை' : form.language === 'English' ? 'e.g. Stewardship' : 'e.g. සාමූහිකත්වය'"
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-['Source_Serif_4',serif] text-xl text-[#004343] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                      Transliteration <span class="text-red-500">*</span>
                    </label>
                    <input type="text" [(ngModel)]="form.transliteration"
                      placeholder="e.g. Sā-mū-hi-kat-wa-ya"
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 font-mono text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                    <p class="text-[10px] text-[#6e7978] mt-1">Phonetic romanized pronunciation guide.</p>
                  </div>
                </div>

                <!-- Row: definition + part of speech -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">
                      Definition (English) <span class="text-red-500">*</span>
                    </label>
                    <textarea rows="2" [(ngModel)]="form.definition"
                      placeholder="Short English meaning shown on the mobile card..."
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all resize-none"></textarea>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Part of Speech</label>
                    <select [(ngModel)]="form.partOfSpeech"
                      class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3.5 py-2.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all cursor-pointer">
                      @for (pos of partsOfSpeech; track pos) {
                        <option [value]="pos">{{ pos }}</option>
                      }
                    </select>
                    <div class="mt-3">
                      <label class="block text-xs font-bold text-[#191c1c] mb-1.5">Audio File</label>
                      <input type="text" [(ngModel)]="form.audioFilename"
                        placeholder="elder_word.wav"
                        class="w-full bg-[#f8faf9] border border-[#dde3eb] rounded-xl px-3 py-2.5 text-xs font-mono text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                    </div>
                  </div>
                </div>

                <!-- Field completeness bar -->
                <div class="pt-2 border-t border-[#f2f4f3]">
                  <div class="flex items-center gap-3 text-[10px] text-[#6e7978] flex-wrap">
                    @for (field of fieldStatus(); track field.label) {
                      <span [class]="field.ok ? 'text-emerald-700' : 'text-red-400'" class="flex items-center gap-0.5 font-semibold">
                        <span class="material-symbols-outlined text-[12px]">{{ field.ok ? 'check_circle' : 'cancel' }}</span>
                        {{ field.label }}
                      </span>
                    }
                  </div>
                </div>
              </div>

            </div>

            <!-- ── RIGHT: Live Mobile Preview (5 cols) ── -->
            <div class="xl:col-span-5 sticky top-0 space-y-4">

              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[#004343] text-base">smartphone</span>
                <span class="text-xs font-bold text-[#3f4948] uppercase tracking-wider">Live Mobile Preview</span>
                <span class="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time
                </span>
              </div>

              <!-- Phone frame -->
              <div class="bg-[#1a1a2e] rounded-3xl p-4 shadow-2xl max-w-[320px] mx-auto">
                <div class="bg-[#f8faf9] rounded-2xl overflow-hidden">

                  <!-- Status bar -->
                  <div class="bg-white px-4 py-2 flex items-center justify-between border-b border-[#f0f0f0]">
                    <span class="text-[10px] font-bold text-[#191c1c]">9:41</span>
                    <div class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px] text-[#191c1c]">signal_cellular_4_bar</span>
                      <span class="material-symbols-outlined text-[12px] text-[#191c1c]">battery_5_bar</span>
                    </div>
                  </div>

                  <!-- Feed label -->
                  <div class="px-4 py-2">
                    <span class="text-[10px] font-bold text-[#6e7978] uppercase tracking-wider">Home Feed</span>
                  </div>

                  <!-- WORD OF THE DAY CARD — mirrors WordOfTheDay.tsx -->
                  <div class="mx-3 mb-3 bg-white rounded-2xl border border-[#dde3eb] shadow-sm overflow-hidden">

                    <!-- Card header -->
                    <div class="px-4 pt-4 pb-1 flex items-center justify-between">
                      <span class="text-[10px] font-bold text-[#6e7978] uppercase tracking-[1.5px]">WORD OF THE DAY</span>
                      <span class="material-symbols-outlined text-[#b0b8b7] text-xl">share</span>
                    </div>

                    <!-- Language + POS badges -->
                    <div class="px-4 pb-2 flex items-center gap-1.5">
                      <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                        [ngClass]="{
                          'bg-amber-50 text-amber-700 border-amber-200': form.language === 'Sinhala',
                          'bg-blue-50 text-blue-700 border-blue-200': form.language === 'Tamil',
                          'bg-emerald-50 text-emerald-700 border-emerald-200': form.language === 'English'
                        }">
                        {{ form.language }}
                      </span>
                      @if (form.partOfSpeech) {
                        <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#6e7978] border border-[#dde3eb]">
                          {{ form.partOfSpeech }}
                        </span>
                      }
                    </div>

                    <!-- Word body -->
                    <div class="px-4 pb-3 space-y-2">
                      <div>
                        <p class="text-2xl font-bold text-[#004343] font-['Source_Serif_4',serif] leading-tight">
                          {{ form.word || 'Native Word' }}
                        </p>
                        <p class="text-[11px] text-[#6e7978] font-mono mt-0.5">
                          {{ form.transliteration || 'transliteration' }}
                        </p>
                      </div>

                      <!-- Definition box (matches definitionBox style) -->
                      <div class="bg-[#f2f4f3] rounded-xl p-3 border border-[#e1e3e2]">
                        <p class="text-xs text-[#191c1c] leading-relaxed">
                          {{ form.definition || 'English definition will appear here...' }}
                        </p>
                      </div>
                    </div>

                    <!-- Card footer -->
                    <div class="px-4 py-3 border-t border-[#f2f4f3] flex items-center justify-between">
                      <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-[#b0b8b7] text-2xl">favorite_border</span>
                        <div class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-[#b0b8b7] text-2xl">volume_up</span>
                          @if (form.audioFilename) {
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Audio attached"></span>
                          }
                        </div>
                      </div>
                      <span class="material-symbols-outlined text-[#b0b8b7] text-2xl">bookmark_border</span>
                    </div>
                  </div>

                  <!-- Active date chip -->
                  <div class="px-4 pb-3 text-center">
                    <span class="text-[10px] text-[#6e7978] font-mono">
                      {{ form.activeDate ? ('Active: ' + form.activeDate) : 'No date set' }}
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>

          <!-- ── STATUS TABS + WORD LIST TABLE ── -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] shadow-xs overflow-hidden">

            <!-- Tab bar -->
            <div class="border-b border-[#dde3eb] px-5 pt-4 flex items-center gap-1">
              @for (tab of statusTabs; track tab.key) {
                <button (click)="activeListTab.set(tab.key)"
                  [class]="activeListTab() === tab.key
                    ? 'border-b-2 border-[#004343] text-[#004343] font-bold bg-transparent'
                    : 'border-b-2 border-transparent text-[#6e7978] hover:text-[#191c1c] font-medium'"
                  class="px-4 py-2.5 text-xs transition-all cursor-pointer flex items-center gap-1.5 -mb-px">
                  <span class="material-symbols-outlined text-sm">{{ tab.icon }}</span>
                  {{ tab.label }}
                  <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    [class]="activeListTab() === tab.key ? tab.activeBadge : 'bg-[#f2f4f3] text-[#6e7978]'">
                    {{ countByStatus(tab.key) }}
                  </span>
                </button>
              }

              <div class="ml-auto pb-1 flex items-center gap-3">
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6e7978] text-base pointer-events-none">search</span>
                  <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
                    placeholder="Search words..."
                    class="w-48 bg-[#f8faf9] border border-[#dde3eb] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#191c1c] focus:outline-none focus:border-[#004343] focus:bg-white transition-all">
                </div>
                <button (click)="showExportPdfModal.set(true)" class="text-xs text-[#004343] font-bold flex items-center gap-1 hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-[#f2f4f3]">
                  <span class="material-symbols-outlined text-sm">picture_as_pdf</span> Export
                </button>
                <button (click)="loadWords()" class="text-xs text-[#004343] font-bold flex items-center gap-1 hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-[#f2f4f3]">
                  <span class="material-symbols-outlined text-sm">refresh</span> Refresh
                </button>
              </div>
            </div>

            <!-- Table -->
            @if (filteredWords().length === 0) {
              <div class="p-10 text-center text-xs text-[#6e7978]">
                <span class="material-symbols-outlined text-3xl text-gray-300 block mb-2">auto_stories</span>
                <p>No <strong>{{ activeListTab() }}</strong> words found.</p>
                @if (activeListTab() === 'Draft') {
                  <p class="mt-1">Use <em>"Save as Draft"</em> above to create one.</p>
                } @else if (activeListTab() === 'Scheduled') {
                  <p class="mt-1">Use <em>"Schedule"</em> above to queue a word.</p>
                } @else {
                  <p class="mt-1">Use <em>"Publish"</em> above to push a word to the feed.</p>
                }
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-[#f8faf9] text-[#6e7978] uppercase tracking-wider text-[10px]">
                      <th class="px-5 py-3 text-left font-bold w-5">Lang</th>
                      <th class="px-5 py-3 text-left font-bold">Word</th>
                      <th class="px-5 py-3 text-left font-bold">Definition</th>
                      <th class="px-5 py-3 text-left font-bold">Part of Speech</th>
                      <th class="px-5 py-3 text-left font-bold">Active Date</th>
                      <th class="px-5 py-3 text-left font-bold">Status</th>
                      <th class="px-5 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#f2f4f3]">
                    @for (item of filteredWords(); track item.id) {
                      <tr class="hover:bg-[#f8faf9] transition-colors group">
                        <td class="px-5 py-3.5">
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                            [ngClass]="{
                              'bg-amber-50 text-amber-700 border-amber-200': item.language === 'Sinhala',
                              'bg-blue-50 text-blue-700 border-blue-200': item.language === 'Tamil',
                              'bg-emerald-50 text-emerald-700 border-emerald-200': item.language === 'English'
                            }">
                            {{ item.language.slice(0,2) }}
                          </span>
                        </td>
                        <td class="px-5 py-3.5">
                          <div class="font-['Source_Serif_4',serif] font-bold text-[#004343] text-base leading-tight">{{ item.word }}</div>
                          <div class="text-[10px] text-[#6e7978] font-mono mt-0.5">{{ item.transliteration }}</div>
                        </td>
                        <td class="px-5 py-3.5 max-w-[200px]">
                          <p class="text-[#3f4948] line-clamp-2 leading-relaxed">{{ item.definition }}</p>
                        </td>
                        <td class="px-5 py-3.5">
                          <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#f2f4f3] text-[#6e7978] border border-[#dde3eb] font-semibold">
                            {{ item.partOfSpeech || '—' }}
                          </span>
                        </td>
                        <td class="px-5 py-3.5 font-mono text-[#6e7978] whitespace-nowrap">{{ item.activeDate }}</td>
                        <td class="px-5 py-3.5">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            [ngClass]="statusBadge(item.status)">
                            {{ item.status }}
                          </span>
                        </td>
                        <td class="px-5 py-3.5 text-right">
                          <div class="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button (click)="editWord(item)" title="Edit"
                              class="p-1.5 rounded-lg hover:bg-[#f2f4f3] text-[#004343] transition-colors cursor-pointer">
                              <span class="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button (click)="deleteWord(item.id!)" title="Delete"
                              class="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer">
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
      </main>
    </div>
  `
})
export class WordOfTheDayComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  toastMessage = signal<string | null>(null);
  isErrorToast = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  editingId = signal<number | null>(null);
  wordList = signal<WordEntry[]>([]);
  activeListTab = signal<string>('Published');

  // Export PDF Modal
  showExportPdfModal = signal<boolean>(false);
  exportDateFrom = '';
  exportDateTo = '';
  searchQuery = signal<string>('');

  languages = [
    { label: 'සිංහල', value: 'Sinhala' },
    { label: 'தமிழ்', value: 'Tamil' },
    { label: 'English', value: 'English' }
  ];

  partsOfSpeech = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Idiom / Phrase'];

  statusTabs = [
    { key: 'Published', label: 'Published', icon: 'check_circle', activeBadge: 'bg-emerald-100 text-emerald-800' },
    { key: 'Scheduled', label: 'Scheduled', icon: 'schedule',     activeBadge: 'bg-amber-100 text-amber-800' },
    { key: 'Draft',     label: 'Drafts',    icon: 'draft',        activeBadge: 'bg-[#e1e3e2] text-[#3f4948]' },
  ];

  form: WordEntry = this.emptyForm();

  fieldStatus = computed(() => [
    { label: 'Language',        ok: !!this.form.language },
    { label: 'Word',            ok: !!this.form.word?.trim() },
    { label: 'Transliteration', ok: !!this.form.transliteration?.trim() },
    { label: 'Definition',      ok: !!this.form.definition?.trim() },
    { label: 'Date',            ok: !!this.form.activeDate },
  ]);

  filteredWords = computed(() =>
    this.wordList().filter(w => {
      const s = w.status ?? '';
      const tab = this.activeListTab();
      let matchTab = false;
      if (tab === 'Published') matchTab = (s === 'Published' || s === 'Today');
      else matchTab = (s === tab);

      if (!matchTab) return false;

      const q = this.searchQuery().toLowerCase();
      if (!q) return true;
      return (w.word?.toLowerCase().includes(q) || 
              w.definition?.toLowerCase().includes(q) || 
              w.transliteration?.toLowerCase().includes(q));
    })
  );

  countByStatus(tab: string): number {
    return this.wordList().filter(w => {
      const s = w.status ?? '';
      if (tab === 'Published') return s === 'Published' || s === 'Today';
      return s === tab;
    }).length;
  }

  statusBadge(status: string): string {
    switch (status) {
      case 'Published':
      case 'Today':    return 'bg-emerald-100 text-emerald-800';
      case 'Scheduled': return 'bg-amber-100 text-amber-800';
      case 'Draft':    return 'bg-[#e1e3e2] text-[#3f4948]';
      case 'Past':     return 'bg-gray-100 text-gray-500';
      default:         return 'bg-[#f2f4f3] text-[#6e7978]';
    }
  }

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

  ngOnInit(): void {
    this.loadWords();
  }

  downloadPdf(): void {
    const doc = new jsPDF();
    const adminName = this.authService.currentUser()?.fullName || 'Generic Admin';
    const dateText = (this.exportDateFrom || this.exportDateTo)
      ? `Date Range: ${this.exportDateFrom || 'Start'} to ${this.exportDateTo || 'End'}`
      : 'All Dates';

    doc.setFontSize(16);
    doc.text('LegacyLens', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated by: ${adminName}`, 14, 30);
    doc.text(dateText, 14, 40);

    let exportData = this.filteredWords();
    
    if (this.exportDateFrom) {
      exportData = exportData.filter(w => w.activeDate >= this.exportDateFrom);
    }
    if (this.exportDateTo) {
      exportData = exportData.filter(w => w.activeDate <= this.exportDateTo);
    }

    const tableData = exportData.map(w => [
      w.language || '-',
      w.word || '-',
      w.definition || '-',
      w.partOfSpeech || '-',
      w.activeDate || '-',
      w.status || '-'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Language', 'Word', 'Definition', 'Part of Speech', 'Active Date', 'Status']],
      body: tableData,
    });

    doc.save('word-of-the-day-report.pdf');
    this.showExportPdfModal.set(false);
  }

  loadWords(): void {
    this.http.get<any>(API_BASE, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        this.wordList.set(Array.isArray(data) ? data : []);
      },
      error: () => this.showToast('Failed to load words from backend.', true)
    });
  }

  saveWord(status: string): void {
    if (!this.form.word?.trim() || !this.form.transliteration?.trim() || !this.form.definition?.trim() || !this.form.activeDate) {
      this.showToast('Please fill in Word, Transliteration, Definition, and Active Date.', true);
      return;
    }
    this.isSaving.set(true);
    const payload = { ...this.form, status };
    const headers = this.getHeaders();
    const req$ = this.isEditMode()
      ? this.http.put<any>(`${API_BASE}/${this.editingId()}`, payload, { headers })
      : this.http.post<any>(API_BASE, payload, { headers });

    req$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showToast(`"${this.form.word}" ${this.isEditMode() ? 'updated' : 'created'} as ${status}!`);
        this.activeListTab.set(status === 'Published' || status === 'Today' ? 'Published' : status);
        this.resetForm();
        this.loadWords();
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg = err?.error?.message ?? 'Failed to save word.';
        this.showToast(msg, true);
      }
    });
  }

  editWord(item: WordEntry): void {
    this.form = { ...item };
    this.isEditMode.set(true);
    this.editingId.set(item.id ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteWord(id: number): void {
    if (!confirm('Delete this word entry? This cannot be undone.')) return;
    this.http.delete<any>(`${API_BASE}/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showToast('Word deleted.');
        if (this.editingId() === id) this.resetForm();
        this.loadWords();
      },
      error: () => this.showToast('Failed to delete word.', true)
    });
  }

  resetForm(): void {
    this.form = this.emptyForm();
    this.isEditMode.set(false);
    this.editingId.set(null);
  }

  private emptyForm(): WordEntry {
    return {
      language: 'Sinhala',
      word: '',
      transliteration: '',
      definition: '',
      partOfSpeech: 'Noun',
      audioFilename: '',
      activeDate: new Date().toISOString().split('T')[0],
      status: 'Draft'
    };
  }

  private showToast(msg: string, isError = false): void {
    this.isErrorToast.set(isError);
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4500);
  }
}
