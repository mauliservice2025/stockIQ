const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const pinnedCode = fs.readFileSync('js/modules/pinned-submodules.js', 'utf8');
const regRoutes = [...pinnedCode.matchAll(/route:\s*'([^']+)'/g)].map(m => m[1]);

// Extract sidebar
const sidebarStart = indexHtml.indexOf('<aside class="sidebar"');
const sidebarEnd = indexHtml.indexOf('</aside>');
const sidebarHtml = indexHtml.substring(sidebarStart, sidebarEnd);

const linkMatches = [...sidebarHtml.matchAll(/href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];

console.log('Sidebar links analysis:');
const missing = [];
linkMatches.forEach(m => {
  const href = m[1];
  const inner = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  const hasReg = regRoutes.includes(href);
  if (!hasReg) {
    missing.push({ href, title: inner });
    console.log(`[MISSING PIN] ${href} -> "${inner}"`);
  } else {
    console.log(`[HAS PIN]     ${href} -> "${inner}"`);
  }
});
console.log('\nTotal Missing in sidebar:', missing.length);
