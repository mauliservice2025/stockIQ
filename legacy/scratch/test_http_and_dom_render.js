const http = require('http');
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// 1. Fetch index.html from http://localhost:3000
http.get('http://localhost:3000', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('HTTP GET / -> Status:', res.statusCode, 'Length:', body.length);
    assert.strictEqual(res.statusCode, 200, 'HTTP status must be 200');
    assert(body.includes('Item Master Dashboard'), 'HTML from server must include Item Master Dashboard');
    assert(body.includes('js/modules/item-dashboard.js'), 'HTML from server must load item-dashboard.js');
    console.log('✓ Server serves index.html with item-dashboard.js successfully.');

    // 2. Fetch js/modules/item-dashboard.js
    http.get('http://localhost:3000/js/modules/item-dashboard.js', (resJs) => {
      let jsBody = '';
      resJs.on('data', chunk => jsBody += chunk);
      resJs.on('end', () => {
        console.log('HTTP GET /js/modules/item-dashboard.js -> Status:', resJs.statusCode, 'Length:', jsBody.length);
        assert.strictEqual(resJs.statusCode, 200, 'item-dashboard.js must return 200');
        assert(jsBody.includes('window.ItemDashboardModule = {'), 'item-dashboard.js contains module definition');
        console.log('✓ Server serves item-dashboard.js successfully.');

        // 3. Full DOM Simulation of routing and render
        const mockStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] || null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
        const sandbox = {
          localStorage: mockStorage,
          window: {
            location: { hash: '#/item-dashboard' },
            addEventListener: () => {},
            localStorage: mockStorage
          },
          document: {
            getElementById: (id) => {
              if (id === 'view-container') return { innerHTML: '', style: {} };
              if (id === 'page-top-bar') return { style: {} };
              return null;
            },
            querySelector: () => null,
            querySelectorAll: () => [],
            createElement: () => ({ setAttribute: () => {}, click: () => {} }),
            body: { appendChild: () => {}, removeChild: () => {} }
          },
          console: console
        };
        sandbox.window.document = sandbox.document;
        vm.createContext(sandbox);

        // Run data & state
        vm.runInContext(fs.readFileSync('js/data/mock-data.js', 'utf8'), sandbox);
        vm.runInContext(fs.readFileSync('js/data/db.js', 'utf8'), sandbox);
        vm.runInContext(fs.readFileSync('js/state.js', 'utf8'), sandbox);
        vm.runInContext(jsBody, sandbox);
        vm.runInContext(fs.readFileSync('js/modules/store-inventory.js', 'utf8'), sandbox);

        const container = { innerHTML: '' };
        sandbox.window.StoreInventoryModule.render(container);

        console.log('Rendered container length:', container.innerHTML.length);
        assert(container.innerHTML.includes('Item Master Dashboard'), 'Rendered container must include dashboard header');
        assert(container.innerHTML.includes('Total Items'), 'Rendered container must include Total Items KPI');
        assert(container.innerHTML.includes('2,845'), 'Rendered container must include 2,845');
        assert(container.innerHTML.includes('Vehicle Compatibility'), 'Rendered container must include Vehicle Compatibility');
        assert(container.innerHTML.includes('Items Requiring Attention'), 'Rendered container must include Items Requiring Attention');
        assert(container.innerHTML.includes('Recently Added Items'), 'Rendered container must include Recently Added Items');
        assert(container.innerHTML.includes('Recently Modified Items'), 'Rendered container must include Recently Modified Items');

        console.log('\n================================================================');
        console.log('🎉 FULL HTTP & IN-BROWSER PIPELINE SIMULATION PASSED 100%!');
        console.log('================================================================');
      });
    });
  });
}).on('error', (err) => {
  console.error('HTTP error:', err.message);
  process.exit(1);
});
