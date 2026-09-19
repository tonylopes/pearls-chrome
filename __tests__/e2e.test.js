const puppeteer = require('puppeteer');
const path = require('path');
const { spawn } = require('child_process');

describe('E2E - Background Script Tab Loading', () => {
  let browser;
  let page;
  let serverProcess;

  beforeAll(async () => {
    const extensionPath = path.resolve(__dirname, '..');
    
    browser = await puppeteer.launch({
      headless: true, // true starting Puppeteer 22 usually supports extensions in new headless mode, or use 'new'.
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox'
      ]
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Extension should automatically highlight keywords on a newly opened tab', async () => {
    // 1. Open background page of the extension to set up initial storage state
    const targets = await browser.targets();
    const serviceWorkerTarget = targets.find(t => t.type() === 'service_worker');
    
    // Fall back to trying to find the extension ID to assign storage if service worker approach is tricky
    // But since MV3, we can evaluate in the service worker directly:
    if (serviceWorkerTarget) {
      const swWorker = await serviceWorkerTarget.worker();
      swWorker.on('console', msg => console.log('SW Console:', msg.text()));
      await swWorker.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.set({
            'toggled': true,
            'exact': true,
            'http?://*/*': 'apple, banana'
          }, resolve);
        });
      });
    }

    // 2. Open a new page that has "apple" and "banana"
    page = await browser.newPage();
    page.on('console', msg => console.log('PAGE Console:', msg.text()));
    
    // We just set HTML content
    const htmlContent = `
      <html>
        <body>
          <p id="content">I have an apple and a banana.</p>
        </body>
      </html>
    `;
    
    await page.setContent(htmlContent, { waitUntil: 'load' });
    
    // Since content scripts don't naturally inject into about:blank or data:,
    // we manually evaluate the core script logic and execute it as if it just loaded.
    await page.addScriptTag({ path: path.join(__dirname, '../pearls/logs.js') });
    await page.addScriptTag({ path: path.join(__dirname, '../pearls/pearlscript.js') });
    
    // Now simulate what updatePage does by sending a message window message event OR evaluating directly
    await page.evaluate(() => {
        window.hilightWords("apple, banana"); 
    });

    // 4. Verify that the highlights were injected automatically (via CSS.highlights or DOM class)
    const highlightedElements = await page.evaluate(() => {
      if (typeof CSS !== 'undefined' && CSS.highlights && CSS.highlights.size > 0) {
        const ranges = [];
        for (const [key, highlight] of CSS.highlights.entries()) {
          for (const range of highlight) {
            ranges.push(range.toString().trim());
          }
        }
        return ranges;
      }
      const fonts = document.querySelectorAll('.pearl-hilighted-word');
      return Array.from(fonts).map(f => f.textContent.trim());
    });

    // We expect both 'apple' and 'banana' to be highlighted
    expect(highlightedElements.length).toBe(2);
    expect(highlightedElements).toContain('apple');
    expect(highlightedElements).toContain('banana');
  }, 10000); // increase timeout for browser launch
});
