const puppeteer = require('puppeteer');
const path = require('path');

describe('Popup UI Layout & Border Alignment', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    const popupPath = 'file://' + path.resolve(__dirname, '../pearls/popup.html');
    await page.goto(popupPath, { waitUntil: 'networkidle0' });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('body should have a fixed width of 600px and no horizontal overflow', async () => {
    const layout = await page.evaluate(() => {
      const body = document.body;
      return {
        clientWidth: body.clientWidth,
        scrollWidth: body.scrollWidth,
        offsetWidth: body.offsetWidth
      };
    });

    expect(layout.clientWidth).toBe(600);
    expect(layout.scrollWidth).toBeLessThanOrEqual(600);
  });

  test('top-level containers should start flush at left: 0 without float-right offset', async () => {
    const containers = await page.evaluate(() => {
      const topBar = document.querySelector('body > div');
      const wordsConfig = document.getElementById('wordsConfig');
      
      return {
        topBarLeft: topBar ? topBar.getBoundingClientRect().left : null,
        wordsConfigLeft: wordsConfig ? wordsConfig.getBoundingClientRect().left : null
      };
    });

    expect(containers.topBarLeft).toBe(0);
    expect(containers.wordsConfigLeft).toBe(0);
  });

  test('textarea elements should fit inside their containers without box-sizing overflow', async () => {
    const overflowInfo = await page.evaluate(() => {
      const textareas = Array.from(document.querySelectorAll('textarea'));
      const wordsConfig = document.getElementById('wordsConfig');
      const configRect = wordsConfig ? wordsConfig.getBoundingClientRect() : null;

      const items = textareas.map(ta => {
        const rect = ta.getBoundingClientRect();
        return {
          id: ta.id,
          width: rect.width,
          right: rect.right,
          containerRight: configRect ? configRect.right : null
        };
      });

      return {
        configScrollWidth: wordsConfig ? wordsConfig.scrollWidth : 0,
        configClientWidth: wordsConfig ? wordsConfig.clientWidth : 0,
        textareas: items,
        configRight: configRect ? configRect.right : null
      };
    });

    expect(overflowInfo.configScrollWidth).toBeLessThanOrEqual(overflowInfo.configClientWidth);

    overflowInfo.textareas.forEach(item => {
      expect(item.right).toBeLessThanOrEqual(overflowInfo.configRight || 600);
    });
  });
});
