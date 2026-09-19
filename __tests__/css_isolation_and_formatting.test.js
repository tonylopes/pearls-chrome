const fs = require('fs');
const path = require('path');

function loadScript(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  eval.call(global, code);
}

global.logError = jest.fn();
global.dlogInfo = jest.fn();

loadScript('../pearls/logs.js');
loadScript('../pearls/pearlstorage.js');
loadScript('../pearls/pearlscript.js');

describe('Content Script CSS Isolation & Scope String Formatting', () => {
  test('pearlsstyle.css must not contain global page layout selectors (html, body, width: 600px)', () => {
    const cssPath = path.resolve(__dirname, '../pearls/pearlsstyle.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Content script CSS injected into all web pages must never style html or body or set fixed widths
    expect(cssContent).not.toMatch(/html\s*,\s*body/i);
    expect(cssContent).not.toMatch(/width:\s*600px/i);
    expect(cssContent).not.toMatch(/\*,\s*\*::before/i);
  });

  test('loadAllPearls must produce clean comma-separated keyword list without trailing or double commas', async () => {
    setUrl('http://example.com/testpage');
    let mockStorage = {
      'http://example.com/testpage': 'apple, banana',
      'http://example.com': '',
      'http?://*/*': ''
    };

    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => {
            const res = {};
            const list = Array.isArray(keys) ? keys : [keys];
            list.forEach(k => { if (k in mockStorage) res[k] = mockStorage[k]; });
            cb(res);
          })
        }
      }
    };

    const wordsString = await loadAllPearls();
    expect(wordsString).toBe('apple,banana');
    expect(wordsString).not.toContain(',,');
    expect(wordsString.endsWith(',')).toBe(false);
    expect(wordsString.startsWith(',')).toBe(false);
  });

  test('unhighlite must not call normalize on parent containers or mutate sibling element structures', () => {
    document.body.innerHTML = '<main class="app-container"><p>This is a <b>test</b> of highlighting.</p></main>';
    resetGlobals();

    hiliteElement(document.body, ['test']);
    const countBefore = document.body.querySelectorAll('.pearl-hilighted-word').length;
    expect(countBefore).toBe(1);

    const mainContainer = document.querySelector('.app-container');
    const normalizeSpy = jest.spyOn(mainContainer, 'normalize');

    unhighlite();

    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(0);
    expect(normalizeSpy).not.toHaveBeenCalled();
    expect(document.body.innerHTML).toContain('<main class="app-container">');
  });
});
