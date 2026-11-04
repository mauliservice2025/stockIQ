import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-pinned-bar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pinned-bar h-9 border-b px-6 flex items-center gap-2 overflow-x-auto text-breadcrumb select-none">
      <span class="text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1 mr-2">
        <span>📌</span> Quick Access:
      </span>
      <a
        routerLink="/job-cards"
        routerLinkActive="active-chip"
        class="chip px-2.5 py-0.5 rounded-xs border text-content-secondary hover:text-content-primary hover:bg-hover-bg font-medium transition-colors cursor-pointer"
      >
        Job Cards
      </a>
      <a
        routerLink="/billing-estimates"
        routerLinkActive="active-chip"
        class="chip px-2.5 py-0.5 rounded-xs border text-content-secondary hover:text-content-primary hover:bg-hover-bg font-medium transition-colors cursor-pointer"
      >
        Estimates
      </a>
      <a
        routerLink="/inventory"
        routerLinkActive="active-chip"
        class="chip px-2.5 py-0.5 rounded-xs border text-content-secondary hover:text-content-primary hover:bg-hover-bg font-medium transition-colors cursor-pointer"
      >
        Stock Balances
      </a>
      <a
        routerLink="/vehicle-compatibility"
        routerLinkActive="active-chip"
        class="chip px-2.5 py-0.5 rounded-xs border text-content-secondary hover:text-content-primary hover:bg-hover-bg font-medium transition-colors cursor-pointer"
      >
        Vehicle Compatibility
      </a>
      <a
        routerLink="/users"
        routerLinkActive="active-chip"
        class="chip px-2.5 py-0.5 rounded-xs border text-content-secondary hover:text-content-primary hover:bg-hover-bg font-medium transition-colors cursor-pointer"
      >
        Users & Roles
      </a>
    </div>
  `,
  styles: [`
    .pinned-bar {
      background-color: var(--bg-toolbar);
      border-color: var(--border-subtle);
    }
    .chip {
      background-color: var(--hover-subtle);
      border-color: var(--border-subtle);
    }
    .active-chip {
      background-color: rgba(99, 102, 241, 0.15) !important;
      color: var(--primary-400) !important;
      border-color: var(--border-accent) !important;
    }
    [data-theme="light"] .active-chip {
      color: var(--primary-600) !important;
      background-color: rgba(79, 70, 229, 0.1) !important;
    }
  `]
})
export class PinnedBarComponent {}
