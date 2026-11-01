const fs = require('fs');

// Read base mock data
const base = fs.readFileSync('scratch/mock_data_319fc166-3e45-4ee6-a37a-88d4cc255d1e_51.js', 'utf8');

// Write to scratch/test_rebuild.js
fs.writeFileSync('scratch/test_rebuild.js', base, 'utf8');

// Now let's see what enrich_mock_data.js does
console.log('Base length:', base.length);
