const fs = require('fs');
const assert = require('assert');

console.log('Testing Full Screen Utilization across application...');

const layoutCss = fs.readFileSync('d:/Projects/ISCM/css/layout.css', 'utf8');
const componentsCss = fs.readFileSync('d:/Projects/ISCM/css/components.css', 'utf8');
const indexHtml = fs.readFileSync('d:/Projects/ISCM/index.html', 'utf8');

// 1. Check layout.css
assert(layoutCss.includes('padding: 4px 8px 6px 8px;'), '.main-content should have compact 8px side padding');
assert(layoutCss.includes('padding: 4px 8px 2px 8px;'), '.page-top-bar should have compact 8px side padding');
assert(layoutCss.includes('.pinned-submodules-bar {\n  position: sticky;\n  top: var(--header-height);\n  z-index: 89;\n  height: 26px;\n  background: var(--bg-surface);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid var(--border-subtle);\n  display: flex;\n  align-items: center;\n  padding: 0 8px;'), '.pinned-submodules-bar should have 8px padding');
assert(layoutCss.includes('min-height: calc(100vh - 240px);'), '.user-table-scroll-container should have full height stretch');

console.log('✓ layout.css passed horizontal and vertical full screen rules');

// 2. Check components.css
assert(componentsCss.includes('.billing-module-container {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: 0;\n  width: 100%;\n  gap: 0 !important;\n}'), '.billing-module-container must flex column');

assert(componentsCss.includes('.billing-module-container #billing-subview-container > .content-card,\n.billing-module-container #billing-subview-container > div > .content-card,\n.estimate-management-screen-card {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: calc(100vh - 215px);'), 'Billing subviews must expand to viewport height');

assert(componentsCss.includes('min-height: calc(100vh - 240px) !important;'), 'Table scroll containers must stretch to fill vertical space');

assert(componentsCss.includes('margin-top: auto !important;\n  flex-shrink: 0;\n}'), 'Pagination bars must anchor to bottom');

assert(componentsCss.includes('.modal-body .table-responsive,\n.modal-container .table-responsive {\n  min-height: auto !important;\n  max-height: 50vh !important;\n}'), 'Modal tables must be protected from full-viewport stretch');

console.log('✓ components.css passed full screen stretch and flex rules');

// 3. Check index.html
assert(indexHtml.includes('css/components.css?v=2.2'), 'index.html has v=2.2 for components.css');
assert(indexHtml.includes('css/layout.css?v=1.9'), 'index.html has v=1.9 for layout.css');

console.log('✓ index.html cache busters verified');

console.log('ALL FULL-SCREEN UTILIZATION ASSERTIONS PASSED!');
