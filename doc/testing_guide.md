# Testing Guide for Pearls Extension

This document provides an overview of the testing infrastructure added to the Pearls Chrome Extension, including requirements, test coverage, and execution instructions.

## 1. Overview of the Testing Strategy
To prevent regressions in core extension functionality, the project utilizes two primary strategies:
- **Unit Testing (Jest + JSDOM)**: Focuses on isolated core logic and DOM parsing/highlighting offline, using a simulated browser environment.
- **End-to-End (E2E) Testing (Puppeteer)**: Launches a real headless Chrome instance with the extension installed, evaluating background script listeners and asynchronous content injection logic.

## 2. Requirements

To run the test suite, ensure you have the following installed:
- **Node.js** (v14+ recommended)
- **NPM** (Node Package Manager)

All dependencies are defined in `package.json` and can be installed via:
```bash
npm install
```

### Key Development Dependencies:
- `jest` & `jest-environment-jsdom`: Provides the core testing framework and a headless DOM environment.
- `jest-chrome`: Mocks the `chrome.*` API namespace for unit testing extension logic outside of a browser.
- `puppeteer`: Headless Chrome Node.js API to run full system tests.

## 3. What the Tests Cover

The testing suite resides in the `__tests__/` directory.

### 3.1. Storage Tests (`pearlstorage.test.js`)
These unit tests focus on the asynchronous wrapper around Chrome's storage API.
- **Key aspects tested**:
  - `loadValue` & `saveValue`: Correctly interact with `chrome.storage.local`.
  - Handling of `chrome.runtime.lastError`.
  - `migrateV3`: Legacy `localStorage` migrations into V3 schema.
  - JSON Backup/Restore functions (`getAllValuesJSON_local`, `loadAllValuesJSON_local`).

### 3.2. Script & Parsing Tests (`pearlscript.test.js`)
These unit tests utilize JSDOM to verify the word matching and highlighting engine.
- **Key aspects tested**:
  - `getWords`: Validation of comma-separated inputs (removing spaces, ignoring empty entries).
  - `normalizeWords`: Verification that regex special characters (`?`, `*`, `+`, `(`, etc.) are safely escaped before searching the page text.
  - `hiliteElement`: Verifies that `<font class="pearl-hilighted-word">` tags are properly wrapped around found words in the DOM hierarchy without destructive side-effects.
  - `unhighlite`: Verifies the original DOM structure is completely restored.

### 3.3. End-to-End Tests (`e2e.test.js`)
This test uses Puppeteer to spin up a genuine browser window.
- **Key aspects tested**:
  - Extension initialization and background worker registration (`pearlload.js`).
  - Validation that navigating to a webpage automatically triggers the `chrome.tabs.onUpdated` listener.
  - Verification that the background script accurately issues the highlighting message (`updatePage` in `pearlupdate.js`) to the content script.
  - Confirming the content script injected on the page correctly renders the HTML tags as seen by the browser.

## 4. How to Execute Tests

### Running the Entire Suite
To run all unit and E2E tests, use the primary test script:
```bash
npm test
```
*Note: This command runs Jest against all files matching the pattern `__tests__/**/*.test.js`.*

### Running Specific Tests
To run only the unit tests (preventing the overhead of Puppeteer):
```bash
npx jest __tests__/pearlscript.test.js
npx jest __tests__/pearlstorage.test.js
```

To exclusively run the End-to-End browser test:
```bash
npx jest __tests__/e2e.test.js
```

## 5. Adding New Tests
If modifying core logic like the Regex engines in `pearlscript.js`, please add a corresponding block to `pearlscript.test.js`.
Ensure functions are exposed at the bottom of the script for Node.js usage via `module.exports`.

If modifying `chrome.tabs` messaging protocols or modifying the core Manifest configuration, verify it against a new block in `e2e.test.js`.
