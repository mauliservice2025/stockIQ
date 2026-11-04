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
          <div class="text-breadcrumb text-content-secondary flex items-center gap-1.5 mb-1">
            <span>Workshop</span>
            <span>/</span>
            <span class="text-brand-400 font-medium">Job Cards</span>
          </div>
          <h2 class="text-page-title text-content-primary tracking-tight">Vehicle Service Job Cards</h2>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="primary" size="sm" (clicked)="isCreateModalOpen.set(true)">
            <span>+ Create Job Card</span>
          </ui-button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-surface-card border border-border-subtle rounded-md p-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Filter by vehicle #, customer name, mobile..."
          class="flex-1 min-w-[200px] form-ctrl"
        />
        <select class="form-ctrl">
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
          <table class="w-full text-left">
            <thead>
              <tr class="table-header-row border-b border-border-subtle text-content-secondary uppercase text-table-header bg-surface-table-th">
                <th class="py-2 px-3 font-semibold">Job Card #</th>
                <th class="py-2 px-3 font-semibold">Vehicle Details</th>
                <th class="py-2 px-3 font-semibold">Customer Info</th>
                <th class="py-2 px-3 font-semibold">Advisor / Tech</th>
                <th class="py-2 px-3 font-semibold">Status</th>
                <th class="py-2 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">JC-2026-0042</td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-content-primary">MH 12 AB 1234</div>
                  <div class="text-[11px] text-content-secondary">★ Honda Activa 6G (DLX)</div>
                  <div class="text-[10px] text-content-muted">Odo: 14,250 km · Fuel: 50%</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-medium text-content-primary">Rahul Sharma</div>
                  <div class="text-[11px] font-mono text-content-secondary">9822012345</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="text-content-primary">R. More (Adv)</div>
                  <div class="text-[10px] text-content-muted">S. Jadhav (Tech)</div>
                </td>
                <td class="py-2.5 px-3">
                  <ui-badge variant="info">IN PROGRESS</ui-badge>
                </td>
                <td class="py-2.5 px-3 text-right space-x-1">
                  <ui-button variant="outline" size="sm">View</ui-button>
                  <ui-button variant="secondary" size="sm">Estimate</ui-button>
                </td>
              </tr>
              <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">JC-2026-0041</td>
                <td class="py-2.5 px-3">
                  <div class="font-bold text-content-primary">MH 14 DF 5678</div>
                  <div class="text-[11px] text-content-secondary">★ Bajaj Pulsar 150 Twin Disc</div>
                  <div class="text-[10px] text-content-muted">Odo: 28,100 km · Fuel: 30%</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="font-medium text-content-primary">Amit Kulkarni</div>
                  <div class="text-[11px] font-mono text-content-secondary">9423019876</div>
                </td>
                <td class="py-2.5 px-3">
                  <div class="text-content-primary">V. Shinde (Adv)</div>
                  <div class="text-[10px] text-content-muted">P. Mane (Tech)</div>
                </td>
                <td class="py-2.5 px-3">
                  <ui-badge variant="warning">ESTIMATED</ui-badge>
                </td>
                <td class="py-2.5 px-3 text-right space-x-1">
                  <ui-button variant="outline" size="sm">View</ui-button>
                  <ui-button variant="secondary" size="sm">Invoice</ui-button>
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
            <label class="block text-form-label text-content-secondary mb-1">Customer Name *</label>
            <input type="text" placeholder="Full name" class="w-full form-ctrl" />
          </div>
          <div>
            <label class="block text-form-label text-content-secondary mb-1">Mobile Number (10 Digits) *</label>
            <input type="tel" maxlength="10" placeholder="10-digit number" class="w-full form-ctrl" />
          </div>
          <div>
            <label class="block text-form-label text-content-secondary mb-1">Vehicle Registration # *</label>
            <input type="text" placeholder="e.g. MH 12 AB 1234" class="w-full form-ctrl uppercase" />
          </div>
          <div>
            <label class="block text-form-label text-content-secondary mb-1">Vehicle Model (Starred Favourites on Top) *</label>
            <select class="w-full form-ctrl">
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
            <label class="block text-form-label text-content-secondary mb-1">Customer Complaints / Requirements</label>
            <textarea rows="3" placeholder="Oil change, brake squeak, general servicing..." class="w-full form-ctrl h-auto py-2"></textarea>
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
