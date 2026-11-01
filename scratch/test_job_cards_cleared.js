const fs = require('fs');
const path = require('path');

// Setup environment
const auditLogs = [];
global.window = {
  location: { hash: '#/job-cards' },
  DB: {
    data: {
      customers: [
        {
          id: 'CUST-000126',
          cin_number: 'CIN-000126',
          cin: 'CIN-000126',
          customer_cin: 'CIN-000126',
          name: 'Rahul Patil',
          customer_name: 'Rahul Patil',
          mobile: '98XXXXXX10',
          customer_mobile: '98XXXXXX10',
          city: 'Pune',
          vehicles: ['MH12AB1234']
        }
      ],
      vehicles: [
        {
          id: 'VEH-000126',
          vehicle_reg_no: 'MH12AB1234',
          customer_cin: 'CIN-000126',
          customer_name: 'Rahul Patil',
          model_name: 'Honda Activa',
          vehicle_model: 'Honda Activa',
          odometer_km: '18,500 km'
        }
      ],
      billingEstimates: [],
      jobCards: [
        // Simulate existing persisted job cards from earlier session
        { id: 'JC-OLD-1', job_card_no: 'JC-PUN-26-001' }
      ],
      draftBills: [],
      finalBills: []
    },
    getAll(tbl) { return this.data[tbl] || []; },
    getById(tbl, id) { return (this.data[tbl] || []).find(x => x.id === id); },
    upsert(tbl, obj) {
      if (!this.data[tbl]) this.data[tbl] = [];
      const idx = this.data[tbl].findIndex(x => x.id === obj.id);
      if (idx >= 0) this.data[tbl][idx] = obj;
      else this.data[tbl].push(obj);
      return obj;
    },
    saveData() {},
    emitChange() {},
    isPlantActive() { return true; },
    logAudit(action, entity, id, desc) {
      auditLogs.push({ action, entity, id, desc, time: new Date() });
    }
  },
  State: {
    showToast(msg, type) { console.log(`[TOAST - ${type || 'info'}]: ${msg}`); },
    showModal(opts) {},
    closeModal() {}
  },
  DocSeriesMasterModule: {
    generateNextNumber(code, plant) {
      return { success: true, docNumber: `${code}-PUN-26-001` };
    }
  }
};

global.document = {
  getElementById(id) {
    return { innerHTML: '', value: '', addEventListener() {} };
  },
  activeElement: null
};

// Load code
const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
eval(billingCode);

console.log('--- Testing Job Cards Initial Cleansing ---');
window.BillingModule.ensureSeedData();
const jobCards = window.DB.getAll('jobCards');
console.log('Job cards count after ensureSeedData:', jobCards.length);
if (jobCards.length !== 0) {
  throw new Error(`Job cards were not cleared! Expected 0, got ${jobCards.length}`);
}
console.log('✓ All job cards successfully removed from DB!');

console.log('\n--- Testing Table View Render with Empty Job Cards ---');
window.BillingModule.jobCardViewMode = 'TABLE';
const tableHtml = window.BillingModule.renderJobCardsTab();
if (!tableHtml.includes('No Job Cards Found') || !tableHtml.includes('+ Create New Job Card')) {
  throw new Error('Table View did not render empty state properly!');
}
console.log('✓ Table View renders clean empty state with "+ Create New Job Card" button!');

console.log('\n--- Testing Split View Render with Empty Job Cards ---');
window.BillingModule.jobCardViewMode = 'CONSOLE';
const splitHtml = window.BillingModule.renderJobCardsTab();
if (!splitHtml.includes('No job cards available') || !splitHtml.includes('No Job Card Selected')) {
  throw new Error('Split View did not render empty state properly!');
}
console.log('✓ Split View renders clean empty state in both panels!');

console.log('\n--- Testing clearAllJobCards() method ---');
// Add a mock job card
window.DB.upsert('jobCards', { id: 'JC-NEW-01', job_card_no: 'JC-PUN-26-101', status: 'READY_FOR_BILLING' });
console.log('Added temporary job card, count:', window.DB.getAll('jobCards').length);
window.BillingModule.clearAllJobCards();
console.log('Job cards count after clearAllJobCards():', window.DB.getAll('jobCards').length);
if (window.DB.getAll('jobCards').length !== 0) {
  throw new Error('clearAllJobCards failed to clear cards!');
}
console.log('✓ clearAllJobCards() method works as expected!');

console.log('\n--- ALL JOB CARDS REMOVAL TESTS PASSED! ---');
