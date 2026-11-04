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
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border',
        variantClasses()
      ]"
    >
      <ng-content></ng-content>
    </span>
  `
})
export class UiBadgeComponent {
  public variant = input<BadgeVariant>('neutral');

  protected variantClasses(): string {
    switch (this.variant()) {
      case 'success':
        return 'bg-status-success/15 text-status-success border-status-success/30';
      case 'warning':
        return 'bg-status-warning/15 text-status-warning border-status-warning/30';
      case 'danger':
        return 'bg-status-danger/15 text-status-danger border-status-danger/30';
      case 'info':
        return 'bg-status-info/15 text-status-info border-status-info/30';
      case 'purple':
        return 'bg-status-purple/15 text-status-purple border-status-purple/30';
      default:
        return 'bg-white/10 text-content-secondary border-white/15';
    }
  }
}

