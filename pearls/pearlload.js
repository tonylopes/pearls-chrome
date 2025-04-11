debug = true

importScripts("logs.js")
importScripts("pearlstorage.js")
importScripts("pearlupdate.js")

const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

async function hasOffscreenDocument() {
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [OFFSCREEN_DOCUMENT_PATH]
    });
    return Boolean(contexts.length);
  } else {
    const matchedClients = await clients.matchAll();
    return await matchedClients.some(client => {
        client.url.includes(chrome.runtime.id);
    });
  }
}

// Fire an offscreen page to migrate the data to v3.
// This is a one-time operation.
let creating = null;
async function createOffscreenDocToMigrateV3() {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
      justification: 'Migrate from v2 storage to v3.'
    });
    await creating;
    creating = null;
  }
}


hasOffscreenDocument().then((result) => {
  if (!result) {
    createOffscreenDocToMigrateV3().catch((error) => {
      logError('Error creating offscreen document: ' + error);
    });
  }
});


// In the service worker
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  if (debug) self.console.log('message received', req)
  loadMigratedV3().then((migrated) => {
    if (req.type == "migrateV3" && req.json_values && !migrated) {
      migrateV3(req.json_values);
    }
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if(debug) self.console.log('listening')
  if (/*change.status === 'complete' && */ loadToggle()) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError) {
        if (debug) self.console.log('Could not load', chrome.runtime.lastError)
      } else if (tabs && tabs[0].url) {
        updatePage(tabs[0]);
      }
    });
  }
});


