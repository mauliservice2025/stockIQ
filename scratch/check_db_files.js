const fs = require('fs');
const path = require('path');

try {
  const initDbPath = path.join(__dirname, '..', 'database', 'init-db.js');
  console.log('init-db exists:', fs.existsSync(initDbPath));
} catch (e) {
  console.error(e);
}
