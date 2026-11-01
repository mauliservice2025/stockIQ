const fs = require('fs');
const path = require('path');

const dir = 'js/modules';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.js')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const whMatches = content.match(/warehouses/g);
    const storeMatches = content.match(/storeMaster|store-master|store_id|warehouse_id/g);
    if (whMatches || storeMatches) {
      console.log(file, 'warehouses:', whMatches ? whMatches.length : 0, 'stores:', storeMatches ? storeMatches.length : 0);
    }
  }
});
