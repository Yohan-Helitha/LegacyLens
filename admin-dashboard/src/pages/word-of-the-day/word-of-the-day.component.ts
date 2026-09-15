import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { SidebarComponent } from '../../components/common/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/common/header/header.component';

export interface WordEntry {
  id: string;
  language: 'Sinhala' | 'Tamil' | 'English';
  wordNative: string;
  transliteration: string;
  meaning: string;
  partOfSpeech: string;
  exampleSentenceNative: string;
  exampleSentenceEnglish: string;
  culturalContext: string;
  publishDate: string;
  audioFilename?: string;
  status: 'Published' | 'Scheduled' | 'Draft';
}

@Component({
  selector: 'app-word-of-the-day',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen w-full bg-[#f8faf9] text-[#191c1c] font-sans overflow-hidden selection:bg-[#fe893e]/20 selection:text-[#9b4600]">
      
      <!-- Toast Alert Notification -->
      @if (toastMessage()) {
        <div class="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#004343] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/30 animate-bounce">
          <span class="material-symbols-outlined text-emerald-300 text-xl">auto_stories</span>
          <div class="text-xs font-semibold">{{ toastMessage() }}</div>
          <button (click)="toastMessage.set(null)" class="text-white/70 hover:text-white ml-2 text-xs">✕</button>
        </div>
      }

      <!-- Left Sidebar Navigation -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col h-full overflow-hidden">
        
        <!-- Common Top Navigation Header -->
        <app-header 
          pageTitle="Word of the Day" 
          section="Console"
          searchPlaceholder="Search dictionary or lexicon..."
          [showSearch]="false">
          <button (click)="openHelp()" class="p-2 rounded-xl text-[#3e4948] hover:bg-[#f2f4f7] transition-colors" title="Curator Guidelines">
            <span class="material-symbols-outlined text-[20px]">help_outline</span>
          </button>
        </app-header>

        <!-- Main Body Scroll Container -->
        <div class="flex-1 overflow-y-auto px-6 lg:px-12 py-8 max-w-5xl mx-auto w-full space-y-6">
          
          <!-- Form Header -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 class="text-2xl lg:text-3xl font-serif font-bold text-[#004343] tracking-tight">Add Word of the Day</h1>
              <p class="text-[#6e7978] text-xs sm:text-sm mt-0.5">Publish a featured heritage word to daily student and researcher feeds.</p>
            </div>

            <div class="flex items-center gap-2.5 self-start sm:self-auto">
              <button (click)="saveDraft()"
                      class="px-4 py-2 rounded-xl border border-[#c2c8c7] text-[#3e4948] hover:bg-[#f2f4f7] font-semibold text-xs transition-colors shadow-sm">
                Save Draft
              </button>
              <button (click)="publishWord()"
                      class="px-5 py-2 rounded-xl bg-[#004343] hover:bg-[#003131] text-white font-semibold text-xs shadow-md shadow-[#004343]/20 transition-all flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base">publish</span>
                <span>Publish Word</span>
              </button>
            </div>
          </div>

          <!-- Focused Single-Card Form -->
          <div class="bg-white rounded-2xl border border-[#dde3eb] p-6 sm:p-8 shadow-sm space-y-6">
            
            <!-- Language Selection Tabs -->
            <div class="pb-5 border-b border-[#dde3eb]">
              <label class="block text-[11px] font-bold text-[#6e7978] uppercase tracking-wider mb-2.5">Select Language</label>
              <div class="inline-flex p-1 bg-[#f2f4f7] rounded-xl gap-1 border border-[#dde3eb]">
                <button (click)="setLanguage('Sinhala')"
                        [ngClass]="currentLanguage() === 'Sinhala' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                  <span class="w-1.5 h-1.5 rounded-full bg-[#fe893e]"></span>
                  <span>Sinhala (සිංහල)</span>
                </button>

                <button (click)="setLanguage('Tamil')"
                        [ngClass]="currentLanguage() === 'Tamil' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                  <span>Tamil (தமிழ்)</span>
                </button>

                <button (click)="setLanguage('English')"
                        [ngClass]="currentLanguage() === 'English' ? 'bg-white text-[#004343] font-bold shadow-sm' : 'text-[#6e7978] hover:text-[#191c1c]'"
                        class="px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                  <span>English</span>
                </button>
              </div>
            </div>

            <!-- Form Fields Grid -->
            <div class="space-y-5">
              
              <!-- Row 1: Word Script & Transliteration -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c] flex items-center justify-between">
                    <span>Word (Native Script)</span>
                    <span class="text-[11px] text-[#004343] font-normal font-serif">e.g. සාමූහිකත්වය</span>
                  </label>
                  <input type="text"
                         [(ngModel)]="wordNative"
                         placeholder="Enter word in native script"
                         class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl px-3.5 py-2.5 text-[#191c1c] font-serif text-lg focus:bg-white focus:border-[#004343] focus:outline-none transition-all" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c] flex items-center justify-between">
                    <span>Transliteration</span>
                    <span class="text-[11px] text-[#6e7978] font-normal">Phonetic guide</span>
                  </label>
                  <input type="text"
                         [(ngModel)]="transliteration"
                         placeholder="e.g. Saamuhikathvaya"
                         class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl px-3.5 py-2.5 text-[#191c1c] text-xs font-semibold focus:bg-white focus:border-[#004343] focus:outline-none transition-all font-mono" />
                </div>
              </div>

              <!-- Row 2: Meaning in English & Part of Speech -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div class="sm:col-span-2 flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c]">Meaning in English</label>
                  <input type="text"
                         [(ngModel)]="meaningEnglish"
                         placeholder="e.g. Communal solidarity; collective action for mutual stewardship"
                         class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl px-3.5 py-2.5 text-[#191c1c] text-xs font-semibold focus:bg-white focus:border-[#004343] focus:outline-none transition-all" />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c]">Part of Speech</label>
                  <select [(ngModel)]="partOfSpeech"
                          class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl px-3.5 py-2.5 text-[#191c1c] text-xs font-semibold focus:bg-white focus:border-[#004343] focus:outline-none transition-all cursor-pointer">
                    <option value="Noun">Noun</option>
                    <option value="Verb">Verb</option>
                    <option value="Adjective">Adjective</option>
                    <option value="Adverb">Adverb</option>
                    <option value="Idiom / Phrase">Idiom / Phrase</option>
                  </select>
                </div>
              </div>

              <!-- Row 3: Example Sentence & Translation -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-[#191c1c]">Example Sentence</label>
                <div class="bg-[#f8faf9] border border-[#c2c8c7] rounded-xl p-3.5 space-y-2.5 focus-within:bg-white focus-within:border-[#004343] transition-all">
                  <input type="text"
                         [(ngModel)]="exampleSentenceNative"
                         placeholder="Sentence in native script"
                         class="w-full bg-transparent border-0 p-0 text-[#191c1c] text-sm font-serif focus:outline-none" />
                  <div class="border-t border-[#dde3eb] pt-2">
                    <input type="text"
                           [(ngModel)]="exampleSentenceEnglish"
                           placeholder="English translation of the sentence"
                           class="w-full bg-transparent border-0 p-0 text-[#6e7978] text-xs italic focus:outline-none" />
                  </div>
                </div>
              </div>

              <!-- Row 4: Cultural Context / Note -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-bold text-[#191c1c] flex items-center justify-between">
                  <span>Cultural Context & Historical Significance</span>
                  <span class="text-[11px] text-[#6e7978] font-normal">Origin or folklore usage</span>
                </label>
                <textarea rows="3"
                          [(ngModel)]="culturalContext"
                          placeholder="A short paragraph explaining the cultural background or traditional significance..."
                          class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl p-3.5 text-[#191c1c] text-xs leading-relaxed focus:bg-white focus:border-[#004343] focus:outline-none transition-all resize-y"></textarea>
              </div>

              <!-- Row 5: Audio Pronunciation & Publish Date -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                <!-- Audio Upload Box -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c]">Audio Pronunciation</label>
                  <div (click)="simulateAudioUpload()"
                       class="border-2 border-dashed border-[#c2c8c7] rounded-xl p-4 bg-[#f8faf9] hover:bg-white hover:border-[#004343] transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-[#004343] text-2xl">cloud_upload</span>
                    <span class="text-xs font-bold text-[#191c1c]">
                      {{ audioFilename() || 'Click to upload elder pronunciation' }}
                    </span>
                    <span class="text-[10px] text-[#6e7978]">Supports .mp3, .wav (up to 10MB)</span>
                  </div>
                </div>

                <!-- Publish Date Picker -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-bold text-[#191c1c]">Publish Date</label>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-[#6e7978] text-[18px] pointer-events-none">calendar_today</span>
                    <input type="date"
                           [(ngModel)]="publishDate"
                           class="w-full bg-[#f8faf9] border border-[#c2c8c7] rounded-xl pl-10 pr-3.5 py-3 text-[#191c1c] text-xs font-semibold focus:bg-white focus:border-[#004343] focus:outline-none transition-all" />
                  </div>
                  <span class="text-[10px] text-[#6e7978] mt-0.5">Word will go live to student feeds at 06:30 AM local time.</span>
                </div>
              </div>

            </div>

          </div>

          <!-- Bottom Footer Status -->
          <div class="flex items-center justify-between text-xs text-[#6e7978] px-2">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Draft auto-saved • Ready for publication</span>
            </span>
            <button (click)="toggleScheduleModal()" class="text-[#004343] font-bold hover:underline flex items-center gap-1">
              <span>View scheduled calendar ({{ scheduledWords().length }})</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <!-- Scheduled Words Calendar Modal / Drawer -->
          @if (showScheduleModal()) {
            <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#dde3eb] overflow-hidden animate-in fade-in zoom-in duration-150">
                <div class="p-6 border-b border-[#dde3eb] flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-[#004343]/10 text-[#004343] flex items-center justify-center">
                      <span class="material-symbols-outlined text-2xl">event</span>
                    </div>
                    <div>
                      <h3 class="text-base font-serif font-bold text-[#191c1c]">Scheduled Word Queue</h3>
                      <p class="text-xs text-[#6e7978]">Upcoming entries broadcast across the mobile learning feed</p>
                    </div>
                  </div>
                  <button (click)="showScheduleModal.set(false)" class="text-[#6e7978] hover:text-[#191c1c]">✕</button>
                </div>

                <div class="p-6 divide-y divide-[#dde3eb] max-h-96 overflow-y-auto">
                  @for (item of scheduledWords(); track item.id) {
                    <div class="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-base font-serif font-bold text-[#004343]">{{ item.wordNative }}</span>
                          <span class="text-xs text-[#6e7978] font-mono">({{ item.transliteration }})</span>
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                                [ngClass]="item.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                            {{ item.status }}
                          </span>
                        </div>
                        <p class="text-xs text-[#3e4948] mt-0.5">{{ item.meaning }}</p>
                      </div>
                      <div class="text-right text-xs font-mono text-[#6e7978] shrink-0">
                        {{ item.publishDate }}
                      </div>
                    </div>
                  }
                </div>

                <div class="p-4 bg-[#f8faf9] border-t border-[#dde3eb] flex justify-end">
                  <button (click)="showScheduleModal.set(false)"
                          class="px-4 py-2 bg-[#004343] text-white rounded-xl text-xs font-bold hover:bg-[#003131] transition-colors">
                    Close Queue
                  </button>
                </div>
              </div>
            </div>
          }

        </div>

      </main>

    </div>
  `
})
export class WordOfTheDayComponent {
  toastMessage = signal<string | null>(null);

  currentLanguage = signal<'Sinhala' | 'Tamil' | 'English'>('Sinhala');
  wordNative = 'සාමූහිකත්වය';
  transliteration = 'Sā-mū-hi-kat-wa-ya';
  meaningEnglish = 'Communal solidarity; collective action for mutual stewardship';
  partOfSpeech = 'Noun';
  exampleSentenceNative = 'සාමූහිකත්වයෙන් ගමේ වැව ප්රතිසංස්කරණය කර අස්වනු සුරක්ෂිත කළහ.';
  exampleSentenceEnglish = 'Through communal solidarity, they restored the village reservoir, safeguarding the harvest.';
  culturalContext = "Rooted in ancient Sri Lankan village customs like 'Kayya' (uncompensated mutual labor). Communities gathered voluntarily to desilt irrigation tanks and cultivate terraced paddy fields before monsoonal floods.";
  publishDate = '2024-10-24';
  audioFilename = signal<string | null>('elder_bandara_saamuhikathvaya.wav');

  showScheduleModal = signal<boolean>(false);

  scheduledWords = signal<WordEntry[]>([
    {
      id: 'WOD-01',
      language: 'Sinhala',
      wordNative: 'සාමූහිකත්වය',
      transliteration: 'Sā-mū-hi-kat-wa-ya',
      meaning: 'Communal solidarity; collective action for mutual stewardship',
      partOfSpeech: 'Noun',
      exampleSentenceNative: 'සාමූහිකත්වයෙන් ගමේ වැව ප්රතිසංස්කරණය කර අස්වනු සුරක්ෂිත කළහ.',
      exampleSentenceEnglish: 'Through communal solidarity, they restored the village reservoir.',
      culturalContext: 'Ancient Kayya mutual labor tradition.',
      publishDate: '2024-10-24',
      status: 'Scheduled'
    },
    {
      id: 'WOD-02',
      language: 'Sinhala',
      wordNative: 'කැවුම් කෝඩුව',
      transliteration: 'Kevum Kōḍuwa',
      meaning: 'Traditional decorative brass mold for festive oil cakes',
      partOfSpeech: 'Noun',
      exampleSentenceNative: 'අලුත් අවුරුදු සමයේ කැවුම් කෝඩුව භාවිතයෙන් රස කැවිලි සෑදූහ.',
      exampleSentenceEnglish: 'During New Year, sweetmeats were made using traditional brass molds.',
      culturalContext: 'Culinary heirloom crafting practice.',
      publishDate: '2024-10-23',
      status: 'Published'
    },
    {
      id: 'WOD-03',
      language: 'Tamil',
      wordNative: 'ஒற்றுமை',
      transliteration: 'Oṟṟumai',
      meaning: 'Harmony, unity, and communal togetherness',
      partOfSpeech: 'Noun',
      exampleSentenceNative: 'கிராமத்து மக்கள் ஒற்றுமையுடன் அறுவடைத் திருநாளைக் கொண்டாடினர்.',
      exampleSentenceEnglish: 'The village residents celebrated the harvest festival with unity.',
      culturalContext: 'Thai Pongal agricultural festival collective celebration.',
      publishDate: '2024-10-25',
      status: 'Scheduled'
    }
  ]);

  constructor(private router: Router, private authService: AuthService) {}

  setLanguage(lang: 'Sinhala' | 'Tamil' | 'English'): void {
    this.currentLanguage.set(lang);
    if (lang === 'Sinhala') {
      this.wordNative = 'සාමූහිකත්වය';
      this.transliteration = 'Sā-mū-hi-kat-wa-ya';
    } else if (lang === 'Tamil') {
      this.wordNative = 'ஒற்றுமை';
      this.transliteration = 'Oṟṟumai';
    } else {
      this.wordNative = 'Solitary Stewardship';
      this.transliteration = 'Sol-i-tar-y Stew-ard-ship';
    }
    this.showToast(`Language switched to ${lang}.`);
  }

  saveDraft(): void {
    this.showToast(`Draft for "${this.wordNative}" saved to council cloud storage.`);
  }

  publishWord(): void {
    const newEntry: WordEntry = {
      id: 'WOD-' + Date.now(),
      language: this.currentLanguage(),
      wordNative: this.wordNative,
      transliteration: this.transliteration,
      meaning: this.meaningEnglish,
      partOfSpeech: this.partOfSpeech,
      exampleSentenceNative: this.exampleSentenceNative,
      exampleSentenceEnglish: this.exampleSentenceEnglish,
      culturalContext: this.culturalContext,
      publishDate: this.publishDate,
      status: 'Published'
    };
    this.scheduledWords.update(words => [newEntry, ...words]);
    this.showToast(`Word of the Day "${this.wordNative}" published to student feeds!`);
  }

  simulateAudioUpload(): void {
    this.audioFilename.set('elder_pronunciation_' + Date.now() + '.wav');
    this.showToast('Elder audio pronunciation uploaded and verified.');
  }

  toggleScheduleModal(): void {
    this.showScheduleModal.update(v => !v);
  }

  openHelp(): void {
    this.showToast('Curatorial Editorial Standard: Select archaic idioms and dialect words with verifiable oral history citations.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
