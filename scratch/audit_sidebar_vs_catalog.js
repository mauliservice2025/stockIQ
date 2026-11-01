const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Parse sidebar groups from index.html
const groupRegex = /<div class="module-group" id="([^"]+)">[\s\S]*?<span class="module-header-title">([^<]+)<\/span>([\s\S]*?)<\/div>\s*<\/div>/g;

let m;
const sidebarModules = [];
while ((m = groupRegex.exec(indexHtml)) !== null) {
  const groupId = m[1];
  const groupTitle = m[2].trim();
  const subMenuHtml = m[3];

  const subItems = [];
  const itemRegex = /<a href="([^"]+)" class="sub-nav-item nav-item"[^>]*>[\s\S]*?<span class="sub-nav-title">([^<]+)<\/span>/g;
  let im;
  while ((im = itemRegex.exec(subMenuHtml)) !== null) {
    subItems.push({ route: im[1], title: im[2].trim() });
  }

  sidebarModules.push({ groupId, groupTitle, subItems });
}

console.log('Sidebar Modules Found:');
sidebarModules.forEach(sm => {
  console.log(`- [${sm.groupId}] "${sm.groupTitle}": ${sm.subItems.length} items`);
});

global.window = global;
eval(fs.readFileSync('js/modules/user-management.js', 'utf8'));

const catalogCategories = Array.from(new Set(window.UserManagementModule.subModulesCatalog.map(sm => sm.category)));
console.log('\nsubModulesCatalog categories:');
catalogCategories.forEach(c => console.log(`- "${c}"`));
