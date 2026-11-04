const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('TEST: Verify Reset Series Preserves Document Number Format');
console.log('================================================================');

// Mock window and DB environment
const initialSeries = [
  {
    id: 'DNS-CUSTOM-01',
    doc_type_code: 'JC',
    doc_type_name: 'Job Card',
    branch_id: 'BR-001',
    branch_name: 'Mauli Service Center 1',
    branch_code: 'MSC1',
    prefix: 'JC',
    separator: '/',
    year_format: 'YYYY',
    number_length: 4, // 4-digit format: JC/MSC1/2026/####
    starting_number: 1,
    current_number: 25,
    next_number: 26,
    generated_count: 25,
    suffix: '',
    reset_frequency: 'Financial Year',
    status: 'Active'
  },
  {
    id: 'DNS-CUSTOM-02',
    doc_type_code: 'INV',
    doc_type_name: 'Tax Invoice',
    branch_id: 'BR-002',
    branch_name: 'Mauli Service Center 2',
    branch_code: 'MSC2',
    prefix: 'TI',
    separator: '-',
    year_format: 'YY',
    number_length: 5,
    starting_number: 50,
    current_number: 75,
    next_number: 76,
    generated_count: 26,
    suffix: '-EXP',
    reset_frequency: 'Calendar Year',
    status: 'Active'
  }
];

const dbData = {
  document_number_series: JSON.parse(JSON.stringify(initialSeries))
};

global.window = {
  DB: {
    data: dbData,
    getAll(col) {
      return this.data[col] || [];
    },
    getById(col, id) {
      return (this.data[col] || []).find(x => x.id === id);
    },
    upsert(col, item) {
      if (!this.data[col]) this.data[col] = [];
      const idx = this.data[col].findIndex(x => x.id === item.id);
      if (idx !== -1) this.data[col][idx] = item;
      else this.data[col].push(item);
      return item;
    },
    saveData() {},
    emitChange() {}
  },
  State: {
    showToast(msg, type) {}
  }
};
global.INITIAL_DATA = { document_number_series: [] };

require('../js/modules/doc-series-master.js');
const mod = global.window.DocSeriesMasterModule;

// Test formatPatternMask for 4-digit series before reset
const mask1Before = mod.formatPatternMask(dbData.document_number_series[0]);
assert.strictEqual(mask1Before, 'JC/MSC1/2026/####', `Expected JC/MSC1/2026/####, got ${mask1Before}`);

// Execute resetAllToStartFromOne
console.log('\n--- 1. Testing resetAllToStartFromOne() ---');
mod.resetAllToStartFromOne(true);

const series1After = window.DB.getById('document_number_series', 'DNS-CUSTOM-01');
const series2After = window.DB.getById('document_number_series', 'DNS-CUSTOM-02');

// Assert DNS-CUSTOM-01: format unchanged
assert.strictEqual(series1After.number_length, 4, 'number_length must remain 4');
assert.strictEqual(series1After.prefix, 'JC', 'prefix must remain JC');
assert.strictEqual(series1After.separator, '/', 'separator must remain /');
assert.strictEqual(series1After.year_format, 'YYYY', 'year_format must remain YYYY');
assert.strictEqual(series1After.suffix, '', 'suffix must remain empty');
assert.strictEqual(series1After.reset_frequency, 'Financial Year', 'reset_frequency must remain Financial Year');
// Assert sequence changed
assert.strictEqual(series1After.current_number, 0, 'current_number must reset to 0');
assert.strictEqual(series1After.next_number, 1, 'next_number must reset to starting_number (1)');
assert.strictEqual(series1After.generated_count, 0, 'generated_count must reset to 0');

const nextDocFormatted = mod.formatDocumentNumber(series1After, series1After.next_number);
assert.strictEqual(nextDocFormatted, 'JC/MSC1/2026/0001', `Next doc number should format to 4 digits: JC/MSC1/2026/0001 (got ${nextDocFormatted})`);
console.log(`✓ Series 1 format preserved: Pattern is ${mod.formatPatternMask(series1After)}, next doc is ${nextDocFormatted}`);

// Assert DNS-CUSTOM-02: custom format unchanged
assert.strictEqual(series2After.number_length, 5, 'number_length must remain 5');
assert.strictEqual(series2After.separator, '-', 'separator must remain -');
assert.strictEqual(series2After.year_format, 'YY', 'year_format must remain YY');
assert.strictEqual(series2After.suffix, '-EXP', 'suffix must remain -EXP');
assert.strictEqual(series2After.reset_frequency, 'Calendar Year', 'reset_frequency must remain Calendar Year');
assert.strictEqual(series2After.current_number, 0, 'current_number must reset to 0');
assert.strictEqual(series2After.next_number, 50, 'next_number must reset to starting_number (50)');
assert.strictEqual(series2After.generated_count, 0, 'generated_count must reset to 0');
console.log(`✓ Series 2 format preserved: Pattern is ${mod.formatPatternMask(series2After)} with suffix ${series2After.suffix} and separator ${series2After.separator}`);

// Test resetSingleSeries
console.log('\n--- 2. Testing resetSingleSeries() ---');
series1After.current_number = 15;
series1After.next_number = 16;
series1After.generated_count = 15;
mod.resetSingleSeries('DNS-CUSTOM-01', true);

const series1SingleReset = window.DB.getById('document_number_series', 'DNS-CUSTOM-01');
assert.strictEqual(series1SingleReset.number_length, 4, 'number_length must remain 4 after single reset');
assert.strictEqual(series1SingleReset.current_number, 0, 'current_number must reset to 0');
assert.strictEqual(series1SingleReset.next_number, 1, 'next_number must reset to 1');
assert.strictEqual(series1SingleReset.generated_count, 0, 'generated_count must reset to 0');
console.log('✓ resetSingleSeries() also preserves format and only resets sequence.');

console.log('\n================================================================');
console.log('🎉 ALL RESET SERIES TESTS PASSED! FORMAT PATTERN IS PRESERVED.');
console.log('================================================================');
