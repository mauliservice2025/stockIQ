const fs = require('fs');
const initSqlJs = require('sql.js');

async function run() {
  const SQL = await initSqlJs();
  const dbPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/conversations/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a.db';
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const res = db.exec("SELECT step_payload FROM steps WHERE idx = 141");
  const payload = res[0].values[0][0];
  console.log('Step 141 payload type:', typeof payload, 'length:', payload.length);
  fs.writeFileSync('d:/Projects/ISCM/scratch/step_141_payload.txt', payload, 'utf8');
  console.log('Saved to scratch/step_141_payload.txt');
  console.log('Snippet:', payload.slice(0, 300));
}
run().catch(console.error);
