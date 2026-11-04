const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');

function readVarint(buffer, offset) {
  let res = 0;
  let shift = 0;
  let bytesRead = 0;
  while (offset < buffer.length) {
    const b = buffer[offset++];
    bytesRead++;
    res |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return { value: res, bytesRead };
}

let offset = 7042; // First 0x1a
const lines = [];

while (offset < buf.length) {
  if (buf[offset] !== 0x1a) {
    // If we hit something else, see if it's the end of repeated field 3
    console.log(`Stopped at offset ${offset}: byte 0x${buf[offset].toString(16)} (lines read: ${lines.length})`);
    break;
  }
  offset++; // skip 0x1a
  const msgLen = readVarint(buf, offset);
  offset += msgLen.bytesRead;
  const msgEnd = offset + msgLen.value;

  // Inside message, read fields
  let lineStr = '';
  while (offset < msgEnd) {
    const tagByte = buf[offset++];
    const fieldNum = tagByte >> 3;
    const wireType = tagByte & 0x07;

    if (fieldNum === 1 && wireType === 2) {
      // string content
      const strLen = readVarint(buf, offset);
      offset += strLen.bytesRead;
      lineStr = buf.slice(offset, offset + strLen.value).toString('utf8');
      offset += strLen.value;
    } else if (wireType === 0) {
      // varint
      const v = readVarint(buf, offset);
      offset += v.bytesRead;
    } else if (wireType === 2) {
      // length delimited
      const l = readVarint(buf, offset);
      offset += l.bytesRead + l.value;
    } else {
      console.warn(`Unknown wire type ${wireType} at offset ${offset}`);
      offset = msgEnd;
      break;
    }
  }
  lines.push(lineStr);
}

console.log('Total lines extracted:', lines.length);
console.log('First 5 lines:', lines.slice(0, 5));
console.log('Last 5 lines:', lines.slice(-5));

const fullCode = lines.join('\n');
console.log('Full code length:', fullCode.length);
fs.writeFileSync('d:/Projects/ISCM/scratch/restored_full_mock_data.js', fullCode, 'utf8');
console.log('Successfully saved to scratch/restored_full_mock_data.js');
