const fs = require('fs');
const path = require('path');
const vm = require('vm');

const mockPath = path.join(__dirname, '../js/data/mock-data.js');
let content = fs.readFileSync(mockPath, 'utf8');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(content.replace('const INITIAL_DATA =', 'var INITIAL_DATA ='), sandbox);

const data = sandbox.INITIAL_DATA;

console.log('Original roles:', data.roles.map(r => r.id));
console.log('Original role_permissions count:', data.role_permissions.length);
console.log('Original sod_rules count:', data.sod_rules.length);
console.log('Original approval_authorities count:', data.approval_authorities.length);

// 1. Update users
data.users.forEach(u => {
  if (u.primary_role === 'ROLE-STORE-EXEC' || u.primary_role_id === 'ROLE-STORE-EXEC') {
    u.primary_role = 'ROLE-STORE-MGR';
    u.primary_role_id = 'ROLE-STORE-MGR';
    console.log(`Updated user ${u.id} (${u.full_name}) -> ROLE-STORE-MGR`);
  }
});

// 2. Filter roles
data.roles = data.roles.filter(r => r.id !== 'ROLE-STORE-EXEC');

// 3. Filter role_permissions
data.role_permissions = data.role_permissions.filter(rp => rp.role_id !== 'ROLE-STORE-EXEC');

// 4. Filter sod_rules
data.sod_rules = data.sod_rules.filter(s => s.conflicting_role_1 !== 'ROLE-STORE-EXEC' && s.conflicting_role_2 !== 'ROLE-STORE-EXEC');

// 5. Filter approval_authorities
data.approval_authorities = data.approval_authorities.filter(a => a.role_id !== 'ROLE-STORE-EXEC');

console.log('New roles:', data.roles.map(r => r.id));
console.log('New role_permissions count:', data.role_permissions.length);
console.log('New sod_rules count:', data.sod_rules.length);
console.log('New approval_authorities count:', data.approval_authorities.length);

// Write back to js/data/mock-data.js
const newContent = 'const INITIAL_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(mockPath, newContent, 'utf8');
console.log('Successfully updated js/data/mock-data.js');
