const fs = require('fs');

// Create minimal DOM for getWords/normalizeWords to load without crashing since pearlscript modifies window/document
document.body.innerHTML = '<div></div>';

// Mock dlogInfo used in pearlscript
global.dlogInfo = jest.fn();
global.logError = jest.fn();

const { 
  getWords, 
  normalizeWords,
  hiliteElement,
  unhighlite,
  hilightedNodes,
  resetGlobals,
  setExact
} = require('../pearls/pearlscript.js');

describe('pearlscript - text normalization and extraction', () => {

  beforeEach(() => {
    resetGlobals();
    setExact(true);
  });

  test('normalizeWords escapes special characters correctly', () => {
    const specials = ".?*+^$[]\\(){}|-";
    const escaped = normalizeWords(specials);
    
    // Each of those characters should have a backslash in front of it
    expect(escaped).toBe('\\.\\?\\*\\+\\^\\$\\[\\]\\\\\\(\\)\\{\\}\\|\\-');
    
    // Normal string shouldn't be touched
    expect(normalizeWords('hello world')).toBe('hello world');
  });

  test('getWords extracts words from a comma-separated string', () => {
    const input = "apple, banana, cherry , , orange";
    const words = getWords(input);
    
    // Should split on comma and trim whitespace, and drop completely empty ones
    expect(words).toEqual(["apple", "banana", "cherry", "orange"]);
  });

  test('getWords extracts special words and numbers', () => {
    const input = "c++, c#, 123";
    const words = getWords(input);
    expect(words).toEqual(["c++", "c#", "123"]);
  });

  test('getWords extracts Unicode and CJK (Chinese, Japanese, Korean) words', () => {
    const input = "苹果, りんご, 사과 , , 珍珠";
    const words = getWords(input);
    expect(words).toEqual(["苹果", "りんご", "사과", "珍珠"]);
  });

});

describe('pearlscript - DOM Modification (jsdom)', () => {

  beforeEach(() => {
    resetGlobals();
    setExact(true);
    // Setup a clean DOM
    document.body.innerHTML = `
      <div id="wrapper">
        <p id="p1">This is a simple test paragraph with the word apple in it.</p>
        <p id="p2">This one has apple and banana.</p>
        <div>
          <span>Nested cherry inside.</span>
        </div>
      </div>
    `;
  });

  function getActiveHighlightsCount() {
    if (typeof CSS !== 'undefined' && CSS.highlights && CSS.highlights.size > 0) {
      let totalRanges = 0;
      for (const [key, highlight] of CSS.highlights.entries()) {
        totalRanges += highlight.size;
      }
      return totalRanges;
    }
    return document.querySelectorAll('.pearl-hilighted-word').length;
  }

  test('hiliteElement correctly highlights keywords in DOM', () => {
    const words = ['apple', 'cherry'];
    
    // Run highlighter on body
    hiliteElement(document.body, words);
    
    // Check that we got 3 highlighted nodes (2 apples, 1 cherry)
    const highlightedNodes = hilightedNodes();
    expect(highlightedNodes.length).toBe(3);
    
    // Check highlight count generically
    expect(getActiveHighlightsCount()).toBe(3);
    
    // Assert content strings if DOM element tags are present
    const tags = document.querySelectorAll('.pearl-hilighted-word');
    if (tags.length > 0) {
      expect(tags[0].textContent).toBe('apple');
      expect(tags[1].textContent).toBe('apple');
      expect(tags[2].textContent).toBe('cherry');
    }
    
    // Validate text hasn't been destroyed around them
    expect(document.getElementById('p1').textContent).toBe('This is a simple test paragraph with the word apple in it.');
  });

  test('unhighlite correctly restores original DOM', () => {
    const words = ['apple', 'cherry'];
    hiliteElement(document.body, words);

    // Unhighlight
    unhighlite();
    
    // Highlights should be gone
    expect(getActiveHighlightsCount()).toBe(0);
    
    // The nodes array should be empty
    expect(hilightedNodes().length).toBe(0);
  });

  test('hiliteElement highlights multiple occurrences in a single text node', () => {
    document.body.innerHTML = '<p id="test">apple and apple and another apple</p>';
    hiliteElement(document.body, ['apple']);
    expect(getActiveHighlightsCount()).toBe(3);
  });

  test('unhighlite restores DOM text nodes back to single uninterrupted text node', () => {
    const p = document.getElementById('p1');
    const originalNodeCount = p.childNodes.length;
    
    hiliteElement(document.body, ['apple']);
    unhighlite();
    
    expect(p.childNodes.length).toBe(originalNodeCount);
    expect(p.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(p.textContent).toBe('This is a simple test paragraph with the word apple in it.');
  });

  test('forces Tier 2 fallback when CSS.highlights is undefined', () => {
    const originalHighlights = window.CSS.highlights;
    delete window.CSS.highlights;
    if (global.CSS) delete global.CSS.highlights;
    
    hiliteElement(document.body, ['apple']);
    const tags = document.querySelectorAll('.pearl-hilighted-word');
    expect(tags.length).toBe(2);
    
    window.CSS.highlights = originalHighlights; // restore
    if (global.CSS) global.CSS.highlights = originalHighlights;
  });

  test('hiliteElement correctly highlights CJK (Chinese & Japanese) characters and restores DOM on unhighlite', () => {
    document.body.innerHTML = `
      <div id="cjk-container">
        <p id="cjk-p1">这是一个包含苹果和珍珠的中文段落，苹果很好吃。</p>
        <p id="cjk-p2">日本の美味しいりんごと綺麗な真珠。</p>
      </div>
    `;

    const cjkWords = ['苹果', '珍珠', 'りんご', '真珠'];
    hiliteElement(document.body, cjkWords);

    // 2 instances of 苹果, 1 珍珠, 1 りんご, 1 真珠 -> Total 5 highlights
    expect(getActiveHighlightsCount()).toBe(5);

    const tags = document.querySelectorAll('.pearl-hilighted-word');
    if (tags.length > 0) {
      const texts = Array.from(tags).map(t => t.textContent);
      expect(texts).toContain('苹果');
      expect(texts).toContain('珍珠');
      expect(texts).toContain('りんご');
      expect(texts).toContain('真珠');
    }

    // Verify unhighlite restores original text intact
    unhighlite();
    expect(getActiveHighlightsCount()).toBe(0);
    expect(document.getElementById('cjk-p1').textContent).toBe('这是一个包含苹果和珍珠的中文段落，苹果很好吃。');
    expect(document.getElementById('cjk-p2').textContent).toBe('日本の美味しいりんごと綺麗な真珠。');
  });

  test('hiliteElement correctly highlights accented European Unicode characters (café, München, niño)', () => {
    document.body.innerHTML = `
      <div id="latin-unicode">
        <p id="lat-p1">We had coffee at the café in München with the niño.</p>
      </div>
    `;

    const unicodeWords = ['café', 'München', 'niño'];
    hiliteElement(document.body, unicodeWords);

    expect(getActiveHighlightsCount()).toBe(3);

    const tags = document.querySelectorAll('.pearl-hilighted-word');
    if (tags.length > 0) {
      const texts = Array.from(tags).map(t => t.textContent);
      expect(texts).toContain('café');
      expect(texts).toContain('München');
      expect(texts).toContain('niño');
    }

    unhighlite();
    expect(getActiveHighlightsCount()).toBe(0);
    expect(document.getElementById('lat-p1').textContent).toBe('We had coffee at the café in München with the niño.');
  });
  
});



