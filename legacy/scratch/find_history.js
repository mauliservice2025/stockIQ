const fs = require('fs');
const path = require('path');

const userProfile = process.env.USERPROFILE || 'C:/Users/PravinPatil';
const appData = process.env.APPDATA || path.join(userProfile, 'AppData/Roaming');

console.log('userProfile:', userProfile);
console.log('appData:', appData);

function searchHistory(baseDir) {
  if (!fs.existsSync(baseDir)) return [];
  let found = [];
  try {
    const entries = fs.readdirSync(baseDir);
    for (const entry of entries) {
      const full = path.join(baseDir, entry);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          const sub = fs.readdirSync(full);
          for (const s of sub) {
            if (s.endsWith('.json')) {
              try {
                const txt = fs.readFileSync(path.join(full, s), 'utf8');
                if (txt.includes('mock-data.js')) {
                  found.push({ dir: full, meta: s });
                }
              } catch(e){}
            }
          }
        }
      } catch(e){}
    }
  } catch(e){}
  return found;
}

const possibleHistoryDirs = [
  path.join(appData, 'Antigravity', 'User', 'History'),
  path.join(appData, 'Code', 'User', 'History'),
  path.join(userProfile, '.gemini', 'antigravity-ide', 'User', 'History'),
  path.join(userProfile, '.gemini', 'antigravity-ide', 'logs'),
  path.join(userProfile, '.gemini', 'antigravity-ide')
];

for (const d of possibleHistoryDirs) {
  console.log('Checking:', d, 'exists:', fs.existsSync(d));
  if (d.includes('History')) {
    const hits = searchHistory(d);
    if (hits.length > 0) {
      console.log('Found history entries in', d, ':', hits);
    }
  }
}
