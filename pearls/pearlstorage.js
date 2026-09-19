var url;
debug = false

function setUrl(purl) {
  url = purl;
}

function saveValue(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({[key]: value}, () => {
      if (chrome.runtime && chrome.runtime.lastError) {
        //logError("Error set key:" + key + " in chrome.storage.local");
        //logError(chrome.runtime.lastError);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function loadValue(key) {
  return new Promise((resolve) => {
    if (!chrome.storage || !chrome.storage.local) {
      resolve("");
      logError("chrome.storage API is not available");
      return;
    }

    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime && chrome.runtime.lastError) {
        // If there's an error, reject the Promise
        logError("Error get key:" + key + " in chrome.storage.local");
        logError(chrome.runtime.lastError);
        resolve("");
      } else {
        if (result && key in result) {
          resolve(result[key]);
        } else {
          resolve("");
        }
      }
    });
  });
}

function getKey(pearlType) {
  if (pearlType === "globalpearls") {
    return "http?://*/*";
  }
  if (!url || typeof url !== 'string') {
    return "http?://*/*";
  }
  if (pearlType === "localpearls") {
    return url;
  }
  if (pearlType === "domainpearls") {
    const parts = url.split(/\/+/g);
    if (parts.length >= 2) {
      return parts[0] + "//" + parts[1];
    }
    return url;
  }
  return "http?://*/*";
}

function loadPearls(pearlType) {
  var key = getKey(pearlType)
  dlogInfo("Getting Pearl! " + pearlType + " key: " + key)
  return loadValue(key)
}

function loadAllPearls() {
  dlogInfo("Getting all pearls");
  
  const localPearlsPromise = loadPearls("localpearls");
  const domainPearlsPromise = loadPearls("domainpearls");
  const globalPearlsPromise = loadPearls("globalpearls");

  return Promise.all([localPearlsPromise, domainPearlsPromise, globalPearlsPromise])
    .then(([localPearls, domainPearls, globalPearls]) => {
      dlogInfo("All pearls caught");
      const list = [];
      [localPearls, domainPearls, globalPearls].forEach(p => {
        if (!p) return;
        const arr = Array.isArray(p) ? p : String(p).split(',');
        arr.forEach(word => {
          const w = String(word).trim();
          if (w && !list.includes(w)) {
            list.push(w);
          }
        });
      });
      return list.join(',');
    });
}

async function savePearls(pearlType, value) {
  dlogInfo("Storing pearl: " + pearlType);
  var key = getKey(pearlType)
  return await saveValue(key, value)
}

async function saveToggle(value) {
  return await saveValue('toggled', value)
}

function loadToggle() {
  return new Promise((resolve) => {
    loadValue('toggled').then((value) => {
      resolve(value === false || value === 'false' ? false : true); // default is true
    });
  });
}

async function saveExact(value) {
  return await saveValue('exact', value)
}

async function saveMigratedV3(value) {
  return await saveValue('migrated_v3', value)
}

function loadExact() {
  return new Promise((resolve) => {
    loadValue('exact').then((value) => {
      resolve(value === false || value === 'false' ? false : true); // default is true
    });
  });
}

function loadMigratedV3() {
  return new Promise((resolve) => {
    loadValue('migrated_v3').then((value) => {
      resolve(value === true || value === 'true' ? true : false); // default is false
    });
  });
}

// Save all values from localStorage into chrome.storage.local
function migrateV3(json) {
  let promises = [];
  var values = JSON.parse(json);
  for (var key in values) {
    promises.push(saveValue(key, values[key]));
  }

  return Promise.all(promises).then((results) => {
    // Check that all promises resolved to true
    if (results.every(result => result === true)) {
      return saveValue('migrated_v3', true);
    } else {
      throw new Error('Not all promises resolved to true');
    }
  }).catch((error) => {
    logError('Error migrating keys: ' + error);
    return false;
  });
}

// A function that gathers all saved values and returns them as json text
function getAllValuesJSON(){
  var values = {};
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    values[key] = localStorage.getItem(key);
  }
  
  return JSON.stringify(values);
}

// A function that gathers all saved values in chrome.storage.local and returns them as json text
function getAllValuesJSON_local() {
  return new Promise((resolve) => {
    var values = {};
    chrome.storage.local.get(null, function(items) {
      for (var key in items) {
        values[key] = items[key];
      }
      resolve(JSON.stringify(values));
    });
  });
}

// A function that loads all values from a json text and saves them in localStorage
function loadAllValuesJSON(json){
  var values = JSON.parse(json);
  for (var key in values) {
    localStorage.setItem(key, values[key]);
  }
}

function loadAllValuesJSON_local(json){
  var values = JSON.parse(json);
  chrome.storage.local.set(values);
}

async function loadPearlsArray(pearlType) {
  const raw = await loadPearls(pearlType);
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(w => String(w).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    return raw.split(',').map(w => w.trim()).filter(Boolean);
  }
  return [];
}

async function savePearlsArray(pearlType, tagsArray) {
  const arr = Array.isArray(tagsArray) ? tagsArray : [];
  const value = arr.map(w => String(w).trim()).filter(Boolean).join(',');
  return await savePearls(pearlType, value);
}

async function saveTagColors(colorMap) {
  return await saveValue('tag_colors', colorMap || {});
}

async function loadTagColors() {
  const val = await loadValue('tag_colors');
  return (val && typeof val === 'object') ? val : {};
}

if (typeof module !== 'undefined' && module.exports !== undefined) {
  module.exports.setUrl = setUrl;
  module.exports.loadValue = loadValue;
  module.exports.saveValue = saveValue;
  module.exports.migrateV3 = migrateV3;
  module.exports.loadAllValuesJSON = loadAllValuesJSON;
  module.exports.getAllValuesJSON = getAllValuesJSON;
  module.exports.getAllValuesJSON_local = getAllValuesJSON_local;
  module.exports.loadAllValuesJSON_local = loadAllValuesJSON_local;
  module.exports.loadPearlsArray = loadPearlsArray;
  module.exports.savePearlsArray = savePearlsArray;
  module.exports.saveTagColors = saveTagColors;
  module.exports.loadTagColors = loadTagColors;
}