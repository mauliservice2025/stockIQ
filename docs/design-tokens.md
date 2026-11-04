# StockIQ Design Tokens Specification

**Source:** `css/variables.css`, `css/layout.css`, `css/components.css`
**Compliance:** 100% Visual Parity with Zero Deviation

---

## 1. Color Palette Tokens

### 1.1 Brand & Accents
| Token Name | Dark Mode Value | Light Mode Value | Tailwind Token (`theme.extend.colors`) |
|------------|-----------------|------------------|----------------------------------------|
| `--primary-50` | `#eef2ff` | `#eef2ff` | `brand.50` |
| `--primary-100` | `#e0e7ff` | `#e0e7ff` | `brand.100` |
| `--primary-300` | `#a5b4fc` | `#4f46e5` | `brand.300` |
| `--primary-400` | `#818cf8` | `#6366f1` | `brand.400` |
| `--primary-500` | `#6366f1` | `#4f46e5` | `brand.500` |
| `--primary-600` | `#4f46e5` | `#4338ca` | `brand.600` |
| `--primary-700` | `#4338ca` | `#3730a3` | `brand.700` |
| `--primary-glow` | `rgba(99, 102, 241, 0.35)` | `rgba(79, 70, 229, 0.2)` | `brand.glow` |

### 1.2 Surface & Backgrounds
| Token Name | Dark Mode Value | Light Mode Value | Tailwind Token |
|------------|-----------------|------------------|----------------|
| `--bg-app` | `#080c14` | `#f4f6fb` | `surface.app` |
| `--bg-sidebar` | `#0b111e` | `#ffffff` | `surface.sidebar` |
| `--bg-header` | `rgba(11, 17, 30, 0.85)` | `rgba(255, 255, 255, 0.92)` | `surface.header` |
| `--bg-card` | `rgba(17, 24, 39, 0.85)` | `#ffffff` | `surface.card` |
| `--bg-card-hover` | `rgba(26, 36, 56, 0.95)` | `#f8fafc` | `surface.card-hover` |
| `--bg-surface` | `#131b2e` | `#ffffff` | `surface.default` |
| `--bg-surface-elevated`| `#1a243b` | `#f8fafc` | `surface.elevated` |
| `--bg-input` | `#0e1626` | `#ffffff` | `surface.input` |
| `--bg-modal` | `#0f172a` | `#ffffff` | `surface.modal` |
| `--bg-modal-backdrop` | `rgba(2, 6, 23, 0.72)` | `rgba(15, 23, 42, 0.45)` | `surface.backdrop` |

### 1.3 Typography Colors
| Token Name | Dark Mode Value | Light Mode Value | Tailwind Token |
|------------|-----------------|------------------|----------------|
| `--text-primary` | `#f8fafc` | `#0f172a` | `content.primary` |
| `--text-secondary` | `#94a3b8` | `#334155` | `content.secondary` |
| `--text-muted` | `#64748b` | `#64748b` | `content.muted` |
| `--text-inverse` | `#0f172a` | `#ffffff` | `content.inverse` |

### 1.4 Status & Functional Colors
| Status | Base Color | Background Tint | Border Tint |
|--------|------------|-----------------|-------------|
| **Success** | `#10b981` (Dark) / `#059669` (Light) | `rgba(16, 185, 129, 0.12)` | `rgba(16, 185, 129, 0.3)` |
| **Warning** | `#f59e0b` (Dark) / `#d97706` (Light) | `rgba(245, 158, 11, 0.12)` | `rgba(245, 158, 11, 0.3)` |
| **Danger** | `#ef4444` (Dark) / `#dc2626` (Light) | `rgba(239, 68, 68, 0.12)` | `rgba(239, 68, 68, 0.3)` |
| **Info** | `#06b6d4` (Dark) / `#0284c7` (Light) | `rgba(6, 182, 212, 0.12)` | `rgba(6, 182, 212, 0.3)` |
| **Purple** | `#a855f7` (Dark) / `#7c3aed` (Light) | `rgba(168, 85, 247, 0.12)` | `rgba(168, 85, 247, 0.3)` |

---

## 2. Typography Tokens

- **Font Family (Sans):** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Family (Mono):** `'JetBrains Mono', 'SF Mono', Consolas, monospace`

| Role / Element | Font Size | Font Weight | Line Height |
|----------------|-----------|-------------|-------------|
| Page Title | `20px` (`1.25rem`) | `700` (Bold) | `1.2` |
| Section / Card Title | `16px` (`1rem`) | `600` (Semi-bold) | `1.25` |
| Menu Heading | `13px` (`0.8125rem`)| `600` (Semi-bold) | `1.2` |
| Sidebar Menu Item | `14px` (`0.875rem`)| `400` / `500` | `1.3` |
| Selected Menu Item | `14px` (`0.875rem`)| `600` (Semi-bold) | `1.3` |
| Form Label | `12.5px` | `500` (Medium) | `1.2` |
| Dropdown / Input Text | `13px` | `400` / `500` | `1.2` |
| Table Header | `12px` | `600` (Semi-bold) | `1.2` |
| Table Cell Data | `13px` | `400` (Regular) | `1.25` |
| Status Badge | `11px` | `600` (Semi-bold) | `1.1` |
| Breadcrumb | `12.5px` | `400` / `500` | `1.2` |
| Pagination Controls | `12.5px` | `500` (Medium) | `1.2` |

---

## 3. Geometry & Layout Dimensions

| Component | Standard Dimension |
|-----------|--------------------|
| Sidebar Width (Expanded) | `280px` |
| Sidebar Width (Collapsed) | `72px` |
| Header Height | `70px` |
| Form Control Height (Default) | `34px` |
| Form Control Height (Small) | `30px` |
| Form Control Height (Extra Small) | `26px` |
| Button Height (Default) | `32px` |
| Button Height (Small) | `28px` |
| Icon Button Size | `28px x 28px` |
| Table Header Row Height | `38px` |
| Table Data Row Height | `42px` |
| Minimum Mobile Touch Target | `44px` |

---

## 4. Radii & Elevation (Shadows)

### Radii
- `radius-xs`: `4px`
- `radius-sm`: `8px`
- `radius-md`: `12px`
- `radius-lg`: `18px`
- `radius-xl`: `24px`
- `radius-full`: `9999px`

### Shadows
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.3)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.4)`
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.5)`
- `shadow-glow`: `0 0 25px rgba(99, 102, 241, 0.35)`

