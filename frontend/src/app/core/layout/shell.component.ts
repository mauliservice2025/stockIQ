import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { PinnedBarComponent } from './pinned-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, PinnedBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-viewport flex flex-col bg-surface-app text-content-primary">
      <app-header />
      <app-pinned-bar />
      <div class="flex-1 flex overflow-hidden">
        <app-sidebar />
        <main class="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class ShellComponent {}

