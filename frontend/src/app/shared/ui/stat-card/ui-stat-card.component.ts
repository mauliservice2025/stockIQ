import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden bg-surface-card border border-white/10 rounded-md p-3 flex flex-col justify-between min-h-[72px] shadow-sm hover:border-brand-500/40 hover:-translate-y-0.5 hover:shadow-glow transition-all duration-150">
      <div class="flex items-center justify-between mb-1 gap-2">
        <span class="text-[10.5px] font-semibold text-content-secondary uppercase tracking-wider truncate">{{ label() }}</span>
        @if (icon()) {
          <div [ngClass]="['w-6 h-6 min-w-6 rounded flex items-center justify-center text-xs flex-shrink-0', iconBgClasses()]">
            <span [innerHTML]="icon()"></span>
          </div>
        }
      </div>
      <div class="flex items-baseline justify-between mt-1">
        <span class="text-xl font-bold font-mono tracking-tight text-content-primary">{{ value() }}</span>
        @if (change()) {
          <span [ngClass]="['text-[11px] font-semibold px-1.5 py-0.5 rounded', isPositive() ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger']">
            {{ change() }}
          </span>
        }
      </div>
    </div>
  `
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
      case 'success': return 'bg-status-success/15 text-status-success';
      case 'warning': return 'bg-status-warning/15 text-status-warning';
      case 'info': return 'bg-status-info/15 text-status-info';
      default: return 'bg-brand-500/15 text-brand-400';
    }
  }
}

