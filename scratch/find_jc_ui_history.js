const fs = require('fs');
const path = require('path');
const dirs = ['109b9e68-4deb-458f-8e50-dcd7e16d854f', '1acfca50-1ffe-4a04-9132-ed77658f32ab', '3d510eae-a5ab-46c9-b70c-ccbdc5f6a33a', '4328f9ff-1602-40cb-9b08-ed329de389bc', '871a4f34-c9b8-4579-9106-40e0b90bc9b7', 'ab1ffb4b-8164-4a6c-893c-b8072bcd1ad8', 'ccd16fdb-a05d-48e3-a037-6bd0f2f98194', 'e400d35e-5f82-4841-9347-e0b75e37b32a', 'edcbf432-9453-41c7-aae9-a4d5bdcb7ca0', 'f101606a-8f63-490e-bd2f-e10908d1e9fc'];

for (const id of dirs) {
  const p = path.join('C:\\Users\\PravinPatil\\.gemini\\antigravity-ide\\brain', id, '.system_generated', 'logs', 'transcript.jsonl');
  if (!fs.existsSync(p)) continue;
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  for (const l of lines) {
    if (!l.trim()) continue;
    try {
      const obj = JSON.parse(l);
      if (obj.type === 'USER_INPUT') {
        const text = typeof obj.content === 'string' ? obj.content : JSON.stringify(obj.content);
        if (/job card|registration/i.test(text)) {
          console.log('[' + id.slice(0, 8) + '] USER: ' + text.replace(/\n/g, ' ').slice(0, 150));
        }
      }
    } catch(e) {}
  }
}
