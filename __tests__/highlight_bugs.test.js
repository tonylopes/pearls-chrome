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

describe('Highlighting Failure Modes & Bug Repros', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetGlobals();
    global.logError = jest.fn();
    global.dlogInfo = jest.fn();
  });

  test('getWords should safely handle undefined or null pearlsString input without throwing TypeError', () => {
    expect(() => {
      getWords(undefined);
    }).not.toThrow();

    expect(getWords(undefined)).toEqual([]);
    expect(getWords(null)).toEqual([]);
  });

  test('getKey should safely extract domain without throwing when url is empty or undefined', () => {
    setUrl(undefined);
    expect(() => {
      getKey('domainpearls');
    }).not.toThrow();

    setUrl('');
    expect(() => {
      getKey('domainpearls');
    }).not.toThrow();
  });

  test('loadAllPearls should safely format arrays and strings into unified keyword list without undefined or NaN', async () => {
    setUrl('http://example.com/test');
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys, cb) => cb({}))
        }
      }
    };

    const words = await loadAllPearls();
    expect(typeof words).toBe('string');
    expect(words).not.toContain('undefined');
  });
});
