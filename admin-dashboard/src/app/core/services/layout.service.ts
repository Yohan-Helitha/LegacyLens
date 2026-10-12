import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private platformId = inject(PLATFORM_ID);
  
  mobileSidebarOpen = signal<boolean>(false);
  isMobile = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
    }
  }

  private checkScreenSize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  toggleMobileSidebar() {
    this.mobileSidebarOpen.update(val => !val);
  }

  closeMobileSidebar() {
    this.mobileSidebarOpen.set(false);
  }
}
