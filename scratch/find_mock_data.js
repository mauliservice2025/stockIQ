const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function findFullMockData() {
  const brainDir = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain';
  const dirs = fs.readdirSync(brainDir);
  for (const dir of dirs) {
    const fullLog = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(fullLog)) continue;
    const fileStream = fs.createReadStream(fullLog);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.includes('Total Lines: 6846') || (line.includes('Mauli Service Center 2') && line.includes('Survey No. 45, Wakad Bypass Highway'))) {
        console.log('Found in dir:', dir, 'line len:', line.length);
        const obj = JSON.parse(line);
        console.log('step:', obj.step_index, 'type:', obj.type);
        if (obj.tool_calls) {
          console.log('tool:', obj.tool_calls.map(tc => tc.name));
        }
      }
    }
  }
}
findFullMockData();
