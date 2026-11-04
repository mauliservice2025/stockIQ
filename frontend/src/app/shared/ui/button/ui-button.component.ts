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
        'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/50 select-none',
        sizeClasses(),
        variantClasses(),
        disabled() || loading() ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-95 cursor-pointer'
      ]"
    >
      @if (loading()) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class UiButtonComponent {
  public variant = input<ButtonVariant>('primary');
  public size = input<ButtonSize>('md');
  public disabled = input<boolean>(false);
  public loading = input<boolean>(false);
  public type = input<'button' | 'submit' | 'reset'>('button');

  public clicked = output<MouseEvent>();

  protected sizeClasses(): string {
    switch (this.size()) {
      case 'sm': return 'h-7 px-2.5 text-xs';
      case 'lg': return 'h-11 px-5 text-base';
      default: return 'h-8 px-3.5 text-xs';
    }
  }

  protected variantClasses(): string {
    switch (this.variant()) {
      case 'secondary':
        return 'bg-surface-elevated text-content-primary border border-white/10 hover:bg-white/10 shadow-sm';
      case 'outline':
        return 'bg-transparent text-content-primary border border-white/20 hover:bg-white/5';
      case 'danger':
        return 'bg-status-danger text-white hover:bg-red-600 shadow-sm';
      case 'ghost':
        return 'bg-transparent text-content-secondary hover:text-content-primary hover:bg-white/5';
      case 'icon':
        return 'h-7 w-7 p-0 bg-transparent text-content-secondary hover:text-content-primary hover:bg-white/10 rounded-md';
      default:
        return 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-glow';
    }
  }
}

