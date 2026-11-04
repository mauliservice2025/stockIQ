import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  badge?: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="w-[280px] min-w-[280px] bg-surface-sidebar border-r border-white/10 flex flex-col h-[calc(100vh-70px)] sticky top-[70px] select-none">
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        @for (sec of navSections; track sec.id) {
          <div class="space-y-1">
            <!-- Section Header (Accordion trigger) -->
            <button
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-secondary hover:text-content-primary rounded transition-colors"
              (click)="toggleSection(sec.id)"
            >
              <div class="flex items-center gap-2">
                <span>{{ sec.icon }}</span>
                <span>{{ sec.title }}</span>
              </div>
              <span class="text-[10px] transform transition-transform duration-200" [class.rotate-90]="isExpanded(sec.id)">
                ▶
              </span>
            </button>

            <!-- Nav Items -->
            @if (isExpanded(sec.id)) {
              <div class="pl-6 space-y-0.5 border-l border-white/10 ml-4 py-1">
                @for (item of sec.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="bg-brand-500/15 text-brand-400 font-semibold border-l-2 border-brand-500"
                    class="flex items-center justify-between px-2.5 py-1.5 text-xs text-content-secondary hover:text-content-primary hover:bg-white/5 rounded transition-colors"
                  >
                    <span>{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-400">
                        {{ item.badge }}
                      </span>
                    }
                  </a>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer / Version -->
      <div class="p-3 border-t border-white/10 text-center text-[10px] text-content-muted font-mono">
        StockIQ Enterprise v2.0 · Angular + Tailwind
      </div>
    </aside>
  `
})
export class SidebarComponent {
  public expandedSections = signal<Set<string>>(new Set(['billing', 'overview', 'inventory']));

  public navSections: NavSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: '📊',
      items: [
        { label: 'Operations Dashboard', route: '/dashboard' }
      ]
    },
    {
      id: 'billing',
      title: 'Workshop & Billing',
      icon: '🔧',
      items: [
        { label: 'Billing Dashboard', route: '/billing-dashboard' },
        { label: 'Job Cards (Workshop)', route: '/job-cards', badge: 'Active' },
        { label: 'Estimates & Quotations', route: '/billing-estimates' },
        { label: 'Draft Bills & Review', route: '/draft-bills' },
        { label: 'Bill List & GST Invoices', route: '/final-bills' },
        { label: 'Vehicle Delivery', route: '/vehicle-delivery' }
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory & Stores',
      icon: '📦',
      items: [
        { label: 'Stock Balances', route: '/inventory' },
        { label: 'Opening Balance', route: '/opening-balance' },
        { label: 'Stock Transfers', route: '/transfers' },
        { label: 'Receive Transfers', route: '/receive-transfers' }
      ]
    },
    {
      id: 'procurement',
      title: 'Procurement',
      icon: '🛒',
      items: [
        { label: 'Purchase Planning (MRP)', route: '/purchase-planning' },
        { label: 'Requisitions (PR)', route: '/requisitions' },
        { label: 'Purchase Orders (PO)', route: '/orders' },
        { label: 'Goods Receipt (GRN)', route: '/grn' },
        { label: 'Supplier Master', route: '/suppliers' }
      ]
    },
    {
      id: 'masters',
      title: 'Item & Model Masters',
      icon: '⚙️',
      items: [
        { label: 'Item Master (Parts)', route: '/item-master' },
        { label: 'Vehicle Compatibility', route: '/vehicle-compatibility', badge: 'Starred' },
        { label: 'Service Master (Labour)', route: '/service-master' },
        { label: 'Store Master Setup', route: '/stores' }
      ]
    },
    {
      id: 'security',
      title: 'Security & RBAC',
      icon: '🛡️',
      items: [
        { label: 'Security Dashboard', route: '/security-dashboard' },
        { label: 'User Master', route: '/users' },
        { label: 'Roles & Permissions', route: '/roles' }
      ]
    },
    {
      id: 'reports',
      title: 'Analytical Reports',
      icon: '📈',
      items: [
        { label: 'Consolidated MIS Reports', route: '/mis-reports' }
      ]
    }
  ];

  public toggleSection(id: string): void {
    this.expandedSections.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public isExpanded(id: string): boolean {
    return this.expandedSections().has(id);
  }
}

