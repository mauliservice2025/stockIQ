const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runTest() {
  console.log('Testing Next Servicing Due Date & KM Implementation in Billing Module...');

  const billingCode = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');

  let lastToast = null;
  const mockState = {
    showToast(msg, type) {
      lastToast = { msg, type };
      console.log(`[Toast ${type}]: ${msg}`);
    },
    closeModal() {},
    showModal(opts) {
      mockState.lastModal = opts;
    },
    currentPlantId: 'PLANT-01'
  };

  const store = {
    draftBills: [
      {
        id: 'DBILL-TEST-001',
        draft_bill_no: 'DB/MSC1/2026/0013',
        job_card_id: 'JC-0013',
        job_card_no: 'JC/MSC1/2026/0013',
        customer_cin: 'CIN/MSC1/2026/000009',
        customer_name: 'Nilesh Ghogare',
        customer_mobile: '9763882688',
        vehicle_reg_no: 'MH14KM2208',
        vehicle_model: 'India FZ-S V3',
        odometer_km: '8766',
        service_type: 'General Service',
        status: 'DRAFT',
        items: [
          { id: 'ITM-1', code: 'PRT-001', name: 'Foam Air Filter Element', type: 'PART', qty: 1, rate: 165, amount: 165 }
        ],
        subtotal: 165,
        taxable_amount: 165,
        total_tax: 0,
        grand_total: 165,
        balance_due: 165,
        amount_received: 0,
        discount_amount: 0,
        next_service_due_date: '',
        next_service_after_km: 3000
      }
    ],
    finalBills: [],
    jobCards: [
      {
        id: 'JC-0013',
        job_card_no: 'JC/MSC1/2026/0013',
        customer_cin: 'CIN/MSC1/2026/000009',
        customer_name: 'Nilesh Ghogare',
        customer_mobile: '9763882688',
        vehicle_reg_no: 'MH14KM2208',
        status: 'READY_FOR_BILLING'
      }
    ],
    vehicles: [
      {
        id: 'VEH-01',
        registration_no: 'MH14KM2208',
        model: 'India FZ-S V3'
      }
    ],
    plants: [
      { id: 'PLANT-01', name: 'Mauli Service Center', gstin: '27AAAAA0000A1Z5' }
    ]
  };

  const mockDB = {
    data: store,
    getAll(coll) {
      return store[coll] || [];
    },
    getById(coll, id) {
      return (store[coll] || []).find(x => x.id === id || x.job_card_no === id);
    },
    upsert(coll, item) {
      if (!store[coll]) store[coll] = [];
      const idx = store[coll].findIndex(x => x.id === item.id);
      if (idx >= 0) {
        store[coll][idx] = { ...store[coll][idx], ...item };
      } else {
        store[coll].push(item);
      }
    },
    emitChange() {},
    saveData() {},
    getDefaultTax() {
      return { rate: 0, cgst_rate: 0, sgst_rate: 0, name: 'GST 0%' };
    }
  };

  // Mock DOM
  const elements = {};
  const mockDoc = {
    getElementById(id) {
      return elements[id] || null;
    },
    createElement() {
      return { appendChild() {}, style: {}, contentWindow: { document: { open() {}, write() {} } } };
    },
    body: { appendChild() {} }
  };

  const context = vm.createContext({
    window: {},
    document: mockDoc,
    navigator: {},
    console,
    alert(msg) { console.log('[Alert]:', msg); },
    confirm() { return true; },
    encodeURIComponent: encodeURIComponent,
    parseInt: parseInt,
    parseFloat: parseFloat,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    Set: Set,
    Date: Date,
    Math: Math
  });

  context.window.State = mockState;
  context.window.DB = mockDB;

  vm.runInContext(billingCode, context);

  const BillingModule = context.window.BillingModule;
  if (!BillingModule) {
    throw new Error('BillingModule not exported to window!');
  }

  BillingModule.activeBillingBillId = 'DBILL-TEST-001';

  // 1. Test UI Rendering in Draft Mode
  console.log('\n--- 1. Testing Draft Bill UI Rendering ---');
  const draftHtml = BillingModule.renderCustomerBillingSingleScreen();
  if (!draftHtml.includes('bill-next-service-date')) {
    throw new Error('Expected draft UI to contain bill-next-service-date input!');
  }
  if (!draftHtml.includes('bill-next-service-km')) {
    throw new Error('Expected draft UI to contain bill-next-service-km input!');
  }
  if (!draftHtml.includes('Next Servicing Due Date')) {
    throw new Error('Expected draft UI to contain Next Servicing Due Date label!');
  }
  if (!draftHtml.includes('Next Servicing after')) {
    throw new Error('Expected draft UI to contain Next Servicing after label!');
  }
  console.log('✓ Draft Bill UI correctly renders mandatory date picker and KM input in workflow action strip and grid.');

  // 2. Test Mandatory Validation: Clicking Create Final Bill without Next Service Date MUST fail
  console.log('\n--- 2. Testing Finalization Rejection without Date ---');
  lastToast = null;
  BillingModule.finalizeCustomerBilling();

  if (!lastToast || !lastToast.msg.includes('Please select Next Servicing Due Date')) {
    throw new Error(`Expected danger toast for missing next servicing due date, got: ${JSON.stringify(lastToast)}`);
  }
  const billStillDraft = store.draftBills.find(b => b.id === 'DBILL-TEST-001');
  if (billStillDraft.status !== 'DRAFT') {
    throw new Error(`Bill status should have remained DRAFT, but became ${billStillDraft.status}`);
  }
  if (store.finalBills.length > 0) {
    throw new Error('No final bill should have been generated when validation failed!');
  }
  console.log('✓ Validation blocked finalization when next servicing due date was empty!');

  // 3. Test Selecting Next Servicing Date & KM
  console.log('\n--- 3. Testing updateDraftNextServiceDate & updateDraftNextServiceKm ---');
  BillingModule.updateDraftNextServiceDate('2026-11-20');
  BillingModule.updateDraftNextServiceKm('3500');

  const updatedDraft = store.draftBills.find(b => b.id === 'DBILL-TEST-001');
  if (updatedDraft.next_service_due_date !== '2026-11-20') {
    throw new Error(`Draft next_service_due_date not updated: ${updatedDraft.next_service_due_date}`);
  }
  if (updatedDraft.next_service_after_km !== 3500) {
    throw new Error(`Draft next_service_after_km not updated: ${updatedDraft.next_service_after_km}`);
  }
  console.log('✓ Draft date and KM successfully persisted.');

  // 4. Test Finalizing with Valid Next Servicing Date
  console.log('\n--- 4. Testing Successful Finalization with Next Servicing ---');
  lastToast = null;
  BillingModule.finalizeCustomerBilling();

  if (store.finalBills.length === 0) {
    throw new Error('Expected final bill to be created!');
  }
  const fb = store.finalBills[0];
  console.log('Final Bill Generated:', fb.invoice_no, 'Status:', fb.status);
  if (fb.next_service_due_date !== '2026-11-20') {
    throw new Error(`Final bill missing next_service_due_date: ${fb.next_service_due_date}`);
  }
  if (fb.next_service_after_km !== 3500) {
    throw new Error(`Final bill missing next_service_after_km: ${fb.next_service_after_km}`);
  }

  // Check parent Job Card
  const jc = store.jobCards.find(j => j.id === 'JC-0013');
  if (jc.next_service_due_date !== '2026-11-20' || jc.next_service_after_km !== 3500) {
    throw new Error(`Job card missing next service fields: date=${jc.next_service_due_date}, km=${jc.next_service_after_km}`);
  }

  // Check Vehicle
  const v = store.vehicles.find(veh => veh.registration_no === 'MH14KM2208');
  if (v.next_service_due_date !== '2026-11-20' || v.next_service_after_km !== 3500) {
    throw new Error(`Vehicle record missing next service fields: date=${v.next_service_due_date}, km=${v.next_service_after_km}`);
  }
  console.log('✓ Final bill, linked job card, and vehicle all received next_service_due_date and next_service_after_km!');

  // 5. Test Finalized Screen UI Rendering
  console.log('\n--- 5. Testing Final Bill Screen UI Rendering ---');
  BillingModule.activeBillingBillId = fb.id;
  const finalHtml = BillingModule.renderCustomerBillingSingleScreen();
  if (!finalHtml.includes('Next Servicing Due:')) {
    throw new Error('Expected final bill screen to display "Next Servicing Due:" badge!');
  }
  if (!finalHtml.includes('2026-11-20')) {
    throw new Error('Expected final bill screen to display "2026-11-20"!');
  }
  if (!finalHtml.includes('Next Servicing after:')) {
    throw new Error('Expected final bill screen to display "Next Servicing after:"!');
  }
  if (!finalHtml.includes('3,500 KM')) {
    throw new Error('Expected final bill screen to display "3,500 KM"!');
  }
  console.log('✓ Final bill screen displays Next Servicing Due Date and Next Servicing after ___ KM!');

  // 6. Test Tax Invoice Print Modal
  console.log('\n--- 6. Testing Tax Invoice Print View ---');
  BillingModule.printInvoice(fb.id);
  const printModal = mockState.lastModal;
  if (!printModal || !printModal.contentHtml) {
    throw new Error('Expected print invoice modal to be shown!');
  }
  if (!printModal.contentHtml.includes('Next Servicing Due')) {
    throw new Error('Expected invoice print view to contain "Next Servicing Due"!');
  }
  if (!printModal.contentHtml.includes('2026-11-20')) {
    throw new Error('Expected invoice print view to contain "2026-11-20"!');
  }
  if (!printModal.contentHtml.includes('3,500 KM')) {
    throw new Error('Expected invoice print view to contain "3,500 KM"!');
  }
  console.log('✓ Tax Invoice Print view includes Next Servicing Due Date & KM!');

  // 7. Test View Bill Details Modal
  console.log('\n--- 7. Testing View Bill Details Modal ---');
  BillingModule.viewBillDetails(fb.id);
  const detailsModal = mockState.lastModal;
  if (!detailsModal || !detailsModal.contentHtml.includes('NEXT SERVICING DUE')) {
    throw new Error('Expected viewBillDetails modal to contain NEXT SERVICING DUE!');
  }
  if (!detailsModal.contentHtml.includes('NEXT SERVICING AFTER KM')) {
    throw new Error('Expected viewBillDetails modal to contain NEXT SERVICING AFTER KM!');
  }
  console.log('✓ View Bill Details modal includes NEXT SERVICING DUE and NEXT SERVICING AFTER KM!');

  console.log('\n========================================');
  console.log('ALL NEXT SERVICING TESTS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTest();
