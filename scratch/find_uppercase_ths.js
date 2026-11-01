const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    if (item === 'node_modules' || item === '.git' || item === 'scratch') continue;
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (full.endsWith('.js') || full.endsWith('.html')) files.push(full);
  }
  return files;
}

const files = walk('./js').concat(fs.existsSync('./index.html') ? ['./index.html'] : []);
const uppercaseThs = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
  for (const m of matches) {
    const text = m.replace(/<[^>]+>/g, '').trim();
    if (/^[A-Z0-9\s/&_\-.,()#:]+$/.test(text) && text.length > 3 && /[A-Z]{2,}/.test(text)) {
      if (!['GST', 'GSTIN', 'HSN', 'SAC', 'CIN', 'PIN', 'UOM', 'CC', 'SR', 'ID', 'PO', 'SKU', 'QR', 'MRP', 'QTY', 'PAN', 'CGST', 'SGST', 'IGST'].includes(text)) {
        uppercaseThs.push({ file: path.relative('.', file), text, raw: m });
      }
    }
  }
}
console.log('Total found:', uppercaseThs.length);
console.log(JSON.stringify(uppercaseThs, null, 2));
