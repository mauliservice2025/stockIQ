const fs = require('fs');

const billingCode = fs.readFileSync('d:/Projects/ISCM/js/modules/billing.js', 'utf8');

// Find all onclick/onchange/oninput referencing window.BillingModule
const regex = /(?:onclick|onchange|oninput)\s*=\s*["'](?:event\.stopPropagation\(\);\s*)?window\.BillingModule\.([a-zA-Z0-9_]+)\(([^)]*)\)["']/g;
let match;
const handlers = new Map();
while ((match = regex.exec(billingCode)) !== null) {
  const fn = match[1];
  const args = match[2];
  if (!handlers.has(fn)) handlers.set(fn, []);
  handlers.get(fn).push(args);
}

// Find all defined methods on BillingModule
// Typically BillingModule has `fnName(` or `fnName:`
console.log(`Total BillingModule event handlers referenced: ${handlers.size}`);

for (const [fn, callList] of handlers.entries()) {
  // Check if method exists in file
  const methodDefRegex = new RegExp(`(?:\\n\\s*${fn}\\s*\\(|\\b${fn}\\s*:\\s*function|\\b${fn}\\s*\\()`, 'g');
  const hasDef = methodDefRegex.test(billingCode);
  console.log(`${fn}: ${hasDef ? 'EXISTS' : 'MISSING!'} (called ${callList.length} times, sample: ${callList[0]})`);
}
