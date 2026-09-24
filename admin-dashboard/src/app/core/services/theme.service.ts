import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggle(): void {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
    this.applyTheme(newTheme);
  }

  private applyTheme(t: Theme): void {
    document.documentElement.setAttribute('data-le-theme', t);
    try {
      localStorage.setItem('le-theme', t);
    } catch (e) {}
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private loadTheme(): Theme {
    return (localStorage.getItem('le-theme') as Theme) || 'dark';
  }
}
