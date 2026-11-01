const finalBills = [
  {
    id: 'INV/MSC1/2026/0029',
    invoice_no: 'INV/MSC1/2026/0029',
    bill_no: 'INV/MSC1/2026/0029',
    status: 'CANCELLED',
    is_reopened: true,
    has_subsequent_revision: true,
    reopened_to_revision_no: 'INV/MSC1/2026/0029-R1',
    reopened_to_revision_id: 'INV-DBILL-001',
    net_payable: 649,
    amount_paid: 0,
    balance_amount: 649,
    payment_mode: 'UPI + Cash'
  },
  {
    id: 'INV-DBILL-001',
    invoice_no: 'INV/MSC1/2026/0029-R1',
    bill_no: 'INV/MSC1/2026/0029-R1',
    draft_bill_id: 'DBILL-001',
    draft_bill_no: 'INV/MSC1/2026/0029-R1',
    status: 'PARTIALLY_PAID',
    is_revision: true,
    revision_no: 'R1',
    original_bill_id: 'INV/MSC1/2026/0029',
    original_bill_no: 'INV/MSC1/2026/0029',
    net_payable: 549,
    amount_paid: 49,
    balance_amount: 500,
    payment_mode: 'Cash + UPI'
  }
];

const draftBills = [
  {
    id: 'DBILL-001',
    draft_bill_no: 'INV/MSC1/2026/0029-R1',
    bill_no: 'INV/MSC1/2026/0029-R1',
    invoice_no: undefined,
    status: 'REVISED_PAYMENT_PENDING',
    is_revision: true,
    revision_no: 'R1',
    original_bill_id: 'INV/MSC1/2026/0029',
    original_bill_no: 'INV/MSC1/2026/0029',
    net_payable: 549,
    amount_paid: 0,
    balance_amount: 549,
    payment_mode: 'UPI + Cash'
  }
];

function getAllBillsForSearchImproved() {
  const map = new Map();
  const seenFinalKeys = new Set();
  const seenDraftIds = new Set();

  // 1. Process Final Bills
  finalBills.forEach(f => {
    if (!f || !f.id) return;
    const invNo = (f.invoice_no || f.bill_no || '').trim();
    const draftId = (f.draft_bill_id || '').trim();
    const draftNo = (f.draft_bill_no || '').trim();

    if (invNo) seenFinalKeys.add(invNo);
    if (draftNo) seenFinalKeys.add(draftNo);
    if (draftId) seenDraftIds.add(draftId);
    if (f.id.startsWith('INV-DBILL-')) seenDraftIds.add(f.id.replace('INV-', ''));

    map.set(f.id, {
      id: f.id,
      recordType: 'FINAL',
      invoice_no: f.invoice_no || f.bill_no || '--',
      bill_no: f.invoice_no || f.bill_no || '--',
      draft_bill_no: f.draft_bill_no || (f.draft_bill_id || '--'),
      draft_bill_id: f.draft_bill_id || '',
      amount_paid: f.amount_paid,
      status: f.status
    });
  });

  // 2. Process Draft Bills
  draftBills.forEach(d => {
    if (!d || !d.id) return;
    const dInvNo = (d.invoice_no || '').trim();
    const dDraftNo = (d.draft_bill_no || '').trim();
    const dBillNo = (d.bill_no || '').trim();
    const finalId = (d.final_bill_id || '').trim();

    // Check if draft is already represented in finalBills
    if (map.has(d.id)) return;
    if (seenDraftIds.has(d.id)) return;
    if (finalId && (map.has(finalId) || seenDraftIds.has(finalId))) return;
    if (dInvNo && dInvNo !== '--' && seenFinalKeys.has(dInvNo)) return;
    if (dDraftNo && dDraftNo !== '--' && seenFinalKeys.has(dDraftNo)) return;
    if (dBillNo && dBillNo !== '--' && seenFinalKeys.has(dBillNo)) return;

    const isFin = (d.status === 'FINALIZED' || d.status === 'PAID' || d.status === 'PARTIALLY_PAID' || d.status === 'REVISED_PAYMENT_PENDING');
    if (isFin && Array.from(map.values()).some(b => 
      b.draft_bill_id === d.id || 
      b.invoice_no === dInvNo || 
      b.bill_no === dBillNo || 
      b.draft_bill_no === dDraftNo
    )) {
      return;
    }

    map.set(d.id, {
      id: d.id,
      recordType: isFin ? 'FINAL' : 'DRAFT',
      invoice_no: d.invoice_no || (isFin ? d.id : '--'),
      bill_no: d.invoice_no || d.draft_bill_no || d.id,
      draft_bill_no: d.draft_bill_no || d.id,
      draft_bill_id: d.id,
      amount_paid: d.amount_paid,
      status: d.status
    });
  });

  // 3. Strict Deduplication Safety Net by unique bill number
  const uniqueBills = [];
  const seenBillNos = new Set();
  const sorted = Array.from(map.values()).sort((a, b) => {
    if (a.recordType === 'FINAL' && b.recordType !== 'FINAL') return -1;
    if (b.recordType === 'FINAL' && a.recordType !== 'FINAL') return 1;
    return (b.amount_paid || 0) - (a.amount_paid || 0);
  });

  sorted.forEach(bill => {
    const billNo = (bill.invoice_no && bill.invoice_no !== '--' ? bill.invoice_no : (bill.draft_bill_no || bill.bill_no || bill.id)).trim();
    if (seenBillNos.has(billNo)) return;
    seenBillNos.add(billNo);
    uniqueBills.push(bill);
  });

  return uniqueBills;
}

console.log('--- Testing Improved getAllBillsForSearch logic ---');
const improved = getAllBillsForSearchImproved();
console.log('Results count:', improved.length);
improved.forEach((r, idx) => {
  console.log(`Row ${idx + 1}: id=${r.id}, bill_no=${r.bill_no}, inv=${r.invoice_no}, paid=${r.amount_paid}, status=${r.status}, recordType=${r.recordType}`);
});
