import { Component, input, output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-backdrop backdrop-blur-sm animate-fade-in"
        (click)="onBackdropClick($event)"
      >
        <div
          [ngClass]="[
            'bg-surface-modal border border-white/10 rounded-lg shadow-modal flex flex-col overflow-hidden transition-all duration-200',
            isFullscreen() ? 'w-full h-full rounded-none' : maxWidthClasses()
          ]"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-surface-default">
            <h3 class="text-sm font-semibold text-content-primary">{{ title() }}</h3>
            <div class="flex items-center gap-2">
              <button
                class="p-1 rounded text-content-secondary hover:text-content-primary hover:bg-white/10 transition-colors"
                (click)="toggleFullscreen()"
                title="Toggle Fullscreen"
              >
                🗖
              </button>
              <button
                class="p-1 rounded text-content-secondary hover:text-content-primary hover:bg-white/10 transition-colors"
                (click)="close.emit()"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-5 overflow-y-auto flex-1">
            <ng-content></ng-content>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-surface-default/50">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class UiModalComponent {
  public isOpen = input<boolean>(false);
  public title = input<string>('Modal Title');
  public size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  public close = output<void>();

  public isFullscreen = signal<boolean>(false);

  public toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  protected maxWidthClasses(): string {
    switch (this.size()) {
      case 'sm': return 'w-full max-w-sm';
      case 'lg': return 'w-full max-w-2xl';
      case 'xl': return 'w-full max-w-4xl';
      default: return 'w-full max-w-lg';
    }
  }
}

