import { Component, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="relative w-full h-screen overflow-y-auto overflow-x-hidden font-body-md text-on-surface">
      
      <!-- Video Background -->
      <video #bgVideo autoplay loop playsinline class="fixed inset-0 w-full h-full object-cover z-0 opacity-80">
        <source src="assets/videos/auth/login.mp4" type="video/mp4" />
      </video>
      <!-- Dark overlay for better form readability -->
      <div class="fixed inset-0 bg-slate-950/20 z-0 pointer-events-none"></div>

      <!-- Scrollable Content Wrapper -->
      <div class="relative z-10 w-full min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-lg bg-surface-container-lowest/90 backdrop-blur-md rounded-xl shadow-xl border border-surface-container-high/40 p-6 sm:p-10 my-4 sm:my-8 flex flex-col">
          
          <!-- Header Section -->
          <div class="flex flex-col items-center text-center gap-2 mb-6">
            <h1 class="font-headline-md text-2xl text-charcoal-text font-semibold tracking-tight">Legacy Lens</h1>
            <h2 class="font-headline-sm text-lg text-primary font-medium">Administrator Sign In</h2>
            <p class="font-body-md text-on-surface-variant text-sm max-w-sm mt-0.5 leading-relaxed">
              Enter your administrator credentials to access curation, moderation, and archival records.
            </p>
          </div>

          <!-- Error Alert Banner -->
          @if (errorMessage()) {
            <div class="mb-5 p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-start gap-2.5 text-xs font-body-md">
              <span class="material-symbols-outlined text-lg shrink-0">error</span>
              <div class="flex-1">{{ errorMessage() }}</div>
            </div>
          }

          <form class="space-y-4" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Phone Number Input -->
            <div class="flex flex-col gap-1">
              <label for="phoneNumber" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider">
                Admin Phone Number
              </label>
              <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                   [class.border-error]="loginForm.get('phoneNumber')?.invalid && loginForm.get('phoneNumber')?.touched">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">phone_iphone</span>
                <input 
                  id="phoneNumber" 
                  type="tel" 
                  formControlName="phoneNumber"
                  placeholder="Phone Number" 
                  autocomplete="tel"
                  class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" />
              </div>
            </div>

            <!-- PIN Input -->
            <div class="flex flex-col gap-1">
              <label for="pin" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider">
                Security PIN
              </label>
              <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                   [class.border-error]="loginForm.get('pin')?.invalid && loginForm.get('pin')?.touched">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock</span>
                <input 
                  class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest placeholder:text-outline/60 focus:outline-none" 
                  id="pin" 
                  [type]="showPin() ? 'text' : 'password'"
                  formControlName="pin"
                  maxlength="4"
                  inputmode="numeric"
                  (input)="sanitizePin($event)"
                  placeholder="••••" 
                  autocomplete="current-password" />
                <button 
                  type="button" 
                  aria-label="Toggle PIN visibility" 
                  class="absolute right-3 text-outline hover:text-charcoal-text focus:outline-none p-1 transition-colors" 
                  (click)="togglePinVisibility()">
                  <span class="material-symbols-outlined text-lg">
                    {{ showPin() ? 'visibility' : 'visibility_off' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="pt-1 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="flex items-center h-5 mt-0.5">
                  <input 
                    class="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-0 cursor-pointer accent-primary" 
                    id="rememberDevice" 
                    type="checkbox"
                    formControlName="rememberDevice" />
                </div>
                <label class="font-label-md text-charcoal-text font-normal cursor-pointer select-none" for="rememberDevice">
                  Remember device
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4">
              <button 
                type="submit" 
                [disabled]="loginForm.invalid || isLoading()"
                class="w-full py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 group cursor-pointer">
                @if (isLoading()) {
                  <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                } @else {
                  <span>Sign In to Admin Console</span>
                  <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                }
              </button>
            </div>
          </form>

          <!-- Footer Links -->
          <div class="mt-6 pt-5 flex flex-col items-center justify-center gap-3 border-t border-surface-container-high/40 text-center">
            <a routerLink="/register" class="font-label-md text-secondary hover:text-on-secondary-container transition-colors font-medium flex items-center gap-1.5 cursor-pointer">
              <span>Need institutional access? <strong>Create an Admin Account</strong></span>
            </a>
            <div class="flex items-center gap-1 text-outline font-label-md text-[11px] mt-1">
              <span class="material-symbols-outlined text-xs text-primary-container">verified_user</span>
              <span>Protected by encrypted PIN hash &amp; institutional ledger</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
  loginForm: FormGroup;
  showPin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (this.bgVideo?.nativeElement) {
      if (document.hidden) {
        this.bgVideo.nativeElement.pause();
      } else {
        this.bgVideo.nativeElement.play().catch(() => {
          this.bgVideo.nativeElement.muted = true;
          this.bgVideo.nativeElement.play().catch(e => console.warn('Video blocked on resume', e));
        });
      }
    }
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+?[0-9]{9,15}|[0-9]{10})$/)]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      rememberDevice: [false]
    });
  }

  ngAfterViewInit() {
    if (this.bgVideo?.nativeElement) {
      const vid = this.bgVideo.nativeElement;
      vid.volume = 0.1;
      
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(e => console.warn('Video blocked', e));
        });
      }

      vid.style.transition = 'opacity 0.6s ease-in-out';
      
      let isFading = false;
      vid.addEventListener('timeupdate', () => {
        if (vid.duration && vid.duration - vid.currentTime <= 0.6) {
          if (!isFading) {
            isFading = true;
            vid.style.opacity = '0';
          }
        } 
        else if (vid.currentTime < 0.6) {
          if (isFading) {
            isFading = false;
            vid.style.opacity = '';
          }
        }
      });
    }
  }

  sanitizePin(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const cleaned = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (input.value !== cleaned) {
      input.value = cleaned;
      this.loginForm.get('pin')?.setValue(cleaned);
    }
  }

  togglePinVisibility(): void {
    this.showPin.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { phoneNumber, pin, rememberDevice } = this.loginForm.value;

    this.authService.login(phoneNumber, pin, rememberDevice).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Invalid credentials. Please try again.');
      }
    });
  }
}
