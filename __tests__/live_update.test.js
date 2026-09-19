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

describe('Live Keyword Updates Without Page Refresh', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div><p>We need to fix this bug and eliminate the error in production.</p></div>';
    resetGlobals();
    exact = false;
  });

  test('Updating keywords from "bug" to "bug,error" on live DOM highlights both words without page refresh', () => {
    // Initial highlight run with 'bug'
    const result1 = hilightWords('bug');
    expect(result1.total).toBe(1);
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(1);

    // Live update keywords to 'bug,error' on the same DOM without reload
    const result2 = hilightWords('bug,error');
    expect(result2.total).toBe(2);
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(2);

    const highlights = Array.from(document.body.querySelectorAll('.pearl-hilighted-word')).map(el => el.textContent.toLowerCase());
    expect(highlights).toContain('bug');
    expect(highlights).toContain('error');
  });

  test('Removing a keyword from "bug,error" to "error" removes highlight for deleted keyword without page refresh', () => {
    // Initial highlight run with 'bug,error'
    hilightWords('bug,error');
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(2);

    // Live update removing 'bug', keeping only 'error'
    const result = hilightWords('error');
    expect(result.total).toBe(1);
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(1);

    const highlights = Array.from(document.body.querySelectorAll('.pearl-hilighted-word')).map(el => el.textContent.toLowerCase());
    expect(highlights).not.toContain('bug');
    expect(highlights).toContain('error');
  });

  test('Toggled string "true" or boolean true in message listener triggers hilightWords correctly', () => {
    let responseSent = null;

    const listener = (req, sender, sendResponse) => {
      if (req.type === "hilight" && (req.toggled === true || req.toggled === "true")) {
        exact = (req.exact === true || req.exact === "true");  
        sendResponse(hilightWords(req.wordsString));
      } else if (req.type === "hilight" && (req.toggled === false || req.toggled === "false")) {
        sendResponse(unhighlite());
      }
    };

    listener({ type: 'hilight', wordsString: 'bug', toggled: 'true', exact: 'false' }, {}, res => {
      responseSent = res;
    });

    expect(responseSent).toEqual({ total: 1 });
    expect(document.body.querySelectorAll('.pearl-hilighted-word').length).toBe(1);
  });
});
