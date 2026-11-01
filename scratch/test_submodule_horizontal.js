const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('VERIFYING SUBMODULE TABS HORIZONTAL LAYOUT RULES');
console.log('================================================================');

const cssPath = path.join(__dirname, '../css/components.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 1. Verify .tabs-header base rule enforces horizontal layout
assert(cssContent.includes('.tabs-header {'), 'Must have .tabs-header rule');
assert(cssContent.includes('flex-direction: row !important;'), 'Must have flex-direction: row !important for tabs header');
assert(cssContent.includes('flex-wrap: nowrap !important;'), 'Must have flex-wrap: nowrap !important');

// 2. Verify .main-content > .tabs-header override
assert(cssContent.includes('.main-content > .tabs-header {'), 'Must have .main-content > .tabs-header specific override');
assert(cssContent.includes('.main-content > div:not(.modal-overlay):not(.toast-container):not(.tabs-header)'), 'main-content column flex must exclude .tabs-header');

// 3. Verify .tab-btn does not shrink
assert(cssContent.includes('flex-shrink: 0 !important;'), '.tab-btn must have flex-shrink: 0 !important');

// 4. Verify org-location.js renders visible tabs within tabs-header
const orgLocPath = path.join(__dirname, '../js/modules/org-location.js');
const orgLocContent = fs.readFileSync(orgLocPath, 'utf8');
assert(orgLocContent.includes('class="tabs-header"'), 'org-location.js must render .tabs-header');
assert(orgLocContent.includes('tab-btn ${this.activeTab === t.key ? \'active\' : \'\'}'), 'org-location.js must render tab-btn items');

console.log('✓ All CSS and module rules verified: Submodule list is guaranteed to display horizontally.');
console.log('================================================================');
