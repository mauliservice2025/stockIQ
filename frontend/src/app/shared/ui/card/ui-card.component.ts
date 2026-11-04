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
        'card-container border rounded-md p-4 transition-all duration-200 shadow-card backdrop-blur-md',
        hoverable() ? 'card-hoverable' : ''
      ]"
    >
      @if (title()) {
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
          <h3 class="text-section-title text-content-primary">{{ title() }}</h3>
          <ng-content select="[card-actions]"></ng-content>
        </div>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card-container {
      background-color: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .card-hoverable:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-glow);
    }
  `]
})
export class UiCardComponent {
  public title = input<string>('');
  public hoverable = input<boolean>(false);
}
