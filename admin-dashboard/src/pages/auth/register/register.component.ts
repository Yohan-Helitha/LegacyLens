import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/core/services/auth.service';
import { City } from '../../../app/core/models/auth.model';

// Custom validator for past dates
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate >= today) {
    return { futureDate: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <main class="relative w-full h-screen overflow-y-auto overflow-x-hidden font-body-md text-on-surface">
      
      <!-- Video Background -->
      <video #bgVideo autoplay loop playsinline 
        class="fixed inset-0 w-full h-full object-cover z-0 transition-all duration-700 ease-in-out"
        [class.opacity-80]="!isFormFocused()"
        [class.opacity-30]="isFormFocused()"
        [class.blur-sm]="isFormFocused()">
        <source src="assets/videos/auth/register.mp4" type="video/mp4" />
      </video>
      
      <!-- Dark overlay that deepens on focus -->
      <div class="fixed inset-0 z-0 pointer-events-none transition-colors duration-700 ease-in-out"
        [ngClass]="{'bg-slate-950/20': !isFormFocused(), 'bg-slate-950/70': isFormFocused()}"></div>

      <!-- Scrollable Content Wrapper -->
      <div class="relative z-10 w-full min-h-full flex items-start sm:items-center justify-center p-4 sm:p-6">
        <div class="w-full max-w-lg bg-surface-container-lowest/90 backdrop-blur-md rounded-xl shadow-xl border border-surface-container-high/40 p-6 sm:p-10 my-4 sm:my-8 flex flex-col transition-transform duration-500"
           (focusin)="isFormFocused.set(true)" (focusout)="onFocusOut($event)">
        
          <!-- Header Section -->
          <div class="flex flex-col items-center text-center gap-2 mb-6">
            <h1 class="font-headline-md text-2xl text-charcoal-text font-semibold tracking-tight">Legacy Lens</h1>
            <h2 class="font-headline-sm text-lg text-primary font-medium">Administrator Registration</h2>
            <p class="font-body-md text-on-surface-variant text-sm max-w-sm mt-0.5 leading-relaxed">
              Step {{ currentStep() }} of 2: {{ currentStep() === 1 ? 'Personal Information' : 'Security & Assignment' }}
            </p>
            
            <!-- Stepper Dots -->
            <div class="flex items-center gap-2 mt-2">
              <div class="h-1.5 rounded-full transition-all duration-300" [ngClass]="currentStep() === 1 ? 'w-6 bg-primary' : 'w-2 bg-outline-variant'"></div>
              <div class="h-1.5 rounded-full transition-all duration-300" [ngClass]="currentStep() === 2 ? 'w-6 bg-primary' : 'w-2 bg-outline-variant'"></div>
            </div>
          </div>

          <!-- Error Alert Banner -->
          @if (errorMessage()) {
            <div class="mb-5 p-3.5 rounded-lg bg-error-container/40 border border-error/30 text-error flex items-start gap-2.5 text-xs font-body-md animate-[fadeIn_0.3s_ease-out]">
              <span class="material-symbols-outlined text-lg shrink-0">error</span>
              <div class="flex-1">{{ errorMessage() }}</div>
            </div>
          }

          <!-- Registration Form -->
          <form class="space-y-4" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            
            <!-- STEP 1: Personal Info -->
            @if (currentStep() === 1) {
              <div class="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-4">
                <!-- Full Name -->
                <div class="flex flex-col gap-1">
                  <label for="fullName" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Full Name </label>
                  <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                    [class.border-error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched">
                    <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">badge</span>
                    <input id="fullName" type="text" formControlName="fullName" placeholder="Samantha Senanayake" autocomplete="name"
                      class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" />
                  </div>
                </div>

                <!-- Phone Number -->
                <div class="flex flex-col gap-1">
                  <label for="phoneNumber" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Admin Phone Number </label>
                  <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                    [class.border-error]="registerForm.get('phoneNumber')?.invalid && registerForm.get('phoneNumber')?.touched">
                    <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">phone_iphone</span>
                    <input id="phoneNumber" type="tel" formControlName="phoneNumber" placeholder="Phone Number" autocomplete="tel"
                      class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" />
                  </div>
                </div>

                <!-- NIC & DOB (Row) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- NIC -->
                  <div class="flex flex-col gap-1">
                    <label for="nicNumber" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> National ID (NIC) </label>
                    <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                      [class.border-error]="registerForm.get('nicNumber')?.invalid && registerForm.get('nicNumber')?.touched">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">pin_invoke</span>
                      <input id="nicNumber" type="text" maxlength="12" formControlName="nicNumber" placeholder="199012345678" (input)="formatNic($event)"
                        class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text uppercase placeholder:text-outline/60 focus:outline-none" />
                    </div>
                  </div>
                  <!-- Date of Birth -->
                  <div class="flex flex-col gap-1">
                    <label for="dateOfBirth" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Date of Birth </label>
                    <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                      [class.border-error]="registerForm.get('dateOfBirth')?.invalid && registerForm.get('dateOfBirth')?.touched">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">calendar_month</span>
                      <input id="dateOfBirth" type="date" formControlName="dateOfBirth"
                        class="w-full pl-10 pr-3 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text placeholder:text-outline/60 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div class="pt-2">
                  <button type="button" (click)="nextStep()" [disabled]="isStep1Invalid()"
                    class="w-full py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    <span>Next Step</span>
                    <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </div>
            }

            <!-- STEP 2: Security & Assignment -->
            @if (currentStep() === 2) {
              <div class="animate-[fadeIn_0.4s_ease-out] flex flex-col gap-4">
                <!-- City & Role (Row) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- City -->
                  <div class="flex flex-col gap-1">
                    <label for="cityId" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Administrative City </label>
                    <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                      [class.border-error]="registerForm.get('cityId')?.invalid && registerForm.get('cityId')?.touched">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">location_city</span>
                      <select id="cityId" formControlName="cityId"
                        class="w-full pl-10 pr-8 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text appearance-none focus:outline-none cursor-pointer">
                        <option disabled selected [ngValue]="null">Select City</option>
                        @for (city of cities(); track city.id) {
                          <option [value]="city.id">{{ city.name }}</option>
                        }
                      </select>
                      <span class="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                  <!-- Role -->
                  <div class="flex flex-col gap-1">
                    <label for="roleType" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Role / Dept </label>
                    <div class="relative flex items-center rounded-lg border border-transparent bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">shield_person</span>
                      <select id="roleType" formControlName="roleType" class="w-full pl-10 pr-8 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text appearance-none focus:outline-none cursor-pointer">
                        <option value="ADMIN">Administrator</option>
                      </select>
                      <span class="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-base">expand_more</span>
                    </div>
                  </div>
                </div>

                <!-- PINs (Row) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- PIN -->
                  <div class="flex flex-col gap-1">
                    <label for="pin" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Security PIN </label>
                    <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                      [class.border-error]="registerForm.get('pin')?.invalid && registerForm.get('pin')?.touched">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock</span>
                      <input id="pin" formControlName="pin" maxlength="4" inputmode="numeric" placeholder="••••" autocomplete="new-password"
                        class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest focus:outline-none"
                        [type]="showPin() ? 'text' : 'password'" (input)="sanitizePin('pin', $event)" />
                      <button type="button" class="absolute right-3 text-outline hover:text-charcoal-text focus:outline-none p-1" (click)="togglePinVisibility()">
                        <span class="material-symbols-outlined text-lg">{{ showPin() ? 'visibility' : 'visibility_off' }}</span>
                      </button>
                    </div>
                  </div>
                  <!-- Confirm PIN -->
                  <div class="flex flex-col gap-1">
                    <label for="confirmPin" class="font-label-md text-xs text-charcoal-text font-semibold uppercase tracking-wider"> Confirm PIN </label>
                    <div class="relative flex items-center rounded-lg border bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:border-primary border-transparent"
                      [class.border-error]="(registerForm.get('confirmPin')?.invalid && registerForm.get('confirmPin')?.touched) || isPinMismatch()">
                      <span class="material-symbols-outlined absolute left-3 text-outline text-xl pointer-events-none">lock_reset</span>
                      <input id="confirmPin" formControlName="confirmPin" maxlength="4" inputmode="numeric" placeholder="••••" autocomplete="new-password"
                        class="w-full pl-10 pr-10 py-2.5 bg-transparent font-body-md text-sm text-charcoal-text tracking-widest focus:outline-none"
                        [type]="showConfirmPin() ? 'text' : 'password'" (input)="sanitizePin('confirmPin', $event)" />
                      <button type="button" class="absolute right-3 text-outline hover:text-charcoal-text focus:outline-none p-1" (click)="toggleConfirmPinVisibility()">
                        <span class="material-symbols-outlined text-lg">{{ showConfirmPin() ? 'visibility' : 'visibility_off' }}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Ethics -->
                <div class="flex items-start gap-2.5 mt-2">
                  <div class="flex items-center h-5 mt-0.5">
                    <input id="ethicsAgreement" type="checkbox" formControlName="ethicsAgreement"
                      class="w-4 h-4 rounded border-outline-variant text-primary-container focus:ring-0 cursor-pointer accent-primary" />
                  </div>
                  <label class="font-label-md text-charcoal-text font-normal cursor-pointer select-none leading-relaxed text-xs" for="ethicsAgreement">
                    I agree to the <a routerLink="/guidelines" target="_blank" class="text-secondary font-semibold hover:underline">Administrator Guidelines</a>.
                  </label>
                </div>

                <div class="pt-2 flex gap-3">
                  <button type="button" (click)="prevStep()"
                    class="w-1/3 py-3 px-4 border border-outline/30 hover:bg-surface-container text-charcoal-text font-label-lg font-medium rounded-lg transition-all flex items-center justify-center cursor-pointer">
                    Back
                  </button>
                  <button type="submit" [disabled]="isLoading() || !registerForm.get('ethicsAgreement')?.value"
                    class="w-2/3 py-3 px-6 bg-primary hover:bg-primary-container text-on-primary font-label-lg font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer">
                    @if (isLoading()) {
                      <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Registering...</span>
                    } @else {
                      <span>Create Account</span>
                      <span class="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">check_circle</span>
                    }
                  </button>
                </div>
              </div>
            }
          </form>

          <!-- Footer Links -->
          <div class="mt-6 pt-4 flex flex-col items-center justify-center gap-2 border-t border-surface-container-high/40 text-center">
            <a routerLink="/login" class="font-label-md text-secondary hover:text-on-secondary-container transition-colors font-medium flex items-center gap-1.5 cursor-pointer">
              <span>Already have an account? <strong>Sign In</strong></span>
            </a>
          </div>

        </div>
      </div>
    </main>
  `
})
export class RegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('bgVideo') bgVideo!: ElementRef<HTMLVideoElement>;
  
  registerForm: FormGroup;
  cities = signal<City[]>([]);
  
  // UI State Signals
  currentStep = signal<number>(1);
  isFormFocused = signal<boolean>(false);
  showPin = signal<boolean>(false);
  showConfirmPin = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  pinValue = signal<string>('');
  confirmPinValue = signal<string>('');

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
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^(\+?[0-9]{9,15}|[0-9]{10})$/)]],
      nicNumber: ['', [Validators.required, Validators.pattern(/^([0-9]{9}[vVxX]|[0-9]{12})$/)]],
      dateOfBirth: ['1990-01-01', [Validators.required, pastDateValidator]],
      cityId: [null, [Validators.required]],
      roleType: ['ADMIN', [Validators.required]],
      pin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      confirmPin: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
      ethicsAgreement: [false, [Validators.requiredTrue]]
    });

    this.registerForm.get('pin')?.valueChanges.subscribe(val => this.pinValue.set(val || ''));
    this.registerForm.get('confirmPin')?.valueChanges.subscribe(val => this.confirmPinValue.set(val || ''));
  }

  ngOnInit(): void {
    this.authService.getCities().subscribe(cities => this.cities.set(cities));
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
      
      let isFading = false;
      vid.addEventListener('timeupdate', () => {
        if (vid.duration && vid.duration - vid.currentTime <= 0.6) {
          if (!isFading) {
            isFading = true;
            if (!this.isFormFocused()) vid.style.opacity = '0';
          }
        } else if (vid.currentTime < 0.6) {
          if (isFading) {
            isFading = false;
            if (!this.isFormFocused()) vid.style.opacity = '';
          }
        }
      });
    }
  }

  onFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      this.isFormFocused.set(false);
    }
  }

  isPinMismatch = () => {
    const p = this.pinValue();
    const c = this.confirmPinValue();
    return c.length > 0 && p !== c;
  };

  isStep1Invalid(): boolean {
    const step1Fields = ['fullName', 'phoneNumber', 'nicNumber', 'dateOfBirth'];
    return step1Fields.some(field => this.registerForm.get(field)?.invalid);
  }

  nextStep() {
    // Validate Step 1 fields before proceeding
    const step1Fields = ['fullName', 'phoneNumber', 'nicNumber', 'dateOfBirth'];
    let isValid = true;
    
    step1Fields.forEach(field => {
      const control = this.registerForm.get(field);
      if (control?.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    if (isValid) {
      this.currentStep.set(2);
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set('Please fill in all personal details correctly.');
    }
  }

  prevStep() {
    this.currentStep.set(1);
    this.errorMessage.set(null);
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

  togglePinVisibility(): void { this.showPin.update(v => !v); }
  toggleConfirmPinVisibility(): void { this.showConfirmPin.update(v => !v); }

  onSubmit(): void {
    if (this.registerForm.invalid || this.isPinMismatch()) {
      this.registerForm.markAllAsTouched();
      this.errorMessage.set('Please check all fields carefully.');
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
        this.errorMessage.set(err.message || 'Registration failed. Please try again.');
      }
    });
  }
}
