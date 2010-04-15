debug = false
function updatePage(tab) {
  if(debug) console.log('requested on ' + tab.url)
  setUrl(tab.url);
  wordsString = getAllPearls();
  toggled = loadToggle();
  exact = loadExact();
  if(debug) console.log('Exact ' + exact )
  chrome.tabs.sendRequest(tab.id,{type: 'hilight', wordsString: wordsString, toggled: toggled, exact: exact}, function(response) {    
    if(debug) console.log('Totals :' + response)
    if (response && response.total == 0) {
      chrome.browserAction.setBadgeText( {text: '',tabId: tab.id} )
    } else if(response && response.total ) {
      chrome.browserAction.setBadgeText( {text: response.total + '' , tabId: tab.id} )
    } else {
      if(debug) console.log('Nothing done');
    }
  });
}

function movePage(currElementId,typeCall,tab) {
  if(debug) console.log('requested on ' + tab.url)  
  chrome.tabs.sendRequest(tab.id,{type: typeCall}, function(response) {        
    if(debug) console.log('Abs pos :' + response)
    //if (response && response > -1) {
      document.getElementById(currElementId).value = response + 1;
    //} else {
    //  if(debug) console.log('Nothing done');
    //}
  });
}

