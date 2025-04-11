json_values = getAllValuesJSON()
if (json_values != "{}") {
    chrome.runtime.sendMessage({type: "migrateV3", json_values: json_values});
}

