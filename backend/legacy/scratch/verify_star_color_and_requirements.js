const fs = require('fs');
const assert = require('assert');

console.log('--- VERIFYING RED ASTERISK AND OPTIONAL FIELDS IN STORE MODULE ---');

const code = fs.readFileSync('js/modules/store-inventory.js', 'utf8');

// 1. Verify showAddStoreModal exists
assert(code.includes('showAddStoreModal()'), 'showAddStoreModal must exist');

// 2. Extract modal HTML template inside showAddStoreModal
const addModalMatch = code.match(/showAddStoreModal\(\)\s*\{[\s\S]*?const contentHtml = `([\s\S]*?)`;\s*window\.State\.showModal/);
assert(addModalMatch, 'contentHtml for showAddStoreModal must be present');
const addHtml = addModalMatch[1];

// 3. Verify Store Code: red star and required
assert(addHtml.includes('Store Code <span style="color: var(--color-danger)">*</span>'), 'Store Code must have red asterisk');
assert(addHtml.includes('id="new-store-code" class="form-control" placeholder="e.g. STR-MAIN" required'), 'Store Code must be required');
console.log('✓ Store Code: Red asterisk + required passed');

// 4. Verify Store Name: red star and required
assert(addHtml.includes('Store Name <span style="color: var(--color-danger)">*</span>'), 'Store Name must have red asterisk');
assert(addHtml.includes('id="new-store-name" class="form-control" placeholder="e.g. Main Parts Store" required'), 'Store Name must be required');
console.log('✓ Store Name: Red asterisk + required passed');

// 5. Verify Store Type: red star and required
assert(addHtml.includes('Store Type <span style="color: var(--color-danger)">*</span>'), 'Store Type must have red asterisk');
assert(addHtml.includes('id="new-store-type" class="form-control" onchange="window.StoreInventoryModule.onStoreTypeChange(this.value)" required'), 'Store Type must be required');
console.log('✓ Store Type: Red asterisk + required passed');

// 6. Verify Branch: red star and required
assert(addHtml.includes('Branch <span style="color: var(--color-danger)">*</span>'), 'Branch must have red asterisk');
assert(addHtml.includes('id="new-store-branch" class="form-control" required'), 'Branch must be required');
console.log('✓ Branch: Red asterisk + required passed');

// 7. Verify Parent Store: NO star, not required
assert(addHtml.includes('<label class="form-label" style="font-size: 12px; font-weight: 600;">Parent Store</label>'), 'Parent Store must NOT have an asterisk');
assert(!addHtml.includes('Parent Store *'), 'Parent Store must not have plain asterisk');
assert(!addHtml.includes('Parent Store <span'), 'Parent Store must not have red asterisk');
console.log('✓ Parent Store: No asterisk + optional passed');

// 8. Verify Store Manager: NO star, not required
assert(addHtml.includes('<label class="form-label" style="font-size: 12px; font-weight: 600;">Store Manager</label>'), 'Store Manager must NOT have an asterisk');
assert(!addHtml.includes('Store Manager *'), 'Store Manager must not have plain asterisk');
assert(!addHtml.includes('Store Manager <span'), 'Store Manager must not have red asterisk');
assert(addHtml.includes('id="new-store-manager" class="form-control" placeholder="Manager name" />'), 'Store Manager input must NOT have required attribute');
console.log('✓ Store Manager: No asterisk + optional (no required attribute) passed');

// 9. Verify Effective From: red star and required
assert(addHtml.includes('Effective From <span style="color: var(--color-danger)">*</span>'), 'Effective From must have red asterisk');
assert(addHtml.includes('id="new-store-from" class="form-control" value="2026-01-01" required'), 'Effective From must be required');
console.log('✓ Effective From: Red asterisk + required passed');

// 10. Verify Edit Store Modal
const editModalMatch = code.match(/showEditStoreModal\(storeId\)\s*\{[\s\S]*?const contentHtml = `([\s\S]*?)`;\s*window\.State\.showModal/);
assert(editModalMatch, 'contentHtml for showEditStoreModal must be present');
const editHtml = editModalMatch[1];

assert(editHtml.includes('Store Name <span style="color: var(--color-danger)">*</span>'), 'Edit Store Name must have red asterisk');
assert(editHtml.includes('<label class="form-label" style="font-size: 12px; font-weight: 600;">Store Manager</label>'), 'Edit Store Manager must NOT have an asterisk');
assert(!editHtml.includes('Store Manager *'), 'Edit Store Manager must not have plain asterisk');
assert(editHtml.includes('id="edit-store-manager" class="form-control" value="${store.manager || \'\'}" placeholder="Manager name" />'), 'Edit Store Manager must NOT be required');
console.log('✓ Edit Store Modal: Store Name red asterisk + Store Manager optional passed');

console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
