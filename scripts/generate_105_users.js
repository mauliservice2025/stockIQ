const fs = require('fs');
const path = require('path');
const pg = require('../database/pg.js');

const firstNames = [
  'Aakash', 'Abhishek', 'Aditya', 'Ajay', 'Akash', 'Amit', 'Anand', 'Aniket', 'Anil', 'Ankush',
  'Ashok', 'Atul', 'Avinash', 'Balasaheb', 'Bharat', 'Chetan', 'Deepak', 'Dhananjay', 'Dinesh', 'Gajanan',
  'Ganesh', 'Girish', 'Harish', 'Hemant', 'Jagdish', 'Jitendra', 'Kailash', 'Kiran', 'Kishore', 'Krishna',
  'Makarand', 'Mandar', 'Mangesh', 'Mayur', 'Milind', 'Mukesh', 'Narendra', 'Naresh', 'Nilesh', 'Nitin',
  'Omkar', 'Pankaj', 'Parag', 'Pradeep', 'Prakash', 'Prashant', 'Prateek', 'Ramesh', 'Ramkrishna', 'Ranjit',
  'Ravindra', 'Rohit', 'Sagar', 'Sameer', 'Sandip', 'Sanjay', 'Santosh', 'Satish', 'Saurabh', 'Shailesh',
  'Sharad', 'Shashank', 'Shivaji', 'Shridhar', 'Subhash', 'Sudhir', 'Suhas', 'Sunil', 'Suresh', 'Suryakant',
  'Swapnil', 'Tanaji', 'Tukaram', 'Uday', 'Umesh', 'Vaibhav', 'Vijay', 'Vikas', 'Vinayak', 'Virendra',
  'Vishal', 'Yogesh', 'Snehal', 'Pooja', 'Priya', 'Rupali', 'Swati', 'Kavita', 'Manisha', 'Sunita'
];

const lastNames = [
  'Bhosale', 'Chavan', 'Deshmukh', 'Gaikwad', 'Jadhav', 'Kadam', 'Kale', 'More', 'Patil', 'Pawar',
  'Salunkhe', 'Shinde', 'Surve', 'Tambe', 'Thorat', 'Wagh', 'Sawant', 'Mane', 'Bangar', 'Borse',
  'Gore', 'Ingale', 'Kharat', 'Khot', 'Magar', 'Mahadik', 'Nikam', 'Rathod', 'Sable', 'Shelke',
  'Shirke', 'Sonar', 'Taware', 'Ubale', 'Yadav', 'Gholap', 'Ghadge', 'Kute', 'Pardeshi', 'Mhatre'
];

const rolesList = [
  { role: 'ROLE-STORE-MGR', title: 'Store Manager', dept: 'Warehouse & Stores', type: 'Employee' },
  { role: 'ROLE-STORE-EXEC', title: 'Store Executive', dept: 'Warehouse & Stores', type: 'Employee' },
  { role: 'ROLE-QA-INSPECTOR', title: 'QA Inspector', dept: 'Quality Assurance & Metallurgy', type: 'Technician' },
  { role: 'ROLE-PURCHASE-MGR', title: 'Purchase Manager', dept: 'Procurement & Supply', type: 'Employee' },
  { role: 'ROLE-PURCHASE-EXEC', title: 'Procurement Specialist', dept: 'Procurement & Supply', type: 'Employee' },
  { role: 'ROLE-PROD-MGR', title: 'Workshop Service Manager', dept: 'Plant Engineering & Maintenance', type: 'Employee' },
  { role: 'ROLE-PROD-EXEC', title: 'Senior Service Technician', dept: 'Plant Engineering & Maintenance', type: 'Technician' },
  { role: 'ROLE-MECHANIC', title: 'Two-Wheeler Master Mechanic', dept: 'Plant Engineering & Maintenance', type: 'Technician' },
  { role: 'ROLE-FINANCE-MGR', title: 'Finance & Billing Executive', dept: 'Finance & Accounts', type: 'Employee' },
  { role: 'ROLE-DISPATCH-EXEC', title: 'Parts Dispatch & Logistics Officer', dept: 'Logistics & Distribution', type: 'Employee' },
  { role: 'ROLE-AUDITOR', title: 'Stock & Inventory Auditor', dept: 'Operations Directorate', type: 'Admin' }
];

const plants = [
  { id: 'PLANT-01', prefix: 'PUN' },
  { id: 'PLANT-02', prefix: 'MUM' },
  { id: 'PLANT-03', prefix: 'NAG' }
];

const defaultSalt = 'a1b2c3d4e5f67890';
const defaultHash = 'sha256$a1b2c3d4e5f67890$31d609d6b3258ee2429b14c0e987ddca6558550f014f0824b8a3813fde440ce4';

const newUsers = [];
for (let i = 18; i <= 105; i++) {
  const numStr = String(i).padStart(3, '0');
  const id = `USR-${numStr}`;
  const fName = firstNames[(i - 18) % firstNames.length];
  const lName = lastNames[(i * 3) % lastNames.length];
  const plant = plants[i % plants.length];
  const roleInfo = rolesList[i % rolesList.length];
  const username = `${plant.prefix}2026${String(i).padStart(3, '0')}`;
  const empId = `EMP-${9000 + i}`;
  const mobile = `98${String(20000000 + i * 3719).slice(0, 8)}`;
  const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@stockiq.com`;
  const displayName = `${fName} ${lName}`;

  newUsers.push({
    id: id,
    username: username,
    employee_id: empId,
    employee_name: displayName,
    first_name: fName,
    middle_name: '',
    last_name: lName,
    display_name: displayName,
    full_name: displayName,
    user_type: roleInfo.type,
    designation: roleInfo.title,
    department: roleInfo.dept,
    specialty: roleInfo.type === 'Technician' ? 'Two-Wheeler Powertrain & Diagnostics' : '',
    mobile_number: mobile,
    email: email,
    status: (i === 24 || i === 48) ? 'LOCKED' : (i === 35 ? 'INACTIVE' : 'ACTIVE'),
    primary_role: roleInfo.role,
    company_id: 'COMP-01',
    plant_id: 'PLANT-01',
    warehouse_id: 'WH-PUN-MAIN',
    reporting_manager: 'Pravin Patil',
    effective_from: '2025-01-01',
    effective_to: '2030-12-31',
    failed_logins: (i === 24 || i === 48) ? 5 : 0,
    locked_until: (i === 24 || i === 48) ? '2026-09-30T18:00:00Z' : null,
    two_factor_enabled: i % 2 === 0,
    password_salt: defaultSalt,
    password_hash: defaultHash,
    password_history: [defaultHash],
    must_change_password: false,
    password_last_changed: '2025-01-15T09:00:00Z',
    last_login: `2026-09-${String(10 + (i % 15)).padStart(2, '0')}T10:00:00Z`,
    created_at: '2025-01-15T09:00:00Z'
  });
}

// 1. Update mock-data.js
const mockDataPath = path.join(__dirname, '../js/data/mock-data.js');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Find USR-017 end in mock-data.js and append the new users
const needle = `"id": "USR-017",`;
if (mockDataContent.includes(needle)) {
  // Let's read existing INITIAL_DATA using require
  delete require.cache[require.resolve(mockDataPath)];
  const raw = require(mockDataPath);
  const data = raw.INITIAL_DATA || raw;
  const existingUsers = data.users || [];
  
  // Check if USR-105 is already there
  if (!existingUsers.some(u => u.id === 'USR-105')) {
    console.log(`Current users in mock-data.js: ${existingUsers.length}. Appending up to USR-105...`);
    newUsers.forEach(nu => {
      if (!existingUsers.some(eu => eu.id === nu.id)) {
        existingUsers.push(nu);
      }
    });

    // Write back cleanly
    const jsonReplacement = JSON.stringify(existingUsers, null, 2);
    // Replace "users": [ ... ]
    mockDataContent = mockDataContent.replace(/"users":\s*\[[\s\S]*?\n\s*\],\s*"roles":/, `"users": ${jsonReplacement},\n  "roles":`);
    fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
    console.log(`Successfully updated mock-data.js! Total users now: ${existingUsers.length}`);
  } else {
    console.log(`mock-data.js already has ${existingUsers.length} users.`);
  }
}

// 2. Also insert newly generated users into PostgreSQL
(async () => {
  try {
    console.log('Inserting generated users into PostgreSQL...');
    for (const u of newUsers) {
      await pg.query(`
        INSERT INTO users (
          id, username, password_hash, password_salt, password_history, email, full_name,
          first_name, middle_name, last_name, display_name, mobile_number, department,
          designation, user_type, specialty, company_id, plant_id, warehouse_id,
          reporting_manager, primary_role_id, status, effective_from, failed_logins,
          two_factor_enabled, must_change_password, password_last_changed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        ON CONFLICT (id) DO NOTHING;
      `, [
        u.id, u.username, u.password_hash, u.password_salt, JSON.stringify(u.password_history),
        u.email, u.full_name, u.first_name, u.middle_name, u.last_name, u.display_name,
        u.mobile_number, u.department, u.designation, u.user_type, u.specialty,
        u.company_id, u.plant_id, u.warehouse_id, u.reporting_manager,
        u.primary_role, u.status, u.effective_from, u.failed_logins,
        u.two_factor_enabled, u.must_change_password, u.password_last_changed
      ]);
    }
    const countRes = await pg.query('SELECT count(*) FROM users;');
    console.log(`PostgreSQL users table now has ${countRes.rows[0].count} users.`);
  } catch (err) {
    console.error('Postgres seeding error:', err.message);
  } finally {
    process.exit(0);
  }
})();
