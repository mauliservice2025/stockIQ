import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';
import { FacilityService } from '../services/facility.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header-container h-[70px] backdrop-blur-md border-b px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <!-- Left: Brand / Facility -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-md bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
            SIQ
          </div>
          <div class="hidden sm:block">
            <h1 class="text-sm font-bold text-content-primary leading-tight">StockIQ Enterprise</h1>
            <span class="text-[10.5px] text-brand-400 font-mono tracking-wider uppercase">AutoGarage & SCM v2.0</span>
          </div>
        </div>

        <div class="h-5 w-px bg-border-subtle mx-1 hidden sm:block"></div>

        <!-- Facility Switcher -->
        <div class="relative">
          <select
            class="h-ctrl bg-surface-elevated text-content-primary text-input font-medium px-3 pr-8 rounded-xs border border-border-subtle focus:outline-none focus:border-brand-500 cursor-pointer appearance-none transition-colors"
            [value]="facilityService.currentFacility().id"
            (change)="onFacilityChange($event)"
          >
            @for (f of facilityService.facilities(); track f.id) {
              <option [value]="f.id">{{ f.name }} ({{ f.code }})</option>
            }
          </select>
          <div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-content-secondary text-[10px]">
            ▼
          </div>
        </div>
      </div>

      <!-- Center: Global Quick Search -->
      <div class="hidden md:flex items-center relative w-80">
        <input
          type="text"
          placeholder="Quick search job cards, parts, orders... (Ctrl+K)"
          class="w-full h-ctrl bg-surface-input text-content-primary placeholder:text-content-muted text-input rounded-xs pl-8 pr-3 border border-border-subtle focus:outline-none focus:border-brand-500 transition-colors"
        />
        <svg class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      <!-- Right: Theme, Notifications, User Profile -->
      <div class="flex items-center gap-3">
        <!-- Theme Toggle -->
        <button
          class="size-btn-icon rounded-xs flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-hover-bg transition-colors cursor-pointer border border-border-subtle"
          (click)="themeService.toggleTheme()"
          [title]="'Current Theme: ' + themeService.currentTheme()"
        >
          @if (themeService.currentTheme() === 'dark') {
            <span class="text-sm">🌙</span>
          } @else {
            <span class="text-sm">☀️</span>
          }
        </button>

        <!-- User Profile Pill -->
        <div class="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
          <div class="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {{ userInitial() }}
          </div>
          <div class="hidden lg:block text-left">
            <div class="text-xs font-semibold text-content-primary leading-tight">{{ authService.currentUser()?.fullName }}</div>
            <div class="text-[10px] text-content-muted font-mono leading-none">{{ authService.currentUser()?.primaryRole }}</div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      background-color: var(--bg-header);
      border-color: var(--border-subtle);
    }
  `]
})
export class HeaderComponent {
  public themeService = inject(ThemeService);
  public facilityService = inject(FacilityService);
  public authService = inject(AuthService);

  public onFacilityChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.facilityService.selectFacility(val);
  }

  public userInitial(): string {
    const name = this.authService.currentUser()?.fullName || 'User';
    return name.charAt(0);
  }
}
