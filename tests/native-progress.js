const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox']});
  try {
    for (const viewport of [{width: 568, height: 320}, {width: 844, height: 390}, {width: 390, height: 844}]) {
      const page = await browser.newPage({viewport}), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        window.NativeOrientation = {setMode: () => {}};
        window.NativeProgress = {exportBackup: text => { window.__nativeExport = text; }, importBackup: () => { window.__nativeImports = (window.__nativeImports || 0) + 1; }};
        if (!sessionStorage.getItem('native-backup-seed')) {
          sessionStorage.setItem('native-backup-seed', 'yes');
          localStorage.setItem('delivery-adventure-v1', JSON.stringify({unlocked: 8, best: {1: 3}, sound: false, seen: true}));
        }
      });
      await page.goto('http://127.0.0.1:4187');
      await page.waitForFunction(() => ParcelRenderer.ready());
      await page.click('[data-progress=open]');
      assert.equal(await page.locator('#progressPanel').evaluate(e => e.open), true);
      assert.equal(await page.locator('#progressFile').isVisible(), false);
      await page.click('[data-progress=export]');
      assert.equal(await page.evaluate(() => JSON.parse(__nativeExport).saves['delivery-adventure-v1'].unlocked), 8);
      await page.click('[data-progress=import]');
      assert.equal(await page.evaluate(() => __nativeImports), 1);
      await page.evaluate(() => dispatchEvent(new CustomEvent('parcel-native-progress', {detail: {kind: 'import', text: '{broken'}})));
      assert.equal(await page.locator('#confirmRestore').isVisible(), false);
      assert.match(await page.locator('#progressStatus').innerText(), /not a supported/);
      await page.evaluate(() => {
        const backup = ParcelSaves.snapshot();
        backup.saves['delivery-adventure-v1'].unlocked = 6;
        backup.recovery = {test: '</script><script>window.__injected=true</script>'};
        dispatchEvent(new CustomEvent('parcel-native-progress', {detail: {kind: 'import', text: JSON.stringify(backup)}}));
      });
      assert.equal(await page.locator('#confirmRestore').isVisible(), true);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('delivery-adventure-v1')).unlocked), 8, 'selection never restores automatically');
      assert.equal(await page.evaluate(() => window.__injected), undefined);
      await Promise.all([page.waitForNavigation(), page.click('#confirmRestore')]);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('delivery-adventure-v1')).unlocked), 6);
      assert.equal(await page.evaluate(() => !!localStorage.getItem('lpc-before-restore')), true);
      await page.click('[data-progress=open]');
      assert.equal(await page.evaluate(() => gameBack()), true);
      assert.equal(await page.locator('#progressPanel').evaluate(e => e.open), false);
      assert.equal(await page.evaluate(() => gameBack()), false, 'Back closes backup before navigating/finishing home');
      await page.evaluate(() => dispatchEvent(new CustomEvent('parcel-native-progress', {detail: {kind: 'import', text: '{}'}})));
      assert.equal(await page.locator('#confirmRestore').isVisible(), false, 'late file response cannot reopen a closed panel');
      await page.click('#advHome [data-action=map]');
      if (viewport.width > viewport.height) {
        const first = await page.locator('#advLevels [data-level="0"]').boundingBox();
        assert(first.y < viewport.height - 60, 'actual route cards must be visible before landscape scrolling');
      }
      const about = page.locator('.chapter-presentation').first();
      assert.equal(await about.getAttribute('open'), null);
      await about.locator('summary').click();
      assert.equal(await about.evaluate(e => e.open), true);
      assert.equal(await about.locator('.chapter-story').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.click('#advMap [data-action=home]');
      await page.click('#advHome [data-action=settings]');
      await page.click('#advCard [data-action=privacy]');
      assert.equal(await page.getByRole('dialog', {name: 'Privacy & support', exact: true}).count(), 1);
      assert.match(await page.locator('#advCard').innerText(), /no accounts, ads, analytics/);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS native bridge UI mocks: export, invalid/confirmed import, no injection, pre-restore copy, Back/late results; compact route book and privacy in three phone layouts. Not an actual SAF-provider test.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
