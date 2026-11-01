const fs = require('fs');
const readline = require('readline');

async function check109Views() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/109b9e68-4deb-458f-8e50-dcd7e16d854f/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('Total Lines: 6') && line.includes('mock-data.js')) {
      const obj = JSON.parse(line);
      console.log('step:', obj.step_index, 'len:', line.length);
      console.log(obj.content ? obj.content.slice(0, 200) : '');
    }
  }
}
check109Views();
