const fs = require('fs');

const buf = fs.readFileSync('scratch/step_141_payload.txt');
const text = buf.toString('utf8');

const jsonStart = text.indexOf('{"AllowMultiple"');
console.log('jsonStart:', jsonStart);

// Let's find the matching closing brace for this JSON
// Or search for where the JSON ends
let parsed = null;
for (let end = text.length; end > jsonStart; end--) {
  try {
    const candidate = text.slice(jsonStart, end);
    parsed = JSON.parse(candidate);
    console.log('Successfully parsed JSON! Length:', candidate.length);
    break;
  } catch(e) {}
}

if (parsed) {
  console.log('Parsed keys:', Object.keys(parsed));
  console.log('TargetFile:', parsed.TargetFile);
  console.log('StartLine:', parsed.StartLine, 'EndLine:', parsed.EndLine);
  console.log('TargetContent len:', parsed.TargetContent ? parsed.TargetContent.length : 0);
  console.log('ReplacementContent len:', parsed.ReplacementContent ? parsed.ReplacementContent.length : 0);
  fs.writeFileSync('d:/Projects/ISCM/scratch/step_141_target.txt', parsed.TargetContent, 'utf8');
  fs.writeFileSync('d:/Projects/ISCM/scratch/step_141_replacement.txt', parsed.ReplacementContent, 'utf8');
} else {
  console.log('Could not parse cleanly, let us look at byte structure');
}
