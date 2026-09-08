import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';
import { City } from '../../../app/core/models/auth.model';

export function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const inputDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today ? { futureDate: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="w-full min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background font-body-md text-on-surface">
      <div class="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high/40 p-6 sm:p-10 my-6 flex flex-col">
        
        <!-- Header Section -->
        <div class="flex flex-col items-center text-center gap-2 mb-6">
          <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-1">
            <span class="material-symbols-outlined text-[28px]">museum</span>
          </div>
          <h1 class="font-headline-md text-2xl text-charcoal-text font-semibold tracking-tight">Legacy Lens</h1>
          <h2 class="font-headline-sm text-lg text-primary font-medium">Create an Admin Account</h2>
          <p class="font-body-md text-on-surface-variant text-sm max-w-md mt-1 leading-relaxed">
            Create your administrator credentials to manage cultural archives, moderation, and community stories.
          </p>
        </div>

        <!-- Error Alert Banner -->
        @if (errorMessage()) {
          <div class="mb-5 p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-start gap-2.5 text-xs font-body-md">
            <span class="material-symbols-outlined text-lg shrink-0">error</span>
            <div class="flex-1">{{ errorMessage() }}</div>
          </div>
        }

        <!-- Registration Form -->
        <form class="space-y-4" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          
          <!-- Full Name -->
          <div class="flex flex-col gap-1">
            <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="fullName">
              Full Name
            </label>
            <div 
              class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
              [class.border-error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched"
              [class.border-transparent]="!(registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched)">
              <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">badge</span>
              <input 
                class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" 
                id="fullName" 
                type="text"
                formControlName="fullName"
                placeholder="Dr. Samantha Senanayake" 
                autocomplete="name" />
            </div>
            @if (registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched) {
              <p class="text-[11px] text-error font-body-md pl-1">Full name is required (minimum 2 characters).</p>
            }
          </div>

          <!-- Phone Number -->
          <div class="flex flex-col gap-1">
            <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="phoneNumber">
              Admin Phone Number
            </label>
            <div 
              class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
              [class.border-error]="registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched"
              [class.border-transparent]="!(registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched)">
              <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">phone_iphone</span>
              <input 
                class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" 
                id="phoneNumber" 
                type="tel"
                formControlName="phoneNumber"
                placeholder="0771234567" 
                autocomplete="tel" />
            </div>
            @if (registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched) {
              <p class="text-[11px] text-error font-body-md pl-1">Enter a valid phone number (e.g. 0771234567).</p>
            }
          </div>

          <!-- NIC Number & Date of Birth (2-col grid) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- NIC Number -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="nicNumber">
                National ID (NIC)
              </label>
              <div 
                class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
                [class.border-error]="registerForm.get('nicNumber')?.invalid && registerForm.get('nicNumber')?.touched"
                [class.border-transparent]="!(registerForm.get('nicNumber')?.invalid && registerForm.get('nicNumber')?.touched)">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">pin_invoke</span>
                <input 
                  class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text uppercase placeholder:text-outline/60 focus:outline-none" 
                  id="nicNumber" 
                  type="text"
                  maxlength="12"
                  (input)="formatNic($event)"
                  formControlName="nicNumber"
                  placeholder="199012345678 or 901234567V" />
              </div>
              @if (registerForm.get('nicNumber')?.invalid && registerForm.get('nicNumber')?.touched) {
                <p class="text-[11px] text-error font-body-md pl-1">
                  NIC must be 9 digits + V/X or 12 digits.
                </p>
              }
            </div>

            <!-- Date of Birth -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="dateOfBirth">
                Date of Birth
              </label>
              <div 
                class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
                [class.border-error]="registerForm.get('dateOfBirth')?.invalid && registerForm.get('dateOfBirth')?.touched"
                [class.border-transparent]="!(registerForm.get('dateOfBirth')?.invalid && registerForm.get('dateOfBirth')?.touched)">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">calendar_month</span>
                <input 
                  class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" 
                  id="dateOfBirth" 
                  type="date"
                  formControlName="dateOfBirth" />
              </div>
              @if (registerForm.get('dateOfBirth')?.invalid && registerForm.get('dateOfBirth')?.touched) {
                <p class="text-[11px] text-error font-body-md pl-1">Date of birth must be a past date.</p>
              }
            </div>
          </div>

          <!-- Administrative City & Role / Department (2-col grid) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Administrative City -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="cityId">
                Administrative City
              </label>
              <div 
                class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
                [class.border-error]="registerForm.get('cityId')?.invalid && registerForm.get('cityId')?.touched"
                [class.border-transparent]="!(registerForm.get('cityId')?.invalid && registerForm.get('cityId')?.touched)">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">location_city</span>
                <select 
                  class="w-full pl-10 pr-8 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text appearance-none focus:outline-none cursor-pointer" 
                  id="cityId"
                  formControlName="cityId">
                  <option [ngValue]="null" disabled selected>Select City</option>
                  @for (city of cities(); track city.id) {
                    <option [value]="city.id">{{ city.name }} ({{ city.region }})</option>
                  }
                </select>
                <span class="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            <!-- Role / Department -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="roleType">
                Role / Department
              </label>
              <div class="relative flex items-center rounded-lg border border-transparent bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">shield_person</span>
                <select 
                  class="w-full pl-10 pr-8 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text appearance-none focus:outline-none cursor-pointer" 
                  id="roleType"
                  formControlName="roleType">
                  <option value="curator">Senior Field Curator</option>
                  <option value="moderator">Archival Moderator</option>
                  <option value="specialist">Oral History Specialist</option>
                  <option value="director">National Heritage Director</option>
                </select>
                <span class="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-base">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Passwords / PIN (4 Digits Only) (2-col grid) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <!-- Create Security PIN -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="pin">
                Security PIN (4 Digits)
              </label>
              <div 
                class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
                [class.border-error]="registerForm.get('pin')?.invalid && registerForm.get('pin')?.touched"
                [class.border-transparent]="!(registerForm.get('pin')?.invalid && registerForm.get('pin')?.touched)">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock</span>
                <input 
                  class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest placeholder:text-outline/60 focus:outline-none" 
                  id="pin" 
                  [type]="showPin() ? 'text' : 'password'"
                  formControlName="pin"
                  maxlength="4"
                  inputmode="numeric"
                  (input)="sanitizePin('pin', $event)"
                  placeholder="••••" 
                  autocomplete="new-password" />
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
              @if (registerForm.get('pin')?.invalid && registerForm.get('pin')?.touched) {
                <span class="font-label-md text-[11px] text-error pt-0.5">PIN must be exactly 4 numeric digits.</span>
              } @else {
                <span class="font-label-md text-[11px] text-outline pt-0.5">Exactly 4 numeric digits</span>
              }
            </div>

            <!-- Confirm PIN -->
            <div class="flex flex-col gap-1">
              <label class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider" for="confirmPin">
                Confirm PIN (4 Digits)
              </label>
              <div 
                class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary"
                [class.border-error]="isPinMismatch() || (registerForm.get('confirmPin')?.invalid && registerForm.get('confirmPin')?.touched)"
                [class.border-transparent]="!(isPinMismatch() || (registerForm.get('confirmPin')?.invalid && registerForm.get('confirmPin')?.touched))">
                <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock_reset</span>
                <input 
                  class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest placeholder:text-outline/60 focus:outline-none" 
                  id="confirmPin" 
                  [type]="showConfirmPin() ? 'text' : 'password'"
                  formControlName="confirmPin"
                  maxlength="4"
                  inputmode="numeric"
                  (input)="sanitizePin('confirmPin', $event)"
                  placeholder="••••" 
                  autocomplete="new-password" />
                <button 
                  type="button" 
                  aria-label="Toggle confirm PIN visibility" 
                  class="absolute right-3 text-outline hover:text-charcoal-text focus:outline-none p-1 transition-colors" 
                  (click)="toggleConfirmPinVisibility()">
                  <span class="material-symbols-outlined text-lg">
                    {{ showConfirmPin() ? 'visibility' : 'visibility_off' }}
                  </span>
                </button>
              </div>
              @if (isPinMismatch()) {
                <span class="font-label-md text-[11px] text-error pt-0.5">PINs do not match</span>
              }
            </div>
          </div>

          <!-- Clean Terms Checkbox -->
          <div class="pt-2 flex items-start gap-2.5">
            <div class="flex items-center h-5 mt-0.5">
              <input 
                class="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-0 cursor-pointer accent-primary" 
                id="ethicsAgreement" 
                type="checkbox"
                formControlName="ethicsAgreement" />
            </div>
            <label class="font-label-md text-charcoal-text font-normal cursor-pointer select-none leading-relaxed text-xs sm:text-sm" for="ethicsAgreement">
              I agree to the <a class="text-secondary font-semibold hover:underline" href="javascript:void(0)">Administrator Guidelines</a> and <a class="text-secondary font-semibold hover:underline" href="javascript:void(0)">Cultural Custody Charter</a>.
            </label>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              [disabled]="isLoading() || !registerForm.get('ethicsAgreement')?.value"
              class="w-full py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold rounded-lg shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-none transition-all flex items-center justify-center gap-2 group cursor-pointer">
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Registering as Administrator...</span>
              } @else {
                <span>Register as Administrator</span>
                <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              }
            </button>
          </div>
        </form>

        <!-- Footer Links -->
        <div class="mt-6 pt-4 flex items-center justify-center border-t border-surface-container-high/40 text-center">
          <a routerLink="/login" class="font-label-md text-secondary hover:text-on-secondary-container transition-colors font-medium flex items-center gap-1.5 cursor-pointer text-sm">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            <span>Already have an account? <strong>Sign in</strong></span>
          </a>
        </div>

      </div>
    </main>
  `
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  cities = signal<City[]>([]);
  showPin = signal<boolean>(false);
  showConfirmPin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  pinValue = signal<string>('');
  confirmPinValue = signal<string>('');

  isPinMismatch = () => {
    const p = this.pinValue();
    const c = this.confirmPinValue();
    return c.length > 0 && p !== c;
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+?[0-9]{9,15}|[0-9]{10})$/)]],
      nicNumber: ['', [Validators.required, Validators.pattern(/^([0-9]{9}[vVxX]|[0-9]{12})$/)]],
      dateOfBirth: ['1990-01-01', [Validators.required, pastDateValidator]],
      cityId: [1, [Validators.required]],
      roleType: ['ADMIN', [Validators.required]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      confirmPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      ethicsAgreement: [false, [Validators.requiredTrue]]
    });

    this.registerForm.get('pin')?.valueChanges.subscribe(val => {
      this.pinValue.set(val || '');
    });

    this.registerForm.get('confirmPin')?.valueChanges.subscribe(val => {
      this.confirmPinValue.set(val || '');
    });
  }

  ngOnInit(): void {
    this.authService.getCities().subscribe(cities => {
      this.cities.set(cities);
    });
  }

  formatNic(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const formatted = input.value.toUpperCase().replace(/[^0-9VX]/g, '');
    if (input.value !== formatted) {
      input.value = formatted;
      this.registerForm.get('nicNumber')?.setValue(formatted);
    }
  }

  sanitizePin(fieldName: 'pin' | 'confirmPin', event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input) return;
    const cleaned = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (input.value !== cleaned) {
      input.value = cleaned;
      this.registerForm.get(fieldName)?.setValue(cleaned);
    }
  }

  togglePinVisibility(): void {
    this.showPin.update(v => !v);
  }

  toggleConfirmPinVisibility(): void {
    this.showConfirmPin.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isPinMismatch()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formVal = this.registerForm.value;

    this.authService.registerAdmin({
      fullName: formVal.fullName,
      phoneNumber: formVal.phoneNumber,
      dateOfBirth: formVal.dateOfBirth,
      nicNumber: formVal.nicNumber,
      cityId: Number(formVal.cityId),
      roleType: formVal.roleType,
      pin: formVal.pin
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Registration failed. Please check your credentials and try again.');
      }
    });
  }
}
