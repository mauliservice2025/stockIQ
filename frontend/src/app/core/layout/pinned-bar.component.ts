import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pinned-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-9 bg-surface-default/60 backdrop-blur-sm border-b border-white/5 px-6 flex items-center gap-2 overflow-x-auto text-xs select-none">
      <span class="text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1 mr-2">
        <span>📌</span> Quick Access:
      </span>
      <a routerLink="/job-cards" class="px-2.5 py-1 rounded bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 font-medium transition-colors">
        Job Cards
      </a>
      <a routerLink="/billing-estimates" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary font-medium transition-colors">
        Estimates
      </a>
      <a routerLink="/inventory" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary font-medium transition-colors">
        Stock Balances
      </a>
      <a routerLink="/vehicle-compatibility" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary font-medium transition-colors">
        Vehicle Compatibility
      </a>
      <a routerLink="/users" class="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-content-secondary hover:text-content-primary font-medium transition-colors">
        Users & Roles
      </a>
    </div>
  `
})
export class PinnedBarComponent {}

