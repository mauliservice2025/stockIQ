const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');
const text = buf.toString('utf8');

console.log('Text length:', text.length);
// Look for mock-data or ReplacementContent
const idx = text.indexOf('replace_file_content');
console.log('replace_file_content at:', idx);

// Find TargetFile
const matchTarget = text.match(/\"TargetFile\":\s*\"([^\"]+)\"/);
if (matchTarget) {
  console.log('TargetFile:', matchTarget[1]);
}

// Find ReplacementContent or CodeContent
const matchCode = text.match(/\"(ReplacementContent|CodeContent)\":\s*\"/);
if (matchCode) {
  console.log('Found code content key:', matchCode[1], 'at position:', matchCode.index);
}

// Let's search if "const INITIAL_DATA" is in text
const initialIdx = text.indexOf('const INITIAL_DATA');
console.log('const INITIAL_DATA at:', initialIdx);
if (initialIdx !== -1) {
  console.log('Snippet around INITIAL_DATA:', text.slice(initialIdx, initialIdx + 500));
}
