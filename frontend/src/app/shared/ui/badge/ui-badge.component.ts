import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [ngClass]="[
        'inline-flex items-center px-2 py-0.5 rounded-xs text-status-badge border transition-colors select-none',
        variantClasses()
      ]"
    >
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
      border-color: var(--color-success-border);
    }
    .badge-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
      border-color: var(--color-warning-border);
    }
    .badge-danger {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      border-color: var(--color-danger-border);
    }
    .badge-info {
      background-color: var(--color-info-bg);
      color: var(--color-info);
      border-color: var(--color-info-border);
    }
    .badge-purple {
      background-color: var(--color-purple-bg);
      color: var(--color-purple);
      border-color: var(--color-purple-border);
    }
    .badge-neutral {
      background-color: var(--hover-bg);
      color: var(--text-secondary);
      border-color: var(--border-subtle);
    }
  `]
})
export class UiBadgeComponent {
  public variant = input<BadgeVariant>('neutral');

  protected variantClasses(): string {
    switch (this.variant()) {
      case 'success':
        return 'badge-success';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      case 'info':
        return 'badge-info';
      case 'purple':
        return 'badge-purple';
      default:
        return 'badge-neutral';
    }
  }
}
