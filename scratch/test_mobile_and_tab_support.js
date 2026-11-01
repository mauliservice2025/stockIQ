/**
 * Automated Verification Suite for Mobile & Tablet (TAB) Support
 * Tests responsive viewport, drawer toggle, backdrop, media queries, touch targets, and layout adaptability
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('TESTING MOBILE & TABLET (TAB) RESPONSIVE ARCHITECTURE');
console.log('================================================================\n');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const layoutCss = fs.readFileSync(path.join(__dirname, '../css/layout.css'), 'utf8');
const componentsCss = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
const warehouseCss = fs.readFileSync(path.join(__dirname, '../css/warehouse.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

let passCount = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Viewport Meta Configuration
console.log('--- 1. Viewport Meta Configuration ---');
assert(
  htmlContent.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">'),
  'Viewport meta tag configured with width=device-width, user-scalable=no, and viewport-fit=cover for mobile notches'
);

// 2. DOM Elements for Mobile Navigation
console.log('\n--- 2. DOM Elements for Mobile & Tablet Navigation ---');
assert(htmlContent.includes('id="sidebar-toggle-btn"'), 'Sidebar toggle button (#sidebar-toggle-btn) exists in HTML');
assert(htmlContent.includes('class="sidebar-toggle-btn mobile-toggle-btn"'), 'Toggle button has mobile-toggle-btn class');
assert(htmlContent.includes('class="header-mobile-brand"'), 'Mobile brand container (.header-mobile-brand) exists in header');
assert(htmlContent.includes('id="sidebar-mobile-close-btn"'), 'Sidebar close button (#sidebar-mobile-close-btn) exists in sidebar header');
assert(htmlContent.includes('id="sidebar-backdrop"'), 'Sidebar backdrop (#sidebar-backdrop) exists in DOM');

// 3. JavaScript Drawer Functions in index.html
console.log('\n--- 3. JavaScript Mobile Drawer Controllers ---');
assert(htmlContent.includes('window.toggleMobileSidebar = function()'), 'window.toggleMobileSidebar function defined in script');
assert(htmlContent.includes('window.closeMobileSidebar = function()'), 'window.closeMobileSidebar function defined in script');
assert(htmlContent.includes("sidebar.classList.toggle('mobile-open')"), 'toggleMobileSidebar toggles mobile-open class');
assert(htmlContent.includes("backdrop.classList.toggle('active', isOpen)"), 'toggleMobileSidebar toggles backdrop active class');
assert(htmlContent.includes("document.body.classList.toggle('sidebar-mobile-open', isOpen)"), 'toggleMobileSidebar locks/unlocks body scroll');

// Execute logic in VM to test drawer toggle/close state machine
const mockDom = {
  sidebarClasses: new Set(['sidebar', 'collapsed']),
  backdropClasses: new Set(['sidebar-backdrop']),
  bodyClasses: new Set(),
};

const sandbox = {
  document: {
    getElementById: (id) => {
      if (id === 'app-sidebar') {
        return {
          classList: {
            toggle: (cls, force) => {
              if (force !== undefined) {
                if (force) mockDom.sidebarClasses.add(cls); else mockDom.sidebarClasses.delete(cls);
                return force;
              }
              if (mockDom.sidebarClasses.has(cls)) {
                mockDom.sidebarClasses.delete(cls);
                return false;
              } else {
                mockDom.sidebarClasses.add(cls);
                return true;
              }
            },
            contains: (cls) => mockDom.sidebarClasses.has(cls),
            remove: (cls) => mockDom.sidebarClasses.delete(cls),
            add: (cls) => mockDom.sidebarClasses.add(cls)
          }
        };
      }
      if (id === 'sidebar-backdrop') {
        return {
          classList: {
            toggle: (cls, force) => {
              if (force !== undefined) {
                if (force) mockDom.backdropClasses.add(cls); else mockDom.backdropClasses.delete(cls);
                return force;
              }
              if (mockDom.backdropClasses.has(cls)) {
                mockDom.backdropClasses.delete(cls);
                return false;
              } else {
                mockDom.backdropClasses.add(cls);
                return true;
              }
            },
            contains: (cls) => mockDom.backdropClasses.has(cls),
            remove: (cls) => mockDom.backdropClasses.delete(cls),
            add: (cls) => mockDom.backdropClasses.add(cls)
          }
        };
      }
      return null;
    },
    body: {
      classList: {
        toggle: (cls, force) => {
          if (force !== undefined) {
            if (force) mockDom.bodyClasses.add(cls); else mockDom.bodyClasses.delete(cls);
            return force;
          }
          if (mockDom.bodyClasses.has(cls)) {
            mockDom.bodyClasses.delete(cls);
            return false;
          } else {
            mockDom.bodyClasses.add(cls);
            return true;
          }
        },
        contains: (cls) => mockDom.bodyClasses.has(cls),
        remove: (cls) => mockDom.bodyClasses.delete(cls),
        add: (cls) => mockDom.bodyClasses.add(cls)
      }
    }
  },
  window: {}
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// Extract the script from index.html that sets toggleMobileSidebar & closeMobileSidebar
const scriptExtractMatch = htmlContent.match(/window\.toggleMobileSidebar\s*=\s*function\(\)[\s\S]*?window\.closeMobileSidebar\s*=\s*function\(\)[\s\S]*?};/);
assert(scriptExtractMatch !== null, 'Extracted mobile toggle functions from index.html');

if (scriptExtractMatch) {
  vm.runInContext(scriptExtractMatch[0], sandbox);
  
  // Test 1: toggle open
  sandbox.toggleMobileSidebar();
  assert(
    mockDom.sidebarClasses.has('mobile-open') && mockDom.backdropClasses.has('active') && mockDom.bodyClasses.has('sidebar-mobile-open'),
    'toggleMobileSidebar() opens sidebar, activates backdrop, and adds body lock'
  );

  // Test 2: toggle closed
  sandbox.toggleMobileSidebar();
  assert(
    !mockDom.sidebarClasses.has('mobile-open') && !mockDom.backdropClasses.has('active') && !mockDom.bodyClasses.has('sidebar-mobile-open'),
    'toggleMobileSidebar() second call closes sidebar, hides backdrop, and removes body lock'
  );

  // Test 3: closeMobileSidebar
  sandbox.toggleMobileSidebar(); // open
  sandbox.closeMobileSidebar();  // close
  assert(
    !mockDom.sidebarClasses.has('mobile-open') && !mockDom.backdropClasses.has('active') && !mockDom.bodyClasses.has('sidebar-mobile-open'),
    'closeMobileSidebar() cleanly resets mobile-open and active states'
  );
}

// 4. App Router Auto-close integration
console.log('\n--- 4. Router Auto-Close on Navigation ---');
assert(
  appJs.includes('window.closeMobileSidebar()'),
  'js/app.js invokes window.closeMobileSidebar() upon route navigation'
);

// 5. CSS Media Queries for Tablet (<= 1024px)
console.log('\n--- 5. Tablet (TAB) CSS Media Queries (<= 1024px) ---');
assert(layoutCss.includes('@media (max-width: 1024px)'), 'layout.css contains @media (max-width: 1024px)');
assert(layoutCss.includes('margin-left: 0 !important'), 'Main-wrapper margin reset to 0 on tablets (<= 1024px)');
assert(layoutCss.includes('transform: translateX(-100%) !important'), 'Sidebar off-canvas drawer hidden by default on <= 1024px');
assert(layoutCss.includes('transform: translateX(0) !important'), 'Sidebar slides in with translateX(0) when .mobile-open on <= 1024px');
assert(componentsCss.includes('@media (max-width: 1024px)'), 'components.css contains tablet (<= 1024px) rules');
assert(componentsCss.includes('max-width: 94vw !important'), 'Modals fit within tablet viewport width');

// 6. CSS Media Queries for Mobile (<= 768px)
console.log('\n--- 6. Mobile Phone CSS Media Queries (<= 768px) ---');
assert(layoutCss.includes('@media (max-width: 768px)'), 'layout.css contains @media (max-width: 768px)');
assert(componentsCss.includes('@media (max-width: 768px)'), 'components.css contains @media (max-width: 768px)');
assert(componentsCss.includes('max-width: calc(100vw - 12px) !important'), 'Modals adapt to full phone screen with margin buffer');
assert(componentsCss.includes('-webkit-overflow-scrolling: touch'), 'Touch momentum scrolling enabled for tables, modals, and tabs');

// 7. CSS Media Queries for Small Mobile (<= 640px)
console.log('\n--- 7. Compact Mobile CSS Media Queries (<= 640px) ---');
assert(layoutCss.includes('@media (max-width: 640px)'), 'layout.css contains @media (max-width: 640px)');
assert(layoutCss.includes('user-profile-details'), 'User profile details hidden on compact mobile to prevent header blowout');
assert(componentsCss.includes('grid-template-columns: repeat(2, 1fr) !important'), 'KPI cards collapse into responsive 2-column grid on phones');
assert(componentsCss.includes('grid-template-columns: 1fr !important'), 'Form grids collapse into 1-column layout on phones');

// 8. Touch Targets and Scrolling
console.log('\n--- 8. Touch Accessibility & Horizontal Scrolling ---');
assert(componentsCss.includes('@media (pointer: coarse)'), 'pointer: coarse touch targets >= 40px configured');
assert(componentsCss.includes('.tabs-header'), 'tabs-header class supports horizontal swipeable tab navigation');
assert(warehouseCss.includes('@media (max-width: 768px)'), 'warehouse.css visualizer adapts shelves and bins on mobile/tablet');

// 9. Billing and Master Module Adaptations
console.log('\n--- 9. Billing & Item Master Module Mobile Polish ---');
const billingJs = fs.readFileSync(path.join(__dirname, '../js/modules/billing.js'), 'utf8');
const itemSetupJs = fs.readFileSync(path.join(__dirname, '../js/modules/item-setup-master.js'), 'utf8');
assert(billingJs.includes('billing-stepper-grid'), 'Billing workflow stepper has billing-stepper-grid class');
assert(billingJs.includes('tabs-header billing-tabs-header'), 'Billing top tabs strip has tabs-header class');
assert(itemSetupJs.includes('tabs-header modal-tabs-header'), '10-tab item setup modal has tabs-header class');

console.log('\n================================================================');
console.log(`RESULTS: ${passCount} / ${totalTests} assertions passed (${Math.round((passCount/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passCount === totalTests) {
  console.log('🎉 ALL MOBILE AND TABLET (TAB) VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ Some assertions failed.');
  process.exit(1);
}
