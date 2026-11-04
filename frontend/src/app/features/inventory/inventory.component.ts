import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div class="text-breadcrumb text-content-secondary flex items-center gap-1.5 mb-1">
            <span>Inventory & Logistics</span>
            <span>/</span>
            <span class="text-brand-400 font-medium">Stock Balances</span>
          </div>
          <h2 class="text-page-title text-content-primary tracking-tight">Real-Time Stock Balances & Bin Allocation</h2>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="outline" size="sm">Export CSV</ui-button>
          <ui-button variant="primary" size="sm">+ Stock Transfer</ui-button>
        </div>
      </div>

      <ui-card>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="table-header-row border-b border-border-subtle text-content-secondary uppercase text-table-header bg-surface-table-th">
                <th class="py-2 px-3 font-semibold">Part # / SKU</th>
                <th class="py-2 px-3 font-semibold">Description</th>
                <th class="py-2 px-3 font-semibold">Bin Location</th>
                <th class="py-2 px-3 font-semibold text-right">Available Qty</th>
                <th class="py-2 px-3 font-semibold text-right">Unit MRP</th>
                <th class="py-2 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">SKU-OIL-10W30</td>
                <td class="py-2.5 px-3 font-medium text-content-primary">4T Plus 10W-30 Premium Engine Oil 900ml</td>
                <td class="py-2.5 px-3 font-mono text-content-secondary">BIN-A-01-04</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-status-success">142 Can</td>
                <td class="py-2.5 px-3 text-right font-mono font-medium text-content-primary">₹385.00</td>
                <td class="py-2.5 px-3"><ui-badge variant="success">IN STOCK</ui-badge></td>
              </tr>
              <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">SKU-BRK-SHO-01</td>
                <td class="py-2.5 px-3 font-medium text-content-primary">Rear Brake Shoe Set (Activa / Dio / Pleasure)</td>
                <td class="py-2.5 px-3 font-mono text-content-secondary">BIN-B-02-11</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-status-warning">4 Set</td>
                <td class="py-2.5 px-3 text-right font-mono font-medium text-content-primary">₹240.00</td>
                <td class="py-2.5 px-3"><ui-badge variant="warning">REORDER LEVEL</ui-badge></td>
              </tr>
              <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">SKU-SPK-PLG-09</td>
                <td class="py-2.5 px-3 font-medium text-content-primary">Champion Copper Plus Spark Plug RG6YC</td>
                <td class="py-2.5 px-3 font-mono text-content-secondary">BIN-C-01-02</td>
                <td class="py-2.5 px-3 text-right font-mono font-bold text-status-success">85 Pcs</td>
                <td class="py-2.5 px-3 text-right font-mono font-medium text-content-primary">₹125.00</td>
                <td class="py-2.5 px-3"><ui-badge variant="success">IN STOCK</ui-badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </ui-card>
    </div>
  `
})
export class InventoryComponent {}
