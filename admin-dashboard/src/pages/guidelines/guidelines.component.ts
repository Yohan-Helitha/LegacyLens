import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guidelines',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="w-full min-h-screen p-8 bg-background font-body-md text-on-surface">
      <div class="max-w-3xl mx-auto bg-surface-container-lowest rounded-xl shadow p-8 border border-surface-container-high/40">
        <h1 class="font-headline-md text-3xl text-charcoal-text font-semibold tracking-tight mb-6">Administrator Guidelines</h1>
        
        <div class="space-y-6 text-on-surface-variant leading-relaxed">
          <section>
            <h2 class="font-headline-sm text-xl text-primary font-medium mb-2">1. Code of Conduct</h2>
            <p>
              As an administrator, you are expected to uphold the highest standards of professional and ethical conduct. Your actions reflect on the platform and its mission to preserve cultural heritage.
            </p>
          </section>

          <section>
            <h2 class="font-headline-sm text-xl text-primary font-medium mb-2">2. Data Privacy & Confidentiality</h2>
            <p>
              Administrators have access to sensitive user data and unverified cultural stories. You must not disclose, share, or misuse any information outside the scope of your administrative duties. All actions are logged and subject to audit.
            </p>
          </section>

          <section>
            <h2 class="font-headline-sm text-xl text-primary font-medium mb-2">3. Moderation Standards</h2>
            <p>
              When moderating content or approving stories, strictly adhere to the cultural verification standards. Ensure that all approved content respects the heritage and historical accuracy as defined by the community elders.
            </p>
          </section>

          <section>
            <h2 class="font-headline-sm text-xl text-primary font-medium mb-2">4. Disciplinary Action</h2>
            <p>
              Violations of these guidelines, unauthorized access, or abuse of administrative privileges may result in immediate suspension of access, revocation of your administrator account, and further legal or disciplinary action if necessary.
            </p>
          </section>
        </div>
      </div>
    </main>
  `
})
export class GuidelinesComponent {}

