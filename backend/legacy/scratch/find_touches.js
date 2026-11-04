const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function findAllMockDataTouches() {
  const baseDir = path.join('C:', 'Users', 'PravinPatil', '.gemini', 'antigravity-ide', 'brain');
  const dirs = fs.readdirSync(baseDir);
  const touches = [];
  for (const d of dirs) {
    const logPath = path.join(baseDir, d, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(logPath)) continue;
    const rl = readline.createInterface({ input: fs.createReadStream(logPath), crlfDelay: Infinity });
    for await (const line of rl) {
      if (line.includes('mock-data.js') && (line.includes('"replace_file_content"') || line.includes('"write_to_file"') || line.includes('"multi_replace_file_content"'))) {
        try {
          const obj = JSON.parse(line);
          if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
              if (tc.args && (tc.args.TargetFile || '').endsWith('mock-data.js')) {
                touches.push({ dir: d, step: obj.step_index, tool: tc.name, created_at: obj.created_at });
              }
            }
          }
        } catch(e) {}
      }
    }
  }
  console.log('All touches:', touches);
}

findAllMockDataTouches();
