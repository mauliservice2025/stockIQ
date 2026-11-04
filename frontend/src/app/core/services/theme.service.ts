import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'dark' | 'light' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'STOCKIQ_THEME';
  public currentTheme = signal<AppTheme>('dark');

  constructor() {
    const saved = (localStorage.getItem(this.STORAGE_KEY) as AppTheme) || 'dark';
    this.currentTheme.set(saved);
    this.applyTheme(saved);

    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
  }

  public toggleTheme(): void {
    const next = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}

