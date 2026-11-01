const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');
const text = buf.toString('utf8');

const initialIdx = text.indexOf('const INITIAL_DATA');
console.log('const INITIAL_DATA index:', initialIdx);
console.log('Total text length:', text.length);

// What is around initialIdx?
console.log('Before INITIAL_DATA (100 chars):', JSON.stringify(text.slice(Math.max(0, initialIdx - 100), initialIdx)));
console.log('After INITIAL_DATA (500 chars):', text.slice(initialIdx, initialIdx + 500));
