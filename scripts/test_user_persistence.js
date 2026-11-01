const pg = require('../database/pg.js');

// Pure SHA-256 implementation identical to client
function pureSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  hash = hash.slice(0, 8);
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength | 0);
  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = (i < 16) ? w[i] : ((w[i - 16] + s0 + w[i - 7] + s1) | 0);
      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

function hashPassword(plain, salt = 'salt2026') {
  const digest = pureSha256(`${salt}:${plain}`);
  return `sha256$${salt}$${digest}`;
}

function verifyPassword(plain, storedHash) {
  if (!storedHash || !plain) return false;
  const parts = String(storedHash).split('$');
  if (parts.length === 3 && parts[0] === 'sha256') {
    const salt = parts[1];
    const expectedDigest = parts[2];
    const actualDigest = pureSha256(`${salt}:${plain}`);
    return actualDigest === expectedDigest;
  }
  return storedHash === plain;
}

async function runTest() {
  console.log('====================================================');
  console.log('TEST: User Credentials Update & Persistence Test');
  console.log('====================================================\n');

  const testUserId = 'USR-002';
  const newUsername = 'QA_LEAD_2026';
  const oldPassword = 'PuN@2026#A7';
  const newPassword = 'SecurePass@2026!';
  const newSalt = 'e5f6a1b2c3d49999';
  const newHash = hashPassword(newPassword, newSalt);

  console.log(`1. Updating User ${testUserId}:`);
  console.log(`   New Username: ${newUsername}`);
  console.log(`   New Password: ${newPassword}`);
  console.log(`   New Salt:     ${newSalt}`);
  console.log(`   New Hash:     ${newHash}`);

  // Send update to Server API (updates PostgreSQL and memory fallback)
  const putRes = await fetch(`http://localhost:3000/api/users/${testUserId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: newUsername,
      password_hash: newHash,
      password_salt: newSalt,
      status: 'ACTIVE'
    })
  });

  if (!putRes.ok) {
    throw new Error(`PUT /api/users/${testUserId} failed with status ${putRes.status}`);
  }
  const putData = await putRes.json();
  console.log('   ✓ Server API updated successfully:', putData.id, putData.username);

  // 2. Direct PostgreSQL Verification
  console.log('\n2. Verifying PostgreSQL Database directly:');
  const pgRes = await pg.query('SELECT id, username, password_hash, password_salt, status FROM users WHERE id = $1', [testUserId]);
  const pgUser = pgRes.rows[0];
  console.log('   Postgres Row:', pgUser);

  if (pgUser.username !== newUsername) {
    throw new Error(`Postgres username mismatch! Expected ${newUsername}, got ${pgUser.username}`);
  }
  if (pgUser.password_hash !== newHash) {
    throw new Error(`Postgres password_hash mismatch! Expected ${newHash}, got ${pgUser.password_hash}`);
  }
  console.log('   ✓ PostgreSQL verified: New username and password_hash persisted in database table!');

  // 3. Simulate Relogin / Authentication Test
  console.log('\n3. Testing Relogin & Authentication Logic:');

  // Attempt A: Login with OLD Username (should FAIL)
  const usersList = (await (await fetch('http://localhost:3000/api/users')).json());
  const matchOldUsername = usersList.find(u => u.username === 'PUN2026002');
  console.log('   Attempt A: Old Username "PUN2026002" lookup result:', matchOldUsername ? 'FOUND (ERROR)' : 'NOT FOUND (CORRECT)');
  if (matchOldUsername) throw new Error('Old username should not exist after update!');

  // Attempt B: Login with NEW Username and OLD Password (should FAIL)
  const matchedUser = usersList.find(u => u.username === newUsername);
  if (!matchedUser) throw new Error(`New user ${newUsername} not found!`);

  const oldPwdValid = verifyPassword(oldPassword, matchedUser.password_hash);
  console.log(`   Attempt B: New Username + OLD Password "${oldPassword}" verification:`, oldPwdValid ? 'PASSED (ERROR)' : 'REJECTED (CORRECT)');
  if (oldPwdValid) throw new Error('Old password should be rejected!');

  // Attempt C: Login with NEW Username and NEW Password (should SUCCEED)
  const newPwdValid = verifyPassword(newPassword, matchedUser.password_hash);
  console.log(`   Attempt C: New Username + NEW Password "${newPassword}" verification:`, newPwdValid ? 'ACCEPTED (CORRECT)' : 'REJECTED (ERROR)');
  if (!newPwdValid) throw new Error('New password must be accepted!');

  console.log('\n====================================================');
  console.log('🎉 ALL PERSISTENCE & RELOGIN TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');

  process.exit(0);
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
