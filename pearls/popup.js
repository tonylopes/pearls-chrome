// const { loadAllValuesJSON } = require("./pearlstorage");

getid = function (id) { return document.getElementById(id); }

function setFoundPearls() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, { type: 'wordsColors' }, function (response) {
      if (response) {
        node = getid('pearlsFound')
        node.innerHTML = "";
        wordsColors = response.wordsColors.split(',')
        show = false
        for (i = 1; i < wordsColors.length; i += 3) {
          var span = document.createElement('FONT');
          span.innerText = wordsColors[i - 1];
          span.style.color = wordsColors[i];
          span.style.background = wordsColors[i + 1];
          node.appendChild(span);
          var space = document.createTextNode(' ');
          node.appendChild(space);
          show = true
        }
        if (show) {
          getid('wordsFound').style.display = 'block'
        } else {
          getid('wordsFound').style.display = 'none'
        }
      }/* else {
        dlogInfo('No words found');
        getid('wordsFound').style.display = 'none'
      }*/
    })
  })
}

var TimeToFade = 2000
function animateFade(lastTick, eid) {
  var curTick = new Date().getTime();
  var elapsedTicks = curTick - lastTick;
  var element = getid(eid);
  if (element.FadeTimeLeft <= elapsedTicks) {
    element.style.opacity = 0
    return;
  }
  element.FadeTimeLeft -= elapsedTicks;
  var newOpVal = element.FadeTimeLeft / TimeToFade;
  element.style.opacity = newOpVal;
  setTimeout(function () { animateFade(curTick, eid) }, 33);
}

function fade(eid) {
  var element = getid(eid);
  if (element == null)
    return;
  element.FadeTimeLeft = TimeToFade
  setTimeout(function () { animateFade(new Date().getTime(), eid) }, 33);
  return;
}

function setPearls(pearltype) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    setUrl(tab.url)
    loadPearls(pearltype).then((value) => {
      pearlsInput = getid(pearltype);
      pearlsInput.value = value;
      pearlsInput.disabled = false;
    }).catch((error) => {
      logError("Error loading pearls");
      logError(error);
    });
  });
}

function setToggle() {
  loadToggle().then((toggled) => {
    toggleInput = getid("toggleBtn")
    toggleInput.className = toggled ? 'on' : 'off';
    toggleInput.value = toggled ? "Pearl On" : "Pearl Off";
    toggleInput.disabled = false;
  }).catch((error) => {
    logError("Error setToggle");
    logError(error);
  });
}

function turnOnOff() {
  loadToggle().then((toggled) => {
    saveToggle(!toggled);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      updatePage(tab).then(() => {
        setToggle();
        setFoundPearls();
      });
    })
  }).catch((error) => {
    logError("Error turnOnOff");
    logError(error);
  });
}

function setExact() {
  loadExact().then((exact) => {
    exactInput = getid("exactBtn")
    exactInput.className = exact ? 'exact' : 'partial';
    exactInput.value = exact ? "Exact" : "Partial";
    exactInput.disabled = false;
  }).catch((error) => {
    logError("Error turnsetExactOnOff");
    logError(error);
  });
}

function turnExactPartial() {
  loadExact().then((exact) => {
    saveExact(!exact);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tab = tabs[0];
      updatePage(tab).then(() => {
        setExact();
        setFoundPearls();
      });
    })
  }).catch((error) => {
    logError("Error turnExactPartial");
    logError(error);
  });
}

function savePearlsAndUpdateMatches(pearltype) {
  dlogInfo('savePearlsAndUpdateMatches: ', pearltype);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    dlogInfo(tab.url);
    setUrl(tab.url);
    pearlvalue = getid(pearltype).value;
    savePearls(pearltype, pearlvalue);
    updatePage(tab).then(() => {
      getid("loaded").style.opacity = 100;
      fade("loaded");
      setFoundPearls();
    });
  });
}

function hide(eid) {
  getid(eid).style.display = 'none';
  //getid(eid).style.visibility = 'hidden' 
}

function hideUnhide(elementId) {
  el = getid(elementId);
  if (el.style.display == 'none') {
    el.style.display = 'block';
    cursorend(getid("localpearls"));
  } else {
    el.style.display = 'none';
  }
}

function hideUnhideConfig() {
  hideUnhide('wordsConfig')
}

function myMovePage(type) {
  hide('wordsConfig');
  dlogInfo('move');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    movePage('pos', type, tab)
  });
}

function loadFound(wordsColors) {
  alert(wordsColors);
}

function cursorend(element) {
  dlogInfo('focused');
  element.value = element.value;
}

function inputkeypressed(e, element) {
  if (e.which == 13 && (element.id == 'localpearls')) {
    e.preventDefault();
    getid("domainpearls").focus();
    return;
  }

  if (e.which == 13 && (element.id == 'domainpearls')) {
    e.preventDefault();
    getid("globalpearls").focus();
    return;
  }

  if (e.which == 13 && (element.id == 'globalpearls')) {
    e.preventDefault();
    getid('moveNextBtn').focus();
    return;
  }

  if (e.which == 27) {
    e.preventDefault();
    element.blur();
  }
}

function backupPearls() {
  allValuesJSON = getAllValuesJSON()
  getAllValuesJSON_local().then((localValuesJSON) => {
    
    dlogInfo("allValuesJSON: ", allValuesJSON, "localValuesJSON: ", localValuesJSON)
    jsonContents = allValuesJSON == "{}" ? localValuesJSON : allValuesJSON;
    // Ask user to save the file with the JSON content
    var blob = new Blob([jsonContents], {type: "text/plain;charset=utf-8"});
    // Set the file name as pearls-<date>.json with Today's date and time
    var fileName = "pearls-" + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ".json";
    saveAs(blob, fileName);
  }).catch((error) => {
    logError("Error backupPearls");
    logError(error);
  });
}

function saveAs(blobData, filename) {
  var downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blobData);
  downloadLink.download = filename;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Restore pearls from a JSON file selected by the user.
function restorePearls() {
  var migration_test=false
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  input.onchange = e => {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = readerEvent => {
      var content = readerEvent.target.result;
      dlogInfo(content);
      if (migration_test) {
        loadAllValuesJSON(content);
        saveMigratedV3(false);
      } else {
        loadAllValuesJSON_local(content);
      }
    }
  }
  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}
  

function registerHandlers() {
  getid("configBtn").addEventListener("click", hideUnhideConfig);
  getid("movePrevBtn").addEventListener("click",
    function () { myMovePage("prevHilightedNode") });
  getid("moveNextBtn").addEventListener("click",
    function () { myMovePage("nextHilightedNode") });
  getid("exactBtn").addEventListener("click", turnExactPartial);
  getid("toggleBtn").addEventListener("click", turnOnOff);
  getid("backupBtn").addEventListener("click", backupPearls);
  getid("restoreBtn").addEventListener("click", restorePearls);
  
  localpearls = getid("localpearls");
  localpearls.addEventListener("focus", function () { cursorend(localpearls) });
  localpearls.addEventListener("keydown", function (e) { inputkeypressed(e, localpearls) });
  localpearls.addEventListener("change", function (e) { savePearlsAndUpdateMatches('localpearls') });

  domainpearls = getid("domainpearls");
  domainpearls.addEventListener("focus", function () { cursorend(domainpearls) });
  domainpearls.addEventListener("keydown", function (e) { inputkeypressed(e, domainpearls) });
  domainpearls.addEventListener("change", function (e) { savePearlsAndUpdateMatches('domainpearls') });

  globalpearls = getid("globalpearls");
  globalpearls.addEventListener("focus", function () { cursorend(globalpearls) });
  globalpearls.addEventListener("keydown", function (e) { inputkeypressed(e, globalpearls) });
  globalpearls.addEventListener("change", function (e) { savePearlsAndUpdateMatches('globalpearls') });
}

function main() {
  registerHandlers()
  dlogInfo("Popup loading");
  setPearls("localpearls");
  setPearls("domainpearls");
  setPearls("globalpearls");
  setToggle();
  setExact();
  setFoundPearls();
  dlogInfo("Popup loaded");
  getid("localpearls").focus()
}

// Calling onload
window.addEventListener("load", main);
