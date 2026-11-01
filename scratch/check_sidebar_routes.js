const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('js/app.js', 'utf8');

// Extract all hrefs from sidebar in index.html
const matches = indexHtml.match(/href="#\/[^"]+"/g) || [];
const hrefs = [...new Set(matches.map(m => m.replace('href="', '').replace('"', '')))];

// Extract moduleCodeMap from app.js
const mapStart = appJs.indexOf('const moduleCodeMap = {');
const mapEnd = appJs.indexOf('};', mapStart);
const mapCode = appJs.substring(mapStart, mapEnd + 2);
let moduleCodeMap;
eval(mapCode.replace('const moduleCodeMap', 'moduleCodeMap'));

const missing = [];
for (const h of hrefs) {
  const code = moduleCodeMap[h];
  if (!code) missing.push(h);
}
console.log('Total sidebar routes:', hrefs.length);
console.log('Missing permCode in moduleCodeMap:', missing);
