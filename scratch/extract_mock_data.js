const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function searchAllTranscripts() {
  const brainDir = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain';
  const dirs = fs.readdirSync(brainDir);
  const foundList = [];
  for (const dir of dirs) {
    const fullLog = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(fullLog)) continue;
    const fileStream = fs.createReadStream(fullLog);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.includes('mock-data.js') && line.includes('"write_to_file"')) {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            if (tc.name === 'write_to_file' && tc.args && (tc.args.TargetFile || '').endsWith('mock-data.js')) {
              foundList.push({ dir, step: obj.step_index, created_at: obj.created_at, len: tc.args.CodeContent.length });
              fs.writeFileSync(`d:/Projects/ISCM/scratch/mock_data_${dir}_${obj.step_index}.js`, tc.args.CodeContent, 'utf8');
            }
          }
        }
      }
    }
  }
  console.log('Found full writes:', foundList);
}

searchAllTranscripts();
