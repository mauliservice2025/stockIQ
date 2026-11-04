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
          <div class="text-breadcrumb text-content-secondary flex items-center gap-1.5 mb-1">
            <span>Overview</span>
            <span>/</span>
            <span class="text-brand-400 font-medium">Operations Dashboard</span>
          </div>
          <h2 class="text-page-title text-content-primary tracking-tight">Executive Operations Dashboard</h2>
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
              <table class="w-full text-left">
                <thead>
                  <tr class="table-header-row border-b border-border-subtle text-content-secondary uppercase text-table-header bg-surface-table-th">
                    <th class="py-2 px-3 font-semibold">Job Card #</th>
                    <th class="py-2 px-3 font-semibold">Vehicle / Model</th>
                    <th class="py-2 px-3 font-semibold">Customer</th>
                    <th class="py-2 px-3 font-semibold">Status</th>
                    <th class="py-2 px-3 font-semibold text-right">Est. Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-subtle">
                  <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                    <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">JC-2026-0042</td>
                    <td class="py-2.5 px-3">
                      <div class="font-medium text-content-primary">MH 12 AB 1234</div>
                      <div class="text-[11px] text-content-muted">Honda Activa 6G (DLX)</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="text-content-primary font-medium">Rahul Sharma</div>
                      <div class="text-[11px] text-content-muted">9822012345</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <ui-badge variant="info">IN PROGRESS</ui-badge>
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono font-semibold text-content-primary">
                      ₹4,850.00
                    </td>
                  </tr>
                  <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                    <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">JC-2026-0041</td>
                    <td class="py-2.5 px-3">
                      <div class="font-medium text-content-primary">MH 14 DF 5678</div>
                      <div class="text-[11px] text-content-muted">Bajaj Pulsar 150 Twin Disc</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="text-content-primary font-medium">Amit Kulkarni</div>
                      <div class="text-[11px] text-content-muted">9423019876</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <ui-badge variant="warning">ESTIMATED</ui-badge>
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono font-semibold text-content-primary">
                      ₹3,200.00
                    </td>
                  </tr>
                  <tr class="table-data-row text-table-data hover:bg-hover-bg transition-colors">
                    <td class="py-2.5 px-3 font-mono font-semibold text-brand-400">JC-2026-0040</td>
                    <td class="py-2.5 px-3">
                      <div class="font-medium text-content-primary">MH 12 XY 9012</div>
                      <div class="text-[11px] text-content-muted">TVS Jupiter ZX Disc</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <div class="text-content-primary font-medium">Pooja Patil</div>
                      <div class="text-[11px] text-content-muted">9158012344</div>
                    </td>
                    <td class="py-2.5 px-3">
                      <ui-badge variant="success">READY / DELIVERED</ui-badge>
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono font-semibold text-content-primary">
                      ₹2,150.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ui-card>
        </div>

        <!-- System Quick Actions & Facility Stats -->
        <div class="space-y-6">
          <ui-card title="Facility Status · PLANT-01">
            <div class="space-y-3 text-table-data">
              <div class="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span class="text-content-secondary">PostgreSQL Replication</span>
                <ui-badge variant="success">SYNCHRONIZED</ui-badge>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span class="text-content-secondary">Workshop Capacity</span>
                <span class="font-mono font-bold text-content-primary">84% (21/25 Bays)</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span class="text-content-secondary">Technicians on Floor</span>
                <span class="font-mono font-bold text-content-primary">12 Active</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-content-secondary">Audit Trail Status</span>
                <span class="text-brand-400 font-mono text-xs">Immutable On</span>
              </div>
            </div>
          </ui-card>

          <ui-card title="Quick Operations">
            <div class="grid grid-cols-2 gap-2">
              <ui-button variant="secondary" size="sm" class="w-full">
                <span>⚡ Quick Bill</span>
              </ui-button>
              <ui-button variant="secondary" size="sm" class="w-full">
                <span>🔄 Putaway Bin</span>
              </ui-button>
              <ui-button variant="secondary" size="sm" class="w-full">
                <span>📋 Gate Pass</span>
              </ui-button>
              <ui-button variant="secondary" size="sm" class="w-full">
                <span>🔍 Part Lookup</span>
              </ui-button>
            </div>
          </ui-card>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {}
