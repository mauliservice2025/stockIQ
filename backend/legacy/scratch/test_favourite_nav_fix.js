const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  let browser;
  try {
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    let executablePath = edgePaths.find(p => fs.existsSync(p));

    const launchOpts = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (executablePath) launchOpts.executablePath = executablePath;

    browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    console.log('Navigating to http://localhost:3000/#/dashboard ...');
    await page.goto('http://localhost:3000/#/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Open Create New Job Card Modal
    console.log('Opening Create New Job Card modal...');
    await page.evaluate(() => {
      if (window.BillingModule && window.BillingModule.showNewJobCardModal) {
        window.BillingModule.showNewJobCardModal();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Verify modal is open
    const isModalOpenInitially = await page.evaluate(() => {
      const overlay = document.getElementById('global-modal-overlay');
      return overlay && overlay.classList.contains('active');
    });
    console.log('Is modal open initially?', isModalOpenInitially);

    // Focus and click the vehicle model search input
    console.log('Opening vehicle model search dropdown...');
    await page.evaluate(() => {
      const input = document.getElementById('new-jc-model-search');
      if (input) {
        input.focus();
        if (window.BillingModule && window.BillingModule.onVehicleModelSearchFocus) {
          window.BillingModule.onVehicleModelSearchFocus();
        }
      }
    });
    await new Promise(r => setTimeout(r, 600));

    // Check dropdown content before clicking star
    const initialDropdownInfo = await page.evaluate(() => {
      const dropdown = document.getElementById('new-jc-model-dropdown');
      const text = dropdown ? dropdown.innerText : '';
      const html = dropdown ? dropdown.innerHTML : '';
      return {
        hasFavBanner: text.includes('FAVOURITE VEHICLES (QUICK ACCESS)'),
        hasOtherModelsBanner: text.includes('OTHER VEHICLE MODELS'),
        hasFavPill: html.includes('>FAV<'),
        optionsCount: dropdown ? dropdown.querySelectorAll('.jc-model-search-option').length : 0,
        firstOptionText: dropdown && dropdown.querySelector('.jc-model-search-option') ? dropdown.querySelector('.jc-model-search-option').innerText : ''
      };
    });
    console.log('Initial dropdown checks:', initialDropdownInfo);

    // Find a star button and click it to toggle favourite
    console.log('Clicking a star button inside the dropdown...');
    const clickResult = await page.evaluate(() => {
      const dropdown = document.getElementById('new-jc-model-dropdown');
      if (!dropdown) return { error: 'Dropdown not found' };
      const starBtn = dropdown.querySelector('.jc-model-search-option button');
      if (!starBtn) return { error: 'Star button not found' };
      starBtn.click();
      return { success: true };
    });
    console.log('Click result:', clickResult);

    // Wait a moment for any async / subscriber events
    await new Promise(r => setTimeout(r, 1000));

    // CRITICAL CHECK: Is modal still open, or did system move to main screen?
    const checkAfterClick = await page.evaluate(() => {
      const overlay = document.getElementById('global-modal-overlay');
      const isOpen = overlay && overlay.classList.contains('active');
      const dropdown = document.getElementById('new-jc-model-dropdown');
      const hash = window.location.hash;
      const text = dropdown ? dropdown.innerText : '';
      const html = dropdown ? dropdown.innerHTML : '';
      return {
        isModalStillOpen: isOpen,
        hash: hash,
        hasFavBanner: text.includes('FAVOURITE VEHICLES (QUICK ACCESS)'),
        hasOtherModelsBanner: text.includes('OTHER VEHICLE MODELS'),
        hasFavPill: html.includes('>FAV<'),
        firstOptionText: dropdown && dropdown.querySelector('.jc-model-search-option') ? dropdown.querySelector('.jc-model-search-option').innerText : ''
      };
    });
    console.log('Check after clicking star:', checkAfterClick);

    // Take screenshot of the open modal with dropdown
    const screenshotPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\job_card_clean_dropdown.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Screenshot saved to:', screenshotPath);

    // Test in Vehicle Compatibility page (#/vehicle-compatibility)
    console.log('Navigating to #/vehicle-compatibility...');
    await page.evaluate(() => { window.State.closeModal(); });
    await new Promise(r => setTimeout(r, 400));
    await page.goto('http://localhost:3000/#/vehicle-compatibility', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const checkCompatPage = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr[data-vehicle-id]');
      const firstRowBtn = document.querySelector('.fav-model-star-btn');
      const hasRedundantBadge = document.body.innerHTML.includes('⭐ FAVOURITE</span>');
      if (firstRowBtn) {
        firstRowBtn.click();
      }
      return {
        rowCount: rows.length,
        hasRedundantBadge: hasRedundantBadge,
        currentHash: window.location.hash
      };
    });
    console.log('Compat page check before click:', checkCompatPage);

    await new Promise(r => setTimeout(r, 800));

    const checkCompatAfterClick = await page.evaluate(() => {
      return {
        currentHash: window.location.hash,
        isStillOnCompatPage: window.location.hash === '#/vehicle-compatibility'
      };
    });
    console.log('Compat page check after clicking star in table:', checkCompatAfterClick);

    const compatScreenshotPath = 'C:\\Users\\PravinPatil\\.gemini\\antigravity\\brain\\886f0614-deee-4817-9c93-0f0f32234aeb\\compat_table_clean.png';
    await page.screenshot({ path: compatScreenshotPath, fullPage: false });
    console.log('Compat screenshot saved to:', compatScreenshotPath);

    await browser.close();

    if (checkAfterClick.isModalStillOpen && !checkAfterClick.hasFavBanner && !checkAfterClick.hasFavPill && checkCompatAfterClick.isStillOnCompatPage) {
      console.log('=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
      process.exit(0);
    } else {
      console.error('Verification failed:', { checkAfterClick, checkCompatAfterClick });
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during testing:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
})();

