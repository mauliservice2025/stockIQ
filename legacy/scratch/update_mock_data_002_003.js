const fs = require('fs');
const path = require('path');

const mockPath = path.join(__dirname, '../js/data/mock-data.js');
let raw = fs.readFileSync(mockPath, 'utf8');

// Match the JSON object inside mock-data.js
const prefix = raw.match(/^[^{]*/)[0];
const suffix = raw.match(/;[^;]*$/)[0];
const jsonStr = raw.substring(prefix.length, raw.length - suffix.length);
const data = JSON.parse(jsonStr);

// 1. Ensure ROLE-002 and ROLE-003 exist in data.roles
const role002 = {
  id: 'ROLE-002',
  code: 'STORE_OPS_EXEC',
  name: 'Store Operations Executive',
  description: 'Store operations executive, parts inward, job card issue/return, transfer, cycle count and stock ledger.',
  role_type: 'OPERATIONAL',
  is_system: true,
  status: 'ACTIVE',
  user_count: 1
};

const role003 = {
  id: 'ROLE-003',
  code: 'STORE_MGR_OPS',
  name: 'Senior Store & Sourcing Manager',
  description: 'Senior store and inventory management, material receipts and requisition approvals.',
  role_type: 'OPERATIONAL',
  is_system: true,
  status: 'ACTIVE',
  user_count: 2
};

[role002, role003].forEach(r => {
  const existingIdx = data.roles.findIndex(x => x.id === r.id);
  if (existingIdx !== -1) {
    data.roles[existingIdx] = { ...data.roles[existingIdx], ...r };
  } else {
    data.roles.push(r);
  }
});

// 2. Clone permissions from ROLE-STORE-MGR to ROLE-002 and ROLE-003
const storeMgrPerms = data.role_permissions.filter(rp => rp.role_id === 'ROLE-STORE-MGR');
console.log(`Found ${storeMgrPerms.length} permissions for ROLE-STORE-MGR.`);

['ROLE-002', 'ROLE-003'].forEach(targetRole => {
  storeMgrPerms.forEach(sp => {
    const clone = { ...sp, role_id: targetRole };
    const existIdx = data.role_permissions.findIndex(rp => rp.role_id === targetRole && rp.perm_code === sp.perm_code);
    if (existIdx !== -1) {
      data.role_permissions[existIdx] = clone;
    } else {
      data.role_permissions.push(clone);
    }
  });
});

console.log(`Updated mock-data.js. Total roles: ${data.roles.length}. Total role_permissions: ${data.role_permissions.length}`);

const newContent = prefix + JSON.stringify(data, null, 2) + suffix;
fs.writeFileSync(mockPath, newContent, 'utf8');
console.log('Successfully saved updated mock-data.js!');
