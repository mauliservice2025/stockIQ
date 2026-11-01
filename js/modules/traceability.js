/* ==========================================================================
   ENTERPRISE ISCM - MATERIAL GENEALOGY & TRACEABILITY (DEPRECATED & REMOVED)
   ========================================================================== */

window.TraceabilityModule = {
  render(container) {
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = '#/inventory';
    }
  }
};
