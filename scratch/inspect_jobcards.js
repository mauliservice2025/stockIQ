const fs = require('fs');
['./data/db.json', './database/db.json'].forEach(p => {
  if (fs.existsSync(p)) {
    const db = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(p, 'jobCards count:', (db.jobCards || []).length);
    console.log((db.jobCards || []).slice(0, 10).map(j => ({ no: j.job_card_no, date: j.date, created_at: j.created_at })));
  }
});
