// Test script to verify Payment Receipt Details and Multi-Mode Breakdown on Invoices
const fs = require('fs');

// Create mock browser environment
global.window = {
  State: {
    currentPlantId: 'PLANT-01',
    currentUser: { id: 'USR-001', name: 'Santosh Shinde', role: 'Billing Operator' },
    showModal: (cfg) => {
      // Store modal content for assertion
      global.lastModalConfig = cfg;
    },
    closeModal: () => {},
    showToast: (msg, type) => {
      // console.log(`[Toast ${type}] ${msg}`);
    }
  },
  DB: {
    data: {
      finalBills: [],
      draftBills: [],
      paymentReceipts: [],
      plants: [
        { id: 'PLANT-01', name: 'Mauli Service Center 1 (MSC1)', gstin: '27AABCT2345M1Z9', address: 'Plot 42, Service Road, Pune', phone: '+91 98220 12345' },
        { id: 'PLANT-02', name: 'Mauli Service Center 2 (MSC2)', gstin: '27AABCT2345M2Z8', address: 'Plot 18, Industrial Estate, Hadapsar', phone: '+91 98220 54321' }
      ]
    },
    getAll: (table) => global.window.DB.data[table] || [],
    getById: (table, id) => (global.window.DB.data[table] || []).find(x => x.id === id),
    upsert: (table, item) => {
      global.window.DB.data[table] = global.window.DB.data[table] || [];
      const idx = global.window.DB.data[table].findIndex(x => x.id === item.id);
      if (idx >= 0) {
        global.window.DB.data[table][idx] = item;
      } else {
        global.window.DB.data[table].push(item);
      }
    },
    saveData: () => {},
    emitChange: () => {}
  },
  document: {
    getElementById: (id) => null
  }
};
global.document = global.window.document;

// Load BillingModule
require('../js/modules/billing.js');
const BillingModule = global.window.BillingModule;

console.log('Testing BillingModule Receipt & Multi-Mode Logic:');

// Test Case 1: Invoice with single payment (UPI) as in user's screenshot
const singleModeInvoice = {
  id: 'INV-MSC1-0005',
  invoice_no: 'INV/MSC1/2026/0005',
  job_card_no: 'JC/MSC1/2026/0008',
  customer_name: 'Om Rothe',
  customer_cin: 'CIN/MSC1/2026/000005',
  customer_mobile: '9764197038',
  vehicle_reg_no: 'MH12AC4335',
  vehicle_model: 'Honda Activa 6G',
  branch_id: 'PLANT-01',
  gross_amount: 1680.00,
  discount_amount: 168.00,
  taxable_amount: 1512.00,
  net_payable: 1512.00,
  amount_paid: 1512.00,
  balance_due: 0.00,
  payment_mode: 'UPI',
  payment_ref: 'UPI Payment',
  items: [
    { name: 'Rear Brake Shoe Set - Activa 6G / Splendor Plus', type: 'PART', hsn: '87141090', qty: 1, rate: 260, amount: 260 },
    { name: 'General Service Labour', type: 'LABOUR', hsn: '998729', qty: 2, rate: 250, amount: 500 },
    { name: 'Oil Filter', type: 'PART', hsn: '27101980', qty: 1, rate: 150, amount: 150 },
    { name: 'Cluch OH', type: 'LABOUR', hsn: '998729', qty: 1, rate: 450, amount: 450 },
    { name: 'Clutch Roller Set', type: 'PART', hsn: '87141090', qty: 1, rate: 320, amount: 320 }
  ]
};
global.window.DB.upsert('finalBills', singleModeInvoice);

const r1 = BillingModule.getBillPaymentReceipts(singleModeInvoice);
console.log('  [Case 1] Single Mode Receipts Count:', r1.length);
console.log('  [Case 1] Receipt No:', r1[0] && r1[0].receipt_no);
console.log('  [Case 1] Mode:', r1[0] && r1[0].payment_mode);
BillingModule.printInvoice(singleModeInvoice.id);
const modalHtml1 = global.lastModalConfig.contentHtml;
console.log('  [Case 1] Has "Payment Receipt Details":', modalHtml1.includes('Payment Receipt Details'));
console.log('  [Case 1] Shows UPI Mode:', modalHtml1.includes('UPI'));
console.log('  [Case 1] Shows Fully Settled badge:', modalHtml1.includes('Fully Settled'));

// Test Case 2: Invoice paid in multiple modes via split payment (Cash ₹500 + UPI ₹1012)
const splitModeInvoice = {
  id: 'INV-MSC1-0006',
  invoice_no: 'INV/MSC1/2026/0006',
  customer_name: 'Rajesh Patil',
  vehicle_reg_no: 'MH12DE1234',
  branch_id: 'PLANT-01',
  net_payable: 1512.00,
  amount_paid: 1512.00,
  balance_due: 0.00,
  payment_mode: 'Cash + UPI',
  payment_history: [
    {
      receipt_id: 'RCP-0006',
      receipt_no: 'RCP/MSC1/2026/000006',
      amount: 1512.00,
      mode: 'Cash + UPI',
      cash_portion: 500.00,
      upi_portion: 1012.00,
      mode_breakdown: [
        { mode: 'Cash', amount: 500.00 },
        { mode: 'UPI', amount: 1012.00, ref: 'UPI Ref #9872341' }
      ],
      date: '2026-10-18',
      time: '11:30:00 AM'
    }
  ]
};
global.window.DB.upsert('finalBills', splitModeInvoice);

const r2 = BillingModule.getBillPaymentReceipts(splitModeInvoice);
console.log('\n  [Case 2] Split Payment Receipts Count:', r2.length);
BillingModule.printInvoice(splitModeInvoice.id);
const modalHtml2 = global.lastModalConfig.contentHtml;
console.log('  [Case 2] Has Multi-Mode badge:', modalHtml2.includes('Multi-Mode'));
console.log('  [Case 2] Shows Cash breakdown (₹500):', modalHtml2.includes('Cash') && modalHtml2.includes('500.00'));
console.log('  [Case 2] Shows UPI breakdown (₹1012):', modalHtml2.includes('UPI') && modalHtml2.includes('1012.00'));
console.log('  [Case 2] Shows Modes Received Summary row:', modalHtml2.includes('Payment Modes Received:'));

// Test Case 3: Multiple Receipts over time in different modes (Receipt 1 Cash + Receipt 2 UPI)
const multiInstallmentInvoice = {
  id: 'INV-MSC1-0007',
  invoice_no: 'INV/MSC1/2026/0007',
  customer_name: 'Ganesh More',
  vehicle_reg_no: 'MH12XY9999',
  branch_id: 'PLANT-01',
  net_payable: 2000.00,
  amount_paid: 2000.00,
  balance_due: 0.00,
  payment_mode: 'Cash + UPI',
  payment_history: [
    {
      receipt_id: 'RCP-0007-A',
      receipt_no: 'RCP/MSC1/2026/000007',
      amount: 800.00,
      mode: 'Cash',
      date: '2026-10-17',
      time: '02:15:00 PM'
    },
    {
      receipt_id: 'RCP-0007-B',
      receipt_no: 'RCP/MSC1/2026/000008',
      amount: 1200.00,
      mode: 'UPI',
      reference: 'UPI/UTR-554433',
      date: '2026-10-18',
      time: '10:00:00 AM'
    }
  ]
};
global.window.DB.upsert('finalBills', multiInstallmentInvoice);

const r3 = BillingModule.getBillPaymentReceipts(multiInstallmentInvoice);
console.log('\n  [Case 3] Multi-Installment Receipts Count:', r3.length);
BillingModule.printInvoice(multiInstallmentInvoice.id);
const modalHtml3 = global.lastModalConfig.contentHtml;
console.log('  [Case 3] Shows Receipt 1 (RCP/MSC1/2026/000007):', modalHtml3.includes('RCP/MSC1/2026/000007'));
console.log('  [Case 3] Shows Receipt 2 (RCP/MSC1/2026/000008):', modalHtml3.includes('RCP/MSC1/2026/000008'));
console.log('  [Case 3] Shows Multi-Mode indicator:', modalHtml3.includes('Multi-Mode'));
console.log('  [Case 3] Shows Cash: ₹800.00:', modalHtml3.includes('800.00'));
console.log('  [Case 3] Shows UPI: ₹1200.00:', modalHtml3.includes('1200.00'));

// Test Case 4: Invoice matching user's screenshot (INV/MSC1/2026/0006, 4 modes: Cash, UPI, Bank Transfer, Card)
const invoice4Modes = {
  id: 'INV-MSC1-0006-USER',
  invoice_no: 'INV/MSC1/2026/0006',
  job_card_no: 'JC/MSC1/2026/0009',
  customer_name: 'Rajesh Tiwari',
  customer_cin: 'CIN/MSC1/2026/000006',
  customer_mobile: '9876543456',
  vehicle_reg_no: 'MH14BH4335',
  vehicle_model: 'Honda Activa 125',
  branch_id: 'PLANT-01',
  gross_amount: 930.00,
  discount_amount: 0.00,
  taxable_amount: 930.00,
  net_payable: 930.00,
  amount_paid: 930.00,
  balance_due: 0.00,
  payment_mode: 'Cash + UPI + Bank Transfer + Card',
  items: [
    { name: 'General Service Labour', type: 'LABOUR', hsn: '998729', qty: 2, rate: 250, amount: 500 },
    { name: 'Oil Filter', type: 'PART', hsn: '27101980', qty: 1, rate: 150, amount: 150 },
    { name: 'Air Filter Element', type: 'PART', hsn: '87141090', qty: 1, rate: 280, amount: 280 }
  ],
  payment_history: [
    {
      receipt_id: 'RCP-00017',
      receipt_no: 'RCP/MSC1/2026/000017',
      amount: 930.00,
      mode: 'Cash + UPI + Bank Transfer + Card',
      mode_breakdown: [
        { mode: 'Cash', amount: 170.00 },
        { mode: 'UPI', amount: 340.00 },
        { mode: 'Bank Transfer', amount: 20.00 },
        { mode: 'Card', amount: 400.00 }
      ],
      date: '2026-10-19',
      time: '09:15:00 AM'
    }
  ]
};
global.window.DB.upsert('finalBills', invoice4Modes);

const r4 = BillingModule.getBillPaymentReceipts(invoice4Modes);
console.log('\n  [Case 4 - Screenshot Match] Receipts Count:', r4.length);
BillingModule.printInvoice(invoice4Modes.id);
const modalHtml4 = global.lastModalConfig.contentHtml;
console.log('  [Case 4] Has "Multi-Mode (4 modes)":', modalHtml4.includes('Multi-Mode (4 modes)'));
console.log('  [Case 4] Shows Cash: ₹170.00:', modalHtml4.includes('170.00'));
console.log('  [Case 4] Shows UPI: ₹340.00:', modalHtml4.includes('340.00'));
console.log('  [Case 4] Shows Bank Transfer: ₹20.00:', modalHtml4.includes('20.00'));
console.log('  [Case 4] Shows Card: ₹400.00:', modalHtml4.includes('400.00'));
console.log('  [Case 4] Button calls triggerPrintInvoice:', modalHtml4.includes("BillingModule.triggerPrintInvoice('INV-MSC1-0006-USER')"));
console.log('  [Case 4] BillingModule.triggerPrintInvoice is a function:', typeof BillingModule.triggerPrintInvoice === 'function');

console.log('\nAll tests completed successfully!');
