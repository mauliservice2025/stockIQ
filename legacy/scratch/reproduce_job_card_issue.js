const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Set window.location.hash before creating JSDOM
const dom = new JSDOM(indexHtml, {
  url: 'http://localhost:3000/#/job-cards',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true
});

const { window } = dom;

// Wait for scripts to load and execute
setTimeout(() => {
  try {
    console.log('--- JSDOM LOADED ---');
    console.log('window.location.hash:', window.location.hash);
    console.log('State.currentUser:', window.State ? window.State.getCurrentUser() : null);
    console.log('App exists:', !!window.App);
    console.log('BillingModule exists:', !!window.BillingModule);
    console.log('BillingModule.activeTab:', window.BillingModule ? window.BillingModule.activeTab : null);
    
    const viewContainer = window.document.getElementById('view-container');
    console.log('viewContainer text snippet:', viewContainer ? viewContainer.textContent.substring(0, 100).trim() : null);

    if (viewContainer && viewContainer.innerHTML.includes('Connected Two-Wheeler Workshop & Billing Workflow')) {
      console.log('===> FAILURE REPRODUCED: viewContainer renders Billing Workflow Dashboard!');
    } else if (viewContainer && viewContainer.innerHTML.includes('Job Card Management')) {
      console.log('===> SUCCESS: viewContainer renders Job Card Management!');
    } else {
      console.log('===> viewContainer renders something else:', viewContainer ? viewContainer.innerHTML.substring(0, 150) : null);
    }
  } catch (e) {
    console.error('Error in simulation:', e);
  }
}, 1000);
