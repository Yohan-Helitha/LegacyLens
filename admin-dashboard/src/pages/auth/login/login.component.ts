import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background font-body-md text-on-surface">
      <div class="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high/40 p-6 sm:p-10 my-6 flex flex-col">
        
        <!-- Header Section -->
        <div class="flex flex-col items-center text-center gap-2 mb-6">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-1">
            <span class="material-symbols-outlined text-[28px]">museum</span>
          </div>
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

        <!-- Login Form -->
        <form class="space-y-4" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          
          <!-- Phone Number -->
          <div class="flex flex-col gap-1">
            <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="admin-phone">
              Admin Phone Number
            </label>
            <div 
              class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
              [class.border-error]="loginForm.get('phoneNumber')?.invalid && loginForm.get('phoneNumber')?.touched"
              [class.border-transparent]="!(loginForm.get('phoneNumber')?.invalid && loginForm.get('phoneNumber')?.touched)">
              <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">phone_iphone</span>
              <input 
                class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" 
                id="admin-phone" 
                type="tel"
                formControlName="phoneNumber"
                placeholder="0771234567" 
                autocomplete="tel" />
            </div>
            @if (loginForm.get('phoneNumber')?.invalid && loginForm.get('phoneNumber')?.touched) {
              <p class="text-xs text-error font-body-md pl-1">Please enter a valid phone number (e.g. 0771234567).</p>
            }
          </div>

          <!-- Security PIN (4 Digits) -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="admin-pin">
                Security PIN (4 Digits)
              </label>
              <a class="font-label-md text-xs text-secondary hover:text-secondary-container hover:underline transition-colors cursor-pointer" href="javascript:void(0)">
                Forgot PIN?
              </a>
            </div>
            <div 
              class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
              [class.border-error]="loginForm.get('pin')?.invalid && loginForm.get('pin')?.touched"
              [class.border-transparent]="!(loginForm.get('pin')?.invalid && loginForm.get('pin')?.touched)">
              <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock</span>
              <input 
                class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest placeholder:text-outline/60 focus:outline-none" 
                id="admin-pin" 
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
            @if (loginForm.get('pin')?.invalid && loginForm.get('pin')?.touched) {
              <p class="text-xs text-error font-body-md pl-1">Security PIN must be exactly 4 numeric digits.</p>
            }
          </div>

          <!-- Remember Device Checkbox -->
          <div class="flex items-center pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input 
                class="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-0 cursor-pointer accent-primary" 
                id="remember-device" 
                type="checkbox"
                formControlName="rememberDevice" />
              <span class="font-body-md text-xs text-on-surface-variant">
                Remember this device for 30 days
              </span>
            </label>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              [disabled]="isLoading()"
              class="w-full py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer">
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
        <div class="mt-6 pt-4 flex flex-col items-center justify-center gap-2 border-t border-surface-container-high/40 text-center">
          <a routerLink="/register" class="font-label-md text-xs text-secondary hover:text-on-secondary-container transition-colors font-medium flex items-center gap-1.5 cursor-pointer">
            <span>Need institutional access? <strong>Create an Admin Account</strong></span>
          </a>
          <div class="flex items-center gap-1 text-outline font-label-md text-[11px] mt-1">
            <span class="material-symbols-outlined text-xs text-primary-container">verified_user</span>
            <span>Protected by encrypted PIN hash &amp; institutional ledger</span>
          </div>
        </div>

      </div>
    </main>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  showPin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      phoneNumber: ['0771234567', [Validators.required, Validators.pattern(/^(\+?[0-9]{9,15}|[0-9]{10})$/)]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      rememberDevice: [false]
    });
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
    this.showPin.update(value => !value);
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
        this.errorMessage.set(err.message || 'Authentication failed. Please check your phone number and 4-digit security PIN.');
      }
    });
  }
}
