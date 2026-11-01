const fs = require('fs');
const mockDataContent = fs.readFileSync('js/data/mock-data.js', 'utf8');
const fakeWindow = {};
eval(mockDataContent + '\nfakeWindow.INITIAL_DATA = INITIAL_DATA;');
console.log('INITIAL_DATA keys:', Object.keys(fakeWindow.INITIAL_DATA));
console.log('plants in INITIAL_DATA:', fakeWindow.INITIAL_DATA.plants);
console.log('organizations in INITIAL_DATA:', fakeWindow.INITIAL_DATA.organizations);
console.log('warehouses in INITIAL_DATA:', fakeWindow.INITIAL_DATA.warehouses ? fakeWindow.INITIAL_DATA.warehouses.length : 0);
