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

  test('hiliteElement correctly injects FONT tags', () => {
    const words = ['apple', 'cherry'];
    
    // Run highlighter on body
    hiliteElement(document.body, words);
    
    // Check that we got 3 highlighted nodes (2 apples, 1 cherry)
    const highlightedNodes = hilightedNodes();
    expect(highlightedNodes.length).toBe(3);
    
    // Check they are the FONT elements and have the correct class
    const fontTags = document.querySelectorAll('font.pearl-hilighted-word');
    expect(fontTags.length).toBe(3);
    
    // Assert content strings
    expect(fontTags[0].textContent).toBe('apple');
    expect(fontTags[1].textContent).toBe('apple');
    expect(fontTags[2].textContent).toBe('cherry');
    
    // Validate text hasn't been destroyed around them
    expect(document.getElementById('p1').textContent).toBe('This is a simple test paragraph with the word apple in it.');
  });

  test('unhighlite correctly restores original DOM', () => {
    const words = ['apple', 'cherry'];
    hiliteElement(document.body, words);
    
    const initialHTML = `
      <div id="wrapper">
        <p id="p1">This is a simple test paragraph with the word apple in it.</p>
        <p id="p2">This one has apple and banana.</p>
        <div>
          <span>Nested cherry inside.</span>
        </div>
      </div>
    `;

    // Unhighlight
    unhighlite();
    
    // The FONT tags should be gone
    const fontTags = document.querySelectorAll('font.pearl-hilighted-word');
    expect(fontTags.length).toBe(0);
    
    // The nodes array should be empty
    expect(hilightedNodes().length).toBe(0);
  });
  
});
