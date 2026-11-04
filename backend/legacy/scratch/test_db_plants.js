const fs = require('fs');

const dbCode = fs.readFileSync('d:/Projects/ISCM/js/data/db.js', 'utf8');

// evaluate db to check plants and records
const vm = require('vm');
const sandbox = { window: {}, console: console, localStorage: { getItem: () => null, setItem: () => {} } };
sandbox.window = sandbox;
sandbox.global = sandbox;

try {
  vm.runInNewContext(dbCode, sandbox);
  const DB = sandbox.window.DB;
  if (DB && DB.data) {
    console.log('Plants:', DB.data.plants);
    console.log('JobCards count:', (DB.data.jobCards || []).length);
    console.log('Sample JobCard:', (DB.data.jobCards || [])[0]);
    console.log('Estimates count:', (DB.data.billingEstimates || []).length);
    console.log('Sample Estimate:', (DB.data.billingEstimates || [])[0]);
    console.log('FinalBills count:', (DB.data.finalBills || []).length);
    console.log('Sample FinalBill:', (DB.data.finalBills || [])[0]);
    console.log('VehicleDeliveries count:', (DB.data.vehicleDeliveries || []).length);
    console.log('Sample VehicleDelivery:', (DB.data.vehicleDeliveries || [])[0]);
  }
} catch (e) {
  console.error(e);
}
