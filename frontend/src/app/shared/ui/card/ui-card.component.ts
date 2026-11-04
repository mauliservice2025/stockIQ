import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [ngClass]="[
        'bg-surface-card border border-white/10 rounded-md p-4 transition-all duration-200 shadow-card backdrop-blur-md',
        hoverable() ? 'hover:border-brand-500/40 hover:-translate-y-0.5 hover:shadow-glow' : ''
      ]"
    >
      @if (title()) {
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
          <h3 class="text-sm font-semibold text-content-primary">{{ title() }}</h3>
          <ng-content select="[card-actions]"></ng-content>
        </div>
      }
      <ng-content></ng-content>
    </div>
  `
})
export class UiCardComponent {
  public title = input<string>('');
  public hoverable = input<boolean>(false);
}

