debug = false
chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if(debug) console.log('listening')
  if (/*change.status === 'complete' && */ loadToggle() && tab.url) {
  // && tab.url.indexOf('http') === 0) {
    updatePage(tab);
  }
});