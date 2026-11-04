# ADR 0004: Mobile & Cross-Platform Architecture - Capacitor

## Context
The business requires mobile access (Android & iOS) for workshop technicians, warehouse pickers, and inventory auditors to scan barcodes, capture vehicle photos, and operate offline/online seamlessly without maintaining two separate native mobile codebases.

## Decision
Adopt **Capacitor** to wrap the Angular web application build:
- Single unified codebase across Web, Android, and iOS.
- Hardware abstraction service (`PlatformService`) with safe web fallbacks for Camera, Barcode Scanning, Geolocation, and Push Notifications.
- Touch-friendly UI (touch targets >= 44px, safe-area-inset CSS support).
- CORS headers in API explicitly whitelist Capacitor origins (`capacitor://localhost`, `http://localhost`, `https://localhost`).

## Consequences
- **Positive:** Maximum code reuse (>95%), unified design system, rapid updates without duplicating business logic.
- **Negative:** Native plugins require platform-specific permissions in `AndroidManifest.xml` and `Info.plist`.

