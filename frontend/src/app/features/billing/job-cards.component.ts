import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../shared/ui/button/ui-button.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';

interface VehicleModel {
  id: string;
  name: string;
  brand: string;
  isStarred: boolean;
}

@Component({
  selector: 'app-job-cards',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiButtonComponent, UiModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div class="text-xs text-content-secondary flex items-center gap-1.5 mb-1">
            <span>Workshop</span>
            <span>/</span>
            <span class="text-brand-400 font-medium">Job Cards</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-content-primary">Vehicle Service Job Cards</h2>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="primary" size="sm" (clicked)="isCreateModalOpen.set(true)">
            <span>+ Create Job Card</span>
          </ui-button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-surface-card border border-white/10 rounded-md p-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by vehicle #, customer name, mobile..."
          class="flex-1 min-w-[200px] bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10 focus:outline-none focus:border-brand-500"
        />
        <select class="bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ESTIMATED">Estimated</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="DELIVERED">Delivered</option>
        </select>
        <ui-button variant="secondary" size="sm">Search</ui-button>
      </div>

      <!-- Job Cards Table -->
      <ui-card>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-white/10 text-content-secondary uppercase text-[11px] font-semibold">
                <th class="py-2.5 px-3">Job Card #</th>
                <th class="py-2.5 px-3">Vehicle Details</th>
                <th class="py-2.5 px-3">Customer Info</th>
                <th class="py-2.5 px-3">Advisor / Tech</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr class="hover:bg-white/5 transition-colors">
                <td class="py-3 px-3 font-mono font-semibold text-brand-400">JC-2026-0042</td>
                <td class="py-3 px-3">
                  <div class="font-bold text-content-primary">MH 12 AB 1234</div>
                  <div class="text-[11px] text-content-secondary">★ Honda Activa 6G (DLX)</div>
                  <div class="text-[10px] text-content-muted">Odo: 14,250 km · Fuel: 50%</div>
                </td>
                <td class="py-3 px-3">
                  <div class="font-medium text-content-primary">Rahul Sharma</div>
                  <div class="text-[11px] font-mono text-content-secondary">9822012345</div>
                </td>
                <td class="py-3 px-3">
                  <div>R. More (Adv)</div>
                  <div class="text-[10px] text-content-muted">S. Jadhav (Tech)</div>
                </td>
                <td class="py-3 px-3">
                  <ui-badge variant="info">IN PROGRESS</ui-badge>
                </td>
                <td class="py-3 px-3 text-right space-x-1">
                  <ui-button variant="outline" size="sm">View</ui-button>
                  <ui-button variant="secondary" size="sm">Estimate</ui-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ui-card>

      <!-- Create Job Card Modal -->
      <ui-modal
        [isOpen]="isCreateModalOpen()"
        title="Create New Job Card (Intake)"
        size="lg"
        (close)="isCreateModalOpen.set(false)"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-content-secondary mb-1">Customer Name *</label>
            <input type="text" placeholder="Full name" class="w-full bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-content-secondary mb-1">Mobile Number (10 Digits) *</label>
            <input type="tel" maxlength="10" placeholder="10-digit number" class="w-full bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-content-secondary mb-1">Vehicle Registration # *</label>
            <input type="text" placeholder="e.g. MH 12 AB 1234" class="w-full bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10 uppercase" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-content-secondary mb-1">Vehicle Model (Starred Favourites on Top) *</label>
            <select class="w-full bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10">
              <optgroup label="⭐ Favourite Models">
                @for (m of favouriteModels(); track m.id) {
                  <option [value]="m.id">★ {{ m.brand }} {{ m.name }}</option>
                }
              </optgroup>
              <optgroup label="All Models">
                @for (m of otherModels(); track m.id) {
                  <option [value]="m.id">{{ m.brand }} {{ m.name }}</option>
                }
              </optgroup>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-content-secondary mb-1">Customer Complaints / Requirements</label>
            <textarea rows="3" placeholder="Oil change, brake squeak, general servicing..." class="w-full bg-surface-input text-xs text-content-primary rounded px-3 py-1.5 border border-white/10"></textarea>
          </div>
        </div>

        <div modal-footer class="flex items-center gap-2">
          <ui-button variant="outline" size="sm" (clicked)="isCreateModalOpen.set(false)">Cancel</ui-button>
          <ui-button variant="primary" size="sm" (clicked)="isCreateModalOpen.set(false)">Generate Job Card</ui-button>
        </div>
      </ui-modal>
    </div>
  `
})
export class JobCardsComponent {
  public isCreateModalOpen = signal<boolean>(false);

  public favouriteModels = signal<VehicleModel[]>([
    { id: 'MOD-001', brand: 'Honda', name: 'Activa 6G (DLX)', isStarred: true },
    { id: 'MOD-002', brand: 'Bajaj', name: 'Pulsar 150 Twin Disc', isStarred: true },
    { id: 'MOD-003', brand: 'TVS', name: 'Jupiter ZX Disc', isStarred: true },
    { id: 'MOD-004', brand: 'Hero', name: 'Splendor Plus XTEC', isStarred: true }
  ]);

  public otherModels = signal<VehicleModel[]>([
    { id: 'MOD-010', brand: 'Honda', name: 'Shine 125 Drum', isStarred: false },
    { id: 'MOD-011', brand: 'Royal Enfield', name: 'Classic 350', isStarred: false },
    { id: 'MOD-012', brand: 'Yamaha', name: 'FZ-S Fi V4', isStarred: false }
  ]);
}

