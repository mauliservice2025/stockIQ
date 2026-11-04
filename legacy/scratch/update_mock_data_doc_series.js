const fs = require('fs');

const mockDataPath = 'js/data/mock-data.js';
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

const seriesData = JSON.parse(fs.readFileSync('scratch/series_data.json', 'utf8'));

// Format seriesData as indented JSON string
const seriesDataString = JSON.stringify(seriesData, null, 4)
  .split('\n')
  .map((line, idx) => (idx === 0 ? line : '  ' + line))
  .join('\n');

const startIndex = mockDataContent.indexOf('  "document_number_series": [');
const endIndex = mockDataContent.indexOf('  "financial_calendar": [');

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find document_number_series markers!');
  process.exit(1);
}

const newContent = 
  mockDataContent.slice(0, startIndex) +
  '  "document_number_series": ' + seriesDataString + ',\n' +
  mockDataContent.slice(endIndex);

fs.writeFileSync(mockDataPath, newContent, 'utf8');
console.log('Successfully updated document_number_series in js/data/mock-data.js');
