const fs = require('fs');

global.window = {};
eval(fs.readFileSync('js/data/mock-data.js', 'utf8'));

const users = INITIAL_DATA.users || [];
console.log('Total users in INITIAL_DATA:', users.length);

const techs = users.filter(u => 
  u.user_type === 'Technician' || 
  (u.designation && u.designation.toLowerCase().includes('tech')) ||
  (u.primary_role && u.primary_role.toLowerCase().includes('tech'))
);

console.log('Technicians count:', techs.length);
console.log('Technicians list:', techs.map(u => ({
  id: u.id,
  employee_id: u.employee_id,
  name: u.full_name || u.display_name || u.username,
  user_type: u.user_type,
  designation: u.designation,
  status: u.status
})));
