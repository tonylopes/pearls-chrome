# Pearls Extension Deployment Guide

This document outlines the steps required to package, test, and publish the Pearls Chrome Extension to the Chrome Web Store.

## 1. Pre-Deployment Checklist

Before creating a deployment package, ensure the following requirements are met:
- **Version Number Update**: Increment the `"version"` string inside `pearls/manifest.json`.
- **Automated Tests Passing**: Run the full test suite and confirm zero failures.
  ```bash
  npm test
  ```
- **Code Optimization (Optional)**: If you use a minifier, ensure the scripts in the `pearls/` directory are minified and obfuscated (though standard Chrome extensions can be shipped unminified if file size isn't a tight constraint). 
- **Verify Console Logs**: Ensure any `debug` flags in `pearlload.js` and `pearlstorage.js` are set to `false`.

## 2. Packaging the Extension

The Chrome Web Store requires the extension to be uploaded as a standard `.zip` file. You only need to include the actual extension assets, not the testing pipeline or documentation.

### Creating the ZIP archive (Linux/macOS)
Navigate into the `pearls/` directory and run the following command to zip its contents:

```bash
cd pearls
zip -r ../pearls-release-v1.0.9.3.zip . -x "*.DS_Store"
cd ..
```
*(Ensure you update the version number in the filename to match your `manifest.json`)*

**What should be inside the ZIP:**
- `manifest.json`
- `popup.html`, `popup.js`
- Background scripts (`pearlload.js`, `pearlupdate.js`)
- Content scripts (`pearlscript.js`, `logs.js`, `pearlstorage.js`, `pearlsstyle.css`)
- Icons (`pearl16.png`, `pearl48.png`, `pearl128.png`, `pearl.png`)
- Offscreen document (`offscreen.html`, `offscreen.js`)

**What MUST NOT be inside the ZIP:**
- `node_modules/`
- `__tests__/`
- `jest.config.js`, `jest.setup.js`, `package.json`, `package-lock.json`
- `doc/`
- `.git/`

## 3. Local Testing the Packaged Build

Before uploading, test the packaged ZIP locally to ensure nothing was lost during compression:
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** in the top right corner.
3. Drag and drop the `pearls-release-vX.X.X.zip` file onto the window, OR extract it to a temporary folder and click **Load unpacked**.
4. Verify that:
   - The extension icon appears in the toolbar.
   - The popup opens correctly.
   - Navigating to a test webpage successfully highlights target words.

## 4. Publishing to the Chrome Web Store

1. Log into the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. If this is an update to an existing item, click on the **Pearls Extension** in your item list. (If new, click **New Item**).
3. Select **Package** from the left sidebar and click **Upload new package**.
4. Select the `.zip` file you created in Step 2.
5. Once uploaded, review the **Store Listing** details:
   - Update the "What's new" section if applicable.
   - Verify screenshots and promotional images are still accurate.
6. Submit for Review by clicking the **Submit for Review** button in the top right corner.

*Note: Extensions utilizing `chrome.storage.local` and background service workers (Manifest V3) usually pass automated review within hours, but manual reviews can take a few days.*
