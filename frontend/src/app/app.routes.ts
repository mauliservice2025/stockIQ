import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { JobCardsComponent } from './features/billing/job-cards.component';
import { InventoryComponent } from './features/inventory/inventory.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, title: 'Operations Dashboard · StockIQ' },
      { path: 'billing-dashboard', component: DashboardComponent, title: 'Billing Dashboard · StockIQ' },
      { path: 'job-cards', component: JobCardsComponent, title: 'Job Cards · StockIQ' },
      { path: 'billing-estimates', component: JobCardsComponent, title: 'Estimates · StockIQ' },
      { path: 'draft-bills', component: JobCardsComponent, title: 'Draft Bills · StockIQ' },
      { path: 'final-bills', component: JobCardsComponent, title: 'Tax Invoices · StockIQ' },
      { path: 'vehicle-delivery', component: JobCardsComponent, title: 'Vehicle Delivery · StockIQ' },
      { path: 'inventory', component: InventoryComponent, title: 'Stock Balances · StockIQ' },
      { path: 'opening-balance', component: InventoryComponent, title: 'Opening Balance · StockIQ' },
      { path: 'transfers', component: InventoryComponent, title: 'Stock Transfers · StockIQ' },
      { path: 'receive-transfers', component: InventoryComponent, title: 'Receive Transfers · StockIQ' },
      { path: 'purchase-planning', component: InventoryComponent, title: 'Purchase Planning · StockIQ' },
      { path: 'requisitions', component: InventoryComponent, title: 'Purchase Requisitions · StockIQ' },
      { path: 'orders', component: InventoryComponent, title: 'Purchase Orders · StockIQ' },
      { path: 'grn', component: InventoryComponent, title: 'Goods Receipt · StockIQ' },
      { path: 'suppliers', component: InventoryComponent, title: 'Suppliers · StockIQ' },
      { path: 'item-master', component: InventoryComponent, title: 'Item Master · StockIQ' },
      { path: 'vehicle-compatibility', component: JobCardsComponent, title: 'Vehicle Compatibility · StockIQ' },
      { path: 'service-master', component: JobCardsComponent, title: 'Service Master · StockIQ' },
      { path: 'stores', component: InventoryComponent, title: 'Store Master · StockIQ' },
      { path: 'security-dashboard', component: DashboardComponent, title: 'Security Dashboard · StockIQ' },
      { path: 'users', component: DashboardComponent, title: 'User Master · StockIQ' },
      { path: 'roles', component: DashboardComponent, title: 'Roles & Permissions · StockIQ' },
      { path: 'mis-reports', component: DashboardComponent, title: 'MIS Reports · StockIQ' }
    ]
  },
  { path: '**', redirectTo: '' }
];
