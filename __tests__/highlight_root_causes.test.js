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
loadScript('../pearls/pearlscript.js');

describe('Highlighting Root Causes & Regex Edge Cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div><p>Testing empty keyword lists and toggle states on live DOM.</p></div>';
    resetGlobals();
    exact = false;
  });

  test('hiliteElement must not match empty strings or create infinite loops when wordsArray is empty []', () => {
    // Calling hiliteElement with empty wordsArray []
    hiliteElement(document.body, []);
    
    // Must not create any pearl-hilighted-word elements
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(0);
  });

  test('hiliteElement must not match empty strings when wordsArray contains only empty strings or whitespace [" ", ""]', () => {
    const words = getWords(" ,  ");
    expect(words).toEqual([]);

    hiliteElement(document.body, words);
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(0);
  });

  test('onMessage listener must trigger hilightWords even if req.toggled is undefined or omitted (defaulting to enabled)', () => {
    let responseSent = null;

    const listener = (req, sender, sendResponse) => {
      const isToggledOff = (req.toggled === false || req.toggled === "false");
      if (req.type === "hilight" && !isToggledOff) {
        exact = (req.exact === true || req.exact === "true");  
        sendResponse(hilightWords(req.wordsString));
      } else if (req.type === "hilight" && isToggledOff) {
        sendResponse(unhighlite());
      }
    };

    // Send req without toggled property (undefined)
    listener({ type: 'hilight', wordsString: 'Testing', exact: 'false' }, {}, res => {
      responseSent = res;
    });

    expect(responseSent).toEqual({ total: 1 });
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(1);
  });
});
