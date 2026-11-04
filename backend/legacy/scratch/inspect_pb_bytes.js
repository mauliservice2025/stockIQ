const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');

for (let i = 7068; i < 7120; i++) {
  console.log(i, '0x' + buf[i].toString(16).padStart(2, '0'), buf[i] >= 32 && buf[i] <= 126 ? String.fromCharCode(buf[i]) : '.');
}
