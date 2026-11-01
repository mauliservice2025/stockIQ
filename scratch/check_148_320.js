const fs = require('fs');
const readline = require('readline');

async function checkSteps148To320() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('mock-data.js')) {
      const obj = JSON.parse(line);
      if (obj.step_index >= 147 && obj.step_index <= 320) {
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            console.log('step:', obj.step_index, tc.name, tc.args ? (tc.args.TargetFile || tc.args.CommandLine || '') : '');
          }
        }
      }
    }
  }
}
checkSteps148To320();
