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
    <aside class="sidebar-container w-[280px] min-w-[280px] border-r flex flex-col h-[calc(100vh-70px)] sticky top-[70px] select-none">
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        @for (sec of navSections; track sec.id) {
          <div class="space-y-1">
            <!-- Section Header (Accordion trigger) -->
            <button
              class="w-full flex items-center justify-between px-3 py-2 text-menu-heading uppercase tracking-wider text-content-secondary hover:text-content-primary rounded-xs transition-colors cursor-pointer"
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
              <div class="pl-5 space-y-0.5 border-l border-border-subtle ml-4 py-1">
                @for (item of sec.items; track item.route) {
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="active-nav-link text-sidebar-item-active"
                    [routerLinkActiveOptions]="{ exact: false }"
                    class="flex items-center justify-between px-2.5 py-1.5 text-sidebar-item text-content-secondary hover:text-content-primary hover:bg-hover-bg rounded-xs transition-colors"
                  >
                    <span>{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="text-status-badge font-mono px-1.5 py-0.2 rounded-xs badge-info">
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
      <div class="p-3 border-t border-border-subtle text-center text-[10.5px] text-content-muted font-mono">
        StockIQ Enterprise v2.0 · Angular + Tailwind
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      background-color: var(--bg-sidebar);
      border-color: var(--border-subtle);
    }
    .active-nav-link {
      background-color: rgba(99, 102, 241, 0.12);
      color: var(--primary-400);
      border-left: 2px solid var(--primary-500);
    }
    [data-theme="light"] .active-nav-link {
      color: var(--primary-600);
      background-color: rgba(79, 70, 229, 0.08);
    }
    .badge-info {
      background-color: var(--color-info-bg);
      color: var(--color-info);
      border: 1px solid var(--color-info-border);
    }
  `]
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
