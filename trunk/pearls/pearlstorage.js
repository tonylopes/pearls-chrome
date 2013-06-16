var url;
debug = false
function setUrl(purl){
  url = purl;
}

function saveValue(key,value){
  try {
    localStorage[key] = value;
  } catch(e) {
    if(debug) console.log("Error inside getItem() for key:" + key);
    if(debug) console.log(e);      
  }
}

function loadValue(key){
  try {
    value = localStorage[key];
  }catch(e) {
    if(debug) console.log("Error inside getItem() for key:" + key);
    if(debug) console.log(e);      
  }
  return value;  
}

function getKey(pearlType){    
  return (pearlType == "localpearls" ? url :
   (pearlType == "domainpearls" ?
    url.split(/\/+/g)[0] + "//" + url.split(/\/+/g)[1] : 
    "http?://*/*"))
}

function getPearls(pearlType){
  var key = getKey(pearlType)
  if(debug) console.log("Getting Pearl! " + pearlType + " key: " + key)
  value = loadValue(key)
  if(debug) console.log("Pearl caught! " + value)
  return value ? value : "";
}

function getAllPearls(){
  if(debug) console.log("Getting all pearls")
    localPearls = getPearls("localpearls")
  domainPearls = getPearls("domainpearls")
  globalPearls = getPearls("globalpearls")
  if(debug) console.log("All pearls caught")
    localAndDomain = localPearls + ( localPearls.length > 0 ? "," : "") + domainPearls;
  return localAndDomain + (localAndDomain.length > 0 ? "," : "") + globalPearls + "";
}

function storePearls(pearlType,value){
  if(debug) console.log("Storing pearl: " + pearlType);
  var key = getKey(pearlType)
  saveValue(key,value)
}
function saveToggle(value){
  saveValue('toggled',value)
}

function loadToggle(){    
  value = loadValue('toggled');    
  return value == "false" ? false : true;  
}

function saveExact(value){
  saveValue('exact',value)
}

function loadExact(){    
  value = loadValue('exact');    
  return value == "false" ? false : true;  
}
