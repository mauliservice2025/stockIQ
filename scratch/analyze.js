const fs = require('fs');
const readline = require('readline');

async function analyze() {
  const fileStream = fs.createReadStream('C:/Users/PravinPatil/.gemini/antigravity-ide/brain/4328f9ff-1602-40cb-9b08-ed329de389bc/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const edits = [];
  const userInputs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.created_at && obj.created_at.startsWith('2026-10-09')) {
        userInputs.push({ step: obj.step_index, time: obj.created_at, content: obj.content });
      }
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'replace_file_content' || tc.name === 'write_to_file' || tc.name === 'multi_replace_file_content') {
            edits.push({ step: obj.step_index, time: obj.created_at, tool: tc.name, args: tc.args });
          }
        }
      }
    } catch (e) {}
  }

  console.log('--- USER INPUTS TODAY ---');
  for (const u of userInputs) {
    const textMatch = u.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
    console.log(`Step ${u.step} [${u.time}]: ${textMatch ? textMatch[1].trim() : u.content.slice(0, 100)}`);
  }

  console.log('\n--- ALL EDITS TODAY ---');
  const recentEdits = edits.filter(e => e.time && e.time.startsWith('2026-10-09'));
  console.log('Today edits count: ' + recentEdits.length);
  for (const e of recentEdits) {
    const file = e.args.TargetFile;
    const desc = e.args.Description || e.args.Instruction;
    console.log(`Step ${e.step} [${e.time}] ${e.tool}: ${file} -> ${desc}`);
  }
}

analyze();
