const fs = require('fs');
const path = require('path');
const assert = require('assert');

const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const match = appJs.match(/window\.renderInventoryLogisticsTabs\s*=\s*function[\s\S]*?^};/m);
if (match) {
  const window = {
    location: { hash: '#/inventory' },
    App: { canAccessRoute: () => true },
    State: { hasPermission: () => true }
  };
  eval(match[0]);
  const html = window.renderInventoryLogisticsTabs('#/inventory');
  console.log('Rendered tabs HTML:\n', html);
  assert(!html.includes('Genealogy'), 'HTML must not include Genealogy');
  assert(!html.includes('#/traceability'), 'HTML must not include #/traceability');
  assert(html.includes('Stock Balances'), 'HTML must include Stock Balances');
  assert(html.includes('Opening Balance'), 'HTML must include Opening Balance');
  assert(html.includes('Stock Transfer'), 'HTML must include Stock Transfer');
  assert(html.includes('Receive Stock Transfer'), 'HTML must include Receive Stock Transfer');
  console.log('\n--- VERIFICATION PASSED: Genealogy & Trace is completely removed from sub-module tabs! ---');
} else {
  console.error('Could not match renderInventoryLogisticsTabs');
}
