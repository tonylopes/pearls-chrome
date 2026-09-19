Object.assign(global, require('jest-chrome'));

global.setImmediate = global.setImmediate || function (fn, ...args) { return global.setTimeout(fn, 0, ...args); };

if (typeof window !== 'undefined') {
  if (!window.CSS) {
    window.CSS = {};
  }

  if (!window.CSS.highlights) {
    class MockHighlight extends Set {
      constructor(...ranges) {
        super(ranges);
      }
    }
    class MockHighlightRegistry extends Map {}
    window.CSS.highlights = new MockHighlightRegistry();
    window.Highlight = MockHighlight;
    global.CSS = window.CSS;
    global.Highlight = window.Highlight;
  }
}

