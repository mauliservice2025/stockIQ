const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function findInTranscripts() {
  const baseDir = path.join('C:', 'Users', 'PravinPatil', '.gemini', 'antigravity-ide', 'brain');
  const dirs = fs.readdirSync(baseDir);
  for (const d of dirs) {
    const logPath = path.join(baseDir, d, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(logPath)) continue;
    const rl = readline.createInterface({ input: fs.createReadStream(logPath), crlfDelay: Infinity });
    let lineNum = 0;
    for await (const line of rl) {
      lineNum++;
      if (line.includes('const INITIAL_DATA') && line.length > 50000) {
        console.log(`Found candidate in ${d} at line ${lineNum}, len: ${line.length}`);
        try {
          const obj = JSON.parse(line);
          let targetText = null;
          if (obj.content && obj.content.includes('const INITIAL_DATA')) {
            targetText = obj.content;
          } else if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
              const argStr = JSON.stringify(tc.args || {});
              if (argStr.includes('const INITIAL_DATA')) {
                targetText = tc.args.CodeContent || tc.args.ReplacementContent || argStr;
              }
            }
          }
          if (targetText && targetText.includes('const INITIAL_DATA') && targetText.length > 30000) {
            console.log(`Found targetText with length ${targetText.length}! Saving...`);
            fs.writeFileSync(`d:/Projects/ISCM/scratch/candidate_${d}_${lineNum}.js`, targetText, 'utf8');
          }
        } catch(e) {
          console.error('Error parsing JSON:', e.message);
        }
      }
    }
  }
  console.log('Search completed.');
}

findInTranscripts();
