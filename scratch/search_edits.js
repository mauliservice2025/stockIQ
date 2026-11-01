const fs = require('fs');
const readline = require('readline');

async function searchWhoEditedMockData() {
  const transPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/brain/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(transPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('mock-data.js') && (line.includes('writeFileSync') || line.includes('replace_file_content') || line.includes('write_to_file'))) {
      const obj = JSON.parse(line);
      console.log('Step:', obj.step_index, 'type:', obj.type);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          console.log('   tc:', tc.name, tc.args ? (tc.args.TargetFile || tc.args.CommandLine || '') : '');
        }
      }
    }
  }
}
searchWhoEditedMockData();
