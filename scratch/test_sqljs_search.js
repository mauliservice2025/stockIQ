const fs = require('fs');
const initSqlJs = require('sql.js');

async function run() {
  const SQL = await initSqlJs();
  const dbPath = 'C:/Users/PravinPatil/.gemini/antigravity-ide/conversations/3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a.db';
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  const res = db.exec("SELECT idx, step_type, length(step_payload) FROM steps WHERE step_payload LIKE '%mock-data.js%'");
  if (res.length > 0) {
    console.log('Matches in 3d510eae:', res[0].values);
  } else {
    console.log('No matches in 3d510eae');
  }

  // Also check 109b9e68
  const dbPath109 = 'C:/Users/PravinPatil/.gemini/antigravity-ide/conversations/109b9e68-4deb-458f-8e50-dcd7e16d854f.db';
  if (fs.existsSync(dbPath109)) {
    const buf109 = fs.readFileSync(dbPath109);
    const db109 = new SQL.Database(buf109);
    const res109 = db109.exec("SELECT idx, step_type, length(step_payload) FROM steps WHERE step_payload LIKE '%mock-data.js%' ORDER BY length(step_payload) DESC LIMIT 10");
    if (res109.length > 0) {
      console.log('Top matches in 109b9e68:', res109[0].values);
    }
  }
}
run().catch(console.error);
