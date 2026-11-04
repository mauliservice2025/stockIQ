import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';
import { UiCardComponent } from '../../shared/ui/card/ui-card.component';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiButtonComponent } from '../../shared/ui/button/ui-button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UiStatCardComponent, UiCardComponent, UiBadgeComponent, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div class="text-xs text-content-secondary flex items-center gap-1.5 mb-1">
            <span>Overview</span>
            <span>/</span>
            <span class="text-brand-400 font-medium">Operations Dashboard</span>
          </div>
          <h2 class="text-xl font-bold tracking-tight text-content-primary">Executive Operations Dashboard</h2>
        </div>
        <div class="flex items-center gap-2">
          <ui-button variant="outline" size="sm">
            <span>Export Report</span>
          </ui-button>
          <ui-button variant="primary" size="sm">
            <span>+ New Job Card</span>
          </ui-button>
        </div>
      </div>

      <!-- 4 KPI Cards (matches legacy kpi-grid) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ui-stat-card
          label="Active Job Cards"
          value="42"
          change="+12% today"
          [isPositive]="true"
          variant="primary"
          icon="🔧"
        />
        <ui-stat-card
          label="Total Inventory Value"
          value="₹18,45,200"
          change="+3.4% mo"
          [isPositive]="true"
          variant="info"
          icon="📦"
        />
        <ui-stat-card
          label="Low Stock Alerts"
          value="7 Items"
          change="Urgent"
          [isPositive]="false"
          variant="warning"
          icon="⚠️"
        />
        <ui-stat-card
          label="Today's Revenue"
          value="₹84,250"
          change="+18% vs avg"
          [isPositive]="true"
          variant="success"
          icon="₹"
        />
      </div>

      <!-- Main Dashboard Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Live Job Cards Table (2 columns wide) -->
        <div class="lg:col-span-2">
          <ui-card title="Recent Workshop Job Cards">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-white/10 text-content-secondary uppercase text-[11px] font-semibold">
                    <th class="py-2.5 px-3">Job Card #</th>
                    <th class="py-2.5 px-3">Vehicle / Model</th>
                    <th class="py-2.5 px-3">Customer</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 px-3 text-right">Est. Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 px-3 font-mono font-semibold text-brand-400">JC-2026-0042</td>
                    <td class="py-3 px-3">
                      <div class="font-medium text-content-primary">MH 12 AB 1234</div>
                      <div class="text-[11px] text-content-muted">Honda Activa 6G (DLX)</div>
                    </td>
                    <td class="py-3 px-3">
                      <div>Rahul Sharma</div>
                      <div class="text-[11px] text-content-muted">9822012345</div>
                    </td>
                    <td class="py-3 px-3">
                      <ui-badge variant="info">IN PROGRESS</ui-badge>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-medium">₹2,450</td>
                  </tr>
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 px-3 font-mono font-semibold text-brand-400">JC-2026-0041</td>
                    <td class="py-3 px-3">
                      <div class="font-medium text-content-primary">MH 14 CD 5678</div>
                      <div class="text-[11px] text-content-muted">Bajaj Pulsar 150 Twin Disc</div>
                    </td>
                    <td class="py-3 px-3">
                      <div>Amit Kulkarni</div>
                      <div class="text-[11px] text-content-muted">9822054321</div>
                    </td>
                    <td class="py-3 px-3">
                      <ui-badge variant="warning">ESTIMATED</ui-badge>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-medium">₹5,120</td>
                  </tr>
                  <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-3 px-3 font-mono font-semibold text-brand-400">JC-2026-0040</td>
                    <td class="py-3 px-3">
                      <div class="font-medium text-content-primary">MH 12 EF 9012</div>
                      <div class="text-[11px] text-content-muted">TVS Jupiter ZX Disc</div>
                    </td>
                    <td class="py-3 px-3">
                      <div>Sunil Shinde</div>
                      <div class="text-[11px] text-content-muted">9822098765</div>
                    </td>
                    <td class="py-3 px-3">
                      <ui-badge variant="success">COMPLETED</ui-badge>
                    </td>
                    <td class="py-3 px-3 text-right font-mono font-medium">₹1,850</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ui-card>
        </div>

        <!-- Quick Metrics / Stock Breakdown -->
        <div>
          <ui-card title="Warehouse Stock Health">
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-content-secondary">Spare Parts Availability</span>
                  <span class="font-semibold text-content-primary">92%</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-brand-500 h-2 rounded-full" style="width: 92%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-content-secondary">Fast Moving Consumables</span>
                  <span class="font-semibold text-content-primary">78%</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-status-success h-2 rounded-full" style="width: 78%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-content-secondary">Bin Capacity Utilization</span>
                  <span class="font-semibold text-content-primary">64%</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-status-info h-2 rounded-full" style="width: 64%"></div>
                </div>
              </div>

              <div class="p-3 bg-surface-elevated rounded border border-white/5 mt-4">
                <div class="text-xs font-semibold text-content-primary mb-1">Active Facility Context</div>
                <div class="text-[11px] text-content-secondary leading-relaxed">
                  PostgreSQL 17 live connection active. Real-time synchronizations enabled across Pune Central & Chakan units.
                </div>
              </div>
            </div>
          </ui-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {}

