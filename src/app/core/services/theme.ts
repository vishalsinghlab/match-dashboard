import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';

  readonly currentTheme = signal<AppTheme>('dark');

  constructor() {
    this.initTheme();
  }

  initTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as AppTheme | null;
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      this.applyTheme(savedTheme);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      this.applyTheme(prefersLight ? 'light' : 'dark');
    }
  }

  setTheme(theme: AppTheme): void {
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  cycleTheme(): void {
    const nextTheme: AppTheme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  private applyTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}

