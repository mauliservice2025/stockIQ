const fs = require('fs');
const readline = require('readline');

async function inspectTranscript() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/edcbf432-9453-41c7-aae9-a4d5bdcb7ca0/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('"step_index":2770') || line.includes('"step_index":2769')) {
      const obj = JSON.parse(line);
      console.log('step:', obj.step_index, 'type:', obj.type);
      if (obj.tool_calls) console.log('tool:', obj.tool_calls);
      if (obj.content && obj.content.length < 500) console.log('content:', obj.content);
    }
  }
}
inspectTranscript();
