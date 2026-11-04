const fs = require('fs');
const readline = require('readline');

async function checkSteps() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.step_index >= 120 && obj.step_index <= 147) {
      console.log('step:', obj.step_index, 'type:', obj.type);
      if (obj.tool_calls) {
        console.log('  tool calls:', obj.tool_calls.map(tc => ({ name: tc.name, args: tc.args })));
      }
      if (obj.content && obj.content.length < 500) {
        console.log('  content:', obj.content);
      }
    }
  }
}
checkSteps();
