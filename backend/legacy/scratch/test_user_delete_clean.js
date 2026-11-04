const fs = require('fs');

function deleteUserFromMock(content, userId) {
  const usersStart = content.indexOf('"users": [');
  if (usersStart === -1) return content;
  
  // Find where users array ends: look for "\n  ]," after usersStart
  const usersEnd = content.indexOf('\n  ],', usersStart);
  if (usersEnd === -1) return content;

  const usersSection = content.slice(usersStart, usersEnd);
  
  // Find user with this id in usersSection
  const userMarker = `\"id\": \"${userId}\"`;
  const idPos = usersSection.indexOf(userMarker);
  if (idPos === -1) return content;

  // Search backward from idPos for the starting '{' of this user object
  const userObjStart = usersSection.lastIndexOf('{', idPos);
  if (userObjStart === -1) return content;

  // Now count braces forward from userObjStart to find the matching '}'
  let depth = 0;
  let userObjEnd = -1;
  for (let i = userObjStart; i < usersSection.length; i++) {
    if (usersSection[i] === '{') depth++;
    else if (usersSection[i] === '}') {
      depth--;
      if (depth === 0) {
        userObjEnd = i + 1;
        break;
      }
    }
  }

  if (userObjEnd === -1) return content;

  // Check if followed by a comma
  let removeEnd = userObjEnd;
  while (removeEnd < usersSection.length && (usersSection[removeEnd] === ' ' || usersSection[removeEnd] === ',' || usersSection[removeEnd] === '\r' || usersSection[removeEnd] === '\n')) {
    if (usersSection[removeEnd] === ',') {
      removeEnd++;
      break;
    }
    removeEnd++;
  }

  // Also include leading whitespace/newline before userObjStart if present
  let removeStart = userObjStart;
  while (removeStart > 0 && (usersSection[removeStart - 1] === ' ' || usersSection[removeStart - 1] === '\t')) {
    removeStart--;
  }
  if (removeStart > 0 && usersSection[removeStart - 1] === '\n') {
    removeStart--;
    if (removeStart > 0 && usersSection[removeStart - 1] === '\r') removeStart--;
  }

  const newUsersSection = usersSection.slice(0, removeStart) + usersSection.slice(removeEnd);
  return content.slice(0, usersStart) + newUsersSection + content.slice(usersEnd);
}

const content = fs.readFileSync('js/data/mock-data.js', 'utf8');
const updated = deleteUserFromMock(content, 'USR-112');
console.log('Original has USR-112:', content.includes('"USR-112"'));
console.log('Updated has USR-112:', updated.includes('"USR-112"'));
console.log('Updated has "users": [:', updated.includes('"users": ['));
console.log('Length diff:', content.length - updated.length);
