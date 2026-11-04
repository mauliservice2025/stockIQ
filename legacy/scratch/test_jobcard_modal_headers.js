const fs = require('fs');
const assert = require('assert');

console.log('Testing removal of BRD section tags from Create Job Card modal...');

global.window = {
  DB: {
    getAll: () => [],
    getActiveWarehouses: () => []
  },
  State: {
    showModal: (config) => {
      const html = config.contentHtml;
      
      // Assert that highlighted BRD citations are removed
      assert(!html.includes('BRD §2'), 'Modal must NOT contain (BRD §2)');
      assert(!html.includes('BRD §3–5'), 'Modal must NOT contain (BRD §3–5)');
      assert(!html.includes('BRD'), 'Modal should not contain any BRD citations');
      
      // Assert that clean headers exist
      assert(html.includes('1. Customer Information'), 'Must have "1. Customer Information"');
      assert(html.includes('2. Vehicle Details'), 'Must have "2. Vehicle Details"');
      assert(html.includes('3. Service Scope & Assignment'), 'Must have "3. Service Scope & Assignment"');
      
      console.log('✓ PASS: Modal cleanly separated into 1. Customer Information, 2. Vehicle Details, and 3. Service Scope & Assignment.');
    }
  }
};

eval(fs.readFileSync('js/modules/billing.js', 'utf8'));
window.BillingModule.showNewJobCardModal();
