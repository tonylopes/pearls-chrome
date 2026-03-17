Object.assign(global, require('jest-chrome'));

global.setImmediate = global.setImmediate || function (fn, ...args) { return global.setTimeout(fn, 0, ...args); };
