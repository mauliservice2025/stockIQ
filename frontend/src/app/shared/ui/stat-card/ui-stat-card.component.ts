import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card border rounded-md p-3 flex flex-col justify-between min-h-[72px] shadow-card transition-all duration-150">
      <div class="flex items-center justify-between mb-1 gap-2">
        <span class="text-[10.5px] font-semibold text-content-secondary uppercase tracking-wider truncate">{{ label() }}</span>
        @if (icon()) {
          <div [ngClass]="['w-[26px] h-[26px] min-w-[26px] rounded-xs flex items-center justify-center text-xs flex-shrink-0', iconBgClasses()]">
            <span [innerHTML]="icon()"></span>
          </div>
        }
      </div>
      <div class="flex items-baseline justify-between mt-1">
        <span class="text-xl font-bold font-mono tracking-tight text-content-primary">{{ value() }}</span>
        @if (change()) {
          <span
            class="text-status-badge px-1.5 py-0.5 rounded-xs border"
            [ngClass]="isPositive() ? 'badge-success' : 'badge-danger'"
          >
            {{ change() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background-color: var(--bg-card);
      border-color: var(--border-subtle);
    }
    .stat-card:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-glow);
    }
    .icon-primary {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--primary-400);
    }
    .icon-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .icon-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }
    .icon-info {
      background-color: var(--color-info-bg);
      color: var(--color-info);
    }
    .badge-success {
      background-color: var(--color-success-bg);
      color: var(--color-success);
      border-color: var(--color-success-border);
    }
    .badge-danger {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      border-color: var(--color-danger-border);
    }
  `]
})
export class UiStatCardComponent {
  public label = input.required<string>();
  public value = input.required<string | number>();
  public icon = input<string>('');
  public change = input<string>('');
  public isPositive = input<boolean>(true);
  public variant = input<'primary' | 'success' | 'warning' | 'info'>('primary');

  protected iconBgClasses(): string {
    switch (this.variant()) {
      case 'success': return 'icon-success';
      case 'warning': return 'icon-warning';
      case 'info': return 'icon-info';
      default: return 'icon-primary';
    }
  }
}
