// Automated Test Suite for User Assigned Branch Login Enforcement
const http = require('http');
const assert = require('assert');

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING ASSIGNED BRANCH LOGIN TESTS ===\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return async () => {
      try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`❌ FAIL: ${name}`);
        console.error(err.message || err);
        failed++;
      }
    };
  }

  const tests = [
    // Test 1: Standard User (Sagar) logging into unauthorized branch
    test('Standard user (SAGARS) denied login to unassigned branch PLANT-02', async () => {
      const res = await postJson('/api/login', {
        username: 'sagar',
        password: 'Apex@2026!',
        facilityId: 'PLANT-02',
        branchId: 'PLANT-02'
      });
      assert.strictEqual(res.status, 403, `Expected status 403, got ${res.status}`);
      assert.ok(res.body.error && res.body.error.includes('Access Denied'), `Expected error message, got: ${JSON.stringify(res.body)}`);
    }),

    // Test 2: Standard User (Sagar) logging into Consolidated 'ALL' branches
    test('Standard user (SAGARS) denied login to Consolidated "ALL" branches', async () => {
      const res = await postJson('/api/login', {
        username: 'sagar',
        password: 'Apex@2026!',
        facilityId: 'ALL',
        branchId: 'ALL'
      });
      assert.strictEqual(res.status, 403, `Expected status 403, got ${res.status}`);
      assert.ok(res.body.error && res.body.error.includes('Access Denied'), `Expected error message, got: ${JSON.stringify(res.body)}`);
    }),

    // Test 3: Standard User (Sagar) logging into assigned branch PLANT-01
    test('Standard user (SAGARS) permitted to login to assigned branch PLANT-01', async () => {
      const res = await postJson('/api/login', {
        username: 'sagar',
        password: 'Apex@2026!',
        facilityId: 'PLANT-01',
        branchId: 'PLANT-01'
      });
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status} ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.selected_branch_id, 'PLANT-01');
    }),

    // Test 4: Admin (Pravin Patil) allowed to login to any branch (e.g. PLANT-02)
    test('Admin (PRAVINP) permitted to login to any branch (PLANT-02)', async () => {
      const res = await postJson('/api/login', {
        username: 'p.patil',
        password: 'Apex@2026!',
        facilityId: 'PLANT-02',
        branchId: 'PLANT-02'
      });
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status} ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
    }),

    // Test 5: Admin (Pravin Patil) allowed to login to Consolidated "ALL" branches
    test('Admin (PRAVINP) permitted to login to Consolidated "ALL" branches', async () => {
      const res = await postJson('/api/login', {
        username: 'p.patil',
        password: 'Apex@2026!',
        facilityId: 'ALL',
        branchId: 'ALL'
      });
      assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status} ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.selected_branch_id, 'ALL');
    }),

    // Test 6: Verify AuthModule UI dropdown locking for non-admin vs admin users
    test('AuthModule UI dropdown locking for non-admin vs admin users', async () => {
      const mockSelect = {
        innerHTML: '',
        value: '',
        disabled: false,
        style: {},
        setAttribute(k, v) { this[k] = v; },
        removeAttribute(k) { delete this[k]; }
      };
      const mockBadge = { innerHTML: '', innerText: '' };
      const mockHelp = { innerHTML: '', innerText: '' };
      const mockCard = { innerHTML: '' };
      const mockUsername = { value: 'sagar' };

      const globalDoc = {
        getElementById(id) {
          if (id === 'login-branch-select') return mockSelect;
          if (id === 'login-branch-scope-badge') return mockBadge;
          if (id === 'login-branch-help-text') return mockHelp;
          if (id === 'login-user-match-card') return mockCard;
          if (id === 'login-username') return mockUsername;
          return null;
        }
      };

      global.document = globalDoc;
      global.fetch = () => Promise.resolve({ ok: false });

      // Load AuthModule script logic
      const fs = require('fs');
      const authCode = fs.readFileSync('js/modules/auth.js', 'utf8');
      
      const mockWindow = {
        DB: {
          getAll(type) {
            if (type === 'users') {
              return [
                { id: 'USR-001', username: 'PRAVINP', full_name: 'Pravin Patil', user_type: 'Admin', primary_role: 'ROLE-001', plant_id: 'PLANT-01' },
                { id: 'USR-106', username: 'SAGARS', full_name: 'Sagar Sable', user_type: 'Employee', primary_role: 'ROLE-STORE-EXEC', plant_id: 'PLANT-01' }
              ];
            }
            if (type === 'plants') {
              return [
                { id: 'PLANT-01', name: 'Pune Central Facility', branch_code: 'PUN-01' },
                { id: 'PLANT-02', name: 'Chakan Assembly Plant', branch_code: 'CHK-02' }
              ];
            }
            if (type === 'roles') {
              return [
                { id: 'ROLE-001', name: 'System Administrator' },
                { id: 'ROLE-STORE-EXEC', name: 'Store Executive' }
              ];
            }
            return [];
          },
          getActivePlants() {
            return this.getAll('plants');
          },
          isPlantActive() { return true; }
        },
        State: {
          currentPlantId: 'PLANT-01',
          showToast() {}
        },
        document: globalDoc
      };

      global.window = mockWindow;

      const evalFn = new Function('window', 'document', authCode);
      evalFn(mockWindow, globalDoc);

      const Auth = mockWindow.AuthModule;
      assert.ok(Auth, 'AuthModule must exist');

      // Test with Standard User Sagar
      Auth.onLoginUsernameInput('sagar');
      assert.strictEqual(mockSelect.disabled, true, 'Standard user select must be disabled');
      assert.strictEqual(mockSelect.value, 'PLANT-01', 'Standard user select must lock to PLANT-01');
      assert.ok(mockBadge.innerHTML.includes('Assigned Branch Locked'), 'Scope badge must show locked');
      assert.ok(mockCard.innerHTML.includes('Sagar Sable'), 'Match card must show user name');

      // Test with Admin Pravin Patil
      Auth.onLoginUsernameInput('p.patil');
      assert.strictEqual(mockSelect.disabled, false, 'Admin user select must be enabled');
      assert.ok(mockBadge.innerHTML.includes('Universal Branch Scope'), 'Scope badge must show universal');
      assert.ok(mockSelect.innerHTML.includes('All Branches (Consolidated)'), 'Admin select must contain ALL');

      // Test with Cleared username
      Auth.onLoginUsernameInput('');
      assert.strictEqual(mockSelect.disabled, false, 'Cleared input select must be enabled');
      assert.strictEqual(mockBadge.innerHTML.includes('Universal'), false, 'Scope badge must reset');
    }),

    // Test 7: Verify State.login and State.setPlant guard against branch spoofing
    test('State.login strictly locks effective plant to user.plant_id for non-admin', async () => {
      const fs = require('fs');
      const stateCode = fs.readFileSync('js/state.js', 'utf8');

      const mockStorage = {};
      const mockWindow = {
        localStorage: {
          setItem(k, v) { mockStorage[k] = v; },
          getItem(k) { return mockStorage[k]; }
        },
        dispatchEvent() {},
        CustomEvent: function(name, opts) { this.name = name; this.detail = opts ? opts.detail : null; },
        DB: {
          getById(type, id) {
            if (type === 'users' && id === 'USR-106') {
              return { id: 'USR-106', username: 'SAGARS', user_type: 'Employee', primary_role: 'ROLE-STORE-EXEC', plant_id: 'PLANT-01' };
            }
            if (type === 'users' && id === 'USR-001') {
              return { id: 'USR-001', username: 'PRAVINP', user_type: 'Admin', primary_role: 'ROLE-001', plant_id: 'PLANT-01' };
            }
            return null;
          },
          getAll() { return []; },
          isPlantActive() { return true; }
        }
      };

      global.window = mockWindow;
      global.localStorage = mockWindow.localStorage;
      global.CustomEvent = mockWindow.CustomEvent;

      const evalFn = new Function('window', 'localStorage', 'CustomEvent', stateCode);
      evalFn(mockWindow, mockWindow.localStorage, mockWindow.CustomEvent);

      const stateInstance = mockWindow.State;
      assert.ok(stateInstance, 'State instance must exist');

      // Non-admin logs in with chosenPlantId = 'PLANT-99' (spoofed)
      stateInstance.login('USR-106', 'PLANT-99');
      assert.strictEqual(stateInstance.currentPlantId, 'PLANT-01', 'State.login must force assigned branch PLANT-01');

      // Non-admin tries to call setPlant('PLANT-02')
      stateInstance.setPlant('PLANT-02');
      assert.strictEqual(stateInstance.currentPlantId, 'PLANT-01', 'State.setPlant must block unauthorized branch switch');

      // Admin logs in with chosenPlantId = 'PLANT-99'
      stateInstance.login('USR-001', 'PLANT-99');
      assert.strictEqual(stateInstance.currentPlantId, 'PLANT-99', 'Admin allowed to select any plant in State.login');

      // Admin switches plant
      stateInstance.setPlant('PLANT-02');
      assert.strictEqual(stateInstance.currentPlantId, 'PLANT-02', 'Admin allowed to switch plant in State.setPlant');
    })
  ];

  for (const t of tests) {
    await t();
  }

  console.log(`\n========================================`);
  console.log(`TOTAL: ${tests.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
