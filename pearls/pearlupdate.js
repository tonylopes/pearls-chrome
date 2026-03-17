if (typeof importScripts !== 'undefined') {  
  importScripts("logs.js")
  importScripts("pearlstorage.js")
}

function updatePage(tab) {
  dlogInfo('updatePage requested on ' + tab.url)
  setUrl(tab.url);

  return Promise.all([loadAllPearls(), loadToggle(), loadExact()])
    .then(([wordsString, toggled, exact]) => {
      dlogInfo('Exact ' + exact)

      const trySendMessage = (retries = 3) => {
        chrome.tabs.sendMessage(tab.id, { type: 'hilight', wordsString: wordsString, toggled: toggled, exact: exact }, function (response) {
          if (chrome.runtime.lastError) {
            if (retries > 0) {
              setTimeout(() => trySendMessage(retries - 1), 500);
            } else {
              logError('Error updating page after retries:', chrome.runtime.lastError.message);
            }
            return;
          }

          if (response && response.total == 0) {
            chrome.action.setBadgeText({ text: '', tabId: tab.id })
          } else if (response && response.total) {
            chrome.action.setBadgeText({ text: response.total + '', tabId: tab.id })
          }
        });
      };
      
      trySendMessage();
    })
    .catch((error) => {
      logError("Error updating page: ", error);
    });
}

function movePage(currElementId, typeCall, tab) {
  dlogInfo('movePage requested on ' + tab.url);
  (async () => {
    await chrome.tabs.sendMessage(tab.id, { type: typeCall }, function (response) {
      //dlogInfo('Abs pos :' + response)
      if(response && response > -1) {
        document.getElementById(currElementId).value = response + 1;
      } else {
        //dlogInfo('Nothing done');
      }
    });
  })();
}

