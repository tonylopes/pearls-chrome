# Pearls Extension System Design Document

## 1. Architecture Overview
Pearls is a Google Chrome Extension designed to automatically search for and highlight a defined set of keywords on webpages. Recently migrated to Manifest V3, the extension relies on robust message passing between a popup UI, a background service worker, and a content script injected into every loaded webpage.

## 2. Component Design

### 2.1. Background Service Worker (`pearlload.js`)
- **Role**: State coordinator and migration handler.
- **Responsibilities**:
  - Monitors tab navigation events (`chrome.tabs.onUpdated`). When a page finishes loading, it checks if the extension is toggled on and commands the content script to execute highlighting.
  - Manages the lifecycle of an **Offscreen Document** (`offscreen.html` / `offscreen.js`) used as a bridge to perform a one-time migration of legacy user data from MV2's `localStorage` into MV3's `chrome.storage.local` asynchronously.

### 2.2. Content Script (`pearlscript.js` & `pearlsstyle.css`)
- **Role**: Execution engine for DOM manipulation.
- **Responsibilities**:
  - **Highlighting**: When commanded, it processes the target keywords from all configured scopes. It heavily traverses the page's DOM, replacing text within text nodes matching the keywords with inline `<font>` elements styled via the injected CSS. Colors are assigned from a hardcoded palette.
  - **Unhighlighting**: Restores the original DOM structure when the extension is toggled off or settings change.
  - **In-page Navigation**: Enables auto-scrolling to the next or previous highlighted word instance.
  - Responds to RPC-like messages from the popup or service worker for updates and status inquiries.

### 2.3. User Interface (`popup.html` & `popup.js`)
- **Role**: User configuration portal.
- **Responsibilities**:
  - Presents text areas to input comma-separated keywords for three hierarchical scopes: **Global** (all pages), **Domain** (e.g., only on example.com), and **Local** (exact URL mapping).
  - Provides core controls: Extension On/Off toggle, Exact/Partial string matching toggle.
  - Provides utilities to Backup and Restore settings by serializing and deserializing the entire storage into a `.json` file (`backupBtn`, `restoreBtn`).
  - Contains Next/Previous controls to let users scroll through highlighted instances easily right from the popup.

### 2.4. Storage & Utilities (`pearlstorage.js`, `pearlupdate.js`)
- **`pearlstorage.js`**: Wraps the async `chrome.storage.local` API into Promises. Calculates the correct storage keys logically based on the desired scope (e.g. generating a domain-level key from an absolute URL).
- **`pearlupdate.js`**: Contains shared operational functions, notably `updatePage`, which fetches all keywords across layers and exact/toggled preferences, then broadcasts a highlighting task to the active tab's content script.

## 3. Storage Data Model
The system relies entirely on `chrome.storage.local`, utilizing a flattened key-value structure:
- **`http?://*/*`**: (String) Comma-separated global keywords.
- **Domain Keys** (e.g., `http://example.com`): (String) Domain-level keywords.
- **URL Keys** (e.g., `http://example.com/path/article.html`): (String) Page-level keywords.
- **`toggled`**: (Boolean/String) Master killswitch for the highlighter.
- **`exact`**: (Boolean/String) Match strategy (exact vs substring bounds).
- **`migrated_v3`**: (Boolean) System flag tracking if the setup migration from MV2 is completed, preventing redundant offscreen document spawns.

## 4. Work Flow: Word Highlighting
1. **Trigger**: A user edits a keyword list in the Popup, OR a page finishes loading (handled by the Service Worker), OR the user clicks the exact/partial match toggle button.
2. **Fetch**: `updatePage` is called, asynchronously resolving all active keywords for the given URL from Storage.
3. **Command**: A message `{type: 'hilight', wordsString: '...', ...}` is dispatched to the active tab.
4. **Execution**: `pearlscript.js` (running inside the tab) clears any existing custom highlights, compiles Regular Expressions for the supplied keywords, walks the DOM text nodes, and injects customized `<font>` elements around the matches.
5. **Feedback**: The content script replies with the total match count, which the Background/Popup uses to update the extension icon's badge text (`chrome.action.setBadgeText`).
