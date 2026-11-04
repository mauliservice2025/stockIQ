const fs = require('fs');

const mockData = require('../js/data/mock-data.js');
const data = mockData.INITIAL_DATA || mockData;

console.log('--- Dates in mock-data collections ---');
['jobCards', 'billingEstimates', 'draftBills', 'finalBills', 'vehicleDeliveries'].forEach(col => {
  const list = data[col] || [];
  console.log(`\nCollection: ${col} (${list.length} records)`);
  list.slice(0, 5).forEach((item, idx) => {
    console.log(` [${idx}] id=${item.id}, date=${item.date}, invoice_date=${item.invoice_date}, delivery_date=${item.delivery_date}, created_at=${item.created_at}`);
  });
});
