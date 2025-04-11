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

      chrome.tabs.sendMessage(tab.id, { type: 'hilight', wordsString: wordsString, toggled: toggled, exact: exact }, function (response) {
        //dlogInfo('Abs pos :' + response)
        if (response && response.total == 0) {
          chrome.action.setBadgeText({ text: '', tabId: tab.id })
        } else if (response && response.total) {
          chrome.action.setBadgeText({ text: response.total + '', tabId: tab.id })
        } else {
          //dlogInfo('Nothing done');
        }
      });
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

