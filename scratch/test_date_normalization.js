function normalizeDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val !== 'string') return '';
  const clean = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
  const ddmmyyyy = clean.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  try {
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {}
  return '';
}

function getRecordDate(rec) {
  if (!rec) return '';
  const candidates = [
    rec.bill_date,
    rec.invoice_date,
    rec.date,
    rec.delivered_at,
    rec.handover_date,
    rec.settled_at,
    rec.delivery_date,
    rec.draft_date,
    rec.estimate_date,
    rec.created_at
  ];
  for (const c of candidates) {
    if (!c) continue;
    const normalized = normalizeDateStr(c);
    if (normalized) return normalized;
  }
  return '';
}

const del = {
  id: 'DEL-JC-0030',
  gate_pass_no: 'Pending Gate Pass',
  job_card_id: 'JC-0030',
  job_card_no: 'JC/MSC1/2026/0030',
  invoice_no: 'INV/MSC1/2026/0020',
  customer_name: 'Jaggu Kolhe',
  vehicle_reg_no: 'MH12AC4378',
  delivery_date: 'Ready for Handover',
  settled_at: '2026-10-26T06:11:14.870Z',
  date: '2026-10-26',
  plant_id: 'PLANT-01'
};

console.log('normalizeDateStr("Ready for Handover"):', JSON.stringify(normalizeDateStr('Ready for Handover')));
console.log('getRecordDate(del):', getRecordDate(del));
