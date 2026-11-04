const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log('--- TEST: Vehicle Compatibility Master Export & Import Feature ---');

const mockDataCode = fs.readFileSync('js/data/mock-data.js', 'utf8');
const itemSetupCode = fs.readFileSync('js/modules/item-setup-master.js', 'utf8');

const modals = [];
const toasts = [];
const downloadedFiles = [];

const context = {
  console: console,
  setTimeout: fn => fn(),
  Blob: class {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      this.text = parts.join('');
    }
  },
  URL: {
    createObjectURL: blob => 'blob:' + Math.random(),
    revokeObjectURL: () => {}
  },
  window: {},
  document: {
    getElementById: id => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: tag => {
      const el = {
        style: {},
        setAttribute: (k, v) => { el[k] = v; },
        click: () => {
          if (el.download) {
            downloadedFiles.push({ filename: el.download, href: el.href });
          }
        }
      };
      return el;
    },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    }
  }
};
context.window = context;
context.window.State = {
  showModal: opts => {
    modals.push(opts);
    console.log(`[Modal Opened]: ${opts.title}`);
  },
  closeModal: () => {
    console.log('[Modal Closed]');
  },
  showToast: (msg, type = 'info') => {
    toasts.push({ msg, type });
    console.log(`[Toast ${type}]: ${msg}`);
  }
};

vm.createContext(context);
vm.runInContext(mockDataCode, context);

context.window.DB = {
  data: JSON.parse(JSON.stringify(context.window.INITIAL_DATA || {})),
  getAll(col) { return this.data[col] || []; },
  getById(col, id) { return (this.data[col] || []).find(x => x.id === id || x.code === id); },
  upsert(col, rec) {
    if (!this.data[col]) this.data[col] = [];
    const idx = this.data[col].findIndex(x => x.id === rec.id || (x.code && rec.code && x.code.toUpperCase() === rec.code.toUpperCase()));
    if (idx !== -1) this.data[col][idx] = rec;
    else this.data[col].push(rec);
  },
  delete(col, id) {
    if (!this.data[col]) return;
    this.data[col] = this.data[col].filter(x => x.id !== id && x.code !== id);
  },
  saveData() {
    console.log('[DB.saveData called]');
  },
  emitChange(col) {
    console.log(`[DB.emitChange called for ${col}]`);
  }
};

vm.runInContext(itemSetupCode, context);
const ISM = context.window.ItemSetupModule;
assert(ISM, 'ItemSetupModule must be defined');

// 1. Verify Toolbar contains Export and Import buttons
console.log('\n--- TEST 1: Toolbar Export & Import Buttons ---');
const toolbarHtml = ISM.renderVehicleCompatibilityTab();
assert(toolbarHtml.includes('exportVehiclesCsv()'), 'Must contain exportVehiclesCsv button');
assert(toolbarHtml.includes('showImportVehiclesModal()'), 'Must contain showImportVehiclesModal button');
assert(toolbarHtml.includes('📤 Export'), 'Must display Export button label');
assert(toolbarHtml.includes('📥 Import'), 'Must display Import button label');
console.log('✓ 1. Vehicle Compatibility Master toolbar includes both 📤 Export and 📥 Import buttons');

// 2. Test Export CSV
console.log('\n--- TEST 2: Export CSV Generation ---');
ISM.exportVehiclesCsv();
assert(downloadedFiles.length > 0, 'Must trigger a file download');
const lastDownload = downloadedFiles[downloadedFiles.length - 1];
assert(lastDownload.filename.startsWith('Vehicle_Compatibility_Master_'), 'Download filename must start with Vehicle_Compatibility_Master_');
console.log(`✓ 2. Export CSV successfully downloaded file: ${lastDownload.filename}`);

// 3. Test Sample CSV Download
console.log('\n--- TEST 3: Sample CSV Template Download ---');
ISM.downloadVehicleSampleCsv();
const sampleDownload = downloadedFiles[downloadedFiles.length - 1];
assert.strictEqual(sampleDownload.filename, 'vehicle_models_import_template.csv');
console.log('✓ 3. Sample CSV template download works properly');

// 4. Test Show Import Modal
console.log('\n--- TEST 4: Show Import Modal ---');
ISM.showImportVehiclesModal();
const importModal = modals[modals.length - 1];
assert(importModal, 'Import modal must open');
assert(importModal.title.includes('Bulk Import Vehicle Models'), 'Modal title must be Bulk Import Vehicle Models');
assert(importModal.contentHtml.includes('downloadVehicleSampleCsv()'), 'Must include sample CSV download action');
assert(importModal.contentHtml.includes('handleVehicleImportFile'), 'Must include file upload handler');
assert(importModal.contentHtml.includes('executeVehicleImport()'), 'Must include execute import button');
console.log('✓ 4. Import dialog opens with file upload, paste, upsert options, and sample download');

// 5. Test CSV Parsing & Import Processing
console.log('\n--- TEST 5: CSV Parsing & Bulk Import Execution ---');
const sampleCsv = `Model Code,Model Name,Variant,Engine CC,Fuel Type,Year From,Year To,Status
ACCESS-125,Access 125,Special Edition,124,Petrol,2020,2026,Active
ATHER-450X,Ather 450X,Gen 3 Pro,0,EV,2022,2026,Active
ACTIVA-6G,Activa 6G,Deluxe Smart,110,Petrol,2020,2026,Active`;

ISM.processVehicleCsvText(sampleCsv);
assert(Array.isArray(ISM._parsedVehicleImportData), 'Must populate _parsedVehicleImportData');
assert.strictEqual(ISM._parsedVehicleImportData.length, 3, 'Must parse exactly 3 vehicles');

const access = ISM._parsedVehicleImportData.find(v => v.code === 'ACCESS-125');
assert(access, 'ACCESS-125 must be present');
assert.strictEqual(access.displacement_cc, 124);
assert.strictEqual(access.fuel_type, 'Petrol');

const ather = ISM._parsedVehicleImportData.find(v => v.code === 'ATHER-450X');
assert(ather, 'ATHER-450X must be present');
assert.strictEqual(ather.fuel_type, 'EV');

// Execute Import
const initialCount = context.window.DB.getAll('vehicleModels').length;
ISM.executeVehicleImport();

const updatedVehicles = context.window.DB.getAll('vehicleModels');
assert(updatedVehicles.some(v => v.code === 'ACCESS-125'), 'ACCESS-125 must be saved in DB');
assert(updatedVehicles.some(v => v.code === 'ATHER-450X'), 'ATHER-450X must be saved in DB');

// Verify existing record (ACTIVA-6G) was updated
const activa = updatedVehicles.find(v => v.code === 'ACTIVA-6G');
assert.strictEqual(activa.variant, 'Deluxe Smart', 'ACTIVA-6G variant must be updated to Deluxe Smart');

console.log(`✓ 5. Successfully imported models into DB (initial: ${initialCount}, new total: ${updatedVehicles.length})`);

console.log('\n🎉 ALL VEHICLE EXPORT & IMPORT TESTS PASSED 100%!');
