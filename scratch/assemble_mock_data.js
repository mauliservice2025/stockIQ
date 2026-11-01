const fs = require('fs');
const path = require('path');

// 1. Read decoded restored mock data
let content = fs.readFileSync('scratch/restored_full_mock_data.js', 'utf8');

// 2. Remove dummy GST numbers from plants in mock data
// Replace "gstin": "27AABCT2345M1Z9" with "gstin": ""
content = content.replace('"gstin": "27AABCT2345M1Z9"', '"gstin": ""');
content = content.replace('"gstin": "27AABCT2345M2Z8"', '"gstin": ""');

// 3. Inject document_print_configurations and document_print_audit_logs if not already there
if (!content.includes('document_print_configurations')) {
  // Read seed configs and audit logs from inject_print_config_mock.js
  const injectScript = fs.readFileSync('scratch/inject_print_config_mock.js', 'utf8');
  
  // Extract seedConfigs and seedAuditLogs
  const configMatch = injectScript.match(/const seedConfigs = (\[[\s\S]*?\n\]);/);
  const auditMatch = injectScript.match(/const seedAuditLogs = (\[[\s\S]*?\n\]);/);
  
  if (configMatch && auditMatch) {
    let seedConfigs, seedAuditLogs;
    eval('seedConfigs = ' + configMatch[1]);
    eval('seedAuditLogs = ' + auditMatch[1]);
    
    // Find the end of INITIAL_DATA object
    // Look for "\n  ]\n};" or the last "};" before "INITIAL_DATA.facilities"
    const endMarker = '\n};\n\nINITIAL_DATA.facilities = INITIAL_DATA.plants;';
    const endIdx = content.indexOf(endMarker);
    if (endIdx !== -1) {
      const extra = ',\n  "document_print_configurations": ' + JSON.stringify(seedConfigs, null, 4).replace(/\n/g, '\n  ') +
                    ',\n  "document_print_audit_logs": ' + JSON.stringify(seedAuditLogs, null, 4).replace(/\n/g, '\n  ');
      content = content.slice(0, endIdx) + extra + content.slice(endIdx);
      console.log('Successfully injected document_print_configurations and document_print_audit_logs');
    } else {
      console.warn('Could not find endMarker in restored mock data');
    }
  } else {
    console.warn('Could not extract seedConfigs / seedAuditLogs');
  }
}

// Write to js/data/mock-data.js
fs.writeFileSync('js/data/mock-data.js', content, 'utf8');
console.log('Written to js/data/mock-data.js, length:', content.length);

// Verify parsing
delete require.cache[require.resolve('../js/data/mock-data.js')];
const mod = require('../js/data/mock-data.js');
const data = mod.INITIAL_DATA;
console.log('Verification:');
console.log('- Keys count:', Object.keys(data).length);
console.log('- Plants:', data.plants.map(p => ({ id: p.id, name: p.name, gstin: p.gstin })));
console.log('- Print configs:', data.document_print_configurations ? data.document_print_configurations.length : 0);
console.log('- Print audit logs:', data.document_print_audit_logs ? data.document_print_audit_logs.length : 0);
console.log('- Users:', data.users ? data.users.length : 0);
