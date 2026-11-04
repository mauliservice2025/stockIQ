const fs = require('fs');

const content = fs.readFileSync('js/modules/billing.js', 'utf8');
const lines = content.split('\n');

const patterns = [
  /convert.*job.*card/i,
  /job_card.*convert/i,
  /converted_to_type/i,
  /ESTIMATE_CONVERT_JC/i
];

lines.forEach((line, idx) => {
  for (const p of patterns) {
    if (p.test(line)) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
      break;
    }
  }
});
