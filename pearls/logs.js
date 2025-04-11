debug = true

function logError(...args) {
    if (typeof self !== 'undefined' && self.importScripts) {
        // In a service worker context
        self.console.log(args);
        self.console.trace();
    } else {
        // In a web page context
        console.log(args);
        console.trace();
    }
}

function dlogInfo(...args) {
    if (!debug) return;
    if (typeof self !== 'undefined' && self.importScripts) {
        // In a service worker context
        self.console.log(args);
    } else {
        // In a web page context
        console.log(args);
    }
}
