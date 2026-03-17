debug = false

importScripts("logs.js")
importScripts("pearlstorage.js")
importScripts("pearlupdate.js")

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

async function hasOffscreenDocument() {
  try {
    if ('getContexts' in chrome.runtime) {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
      });
      return Boolean(contexts.length);
    } else {
      // Fallback for older Chrome versions
      return false;
    }
  } catch (error) {
    logError('Error checking for offscreen document: ' + error);
    return false;
  }
}

async function closeOffscreenDoc() {
  try {
    if (await hasOffscreenDocument()) {
      await chrome.offscreen.closeDocument();
      return true;
    }
    return false;
  } catch (error) {
    logError('Error closing offscreen document: ' + error);
    return false;
  }
}

// Fire an offscreen page to migrate the data to v3.
// This is a one-time operation.
let creating = null;
async function createOffscreenDocToMigrateV3() {
  try {
    // Check if document already exists
    if (await hasOffscreenDocument()) {
      return;
    }
    
    // Create offscreen document
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH),
        reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
        justification: 'Migrate from v2 storage to v3.'
      });
      await creating;
      creating = null;
    }
  } catch (error) {
    logError('Error creating offscreen document: ' + error);
    creating = null;
  }
}

// Check if migration is needed and create offscreen document if so
loadMigratedV3().then((migrated) => {
  if (!migrated) {
    hasOffscreenDocument().then((result) => {
      if (!result) {
        createOffscreenDocToMigrateV3().catch((error) => {
          logError('Error creating offscreen document: ' + error);
        });
      }
    });
  }
});

// In the service worker
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  if (debug) self.console.log('message received', req);
  
  if (req.type === "migrateV3" && req.json_values) {
    // Handle migration request
    loadMigratedV3().then((migrated) => {
      if (!migrated) {
        migrateV3(req.json_values).then(success => {
          if (success) {
            // Close the offscreen document after successful migration
            closeOffscreenDoc().catch(err => logError('Error closing offscreen doc:', err));
          }
          sendResponse({success: success});
        }).catch(error => {
          logError('Migration error:', error);
          sendResponse({success: false, error: error.message});
        });
      } else {
        sendResponse({success: true, alreadyMigrated: true});
      }
    });
    return true; // Keep the message channel open for async response
  }

  // Add this handler for manual migration requests
  if (req.type === "requestManualMigration") {
    loadMigratedV3().then((migrated) => {
      if (!migrated) {
        createOffscreenDocToMigrateV3().then(() => {
          sendResponse({success: true});
        }).catch(error => {
          logError('Error creating offscreen document:', error);
          sendResponse({success: false, error: error.message});
        });
      } else {
        sendResponse({success: true, alreadyMigrated: true});
      }
    });
    return true; // Keep the message channel open for async response
  }
});

// Fix the tab update listener to properly handle promises
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status === 'complete') {
    loadToggle().then(toggled => {
      if (toggled && tab && tab.url) {
        updatePage(tab).catch(err => logError('Error updating page:', err));
      }
    }).catch(err => logError('Error loading toggle state:', err));
  }
});