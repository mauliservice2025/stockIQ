// Automated verification script for Title and Gender master interlinking
const fs = require('fs');
const path = require('path');

// Mock browser window and localStorage
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

// Mock document and navigator
global.document = {
  getElementById: (id) => null
};
global.navigator = {};
global.State = {
  openModal: () => {},
  closeModal: () => {},
  showToast: () => {}
};

// Load mock data
const mockDataContent = fs.readFileSync(path.join(__dirname, '../js/data/mock-data.js'), 'utf8');
eval(mockDataContent);

// Load DB layer
const dbContent = fs.readFileSync(path.join(__dirname, '../js/data/db.js'), 'utf8');
eval(dbContent);

// DB loads data on construction
// window.DB is already initialized


// Load Common Lookup Master module
const commonMasterContent = fs.readFileSync(path.join(__dirname, '../js/modules/common-lookup-master.js'), 'utf8');
eval(commonMasterContent);

console.log('--- TEST SUITE: Title Master & Gender Master Interlinkage ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. Verify seed data has interlinked fields
const titles = window.DB.getCommonMasters('TITLE');
assert(titles.length >= 8, `Found ${titles.length} title entries`);

const mr = titles.find(t => t.code === 'MR');
assert(mr && mr.linked_gender_code === 'MALE' && mr.linked_gender_name === 'Male' && mr.is_gender_fixed === true, 
  'Mr. is interlinked with Male and fixed');

const mrs = titles.find(t => t.code === 'MRS');
assert(mrs && mrs.linked_gender_code === 'FEMALE' && mrs.linked_gender_name === 'Female' && mrs.is_gender_fixed === true, 
  'Mrs. is interlinked with Female and fixed');

const ms = titles.find(t => t.code === 'MS');
assert(ms && ms.linked_gender_code === 'FEMALE' && ms.linked_gender_name === 'Female' && ms.is_gender_fixed === true, 
  'Ms. is interlinked with Female and fixed');

const shri = titles.find(t => t.code === 'SHRI');
assert(shri && shri.linked_gender_code === 'MALE' && shri.linked_gender_name === 'Male' && shri.is_gender_fixed === true, 
  'Shri is interlinked with Male and fixed');

const smt = titles.find(t => t.code === 'SMT');
assert(smt && smt.linked_gender_code === 'FEMALE' && smt.linked_gender_name === 'Female' && smt.is_gender_fixed === true, 
  'Smt. is interlinked with Female and fixed');

const dr = titles.find(t => t.code === 'DR');
assert(dr && dr.is_gender_fixed === false, 
  'Dr. is flexible (not fixed)');

// 2. Test DB.getTitleGenderMapping helper
const mrMapping = window.DB.getTitleGenderMapping('Mr.');
assert(mrMapping && mrMapping.titleCode === 'MR' && mrMapping.linkedGenderCode === 'MALE' && mrMapping.isGenderFixed === true,
  'DB.getTitleGenderMapping("Mr.") resolves correctly');

const mrsMapping = window.DB.getTitleGenderMapping('MRS');
assert(mrsMapping && mrsMapping.linkedGenderCode === 'FEMALE' && mrsMapping.isGenderFixed === true,
  'DB.getTitleGenderMapping("MRS") resolves correctly');

const drMapping = window.DB.getTitleGenderMapping('Dr.');
assert(drMapping && drMapping.isGenderFixed === false,
  'DB.getTitleGenderMapping("Dr.") resolves flexible');

// 3. Test CommonLookupMasterModule public helpers
const modMrMapping = window.CommonLookupMasterModule.getGenderForTitle('Mr.');
assert(modMrMapping && modMrMapping.linkedGenderCode === 'MALE' && modMrMapping.isGenderFixed === true,
  'CommonLookupMasterModule.getGenderForTitle("Mr.") works');

const maleTitles = window.CommonLookupMasterModule.getTitlesForGender('MALE');
const maleTitleCodes = maleTitles.map(t => t.code);
assert(maleTitleCodes.includes('MR') && maleTitleCodes.includes('SHRI'),
  'CommonLookupMasterModule.getTitlesForGender("MALE") includes MR and SHRI');

// 4. Test render output contains interlink badge
window.CommonLookupMasterModule.typeFilter = 'TITLE';
const htmlOutput = window.CommonLookupMasterModule.renderTableContent();
assert(htmlOutput.includes('Title Master & Gender Master Interlinkage'),
  'Title filter view includes Title-Gender Interlink banner');
assert(htmlOutput.includes('Gender: <strong>Male</strong> (Fixed)'),
  'Table includes Gender: Male (Fixed) badge for Mr.');

// 5. Test GENDER view includes linked titles
window.CommonLookupMasterModule.typeFilter = 'GENDER';
const genderHtml = window.CommonLookupMasterModule.renderTableContent();
assert(genderHtml.includes('Linked Titles:'),
  'Gender table view includes Linked Titles preview');


// 6. Test simulator feedback
const mockFeedback = { innerHTML: '' };
global.document.getElementById = (id) => {
  if (id === 'common-lookup-interlink-feedback') return mockFeedback;
  return null;
};

window.CommonLookupMasterModule.testTitleGenderInterlink('MR');
assert(mockFeedback.innerHTML.includes('Fixed: Male'), 'testTitleGenderInterlink("MR") shows Fixed: Male');

window.CommonLookupMasterModule.testTitleGenderInterlink('DR');
assert(mockFeedback.innerHTML.includes('Flexible: Any'), 'testTitleGenderInterlink("DR") shows Flexible: Any');

// 7. Test CRUD persistence of interlink fields
window.DB.insert('common_masters', {
  id: 'CM-TEST-1',
  type: 'TITLE',
  type_label: 'Title',
  code: 'CAPT',
  name: 'Capt.',
  description: 'Captain',
  sort_order: 9,
  status: 'Active',
  linked_gender_code: 'MALE',
  linked_gender_name: 'Male',
  is_gender_fixed: false
});

const captMapping = window.DB.getTitleGenderMapping('CAPT');
assert(captMapping && captMapping.linkedGenderCode === 'MALE' && captMapping.isGenderFixed === false,
  'Inserted TITLE entry CAPT correctly maps to MALE flexible');

// Clean up test entry
window.DB.delete('common_masters', 'CM-TEST-1');
assert(!window.DB.getTitleGenderMapping('CAPT'), 'Cleaned up test entry');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed successfully!');
}

