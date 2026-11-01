const fs = require('fs');

let content = fs.readFileSync('js/data/mock-data.js', 'utf8');

// Replace organizations
content = content.replace(/"organizations":\s*\[[\s\S]*?\}\s*\]\s*,/g, '"organizations": [],');

// Replace plants
content = content.replace(/"plants":\s*\[[\s\S]*?\}\s*\]\s*,/g, '"plants": [],');

fs.writeFileSync('js/data/mock-data.js', content, 'utf8');
console.log('Updated mock-data.js!');

delete require.cache[require.resolve('../js/data/mock-data.js')];
const mod = require('../js/data/mock-data.js');
console.log('Organizations in mock-data:', mod.INITIAL_DATA.organizations);
console.log('Plants in mock-data:', mod.INITIAL_DATA.plants);
console.log('Facilities in mock-data:', mod.INITIAL_DATA.facilities);
