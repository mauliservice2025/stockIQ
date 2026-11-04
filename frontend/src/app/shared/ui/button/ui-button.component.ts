import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit($event)"
      [ngClass]="[
        'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 select-none cursor-pointer',
        sizeClasses(),
        variantClasses(),
        disabled() || loading() ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-95'
      ]"
    >
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn-variant-primary {
      background-color: var(--primary-500);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .btn-variant-primary:hover {
      background-color: var(--primary-600);
      box-shadow: var(--shadow-glow);
    }
    .btn-variant-secondary {
      background-color: var(--bg-surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
    }
    .btn-variant-secondary:hover {
      background-color: var(--hover-bg);
      border-color: var(--border-medium);
    }
    .btn-variant-outline {
      background-color: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border-medium);
    }
    .btn-variant-outline:hover {
      background-color: var(--hover-bg);
    }
    .btn-variant-danger {
      background-color: var(--color-danger);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .btn-variant-danger:hover {
      opacity: 0.9;
    }
    .btn-variant-ghost {
      background-color: transparent;
      color: var(--text-secondary);
    }
    .btn-variant-ghost:hover {
      color: var(--text-primary);
      background-color: var(--hover-bg);
    }
    .btn-variant-icon {
      width: var(--btn-icon-size);
      height: var(--btn-icon-size);
      padding: 0;
      background-color: transparent;
      color: var(--text-secondary);
    }
    .btn-variant-icon:hover {
      color: var(--text-primary);
      background-color: var(--hover-bg);
    }
  `]
})
export class UiButtonComponent {
  public variant = input<ButtonVariant>('primary');
  public size = input<ButtonSize>('md');
  public disabled = input<boolean>(false);
  public loading = input<boolean>(false);
  public type = input<'button' | 'submit' | 'reset'>('button');

  public clicked = output<MouseEvent>();

  protected sizeClasses(): string {
    if (this.variant() === 'icon') {
      return 'size-btn-icon';
    }
    switch (this.size()) {
      case 'sm': return 'h-[28px] px-2.5 text-xs';
      case 'lg': return 'h-[38px] px-4 text-sm';
      default: return 'h-[32px] px-3 text-xs';
    }
  }

  protected variantClasses(): string {
    switch (this.variant()) {
      case 'secondary': return 'btn-variant-secondary';
      case 'outline': return 'btn-variant-outline';
      case 'danger': return 'btn-variant-danger';
      case 'ghost': return 'btn-variant-ghost';
      case 'icon': return 'btn-variant-icon';
      default: return 'btn-variant-primary';
    }
  }
}
