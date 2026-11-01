const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');

// Find "const INITIAL_DATA" in buffer
const targetStr = Buffer.from('const INITIAL_DATA');
const startIdx = buf.indexOf(targetStr);
console.log('startIdx:', startIdx);

// Let's find where the file content ends
// In mock-data.js, the end of the file is:
// "module.exports = { INITIAL_DATA };" or similar
const endStr1 = Buffer.from('module.exports = { INITIAL_DATA };');
const endStr2 = Buffer.from('INITIAL_DATA.facilities = INITIAL_DATA.plants;');

console.log('endStr1 index:', buf.indexOf(endStr1));
console.log('endStr2 index:', buf.indexOf(endStr2));

// Let's look at protobuf structure around startIdx
// Typically field is wire type 2 (length-delimited): tag byte, then varint length, then bytes
let fileContent = null;
if (startIdx !== -1) {
  // Let's search for the end of the JS code
  const endMarker = Buffer.from('module.exports = { INITIAL_DATA };\n}');
  let endIdx = buf.indexOf(endMarker);
  if (endIdx === -1) {
    endIdx = buf.indexOf(Buffer.from('module.exports = { INITIAL_DATA };'));
    if (endIdx !== -1) {
      // look for next newline or brace
      endIdx += Buffer.from('module.exports = { INITIAL_DATA };').length;
      while (endIdx < buf.length && (buf[endIdx] === 10 || buf[endIdx] === 13 || buf[endIdx] === 32 || buf[endIdx] === 125)) {
        endIdx++;
      }
    }
  } else {
    endIdx += endMarker.length;
  }
  console.log('endIdx:', endIdx);
  if (endIdx !== -1) {
    const rawContent = buf.slice(startIdx, endIdx);
    console.log('Extracted rawContent length:', rawContent.length);
    fs.writeFileSync('d:/Projects/ISCM/scratch/extracted_full_mock_data.js', rawContent);
    console.log('Saved to scratch/extracted_full_mock_data.js');
    console.log('Head (200):', rawContent.slice(0, 200).toString('utf8'));
    console.log('Tail (200):', rawContent.slice(-200).toString('utf8'));
  }
}
