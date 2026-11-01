const { INITIAL_DATA } = require('../js/data/mock-data');

const targets = ['PLANT-02', 'PLANT-03', 'BRANCH-CHE-02', 'BRANCH-WAKAD-01', 'Sriperumbudur', 'Apex Two-Wheeler Wakad'];

for (const [key, val] of Object.entries(INITIAL_DATA)) {
  if (Array.isArray(val)) {
    val.forEach((item, idx) => {
      const str = JSON.stringify(item);
      for (const t of targets) {
        if (str.includes(t)) {
          console.log(`Key "${key}" [${idx}]: found "${t}" (id: ${item.id || item.code || idx})`);
          break;
        }
      }
    });
  }
}
