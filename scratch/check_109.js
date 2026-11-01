const fs = require('fs');
const readline = require('readline');

async function check109() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/109b9e68-4deb-458f-8e50-dcd7e16d854f/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('"step_index":6348') || line.includes('"step_index":6350') || line.includes('"step_index":6542')) {
      const obj = JSON.parse(line);
      console.log('step:', obj.step_index, 'type:', obj.type);
      if (obj.tool_calls) {
        console.log('tool:', obj.tool_calls.map(tc => tc.name));
      }
    }
  }
}
check109();
