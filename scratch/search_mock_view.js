const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function searchTranscriptForMockDataViews() {
  const brainDir = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain';
  const dirs = fs.readdirSync(brainDir);
  for (const dir of dirs) {
    const fullLog = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(fullLog)) continue;
    const fileStream = fs.createReadStream(fullLog);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.includes('Total Bytes: 215685') || (line.includes('mock-data.js') && line.includes('6846'))) {
        console.log('Match in dir:', dir, 'line len:', line.length);
        const obj = JSON.parse(line);
        console.log('step:', obj.step_index, 'type:', obj.type);
      }
    }
  }
}
searchTranscriptForMockDataViews();
