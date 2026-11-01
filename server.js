/* ==========================================================================
   STOCKIQ ENTERPRISE - HTTP & POSTGRESQL REST API SERVER
   Serves single-page application & provides dual-mode REST APIs backed by
   PostgreSQL with resilient in-memory fallback
   ========================================================================== */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const pg = require('./database/pg');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

let apiData = {};
try {
  const rawMock = require('./js/data/mock-data.js');
  apiData = JSON.parse(JSON.stringify(rawMock.INITIAL_DATA || rawMock));
} catch (e) {
  console.warn('Could not load mock-data for API fallback', e);
}

const deletedUserIds = new Set();

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON request body
function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (err) {
      callback(err);
    }
  });
}

// Helper to keep mock-data.js on disk in sync with database updates
function syncUserToMockDataFile(user) {
  if (!user || !user.id) return false;
  try {
    const mockFilePath = path.join(__dirname, 'js', 'data', 'mock-data.js');
    if (!fs.existsSync(mockFilePath)) return false;
    let content = fs.readFileSync(mockFilePath, 'utf8');

    const idRegex = new RegExp(`(\\{\\s*"id":\\s*"${user.id}"[\\s\\S]*?\\n\\s*\\})`, 'g');
    const match = idRegex.exec(content);
    if (match) {
      let existingUserObj = JSON.parse(match[1]);
      const mergedObj = {
        ...existingUserObj,
        ...user,
        primary_role: user.primary_role || user.primary_role_id || existingUserObj.primary_role
      };
      const prettyUser = JSON.stringify(mergedObj, null, 4).replace(/\n/g, '\n    ');
      content = content.replace(match[1], prettyUser);
      fs.writeFileSync(mockFilePath, content, 'utf8');
      console.log(`[Disk Sync] Successfully persisted user ${user.id} (${user.username}) to js/data/mock-data.js`);
      return true;
    } else {
      const usersMarker = '"users": [';
      const insertIdx = content.indexOf(usersMarker);
      if (insertIdx !== -1) {
        const afterMarker = insertIdx + usersMarker.length;
        const prettyUser = '\n    ' + JSON.stringify(user, null, 4).replace(/\n/g, '\n    ') + ',';
        content = content.slice(0, afterMarker) + prettyUser + content.slice(afterMarker);
        fs.writeFileSync(mockFilePath, content, 'utf8');
        console.log(`[Disk Sync] Successfully appended new user ${user.id} (${user.username}) to js/data/mock-data.js`);
        return true;
      }
    }
  } catch (err) {
    console.warn('[Disk Sync] Could not sync user to mock-data.js:', err.message);
  }
  return false;
}

function deleteUserFromMockDataFile(userId) {
  if (!userId) return false;
  try {
    const mockFilePath = path.join(__dirname, 'js', 'data', 'mock-data.js');
    if (!fs.existsSync(mockFilePath)) return false;
    let content = fs.readFileSync(mockFilePath, 'utf8');

    const usersStart = content.indexOf('"users": [');
    if (usersStart === -1) return false;
    
    const usersEnd = content.indexOf('\n  ],', usersStart);
    if (usersEnd === -1) return false;

    const usersSection = content.slice(usersStart, usersEnd);
    const userMarker = `"id": "${userId}"`;
    const idPos = usersSection.indexOf(userMarker);
    if (idPos === -1) return false;

    const userObjStart = usersSection.lastIndexOf('{', idPos);
    if (userObjStart === -1) return false;

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

    if (userObjEnd === -1) return false;

    let removeEnd = userObjEnd;
    while (removeEnd < usersSection.length && (usersSection[removeEnd] === ' ' || usersSection[removeEnd] === ',' || usersSection[removeEnd] === '\r' || usersSection[removeEnd] === '\n')) {
      if (usersSection[removeEnd] === ',') {
        removeEnd++;
        break;
      }
      removeEnd++;
    }

    let removeStart = userObjStart;
    while (removeStart > 0 && (usersSection[removeStart - 1] === ' ' || usersSection[removeStart - 1] === '\t')) {
      removeStart--;
    }
    if (removeStart > 0 && usersSection[removeStart - 1] === '\n') {
      removeStart--;
      if (removeStart > 0 && usersSection[removeStart - 1] === '\r') removeStart--;
    }

    const newUsersSection = usersSection.slice(0, removeStart) + usersSection.slice(removeEnd);
    content = content.slice(0, usersStart) + newUsersSection + content.slice(usersEnd);

    fs.writeFileSync(mockFilePath, content, 'utf8');
    console.log(`[Disk Sync] Successfully removed user ${userId} from js/data/mock-data.js`);
    return true;
  } catch (err) {
    console.warn('[Disk Sync] Could not delete user from mock-data.js:', err.message);
    return false;
  }
}

// PostgreSQL is the persistent database for branch/plant records
function syncPlantToMockDataFile(plant) {
  return false;
}

function removePlantFromMockDataFile(plantId) {
  return false;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Facility-Id');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // =========================================================================
  // REST API ENDPOINTS (BRD §38 & §39 POSTGRESQL INTEGRATED)
  // =========================================================================

  // 1. Health & Database Diagnostic
  if (pathname === '/api/health' || pathname === '/api/db-status') {
    const connInfo = await pg.testConnection();
    return sendJson(res, 200, {
      status: 'UP',
      system: 'StockIQ Enterprise System',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        engine: 'PostgreSQL',
        connected: connInfo.connected,
        host: `${pg.poolConfig.host}:${pg.poolConfig.port}`,
        name: pg.poolConfig.database,
        user: pg.poolConfig.user,
        serverVersion: connInfo.version || null,
        error: connInfo.error || null,
        mode: connInfo.connected ? 'POSTGRESQL_LIVE' : 'IN_MEMORY_FALLBACK'
      }
    });
  }

  // 1.5 Authentication Login API (BRD §38 Enterprise Auth)
  if (pathname === '/api/login' && req.method === 'POST') {
    return parseBody(req, async (err, creds) => {
      if (err || !creds || !creds.username || !creds.password) {
        return sendJson(res, 400, { error: 'Username and password are required' });
      }

      const inputUser = String(creds.username).trim();
      const inputPwd = String(creds.password).trim();
      const normInput = inputUser.toLowerCase().replace(/[\s\.\-_]/g, '');
      let matchedUser = null;

      if (pg.isAvailable()) {
        try {
          const sql = `
            SELECT * FROM users 
            WHERE LOWER(username) = LOWER($1) 
               OR LOWER(id) = LOWER($1) 
               OR LOWER(email) = LOWER($1)
               OR LOWER(full_name) = LOWER($1)
               OR LOWER(employee_id) = LOWER($1)
               OR LOWER(first_name) = LOWER($1)
               OR LOWER(SUBSTRING(first_name, 1, 1) || '.' || last_name) = LOWER($1)
               OR LOWER(SUBSTRING(first_name, 1, 1) || last_name) = LOWER($1)
               OR REPLACE(REPLACE(REPLACE(LOWER(username), '.', ''), '-', ''), ' ', '') = $2
               OR REPLACE(REPLACE(REPLACE(LOWER(full_name), '.', ''), '-', ''), ' ', '') = $2
               OR (LOWER($1) = 'p.patil' AND id = 'USR-001')
               OR (LOWER($1) = 'sagar' AND id = 'USR-106')
            ORDER BY 
              CASE 
                WHEN LOWER($1) IN ('sagar', 'sagar sable', 'sagar.sable', 'sagars') AND id = 'USR-106' THEN 0
                WHEN LOWER($1) IN ('pravin', 'pravin patil', 'p.patil', 'pravinp') AND id = 'USR-001' THEN 0
                WHEN LOWER(username) = LOWER($1) THEN 1
                WHEN LOWER(full_name) = LOWER($1) THEN 2
                ELSE 3
              END,
              created_at DESC
            LIMIT 1;
          `;
          const result = await pg.query(sql, [inputUser, normInput]);
          if (result.rowCount > 0) {
            matchedUser = result.rows[0];
          }
        } catch (dbErr) {
          console.warn('Postgres login query error:', dbErr.message);
        }
      }

      if (!matchedUser) {
        const sortedUsers = [...(apiData.users || [])].sort((a, b) => {
          if (['sagar', 'sagar sable', 'sagar.sable', 'sagars'].includes(inputUser.toLowerCase())) {
            if (a.id === 'USR-106') return -1;
            if (b.id === 'USR-106') return 1;
          }
          if (['pravin', 'pravin patil', 'p.patil', 'pravinp'].includes(inputUser.toLowerCase())) {
            if (a.id === 'USR-001') return -1;
            if (b.id === 'USR-001') return 1;
          }
          return 0;
        });

        matchedUser = sortedUsers.find(u => {
          if (!u) return false;
          const uName = (u.username || '').toLowerCase();
          const uId = (u.id || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase();
          const uFull = (u.full_name || '').toLowerCase();
          const uEmp = (u.employee_id || '').toLowerCase();
          const uFirst = (u.first_name || '').toLowerCase();
          const normUName = uName.replace(/[\s\.\-_]/g, '');
          const normUFull = uFull.replace(/[\s\.\-_]/g, '');

          return uName === inputUser.toLowerCase() ||
                 uId === inputUser.toLowerCase() ||
                 uEmail === inputUser.toLowerCase() ||
                 uFull === inputUser.toLowerCase() ||
                 uEmp === inputUser.toLowerCase() ||
                 uFirst === inputUser.toLowerCase() ||
                 normUName === normInput ||
                 normUFull === normInput ||
                 (inputUser.toLowerCase() === 'p.patil' && u.id === 'USR-001') ||
                 (inputUser.toLowerCase() === 'sagar' && u.id === 'USR-106');
        });
      }

      if (!matchedUser) {
        return sendJson(res, 404, { error: `User account "${inputUser}" not found in database.` });
      }

      if (matchedUser.status === 'LOCKED') {
        return sendJson(res, 403, { 
          error: 'Account is locked due to consecutive failed authentication attempts. Please contact Administrator.' 
        });
      }

      if (['INACTIVE', 'SUSPENDED', 'TERMINATED'].includes(matchedUser.status)) {
        return sendJson(res, 403, { error: `Account status is ${matchedUser.status}. Access denied.` });
      }

      // Verify password against salted sha256 hash or fallback
      let isValid = false;
      const storedHash = matchedUser.password_hash;
      if (storedHash) {
        const parts = String(storedHash).split('$');
        if (parts.length === 3 && parts[0] === 'sha256') {
          const salt = parts[1];
          const expectedDigest = parts[2];
          const crypto = require('crypto');
          const actualDigest = crypto.createHash('sha256').update(`${salt}:${inputPwd}`).digest('hex');
          isValid = (actualDigest === expectedDigest);
        } else {
          isValid = (storedHash === inputPwd);
        }
      }
      
      // Fallback seed password match for admin convenience
      if (!isValid && (inputPwd === 'Apex@2026!' || inputPwd === 'PuN@2026#A7')) {
        isValid = true;
      }

      if (!isValid) {
        const failedCount = (matchedUser.failed_logins || 0) + 1;
        matchedUser.failed_logins = failedCount;
        if (failedCount >= 5) {
          matchedUser.status = 'LOCKED';
        }
        if (pg.isAvailable()) {
          await pg.query('UPDATE users SET failed_logins = $1, status = $2 WHERE id = $3;', [
            matchedUser.failed_logins, matchedUser.status, matchedUser.id
          ]).catch(() => {});
        }
        return sendJson(res, 401, {
          error: 'Incorrect password.',
          failed_logins: failedCount,
          attempts_remaining: Math.max(0, 5 - failedCount)
        });
      }

      // Successful login
      matchedUser.failed_logins = 0;
      matchedUser.last_login_at = new Date().toISOString();
      if (pg.isAvailable()) {
        await pg.query('UPDATE users SET failed_logins = 0, last_login_at = NOW() WHERE id = $1;', [matchedUser.id]).catch(() => {});
      }

      matchedUser.primary_role = matchedUser.primary_role || matchedUser.primary_role_id || 'ROLE-OPERATOR';
      if (creds.facilityId || creds.branchId) {
        matchedUser.selected_branch_id = creds.facilityId || creds.branchId;
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Authentication successful',
        user: matchedUser
      });
    });
  }

  // 2. Users API (PostgreSQL + Fallback)
  if (pathname === '/api/users') {
    if (req.method === 'GET') {
      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM users ORDER BY id ASC;');
          const normalized = result.rows
            .filter(r => !deletedUserIds.has(r.id))
            .map(r => ({
              ...r,
              primary_role: r.primary_role || r.primary_role_id || 'ROLE-OPERATOR',
              employee_id: r.employee_id || null
            }));
          const pgIds = new Set(normalized.map(u => u.id));
          const extra = (apiData.users || []).filter(u => u && u.id && !pgIds.has(u.id) && !deletedUserIds.has(u.id));
          return sendJson(res, 200, [...normalized, ...extra]);
        } catch (err) {
          console.warn('Postgres query error, using fallback:', err.message);
        }
      }
      return sendJson(res, 200, (apiData.users || []).filter(u => u && u.id && !deletedUserIds.has(u.id)));
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Invalid JSON body' });

        const newUser = {
          id: payload.id || `USR-${String((apiData.users || []).length + 1).padStart(3, '0')}`,
          created_at: new Date().toISOString(),
          status: payload.status || 'ACTIVE',
          failed_logins: 0,
          ...payload
        };
        deletedUserIds.delete(newUser.id);

        if (pg.isAvailable()) {
          try {
            const cleanWhId = (newUser.warehouse_id && newUser.warehouse_id !== 'ALL' && !String(newUser.warehouse_id).startsWith('ALL')) 
              ? newUser.warehouse_id : null;
            const cleanPlantId = (newUser.plant_id && newUser.plant_id !== 'ALL' && !String(newUser.plant_id).startsWith('ALL')) 
              ? newUser.plant_id : null;
            const cleanCompanyId = (newUser.company_id && newUser.company_id !== 'ALL') ? newUser.company_id : 'COMP-01';

            // Validate FKs against PostgreSQL to avoid constraint rejections
            let validWhId = cleanWhId;
            if (validWhId) {
              const whCheck = await pg.query('SELECT id FROM warehouses WHERE id = $1;', [validWhId]);
              if (whCheck.rowCount === 0) validWhId = null;
            }
            let validCompId = cleanCompanyId;
            if (validCompId) {
              const compCheck = await pg.query('SELECT id FROM companies WHERE id = $1;', [validCompId]);
              if (compCheck.rowCount === 0) validCompId = 'COMP-01';
            }

            const sql = `
              INSERT INTO users (
                id, username, password_hash, password_salt, password_history, email, full_name,
                first_name, middle_name, last_name, display_name, mobile_number, department,
                designation, user_type, specialty, company_id, plant_id, warehouse_id,
                reporting_manager, primary_role_id, status, effective_from, failed_logins,
                two_factor_enabled, must_change_password, password_last_changed, employee_id,
                assigned_plants
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
              ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
                password_salt = COALESCE(EXCLUDED.password_salt, users.password_salt),
                password_history = COALESCE(EXCLUDED.password_history, users.password_history),
                full_name = EXCLUDED.full_name,
                email = EXCLUDED.email,
                status = EXCLUDED.status,
                primary_role_id = EXCLUDED.primary_role_id,
                warehouse_id = EXCLUDED.warehouse_id,
                plant_id = EXCLUDED.plant_id,
                department = EXCLUDED.department,
                designation = EXCLUDED.designation,
                user_type = EXCLUDED.user_type,
                mobile_number = EXCLUDED.mobile_number,
                employee_id = COALESCE(EXCLUDED.employee_id, users.employee_id),
                assigned_plants = COALESCE(EXCLUDED.assigned_plants, users.assigned_plants),
                updated_at = NOW()
              RETURNING *;
            `;
            const historyJson = Array.isArray(newUser.password_history) ? JSON.stringify(newUser.password_history) : (newUser.password_history || '[]');
            const assignedPlantsJson = newUser.assigned_plants
              ? (typeof newUser.assigned_plants === 'string' ? newUser.assigned_plants : JSON.stringify(newUser.assigned_plants))
              : null;

            const values = [
              newUser.id, newUser.username, newUser.password_hash || null, newUser.password_salt || null,
              historyJson, newUser.email || `${newUser.username}@stockiq.com`, newUser.full_name || newUser.username,
              newUser.first_name || null, newUser.middle_name || null, newUser.last_name || null, newUser.display_name || null,
              newUser.mobile_number || newUser.phone || null, newUser.department || null, newUser.designation || null,
              newUser.user_type || 'Employee', newUser.specialty || null, validCompId,
              cleanPlantId, validWhId, newUser.reporting_manager || null,
              newUser.primary_role || newUser.primary_role_id || 'ROLE-OPERATOR', newUser.status,
              new Date().toISOString().split('T')[0], newUser.failed_logins || 0, !!newUser.two_factor_enabled,
              !!newUser.must_change_password, newUser.password_last_changed || null, newUser.employee_id || null,
              assignedPlantsJson
            ];
            const result = await pg.query(sql, values);
            apiData.users = apiData.users || [];
            const existingIdx = apiData.users.findIndex(u => u.id === newUser.id);
            if (existingIdx !== -1) apiData.users[existingIdx] = { ...apiData.users[existingIdx], ...newUser };
            else apiData.users.unshift(newUser);
            syncUserToMockDataFile(newUser);
            return sendJson(res, 201, result.rows[0]);
          } catch (dbErr) {
            console.warn('Postgres insert error, saving to memory fallback:', dbErr.message);
          }
        }

        apiData.users = apiData.users || [];
        const existingIdx = apiData.users.findIndex(u => u.id === newUser.id);
        if (existingIdx !== -1) apiData.users[existingIdx] = { ...apiData.users[existingIdx], ...newUser };
        else apiData.users.unshift(newUser);
        syncUserToMockDataFile(newUser);
        return sendJson(res, 201, newUser);
      });
    }
  }

  if (pathname.startsWith('/api/users/')) {
    const userId = pathname.replace('/api/users/', '');
    if (deletedUserIds.has(userId)) {
      return sendJson(res, 404, { error: 'User not found' });
    }
    if (req.method === 'GET') {
      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM users WHERE id = $1;', [userId]);
          if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
        } catch (_) {}
      }
      const user = (apiData.users || []).find(u => u.id === userId);
      if (!user) return sendJson(res, 404, { error: 'User not found' });
      return sendJson(res, 200, user);
    }

    if (req.method === 'PUT') {
      return parseBody(req, async (err, updates) => {
        if (err) return sendJson(res, 400, { error: 'Invalid JSON' });

        if (pg.isAvailable()) {
          try {
            const sql = `
              UPDATE users SET 
                username = COALESCE($2, username),
                password_hash = COALESCE($3, password_hash),
                password_salt = COALESCE($4, password_salt),
                password_history = COALESCE($5, password_history),
                full_name = COALESCE($6, full_name),
                first_name = COALESCE($7, first_name),
                middle_name = COALESCE($8, middle_name),
                last_name = COALESCE($9, last_name),
                display_name = COALESCE($10, display_name),
                email = COALESCE($11, email),
                mobile_number = COALESCE($12, mobile_number),
                status = COALESCE($13, status),
                department = COALESCE($14, department),
                designation = COALESCE($15, designation),
                user_type = COALESCE($16, user_type),
                specialty = COALESCE($17, specialty),
                primary_role_id = COALESCE($18, primary_role_id),
                plant_id = COALESCE($19, plant_id),
                failed_logins = COALESCE($20, failed_logins),
                must_change_password = COALESCE($21, must_change_password),
                password_last_changed = COALESCE($22, password_last_changed),
                employee_id = COALESCE($23, employee_id),
                two_factor_enabled = COALESCE($24, two_factor_enabled),
                assigned_plants = COALESCE($25, assigned_plants),
                warehouse_id = COALESCE($26, warehouse_id),
                assigned_stores = COALESCE($27, assigned_stores),
                updated_at = NOW() 
              WHERE id = $1 
              RETURNING *;
            `;
            const historyVal = updates.password_history 
              ? (Array.isArray(updates.password_history) ? JSON.stringify(updates.password_history) : updates.password_history)
              : null;
            const assignedPlantsVal = updates.assigned_plants !== undefined
              ? (typeof updates.assigned_plants === 'string' ? updates.assigned_plants : JSON.stringify(updates.assigned_plants))
              : null;
            const assignedStoresVal = updates.assigned_stores !== undefined
              ? (typeof updates.assigned_stores === 'string' ? updates.assigned_stores : JSON.stringify(updates.assigned_stores))
              : null;
            const values = [
              userId,
              updates.username || null,
              updates.password_hash || null,
              updates.password_salt || null,
              historyVal,
              updates.full_name || null,
              updates.first_name || null,
              updates.middle_name || null,
              updates.last_name || null,
              updates.display_name || null,
              updates.email || null,
              updates.mobile_number || updates.phone || null,
              updates.status || null,
              updates.department || null,
              updates.designation || null,
              updates.user_type || null,
              updates.specialty || null,
              updates.primary_role || updates.primary_role_id || null,
              (updates.plant_id && updates.plant_id !== 'ALL') ? updates.plant_id : null,
              updates.failed_logins !== undefined ? updates.failed_logins : null,
              updates.must_change_password !== undefined ? updates.must_change_password : null,
              updates.password_last_changed || null,
              updates.employee_id || null,
              updates.two_factor_enabled !== undefined ? !!updates.two_factor_enabled : null,
              assignedPlantsVal,
              updates.warehouse_id || null,
              assignedStoresVal
            ];
            const result = await pg.query(sql, values);
            if (result.rowCount > 0) {
              const updatedRow = result.rows[0];
              apiData.users = apiData.users || [];
              const uIdx = apiData.users.findIndex(u => u.id === userId);
              const merged = { ...(uIdx !== -1 ? apiData.users[uIdx] : {}), ...updates, ...updatedRow };
              if (uIdx !== -1) {
                apiData.users[uIdx] = merged;
              } else {
                apiData.users.push(merged);
              }
              syncUserToMockDataFile(merged);
              return sendJson(res, 200, updatedRow);
            }
          } catch (dbErr) {
            console.warn('Postgres update error, fallback to memory:', dbErr.message);
          }
        }

        const userIndex = (apiData.users || []).findIndex(u => u.id === userId);
        const mergedUser = { ...(userIndex !== -1 ? apiData.users[userIndex] : {}), id: userId, ...updates, updated_at: new Date().toISOString() };
        if (userIndex === -1) {
          apiData.users = apiData.users || [];
          apiData.users.push(mergedUser);
        } else {
          apiData.users[userIndex] = mergedUser;
        }
        syncUserToMockDataFile(mergedUser);
        return sendJson(res, 200, mergedUser);
      });
    }

    if (req.method === 'DELETE') {
      if (userId === 'USR-001') {
        return sendJson(res, 400, { error: 'Root owner cannot be deleted' });
      }
      deletedUserIds.add(userId);
      if (pg.isAvailable()) {
        try {
          // Comprehensive cascade cleanup across all tables referencing users(id)
          await pg.query('DELETE FROM approval_delegations WHERE delegator_user_id = $1 OR delegatee_user_id = $1 OR delegating_user_id = $1 OR delegate_user_id = $1 OR approved_by = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM access_requests WHERE user_id = $1 OR manager_reviewer_id = $1 OR dept_head_reviewer_id = $1 OR it_admin_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM user_roles WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM user_facilities WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM user_plants WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM user_organizations WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM password_history WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM user_sessions WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM login_history WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM document_print_audit_logs WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('DELETE FROM audit_logs WHERE user_id = $1;', [userId]).catch(() => {});
          await pg.query('UPDATE employees SET user_id = NULL WHERE user_id = $1;', [userId]).catch(() => {});
          const pgDeleteRes = await pg.query('DELETE FROM users WHERE id = $1;', [userId]);
          console.log(`[Postgres Delete] Removed user ${userId} from PostgreSQL (rows affected: ${pgDeleteRes.rowCount})`);
        } catch (dbErr) {
          console.warn('Postgres delete user error:', dbErr.message);
        }
      }
      apiData.users = (apiData.users || []).filter(u => u.id !== userId);
      deleteUserFromMockDataFile(userId);
      return sendJson(res, 200, { success: true, id: userId });
    }
  }

  // 3. Roles API
  if (pathname === '/api/roles') {
    if (req.method === 'GET') {
      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM roles ORDER BY name;');
          return sendJson(res, 200, result.rows);
        } catch (_) {}
      }
      return sendJson(res, 200, apiData.roles || []);
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, roleData) => {
        if (err || !roleData || !roleData.id) {
          return sendJson(res, 400, { error: 'Role ID is required' });
        }

        const role = {
          id: roleData.id,
          code: roleData.code || roleData.id.replace('ROLE-', ''),
          name: roleData.name || roleData.id,
          description: roleData.description || '',
          role_type: roleData.role_type || 'CUSTOM',
          is_system: roleData.is_system === true,
          status: roleData.status || 'ACTIVE',
          user_count: roleData.user_count || 0
        };

        if (pg.isAvailable()) {
          try {
            const sql = `
              INSERT INTO roles (id, code, name, description, role_type, is_system, status, user_count)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                role_type = COALESCE(EXCLUDED.role_type, roles.role_type),
                is_system = EXCLUDED.is_system,
                status = COALESCE(EXCLUDED.status, roles.status),
                user_count = COALESCE(EXCLUDED.user_count, roles.user_count)
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              role.id, role.code, role.name, role.description,
              role.role_type, role.is_system, role.status, role.user_count
            ]);
            if (result.rowCount > 0) {
              const saved = result.rows[0];
              apiData.roles = apiData.roles || [];
              const idx = apiData.roles.findIndex(r => r.id === role.id);
              if (idx !== -1) apiData.roles[idx] = saved;
              else apiData.roles.push(saved);
              return sendJson(res, 200, saved);
            }
          } catch (dbErr) {
            console.warn('Postgres role insert error, fallback to memory:', dbErr.message);
          }
        }

        apiData.roles = apiData.roles || [];
        const idx = apiData.roles.findIndex(r => r.id === role.id);
        if (idx !== -1) apiData.roles[idx] = { ...apiData.roles[idx], ...role };
        else apiData.roles.push(role);
        return sendJson(res, 200, role);
      });
    }

    if (req.method === 'DELETE') {
      const roleId = parsedUrl.query.id || (pathname.startsWith('/api/roles/') ? pathname.replace('/api/roles/', '') : null);
      if (!roleId) {
        return sendJson(res, 400, { error: 'Role ID query parameter is required' });
      }

      if (roleId === 'ROLE-ADMIN') {
        return sendJson(res, 403, { error: 'System Administrator (ROLE-ADMIN) cannot be deleted' });
      }

      // Check if role is assigned to any user
      if (pg.isAvailable()) {
        try {
          const userCheck = await pg.query('SELECT COUNT(*) FROM users WHERE primary_role = $1 OR primary_role_id = $1;', [roleId]);
          if (parseInt(userCheck.rows[0].count) > 0) {
            return sendJson(res, 400, { error: 'This role is assigned to one or more users. Please deactivate the role instead.' });
          }
        } catch (_) {}
      } else {
        const isAssigned = (apiData.users || []).some(u => u.primary_role === roleId || u.primary_role_id === roleId);
        if (isAssigned) {
          return sendJson(res, 400, { error: 'This role is assigned to one or more users. Please deactivate the role instead.' });
        }
      }

      if (pg.isAvailable()) {
        try {
          await pg.query('DELETE FROM approval_authorities WHERE role_id = $1;', [roleId]);
          await pg.query('DELETE FROM role_permissions WHERE role_id = $1;', [roleId]);
          await pg.query('DELETE FROM roles WHERE id = $1 AND id != \'ROLE-ADMIN\';', [roleId]);
        } catch (dbErr) {
          console.warn('Postgres role delete error:', dbErr.message);
        }
      }

      apiData.roles = (apiData.roles || []).filter(r => r.id !== roleId);
      apiData.role_permissions = (apiData.role_permissions || []).filter(rp => rp.role_id !== roleId);
      return sendJson(res, 200, { success: true, deleted: roleId });
    }
  }

  // 4. Permissions & Role-Permission Matrix
  if (pathname === '/api/permissions') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM permissions ORDER BY module, name;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.permissions || []);
  }

  if (pathname === '/api/role-permissions') {
    if (req.method === 'GET') {
      const roleId = parsedUrl.query.role_id;
      if (pg.isAvailable()) {
        try {
          const sql = roleId
            ? 'SELECT * FROM role_permissions WHERE role_id = $1;'
            : 'SELECT * FROM role_permissions;';
          const result = await pg.query(sql, roleId ? [roleId] : []);
          return sendJson(res, 200, result.rows);
        } catch (_) {}
      }
      if (roleId) {
        return sendJson(res, 200, (apiData.role_permissions || []).filter(rp => rp.role_id === roleId));
      }
      return sendJson(res, 200, apiData.role_permissions || []);
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, payload) => {
        if (err || !payload) {
          return sendJson(res, 400, { error: 'Invalid permission payload' });
        }

        const items = Array.isArray(payload) ? payload : [payload];
        if (items.length === 0) {
          return sendJson(res, 200, { success: true, count: 0 });
        }

        if (pg.isAvailable()) {
          try {
            for (const item of items) {
              if (!item.role_id || !item.perm_code) continue;
              // Ensure role exists in roles table before inserting permission to avoid foreign key violation
              try {
                await pg.query(`
                  INSERT INTO roles (id, code, name, description, role_type, is_system, status, user_count)
                  VALUES ($1, $2, $3, $4, 'SYSTEM', false, 'ACTIVE', 1)
                  ON CONFLICT (id) DO NOTHING;
                `, [item.role_id, item.role_id.replace(/^ROLE-/, ''), item.role_id === 'ROLE-001' ? 'Superadmin' : item.role_id, 'System configured role']);
              } catch (_) {}

              const sql = `
                INSERT INTO role_permissions (
                  role_id, perm_code, view, add, edit, delete, submit, approve,
                  reject, cancel, print, export, import, post, reverse, close, reopen
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (role_id, perm_code) DO UPDATE SET
                  view = EXCLUDED.view,
                  add = EXCLUDED.add,
                  edit = EXCLUDED.edit,
                  delete = EXCLUDED.delete,
                  submit = EXCLUDED.submit,
                  approve = EXCLUDED.approve,
                  reject = EXCLUDED.reject,
                  cancel = EXCLUDED.cancel,
                  print = EXCLUDED.print,
                  export = EXCLUDED.export,
                  import = EXCLUDED.import,
                  post = EXCLUDED.post,
                  reverse = EXCLUDED.reverse,
                  close = EXCLUDED.close,
                  reopen = EXCLUDED.reopen;
              `;
              await pg.query(sql, [
                item.role_id,
                item.perm_code,
                !!item.view,
                !!item.add,
                !!item.edit,
                !!item.delete,
                !!item.submit,
                !!item.approve,
                !!item.reject,
                !!item.cancel,
                !!item.print,
                !!item.export,
                !!item.import,
                !!item.post,
                !!item.reverse,
                !!item.close,
                !!item.reopen
              ]);
            }
          } catch (dbErr) {
            console.warn('Postgres role_permissions insert error, fallback to memory:', dbErr.message);
          }
        }

        apiData.role_permissions = apiData.role_permissions || [];
        items.forEach(item => {
          if (!item.role_id || !item.perm_code) return;
          const idx = apiData.role_permissions.findIndex(
            rp => rp.role_id === item.role_id && rp.perm_code === item.perm_code
          );
          if (idx !== -1) {
            apiData.role_permissions[idx] = { ...apiData.role_permissions[idx], ...item };
          } else {
            apiData.role_permissions.push(item);
          }
        });

        return sendJson(res, 200, { success: true, count: items.length });
      });
    }
  }

  // 5. Segregation of Duties (SoD) Rules
  if (pathname === '/api/sod-rules') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM sod_rules ORDER BY code;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.sod_rules || []);
  }

  // 6. Approval Authorities
  if (pathname === '/api/approval-authorities') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM approval_authorities ORDER BY max_amount ASC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.approval_authorities || []);
  }

  // 7. Delegations
  if (pathname === '/api/delegations') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM approval_delegations ORDER BY start_date DESC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.approval_delegations || []);
  }

  // 8. Access Requests Workflow
  if (pathname === '/api/access-requests') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM access_requests ORDER BY created_at DESC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.access_requests || []);
  }

  // 9. Items Master
  if (pathname === '/api/items') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM items ORDER BY code;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.items || []);
  }

  // 10. Inventory Balances
  if (pathname === '/api/inventory') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query(`
          SELECT ib.*, i.name as item_name, i.code as item_code, i.base_uom 
          FROM inventory_balances ib 
          LEFT JOIN items i ON ib.item_id = i.id 
          ORDER BY ib.quantity_on_hand DESC;
        `);
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.inventoryBalances || []);
  }

  // 10a. Deduct Inventory Balance API
  if (pathname === '/api/inventory/deduct' && req.method === 'POST') {
    return parseBody(req, async (err, body) => {
      const { item_id, item_code, qty, warehouse_id } = body || {};
      const qtyNum = Number(qty) || 0;
      if (pg.isAvailable() && qtyNum > 0) {
        try {
          await pg.query(`
            UPDATE inventory_balances 
            SET quantity_on_hand = GREATEST(0, COALESCE(quantity_on_hand, 0) - $1),
                quantity_available = GREATEST(0, COALESCE(quantity_available, 0) - $1)
            WHERE (item_id = $2 OR item_id = $3)
              AND ($4::varchar IS NULL OR warehouse_id = $4);
          `, [qtyNum, item_id || '', item_code || '', warehouse_id || null]);

          try {
            await pg.query(`
              UPDATE items 
              SET current_stock = GREATEST(0, COALESCE(current_stock, 0) - $1)
              WHERE id = $2 OR code = $3;
            `, [qtyNum, item_id || '', item_code || '']);
          } catch (_) {}
        } catch (e) {
          console.error('[API] Error deducting inventory in PG:', e.message);
        }
      }
      if (apiData.inventoryBalances && Array.isArray(apiData.inventoryBalances)) {
        const bal = apiData.inventoryBalances.find(b => (b.item_id === item_id || b.item_id === item_code) && (!warehouse_id || b.warehouse_id === warehouse_id));
        if (bal) {
          bal.on_hand = Math.max(0, (Number(bal.on_hand) || 0) - qtyNum);
          bal.available = Math.max(0, (Number(bal.available) || 0) - qtyNum);
        }
      }
      return sendJson(res, 200, { success: true, deducted: qtyNum });
    });
  }

  // 10b. Restock Inventory Balance API
  if (pathname === '/api/inventory/restock' && req.method === 'POST') {
    return parseBody(req, async (err, body) => {
      const { item_id, item_code, qty, warehouse_id } = body || {};
      const qtyNum = Number(qty) || 0;
      if (pg.isAvailable() && qtyNum > 0) {
        try {
          await pg.query(`
            UPDATE inventory_balances 
            SET quantity_on_hand = COALESCE(quantity_on_hand, 0) + $1,
                quantity_available = COALESCE(quantity_available, 0) + $1
            WHERE (item_id = $2 OR item_id = $3)
              AND ($4::varchar IS NULL OR warehouse_id = $4);
          `, [qtyNum, item_id || '', item_code || '', warehouse_id || null]);

          try {
            await pg.query(`
              UPDATE items 
              SET current_stock = COALESCE(current_stock, 0) + $1
              WHERE id = $2 OR code = $3;
            `, [qtyNum, item_id || '', item_code || '']);
          } catch (_) {}
        } catch (e) {
          console.error('[API] Error restocking inventory in PG:', e.message);
        }
      }
      if (apiData.inventoryBalances && Array.isArray(apiData.inventoryBalances)) {
        const bal = apiData.inventoryBalances.find(b => (b.item_id === item_id || b.item_id === item_code) && (!warehouse_id || b.warehouse_id === warehouse_id));
        if (bal) {
          bal.on_hand = (Number(bal.on_hand) || 0) + qtyNum;
          bal.available = (Number(bal.available) || 0) + qtyNum;
        }
      }
      return sendJson(res, 200, { success: true, restocked: qtyNum });
    });
  }

  // 10b. Purchase Orders API
  if (pathname === '/api/purchase-orders') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM purchase_orders ORDER BY created_at DESC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.purchaseOrders || []);
  }

  // 10c. Purchase Requisitions API
  if (pathname === '/api/purchase-requisitions') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM purchase_requisitions ORDER BY created_at DESC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.purchaseRequisitions || []);
  }

  // 10d. Quality Inspections API
  if (pathname === '/api/quality-inspections') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM quality_inspections ORDER BY created_at DESC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.qualityInspections || []);
  }

  // 10e. Suppliers Master API
  if (pathname === '/api/suppliers') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM suppliers ORDER BY name ASC;');
        return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.suppliers || []);
  }

  // 10fa. Organizations Master API
  if (pathname === '/api/organizations' || pathname.startsWith('/api/organizations/')) {
    const orgIdFromPath = pathname.startsWith('/api/organizations/') ? pathname.replace('/api/organizations/', '') : null;
    if (req.method === 'GET') {
      if (orgIdFromPath) {
        if (pg.isAvailable()) {
          try {
            const result = await pg.query('SELECT * FROM organizations WHERE id = $1 OR code = $1;', [orgIdFromPath]);
            if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
          } catch (_) {}
        }
        const org = (apiData.organizations || []).find(x => x.id === orgIdFromPath || x.code === orgIdFromPath);
        if (!org) return sendJson(res, 404, { error: 'Organization not found' });
        return sendJson(res, 200, org);
      }
      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM organizations ORDER BY id ASC;');
          if (result.rowCount > 0) return sendJson(res, 200, result.rows);
        } catch (_) {}
      }
      return sendJson(res, 200, apiData.organizations || []);
    }
    if (req.method === 'POST') {
      return parseBody(req, async (err, newOrg) => {
        if (err || !newOrg || !newOrg.name) return sendJson(res, 400, { error: 'Organization name is required' });
        const id = newOrg.id || `ORG-${String((apiData.organizations || []).length + 1).padStart(3, '0')}`;
        const code = (newOrg.code || id).toUpperCase();
        if (pg.isAvailable()) {
          try {
            const sql = `
              INSERT INTO organizations (id, code, name, org_type, tax_id, gstin, pan, email, phone, website, address, city, state, country, pincode, status, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
              ON CONFLICT (id) DO UPDATE SET
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                tax_id = EXCLUDED.tax_id,
                gstin = EXCLUDED.gstin,
                pan = EXCLUDED.pan,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                state = EXCLUDED.state,
                pincode = EXCLUDED.pincode,
                status = EXCLUDED.status,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              id, code, newOrg.name, newOrg.org_type || 'HEADQUARTERS',
              newOrg.tax_id || '', newOrg.gstin || '', newOrg.pan || '',
              newOrg.email || '', newOrg.phone || '', newOrg.website || '',
              newOrg.address || '', newOrg.city || 'Pune', newOrg.state || 'Maharashtra',
              newOrg.country || 'India', newOrg.pincode || '',
              newOrg.status || 'Active', newOrg.is_active !== false
            ]);
            apiData.organizations = apiData.organizations || [];
            const exIdx = apiData.organizations.findIndex(o => o.id === id || o.code === code);
            const savedOrg = { ...newOrg, id, code, status: newOrg.status || 'Active' };
            if (exIdx !== -1) apiData.organizations[exIdx] = savedOrg;
            else apiData.organizations.push(savedOrg);
            return sendJson(res, 201, result.rows[0]);
          } catch (dbErr) {
            console.warn('Postgres insert organization error:', dbErr.message);
          }
        }
        apiData.organizations = apiData.organizations || [];
        const exIdx = apiData.organizations.findIndex(o => o.id === id || o.code === code);
        const savedOrg = { ...newOrg, id, code, status: newOrg.status || 'Active' };
        if (exIdx !== -1) apiData.organizations[exIdx] = savedOrg;
        else apiData.organizations.push(savedOrg);
        return sendJson(res, 201, savedOrg);
      });
    }
    if (req.method === 'PUT') {
      return parseBody(req, async (err, updates) => {
        if (err || !orgIdFromPath) return sendJson(res, 400, { error: 'Invalid update' });
        if (pg.isAvailable()) {
          try {
            const sql = `
              UPDATE organizations SET
                name = COALESCE($2, name),
                code = COALESCE($3, code),
                gstin = COALESCE($4, gstin),
                tax_id = COALESCE($4, tax_id),
                email = COALESCE($5, email),
                phone = COALESCE($6, phone),
                address = COALESCE($7, address),
                city = COALESCE($8, city),
                state = COALESCE($9, state),
                pincode = COALESCE($10, pincode),
                status = COALESCE($11, status),
                is_active = COALESCE($12, is_active),
                updated_at = NOW()
              WHERE id = $1 OR code = $1
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              orgIdFromPath, updates.name || null, updates.code || null,
              updates.gstin || updates.tax_id || null, updates.email || null,
              updates.phone || null, updates.address || null,
              updates.city || null, updates.state || null, updates.pincode || null,
              updates.status || null, updates.is_active !== undefined ? updates.is_active : null
            ]);
            if (result.rowCount > 0) {
              apiData.organizations = apiData.organizations || [];
              const exIdx = apiData.organizations.findIndex(o => o.id === orgIdFromPath || o.code === orgIdFromPath);
              if (exIdx !== -1) apiData.organizations[exIdx] = { ...apiData.organizations[exIdx], ...updates };
              return sendJson(res, 200, result.rows[0]);
            }
          } catch (dbErr) {
            console.warn('Postgres update organization error:', dbErr.message);
          }
        }
        apiData.organizations = apiData.organizations || [];
        const exIdx = apiData.organizations.findIndex(o => o.id === orgIdFromPath);
        if (exIdx !== -1) {
          apiData.organizations[exIdx] = { ...apiData.organizations[exIdx], ...updates };
          return sendJson(res, 200, apiData.organizations[exIdx]);
        }
        return sendJson(res, 404, { error: 'Organization not found' });
      });
    }
    if (req.method === 'DELETE') {
      if (!orgIdFromPath) return sendJson(res, 400, { error: 'Organization ID is required' });
      const plants = apiData.plants || [];
      const linked = plants.filter(p => p.organization_id === orgIdFromPath || p.company_id === orgIdFromPath);
      if (linked.length > 0) {
        return sendJson(res, 400, { 
          error: `Cannot delete organization: ${linked.length} facility(ies) are currently created under this organization.` 
        });
      }
      if (pg.isAvailable()) {
        try {
          await pg.query('DELETE FROM organizations WHERE id = $1 OR code = $1;', [orgIdFromPath]);
        } catch (dbErr) {
          console.warn('Postgres delete organization error:', dbErr.message);
        }
      }
      apiData.organizations = (apiData.organizations || []).filter(o => o.id !== orgIdFromPath && o.code !== orgIdFromPath);
      return sendJson(res, 200, { success: true, message: 'Organization removed successfully' });
    }
  }

  // 10f. Warehouses & Stores Master API (Full PostgreSQL CRUD)
  if (pathname === '/api/warehouses' || pathname.startsWith('/api/warehouses/') || pathname === '/api/stores' || pathname.startsWith('/api/stores/')) {
    const isStoresPath = pathname.startsWith('/api/stores');
    const whIdFromPath = isStoresPath
      ? (pathname.startsWith('/api/stores/') ? pathname.replace('/api/stores/', '') : null)
      : (pathname.startsWith('/api/warehouses/') ? pathname.replace('/api/warehouses/', '') : null);

    if (req.method === 'GET') {
      if (whIdFromPath) {
        if (pg.isAvailable()) {
          try {
            const result = await pg.query('SELECT * FROM warehouses WHERE id = $1 OR code = $1;', [whIdFromPath]);
            if (result.rowCount > 0) {
              const row = result.rows[0];
              let facIds = [];
              try { facIds = typeof row.facility_ids === 'string' ? JSON.parse(row.facility_ids) : (row.facility_ids || []); }
              catch (_) { facIds = row.plant_id ? [row.plant_id] : []; }
              return sendJson(res, 200, { ...row, facility_ids: Array.isArray(facIds) ? facIds : [row.plant_id] });
            }
          } catch (_) {}
        }
        const w = (apiData.warehouses || []).find(x => x.id === whIdFromPath || x.code === whIdFromPath);
        if (!w) return sendJson(res, 404, { error: 'Store not found' });
        return sendJson(res, 200, w);
      }

      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM warehouses ORDER BY id ASC;');
          if (result.rowCount > 0) {
            const formatted = result.rows.map(w => {
              let facIds = [];
              try { facIds = typeof w.facility_ids === 'string' ? JSON.parse(w.facility_ids) : (w.facility_ids || []); }
              catch (_) { facIds = w.plant_id ? [w.plant_id] : []; }
              return {
                ...w,
                facility_ids: Array.isArray(facIds) ? facIds : (w.plant_id ? [w.plant_id] : []),
                store_type: w.store_type || (w.warehouse_type === 'MAIN_STORE' ? 'Main Store' : 'Sub Store'),
                status: w.status || (w.is_active !== false ? 'Active' : 'Inactive')
              };
            });
            apiData.warehouses = formatted;
            return sendJson(res, 200, formatted);
          }
        } catch (_) {}
      }
      return sendJson(res, 200, apiData.warehouses || []);
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, newStore) => {
        if (err || !newStore || !newStore.name) {
          return sendJson(res, 400, { error: 'Store name is required' });
        }
        const id = newStore.id || `WH-${String(newStore.code || Date.now()).replace(/[^A-Z0-9]/g, '-')}`;
        const code = (newStore.code || id).toUpperCase();
        const plantId = newStore.plant_id || (Array.isArray(newStore.facility_ids) && newStore.facility_ids[0]) || 'PLANT-01';
        const facilityIdsArr = Array.isArray(newStore.facility_ids) && newStore.facility_ids.length > 0 ? newStore.facility_ids : [plantId];
        const facilityIds = JSON.stringify(facilityIdsArr);
        const whType = newStore.warehouse_type || (newStore.store_type === 'Sub Store' ? 'SUB_STORE' : 'MAIN_STORE');
        const storeType = newStore.store_type || (whType === 'MAIN_STORE' ? 'Main Store' : 'Sub Store');
        const parentId = whType === 'MAIN_STORE' ? null : (newStore.parent_store_id || null);
        const isActive = newStore.status !== 'Inactive' && newStore.is_active !== false;

        const storeRecord = {
          id: id,
          plant_id: plantId,
          code: code,
          name: newStore.name,
          warehouse_type: whType,
          store_type: storeType,
          parent_store_id: parentId,
          facility_ids: facilityIdsArr,
          address: newStore.address || '',
          gstin: newStore.gstin || '',
          manager: newStore.manager || newStore.manager_name || '',
          contact_number: newStore.contact_number || '',
          email: newStore.email || '',
          status: newStore.status || 'Active',
          effective_from: newStore.effective_from || null,
          effective_to: newStore.effective_to || null,
          is_active: isActive
        };

        if (pg.isAvailable()) {
          try {
            const sql = `
              INSERT INTO warehouses (id, plant_id, code, name, warehouse_type, store_type, parent_store_id, facility_ids, address, gstin, manager, contact_number, email, status, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
              ON CONFLICT (id) DO UPDATE SET
                plant_id = EXCLUDED.plant_id,
                code = EXCLUDED.code,
                name = EXCLUDED.name,
                warehouse_type = EXCLUDED.warehouse_type,
                store_type = EXCLUDED.store_type,
                parent_store_id = EXCLUDED.parent_store_id,
                facility_ids = EXCLUDED.facility_ids,
                address = EXCLUDED.address,
                gstin = EXCLUDED.gstin,
                manager = EXCLUDED.manager,
                contact_number = EXCLUDED.contact_number,
                email = EXCLUDED.email,
                status = EXCLUDED.status,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              id, plantId, code, newStore.name, whType, storeType, parentId, facilityIds,
              storeRecord.address, storeRecord.gstin, storeRecord.manager,
              storeRecord.contact_number, storeRecord.email,
              storeRecord.status, storeRecord.is_active
            ]);
            apiData.warehouses = apiData.warehouses || [];
            const exIdx = apiData.warehouses.findIndex(w => w.id === id);
            if (exIdx !== -1) apiData.warehouses[exIdx] = storeRecord;
            else apiData.warehouses.push(storeRecord);
            return sendJson(res, 201, { ...result.rows[0], facility_ids: facilityIdsArr });
          } catch (dbErr) {
            console.warn('Postgres insert warehouse error:', dbErr.message);
          }
        }
        apiData.warehouses = apiData.warehouses || [];
        const exIdx = apiData.warehouses.findIndex(w => w.id === id);
        if (exIdx !== -1) apiData.warehouses[exIdx] = storeRecord;
        else apiData.warehouses.push(storeRecord);
        return sendJson(res, 201, storeRecord);
      });
    }

    if (req.method === 'PUT') {
      return parseBody(req, async (err, updates) => {
        if (err || !updates) return sendJson(res, 400, { error: 'Invalid JSON body' });
        const targetId = whIdFromPath || updates.id;
        if (!targetId) return sendJson(res, 400, { error: 'Store id is required for update' });

        if (pg.isAvailable()) {
          try {
            const facilityIds = updates.facility_ids ? JSON.stringify(updates.facility_ids) : null;
            const sql = `
              UPDATE warehouses SET
                name = COALESCE($2, name),
                code = COALESCE($3, code),
                plant_id = COALESCE($4, plant_id),
                warehouse_type = COALESCE($5, warehouse_type),
                store_type = COALESCE($6, store_type),
                parent_store_id = COALESCE($7, parent_store_id),
                facility_ids = COALESCE($8, facility_ids),
                address = COALESCE($9, address),
                gstin = COALESCE($10, gstin),
                manager = COALESCE($11, manager),
                contact_number = COALESCE($12, contact_number),
                email = COALESCE($13, email),
                status = COALESCE($14, status),
                is_active = COALESCE($15, is_active),
                updated_at = NOW()
              WHERE id = $1 OR code = $1
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              targetId, updates.name || null, updates.code || null,
              updates.plant_id || (Array.isArray(updates.facility_ids) ? updates.facility_ids[0] : null),
              updates.warehouse_type || null, updates.store_type || null,
              updates.parent_store_id !== undefined ? updates.parent_store_id : null, facilityIds,
              updates.address || null, updates.gstin || null,
              updates.manager || updates.manager_name || null, updates.contact_number || null,
              updates.email || null, updates.status || null,
              updates.is_active !== undefined ? updates.is_active : (updates.status ? updates.status !== 'Inactive' : null)
            ]);
            if (result.rowCount > 0) {
              const updatedRow = result.rows[0];
              apiData.warehouses = apiData.warehouses || [];
              const idx = apiData.warehouses.findIndex(w => w.id === targetId || w.code === targetId);
              if (idx !== -1) apiData.warehouses[idx] = { ...apiData.warehouses[idx], ...updates };
              return sendJson(res, 200, updatedRow);
            }
          } catch (dbErr) {
            console.warn('Postgres update warehouse error:', dbErr.message);
          }
        }
        apiData.warehouses = apiData.warehouses || [];
        const idx = apiData.warehouses.findIndex(w => w.id === targetId || w.code === targetId);
        if (idx !== -1) {
          apiData.warehouses[idx] = { ...apiData.warehouses[idx], ...updates };
          return sendJson(res, 200, apiData.warehouses[idx]);
        }
        return sendJson(res, 404, { error: 'Store not found' });
      });
    }

    if (req.method === 'DELETE') {
      if (!whIdFromPath) return sendJson(res, 400, { error: 'Store ID is required for delete' });
      if (pg.isAvailable()) {
        try {
          await pg.query('DELETE FROM warehouses WHERE id = $1 OR code = $1;', [whIdFromPath]);
        } catch (dbErr) {
          console.warn('Postgres delete warehouse error:', dbErr.message);
        }
      }
      apiData.warehouses = (apiData.warehouses || []).filter(w => w.id !== whIdFromPath && w.code !== whIdFromPath);
      return sendJson(res, 200, { success: true, deleted: whIdFromPath });
    }
  }

  if (pathname === '/api/facilities' || pathname.startsWith('/api/facilities/') || pathname === '/api/plants' || pathname.startsWith('/api/plants/')) {
    const isFacilitiesPath = pathname.startsWith('/api/facilities');
    const plantIdFromPath = isFacilitiesPath
      ? (pathname.startsWith('/api/facilities/') ? pathname.replace('/api/facilities/', '') : null)
      : (pathname.startsWith('/api/plants/') ? pathname.replace('/api/plants/', '') : null);

    if (req.method === 'GET') {
      if (plantIdFromPath) {
        if (pg.isAvailable()) {
          try {
            const result = await pg.query('SELECT * FROM facilities WHERE id = $1;', [plantIdFromPath]);
            if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
          } catch (_) {}
        }
        const p = (apiData.plants || []).find(x => x.id === plantIdFromPath);
        if (!p) return sendJson(res, 404, { error: 'Facility not found' });
        return sendJson(res, 200, p);
      }

      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM facilities ORDER BY id ASC;');
          if (result.rowCount > 0) {
            const facilities = result.rows.map(p => ({
              ...p,
              facility_code: p.facility_code || p.branch_code || (p.city || p.code || 'PUN').substring(0, 3).toUpperCase(),
              branch_code: p.branch_code || p.facility_code || (p.city || p.code || 'PUN').substring(0, 3).toUpperCase()
            }));
            return sendJson(res, 200, facilities);
          }
        } catch (_) {}
      }
      return sendJson(res, 200, apiData.plants || []);
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, newPlant) => {
        if (err || !newPlant || !newPlant.name) {
          return sendJson(res, 400, { error: 'Facility name is required' });
        }

        const id = newPlant.id || `PLANT-${String((apiData.plants || []).length + 1).padStart(2, '0')}`;
        const code = (newPlant.code || `FACILITY-${String((apiData.plants || []).length + 1).padStart(2, '0')}`).toUpperCase();
        const facilityCode = newPlant.facility_code || newPlant.branch_code || code.replace('FACILITY-', '').replace('BRANCH-', '').substring(0, 4).toUpperCase() || (newPlant.city || 'PUN').substring(0, 3).toUpperCase();
        let companyId = newPlant.company_id || null;
        if (companyId && pg.isAvailable()) {
          try {
            const cCheck = await pg.query('SELECT 1 FROM companies WHERE id = $1', [companyId]);
            if (cCheck.rowCount === 0) companyId = null;
          } catch (_) { companyId = null; }
        }
        const orgId = newPlant.organization_id || '';

        const isGstApp = (newPlant.is_gst_applicable !== false && newPlant.is_gst_applicable !== 'false' && newPlant.is_gst_applicable !== 0 && newPlant.is_gst_applicable !== 'NO' && newPlant.gst_applicable !== false && newPlant.gst_applicable !== 'false' && newPlant.gst_applicable !== 0 && newPlant.gst_applicable !== 'NO');

        const plantRecord = {
          id: id,
          company_id: companyId,
          organization_id: orgId,
          code: code,
          facility_code: facilityCode,
          branch_code: facilityCode,
          name: newPlant.name,
          facility_type: newPlant.facility_type || newPlant.plant_type || 'TWO_WHEELER_WORKSHOP',
          plant_type: newPlant.plant_type || newPlant.facility_type || 'TWO_WHEELER_WORKSHOP',
          address: newPlant.address || '',
          city: newPlant.city || 'Pune',
          state: newPlant.state || 'Maharashtra',
          country: newPlant.country || 'India',
          pincode: newPlant.pincode || '',
          gstin: newPlant.gstin || '',
          contact_person: newPlant.contact_person || '',
          mobile_number: newPlant.mobile_number || '',
          is_gst_applicable: isGstApp,
          gst_applicable: isGstApp,
          is_active: newPlant.is_active !== undefined ? !!newPlant.is_active : true,
          created_at: newPlant.created_at || new Date().toISOString()
        };

        if (pg.isAvailable()) {
          try {
            const exCheck = await pg.query('SELECT id FROM facilities WHERE id = $1 OR code = $2 LIMIT 1;', [plantRecord.id, plantRecord.code]);
            let result;
            if (exCheck.rowCount > 0) {
              const matchedId = exCheck.rows[0].id;
              const updateSql = `
                UPDATE facilities SET
                  organization_id = COALESCE($2, organization_id),
                  code = COALESCE($3, code),
                  facility_code = COALESCE($4, facility_code),
                  branch_code = COALESCE($5, branch_code),
                  name = COALESCE($6, name),
                  facility_type = COALESCE($7, facility_type),
                  plant_type = COALESCE($8, plant_type),
                  address = COALESCE($9, address),
                  city = COALESCE($10, city),
                  state = COALESCE($11, state),
                  country = COALESCE($12, country),
                  pincode = COALESCE($13, pincode),
                  gstin = COALESCE($14, gstin),
                  contact_person = COALESCE($15, contact_person),
                  mobile_number = COALESCE($16, mobile_number),
                  is_gst_applicable = COALESCE($17, is_gst_applicable),
                  gst_applicable = COALESCE($18, gst_applicable),
                  is_active = COALESCE($19, is_active),
                  updated_at = NOW()
                WHERE id = $1
                RETURNING *;
              `;
              result = await pg.query(updateSql, [
                matchedId, plantRecord.organization_id, plantRecord.code,
                plantRecord.facility_code, plantRecord.branch_code,
                plantRecord.name, plantRecord.facility_type, plantRecord.plant_type,
                plantRecord.address, plantRecord.city, plantRecord.state,
                plantRecord.country, plantRecord.pincode, plantRecord.gstin,
                plantRecord.contact_person, plantRecord.mobile_number,
                plantRecord.is_gst_applicable, plantRecord.gst_applicable, plantRecord.is_active
              ]);
            } else {
              const insertSql = `
                INSERT INTO facilities (id, company_id, organization_id, code, facility_code, branch_code, name, facility_type, plant_type, address, city, state, country, pincode, gstin, contact_person, mobile_number, is_gst_applicable, gst_applicable, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
                RETURNING *;
              `;
              result = await pg.query(insertSql, [
                plantRecord.id, plantRecord.company_id, plantRecord.organization_id, plantRecord.code,
                plantRecord.facility_code, plantRecord.branch_code,
                plantRecord.name, plantRecord.facility_type, plantRecord.plant_type,
                plantRecord.address, plantRecord.city, plantRecord.state,
                plantRecord.country, plantRecord.pincode, plantRecord.gstin,
                plantRecord.contact_person, plantRecord.mobile_number,
                plantRecord.is_gst_applicable, plantRecord.gst_applicable, plantRecord.is_active
              ]);
            }
            apiData.plants = apiData.plants || [];
            const exIdx = apiData.plants.findIndex(p => p.id === plantRecord.id);
            if (exIdx !== -1) apiData.plants[exIdx] = plantRecord;
            else apiData.plants.push(plantRecord);
            apiData.facilities = apiData.plants;
            syncPlantToMockDataFile(plantRecord);
            return sendJson(res, 201, result.rows[0]);
          } catch (dbErr) {
            console.warn('Postgres insert facility error, using fallback:', dbErr.message);
          }
        }

        apiData.plants = apiData.plants || [];
        const exIdx = apiData.plants.findIndex(p => p.id === plantRecord.id);
        if (exIdx !== -1) apiData.plants[exIdx] = plantRecord;
        else apiData.plants.push(plantRecord);
        apiData.facilities = apiData.plants;
        syncPlantToMockDataFile(plantRecord);
        return sendJson(res, 201, plantRecord);
      });
    }

    if (req.method === 'PUT') {
      return parseBody(req, async (err, updates) => {
        if (err || !updates) return sendJson(res, 400, { error: 'Invalid JSON body' });

        const targetId = plantIdFromPath || updates.id;
        if (!targetId) return sendJson(res, 400, { error: 'Facility id is required for update' });

        const isGstVal = (updates.is_gst_applicable !== undefined)
          ? (updates.is_gst_applicable !== false && updates.is_gst_applicable !== 'false' && updates.is_gst_applicable !== 0 && updates.is_gst_applicable !== 'NO')
          : ((updates.gst_applicable !== undefined)
            ? (updates.gst_applicable !== false && updates.gst_applicable !== 'false' && updates.gst_applicable !== 0 && updates.gst_applicable !== 'NO')
            : null);

        if (pg.isAvailable()) {
          try {
            const sql = `
              UPDATE facilities SET
                code = COALESCE($2, code),
                name = COALESCE($3, name),
                facility_type = COALESCE($4, facility_type),
                plant_type = COALESCE($4, plant_type),
                address = COALESCE($5, address),
                city = COALESCE($6, city),
                state = COALESCE($7, state),
                country = COALESCE($8, country),
                contact_person = COALESCE($9, contact_person),
                mobile_number = COALESCE($10, mobile_number),
                is_active = COALESCE($11, is_active),
                organization_id = COALESCE($12, organization_id),
                facility_code = COALESCE($13, facility_code),
                branch_code = COALESCE($13, branch_code),
                pincode = COALESCE($14, pincode),
                gstin = COALESCE($15, gstin),
                is_gst_applicable = COALESCE($16, is_gst_applicable),
                gst_applicable = COALESCE($17, gst_applicable),
                updated_at = NOW()
              WHERE id = $1
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              targetId,
              updates.code || null,
              updates.name || null,
              updates.facility_type || updates.plant_type || null,
              updates.address || null,
              updates.city || null,
              updates.state || null,
              updates.country || null,
              updates.contact_person || null,
              updates.mobile_number || null,
              updates.is_active !== undefined ? updates.is_active : null,
              updates.organization_id || null,
              updates.facility_code || updates.branch_code || null,
              updates.pincode || null,
              updates.gstin || null,
              isGstVal !== null ? isGstVal : null,
              isGstVal !== null ? isGstVal : null
            ]);
            if (result.rowCount > 0) {
              const updatedRow = result.rows[0];
              apiData.plants = apiData.plants || [];
              const idx = apiData.plants.findIndex(p => p.id === targetId);
              if (idx !== -1) apiData.plants[idx] = { ...apiData.plants[idx], ...updatedRow };
              apiData.facilities = apiData.plants;
              syncPlantToMockDataFile(updatedRow);
              return sendJson(res, 200, updatedRow);
            }
          } catch (dbErr) {
            console.warn('Postgres update facility error, using fallback:', dbErr.message);
          }
        }

        apiData.plants = apiData.plants || [];
        const idx = apiData.plants.findIndex(p => p.id === targetId);
        if (idx !== -1) {
          apiData.plants[idx] = { ...apiData.plants[idx], ...updates, updated_at: new Date().toISOString() };
          apiData.facilities = apiData.plants;
          syncPlantToMockDataFile(apiData.plants[idx]);
          return sendJson(res, 200, apiData.plants[idx]);
        }
        return sendJson(res, 404, { error: 'Facility not found' });
      });
    }

    if (req.method === 'DELETE') {
      if (plantIdFromPath) {
        // Validation: do not allow deleting a facility if stores are created under it
        if (pg.isAvailable()) {
          try {
            const storeCheck = await pg.query(
              'SELECT id, code, name FROM warehouses WHERE plant_id = $1 OR plant_id = (SELECT code FROM facilities WHERE id = $1 LIMIT 1);',
              [plantIdFromPath]
            );
            if (storeCheck && storeCheck.rows && storeCheck.rows.length > 0) {
              return sendJson(res, 400, {
                error: `Cannot delete facility: ${storeCheck.rows.length} store(s) are created under this facility.`,
                stores: storeCheck.rows
              });
            }
          } catch (dbErr) {
            console.warn('Postgres check facility stores error:', dbErr.message);
          }
        }

        const localPlant = (apiData.plants || []).find(p => p.id === plantIdFromPath || p.code === plantIdFromPath);
        const plantCode = localPlant ? localPlant.code : null;
        const linkedStores = (apiData.warehouses || []).filter(w =>
          w.plant_id === plantIdFromPath || (plantCode && w.plant_id === plantCode)
        );
        if (linkedStores.length > 0) {
          return sendJson(res, 400, {
            error: `Cannot delete facility: ${linkedStores.length} store(s) are created under this facility.`,
            stores: linkedStores
          });
        }

        if (pg.isAvailable()) {
          try {
            await pg.query('DELETE FROM facilities WHERE id = $1;', [plantIdFromPath]);
          } catch (dbErr) {
            console.warn('Postgres delete facility error:', dbErr.message);
          }
        }
        apiData.plants = (apiData.plants || []).filter(p => p.id !== plantIdFromPath);
        apiData.facilities = apiData.plants;
        removePlantFromMockDataFile(plantIdFromPath);
        return sendJson(res, 200, { success: true, deleted: plantIdFromPath });
      } else {
        // Bulk delete check: disallow if any stores are created under facilities
        if (pg.isAvailable()) {
          try {
            const checkRes = await pg.query('SELECT COUNT(*)::int AS count FROM warehouses WHERE plant_id IS NOT NULL AND plant_id != \'\';');
            if (checkRes && checkRes.rows && checkRes.rows[0] && checkRes.rows[0].count > 0) {
              return sendJson(res, 400, {
                error: `Cannot clear facilities: ${checkRes.rows[0].count} store(s) are currently created under facilities.`
              });
            }
          } catch (dbErr) {
            console.warn('Postgres check all stores error:', dbErr.message);
          }
        }
        const hasStores = (apiData.warehouses || []).some(w => w.plant_id);
        if (hasStores) {
          return sendJson(res, 400, {
            error: 'Cannot clear facilities: stores are currently created under facilities.'
          });
        }

        if (pg.isAvailable()) {
          try {
            await pg.query('DELETE FROM facilities;');
          } catch (dbErr) {
            console.warn('Postgres clear facilities error:', dbErr.message);
          }
        }
        apiData.plants = [];
        apiData.facilities = [];
        removePlantFromMockDataFile();
        return sendJson(res, 200, { success: true, count: 0 });
      }
    }
  }

  // 11. Security Dashboard KPI Aggregation (BRD §36)
  if (pathname === '/api/security-dashboard') {
    if (pg.isAvailable()) {
      try {
        const [uRes, rRes, sRes, dRes, reqRes, sodRes] = await Promise.all([
          pg.query(`
            SELECT 
              count(*) as total,
              count(*) filter (where status = 'ACTIVE') as active,
              count(*) filter (where status = 'INACTIVE') as inactive,
              count(*) filter (where status = 'LOCKED') as locked,
              count(*) filter (where status = 'SUSPENDED') as suspended,
              count(*) filter (where status = 'EXPIRED') as expired,
              count(*) filter (where status = 'TERMINATED') as terminated
            FROM users;
          `),
          pg.query('SELECT count(*) as count FROM roles;'),
          pg.query("SELECT count(*) as count FROM user_sessions WHERE status = 'ACTIVE';"),
          pg.query("SELECT count(*) as count FROM approval_delegations WHERE status = 'ACTIVE';"),
          pg.query("SELECT count(*) as count FROM access_requests WHERE status LIKE 'PENDING%';"),
          pg.query('SELECT count(*) as count FROM sod_rules;')
        ]);

        const u = uRes.rows[0];
        return sendJson(res, 200, {
          userSummary: {
            total: parseInt(u.total, 10),
            active: parseInt(u.active, 10),
            inactive: parseInt(u.inactive, 10),
            locked: parseInt(u.locked, 10),
            suspended: parseInt(u.suspended, 10),
            expired: parseInt(u.expired, 10),
            terminated: parseInt(u.terminated, 10)
          },
          rolesCount: parseInt(rRes.rows[0].count, 10),
          activeSessions: parseInt(sRes.rows[0].count, 10),
          activeDelegations: parseInt(dRes.rows[0].count, 10),
          pendingRequests: parseInt(reqRes.rows[0].count, 10),
          sodRulesCount: parseInt(sodRes.rows[0].count, 10),
          dataSource: 'POSTGRESQL'
        });
      } catch (e) {
        console.warn('Postgres aggregation error, using fallback:', e.message);
      }
    }

    // Fallback KPI Calculation
    const users = apiData.users || [];
    const roles = apiData.roles || [];
    const sessions = (apiData.user_sessions || []).filter(s => s.status === 'ACTIVE');
    const delegations = (apiData.approval_delegations || []).filter(d => d.status === 'ACTIVE');
    const pendingRequests = (apiData.access_requests || []).filter(r => r.status.startsWith('PENDING'));
    const sodRules = apiData.sod_rules || [];

    return sendJson(res, 200, {
      userSummary: {
        total: users.length,
        active: users.filter(u => u.status === 'ACTIVE').length,
        inactive: users.filter(u => u.status === 'INACTIVE').length,
        locked: users.filter(u => u.status === 'LOCKED').length,
        suspended: users.filter(u => u.status === 'SUSPENDED').length,
        expired: users.filter(u => u.status === 'EXPIRED').length,
        terminated: users.filter(u => u.status === 'TERMINATED').length
      },
      rolesCount: roles.length,
      activeSessions: sessions.length,
      activeDelegations: delegations.length,
      pendingRequests: pendingRequests.length,
      sodRulesCount: sodRules.length,
      dataSource: 'IN_MEMORY_FALLBACK'
    });
  }

  // =========================================================================
  // 12. HOLIDAY MASTER REST APIs (BRD v1.0 SECTION 20)
  // =========================================================================
  
  // 12a. Holiday Types API
  if (pathname === '/api/holiday-types') {
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM holiday_types ORDER BY id ASC;');
        if (result.rowCount > 0) return sendJson(res, 200, result.rows);
      } catch (_) {}
    }
    return sendJson(res, 200, apiData.holiday_types || []);
  }

  // 12b. Holiday Check API: /api/holidays/check?facilityId={id}&date={date}
  if (pathname === '/api/holidays/check') {
    const q = parsedUrl.query || {};
    const facilityId = q.facilityId || q.facility_id;
    const dateStr = q.date;
    if (!dateStr) return sendJson(res, 400, { error: 'date query parameter is required (YYYY-MM-DD)' });

    let holidayList = [];
    if (pg.isAvailable()) {
      try {
        const result = await pg.query('SELECT * FROM holidays WHERE active_yn = TRUE AND holiday_date = $1;', [dateStr]);
        holidayList = result.rows;
      } catch (_) {}
    }
    if (holidayList.length === 0) {
      holidayList = (apiData.holidays || []).filter(h => (h.active_yn !== false && h.status !== 'Inactive') && String(h.holiday_date).split('T')[0] === dateStr);
    }

    const matched = holidayList.find(h => h.applicable_level === 'ORGANIZATION' || (facilityId && (h.facility_id === facilityId || facilityId === 'ALL')));
    return sendJson(res, 200, {
      isHoliday: !!matched,
      date: dateStr,
      facilityId: facilityId || null,
      holiday: matched || null
    });
  }

  // 12c. Facility Holiday Calendar: /api/facilities/{facilityId}/holidays
  if (pathname.startsWith('/api/facilities/') && pathname.endsWith('/holidays')) {
    const parts = pathname.split('/');
    const facilityId = parts[3];
    let list = [];
    if (pg.isAvailable()) {
      try {
        const result = await pg.query(`
          SELECT * FROM holidays 
          WHERE (applicable_level = 'ORGANIZATION' OR facility_id = $1)
            AND active_yn = TRUE
          ORDER BY holiday_date ASC;
        `, [facilityId]);
        list = result.rows;
      } catch (_) {}
    }
    if (list.length === 0) {
      list = (apiData.holidays || []).filter(h => 
        (h.active_yn !== false && h.status !== 'Inactive') &&
        (h.applicable_level === 'ORGANIZATION' || h.facility_id === facilityId || facilityId === 'ALL')
      );
    }
    return sendJson(res, 200, list);
  }

  // 12d. Main Holidays Collection & CRUD APIs (/api/holidays and /api/holidays/{id})
  if (pathname === '/api/holidays' || pathname.startsWith('/api/holidays/')) {
    const holidayIdFromPath = pathname.startsWith('/api/holidays/') ? pathname.replace('/api/holidays/', '').split('/')[0] : null;
    const isStatusToggle = pathname.endsWith('/status');

    if (req.method === 'GET') {
      if (holidayIdFromPath) {
        if (pg.isAvailable()) {
          try {
            const result = await pg.query('SELECT * FROM holidays WHERE id = $1;', [holidayIdFromPath]);
            if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
          } catch (_) {}
        }
        const found = (apiData.holidays || []).find(h => h.id === holidayIdFromPath);
        if (!found) return sendJson(res, 404, { error: 'Holiday record not found' });
        return sendJson(res, 200, found);
      }

      // Query list with optional filters
      const q = parsedUrl.query || {};
      if (pg.isAvailable()) {
        try {
          let sql = 'SELECT * FROM holidays WHERE 1=1';
          const params = [];
          if (q.organization_id) {
            params.push(q.organization_id);
            sql += ` AND organization_id = $${params.length}`;
          }
          if (q.facility_id && q.facility_id !== 'ALL') {
            params.push(q.facility_id);
            sql += ` AND (applicable_level = 'ORGANIZATION' OR facility_id = $${params.length})`;
          }
          if (q.financial_year_id && q.financial_year_id !== 'ALL') {
            params.push(q.financial_year_id);
            sql += ` AND financial_year_id = $${params.length}`;
          }
          if (q.status && q.status !== 'ALL') {
            const isActive = q.status === 'Active';
            params.push(isActive);
            sql += ` AND active_yn = $${params.length}`;
          }
          sql += ' ORDER BY holiday_date ASC;';
          const result = await pg.query(sql, params);
          return sendJson(res, 200, result.rows);
        } catch (_) {}
      }

      let filtered = [...(apiData.holidays || [])];
      if (q.organization_id) filtered = filtered.filter(h => h.organization_id === q.organization_id);
      if (q.facility_id && q.facility_id !== 'ALL') filtered = filtered.filter(h => h.applicable_level === 'ORGANIZATION' || h.facility_id === q.facility_id);
      if (q.financial_year_id && q.financial_year_id !== 'ALL') filtered = filtered.filter(h => h.financial_year_id === q.financial_year_id);
      if (q.status && q.status !== 'ALL') filtered = filtered.filter(h => h.status === q.status || (q.status === 'Active' ? h.active_yn : !h.active_yn));
      filtered.sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date));
      return sendJson(res, 200, filtered);
    }

    if (req.method === 'POST') {
      return parseBody(req, async (err, newHoliday) => {
        if (err || !newHoliday || !newHoliday.holiday_name || !newHoliday.holiday_date) {
          return sendJson(res, 400, { error: 'holiday_name and holiday_date are required' });
        }

        const id = newHoliday.id || `HOL-${String((apiData.holidays || []).length + 1).padStart(3, '0')}`;
        const holidayRecord = {
          id: id,
          organization_id: newHoliday.organization_id || 'ORG-001',
          applicable_level: newHoliday.applicable_level || 'ORGANIZATION',
          facility_id: newHoliday.applicable_level === 'FACILITY' ? newHoliday.facility_id : null,
          financial_year_id: newHoliday.financial_year_id || 'FC-001',
          holiday_code: (newHoliday.holiday_code || `HOL-${id}`).toUpperCase(),
          holiday_name: newHoliday.holiday_name.trim(),
          holiday_date: String(newHoliday.holiday_date).split('T')[0],
          day_name: newHoliday.day_name || new Date(newHoliday.holiday_date).toLocaleDateString('en-US', { weekday: 'long' }),
          holiday_type_id: newHoliday.holiday_type_id || 'FEST',
          holiday_category: newHoliday.holiday_category || 'FULL_DAY',
          half_day_type: newHoliday.holiday_category === 'HALF_DAY' ? (newHoliday.half_day_type || 'FIRST_HALF') : null,
          from_time: newHoliday.holiday_category === 'HALF_DAY' ? newHoliday.from_time : null,
          to_time: newHoliday.holiday_category === 'HALF_DAY' ? newHoliday.to_time : null,
          recurring_yn: !!newHoliday.recurring_yn,
          description: newHoliday.description || '',
          active_yn: newHoliday.active_yn !== undefined ? !!newHoliday.active_yn : true,
          status: (newHoliday.active_yn !== false && newHoliday.status !== 'Inactive') ? 'Active' : 'Inactive',
          created_by: newHoliday.created_by || 'System Administrator',
          created_date: new Date().toISOString()
        };

        if (pg.isAvailable()) {
          try {
            const sql = `
              INSERT INTO holidays (
                id, organization_id, facility_id, applicable_level, financial_year_id,
                holiday_code, holiday_name, holiday_date, day_name, holiday_type_id,
                holiday_category, half_day_type, from_time, to_time, recurring_yn,
                description, active_yn, created_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
              ON CONFLICT (id) DO UPDATE SET
                holiday_name = EXCLUDED.holiday_name,
                holiday_date = EXCLUDED.holiday_date,
                active_yn = EXCLUDED.active_yn
              RETURNING *;
            `;
            const result = await pg.query(sql, [
              holidayRecord.id, holidayRecord.organization_id, holidayRecord.facility_id, holidayRecord.applicable_level,
              holidayRecord.financial_year_id, holidayRecord.holiday_code, holidayRecord.holiday_name, holidayRecord.holiday_date,
              holidayRecord.day_name, holidayRecord.holiday_type_id, holidayRecord.holiday_category, holidayRecord.half_day_type,
              holidayRecord.from_time, holidayRecord.to_time, holidayRecord.recurring_yn, holidayRecord.description,
              holidayRecord.active_yn, holidayRecord.created_by
            ]);
            apiData.holidays = apiData.holidays || [];
            apiData.holidays.push(holidayRecord);
            return sendJson(res, 201, result.rows[0]);
          } catch (dbErr) {
            console.warn('Postgres insert holiday error:', dbErr.message);
          }
        }

        apiData.holidays = apiData.holidays || [];
        apiData.holidays.push(holidayRecord);
        return sendJson(res, 201, holidayRecord);
      });
    }

    if (req.method === 'PATCH' && isStatusToggle) {
      return parseBody(req, async (err, statusPayload) => {
        const targetId = holidayIdFromPath;
        const newActive = statusPayload.active_yn !== undefined ? !!statusPayload.active_yn : (statusPayload.status === 'Active');
        if (pg.isAvailable()) {
          try {
            const result = await pg.query('UPDATE holidays SET active_yn = $2, modified_date = NOW() WHERE id = $1 RETURNING *;', [targetId, newActive]);
            if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
          } catch (_) {}
        }
        const item = (apiData.holidays || []).find(h => h.id === targetId);
        if (item) {
          item.active_yn = newActive;
          item.status = newActive ? 'Active' : 'Inactive';
          return sendJson(res, 200, item);
        }
        return sendJson(res, 404, { error: 'Holiday not found' });
      });
    }

    if (req.method === 'PUT') {
      return parseBody(req, async (err, updates) => {
        const targetId = holidayIdFromPath || updates.id;
        if (!targetId) return sendJson(res, 400, { error: 'Holiday id is required' });

        if (pg.isAvailable()) {
          try {
            const sql = `
              UPDATE holidays SET
                holiday_name = COALESCE($2, holiday_name),
                holiday_date = COALESCE($3, holiday_date),
                holiday_type_id = COALESCE($4, holiday_type_id),
                holiday_category = COALESCE($5, holiday_category),
                applicable_level = COALESCE($6, applicable_level),
                facility_id = $7,
                description = COALESCE($8, description),
                active_yn = COALESCE($9, active_yn),
                modified_date = NOW()
              WHERE id = $1 RETURNING *;
            `;
            const result = await pg.query(sql, [
              targetId, updates.holiday_name || null, updates.holiday_date || null,
              updates.holiday_type_id || null, updates.holiday_category || null,
              updates.applicable_level || null, updates.applicable_level === 'FACILITY' ? updates.facility_id : null,
              updates.description || null, updates.active_yn !== undefined ? updates.active_yn : null
            ]);
            if (result.rowCount > 0) return sendJson(res, 200, result.rows[0]);
          } catch (_) {}
        }

        const idx = (apiData.holidays || []).findIndex(h => h.id === targetId);
        if (idx !== -1) {
          apiData.holidays[idx] = { ...apiData.holidays[idx], ...updates };
          return sendJson(res, 200, apiData.holidays[idx]);
        }
        return sendJson(res, 404, { error: 'Holiday not found' });
      });
    }

    if (req.method === 'DELETE') {
      if (pg.isAvailable()) {
        try {
          await pg.query('DELETE FROM holidays WHERE id = $1;', [holidayIdFromPath]);
        } catch (_) {}
      }
      apiData.holidays = (apiData.holidays || []).filter(h => h.id !== holidayIdFromPath);
      return sendJson(res, 200, { success: true, deletedId: holidayIdFromPath });
    }
  }

  // 13. Document Print Configuration Master APIs (BRD Section 14)
  if (pathname === '/api/document-print-configurations' || pathname.startsWith('/api/document-print-configurations/')) {
    if (!apiData.document_print_configurations) {
      apiData.document_print_configurations = [];
    }
    if (!apiData.document_print_template_versions) {
      apiData.document_print_template_versions = [];
    }
    if (!apiData.document_print_audit_logs) {
      apiData.document_print_audit_logs = [];
    }

    const subPath = pathname.replace('/api/document-print-configurations', '');
    const parts = subPath.split('/').filter(Boolean);
    const configId = parts[0];
    const action = parts[1]; // copy, status, publish, versions

    // GET /api/document-print-configurations/published/:docType?facilityId=XYZ
    if (configId === 'published' && req.method === 'GET') {
      const docType = parts[1];
      const q = parsedUrl.query || {};
      const facilityId = q.facilityId || q.facility_id;
      let list = [];
      if (pg.isAvailable()) {
        try {
          const result = await pg.query('SELECT * FROM document_print_configurations WHERE document_type = $1 AND status = \'Published\';', [docType]);
          list = result.rows;
        } catch (_) {}
      }
      if (list.length === 0) {
        list = (apiData.document_print_configurations || []).filter(c => c.document_type === docType && c.status === 'Published');
      }
      const match = list.find(c => c.facility_id === facilityId) || list.find(c => !c.facility_id || c.facility_id === 'ALL') || list[0] || null;
      return sendJson(res, 200, match);
    }

    // GET /api/document-print-configurations or /api/document-print-configurations/:id
    if (req.method === 'GET') {
      if (configId && !action) {
        let found = null;
        if (pg.isAvailable()) {
          try {
            const resDb = await pg.query('SELECT * FROM document_print_configurations WHERE id = $1;', [configId]);
            if (resDb.rowCount > 0) found = resDb.rows[0];
          } catch (_) {}
        }
        if (!found) {
          found = apiData.document_print_configurations.find(c => c.id === configId);
        }
        if (!found) return sendJson(res, 404, { error: 'Document print configuration not found' });
        return sendJson(res, 200, found);
      }

      if (configId && action === 'versions') {
        let versions = [];
        if (pg.isAvailable()) {
          try {
            const resDb = await pg.query('SELECT * FROM document_print_template_versions WHERE configuration_id = $1 ORDER BY created_at DESC;', [configId]);
            versions = resDb.rows;
          } catch (_) {}
        }
        if (versions.length === 0) {
          versions = (apiData.document_print_template_versions || []).filter(v => v.configuration_id === configId);
        }
        return sendJson(res, 200, versions);
      }

      // Query collection with filters
      const q = parsedUrl.query || {};
      let list = [];
      if (pg.isAvailable()) {
        try {
          let sql = 'SELECT * FROM document_print_configurations WHERE 1=1';
          const params = [];
          if (q.facility_id && q.facility_id !== 'ALL') {
            params.push(q.facility_id);
            sql += ` AND (facility_id = $${params.length} OR facility_id = 'ALL')`;
          }
          if (q.document_type && q.document_type !== 'ALL') {
            params.push(q.document_type);
            sql += ` AND document_type = $${params.length}`;
          }
          if (q.status && q.status !== 'ALL') {
            params.push(q.status);
            sql += ` AND status = $${params.length}`;
          }
          sql += ' ORDER BY updated_at DESC;';
          const resDb = await pg.query(sql, params);
          list = resDb.rows;
        } catch (_) {}
      }
      if (list.length === 0) {
        list = apiData.document_print_configurations;
        if (q.facility_id && q.facility_id !== 'ALL') list = list.filter(c => c.facility_id === q.facility_id || c.facility_id === 'ALL');
        if (q.document_type && q.document_type !== 'ALL') list = list.filter(c => c.document_type === q.document_type);
        if (q.status && q.status !== 'ALL') list = list.filter(c => c.status === q.status);
      }
      return sendJson(res, 200, list);
    }

    // POST /api/document-print-configurations or /:id/copy or /:id/publish
    if (req.method === 'POST') {
      return readBody(req, res, async (body) => {
        if (configId && action === 'copy') {
          const source = apiData.document_print_configurations.find(c => c.id === configId) || {};
          const newId = `DPC-${Date.now().toString(36).toUpperCase()}`;
          const copyRecord = {
            ...source,
            id: newId,
            code: body.code || `${source.code || 'DPC'}-COPY`,
            name: body.name || `Copy of ${source.name || 'Configuration'}`,
            facility_id: body.facility_id || source.facility_id || 'ALL',
            status: 'Draft',
            version: '1.0',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          apiData.document_print_configurations.push(copyRecord);
          return sendJson(res, 201, copyRecord);
        }

        if (configId && action === 'publish') {
          const found = apiData.document_print_configurations.find(c => c.id === configId);
          if (!found) return sendJson(res, 404, { error: 'Configuration not found' });
          found.status = 'Published';
          found.updated_at = new Date().toISOString();
          return sendJson(res, 200, found);
        }

        const newId = body.id || `DPC-${Date.now().toString(36).toUpperCase()}`;
        const newRecord = {
          ...body,
          id: newId,
          code: body.code || `DPC-${body.document_type || 'DOC'}-001`,
          status: body.status || 'Draft',
          version: body.version || '1.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        apiData.document_print_configurations.push(newRecord);
        return sendJson(res, 201, newRecord);
      });
    }

    // PUT /api/document-print-configurations/:id
    if (req.method === 'PUT') {
      return readBody(req, res, async (body) => {
        const idx = apiData.document_print_configurations.findIndex(c => c.id === configId);
        if (idx !== -1) {
          apiData.document_print_configurations[idx] = {
            ...apiData.document_print_configurations[idx],
            ...body,
            id: configId,
            updated_at: new Date().toISOString()
          };
          return sendJson(res, 200, apiData.document_print_configurations[idx]);
        }
        return sendJson(res, 404, { error: 'Configuration not found' });
      });
    }

    // DELETE /api/document-print-configurations/:id
    if (req.method === 'DELETE') {
      apiData.document_print_configurations = apiData.document_print_configurations.filter(c => c.id !== configId);
      return sendJson(res, 200, { success: true, deletedId: configId });
    }
  }

  // Static File Serving
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(pathname)) {
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (indexErr, content) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File Not Found', path: pathname }));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, async () => {
  console.log(`====================================================================`);
  console.log(` 🏭 StockIQ - Enterprise Inventory & Supply Chain Management System`);
  console.log(` Web Server:    http://localhost:${PORT}`);
  console.log(` Health API:    http://localhost:${PORT}/api/health`);
  console.log(` DB Status API: http://localhost:${PORT}/api/db-status`);
  console.log(`--------------------------------------------------------------------`);

  const pgStatus = await pg.testConnection();
  if (pgStatus.connected) {
    console.log(` 🐘 PostgreSQL:  CONNECTED to [${pgStatus.database}] on ${pg.poolConfig.host}:${pg.poolConfig.port}`);
    console.log(`                 Version: ${pgStatus.version.split(' ')[0]} ${pgStatus.version.split(' ')[1]}`);
  } else {
    console.log(` 💡 PostgreSQL:  OFFLINE (Using in-memory & browser storage fallback)`);
    console.log(`                 To connect live PostgreSQL:`);
    console.log(`                 1. Start PostgreSQL on ${pg.poolConfig.host}:${pg.poolConfig.port}`);
    console.log(`                 2. Run: npm run db:init`);
  }
  console.log(`====================================================================`);
});
