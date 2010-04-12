var url;
debug = false
function setUrl(purl){
  url = purl;
}

function getKey(pearlType){    
  return pearlType == "localpearls" ? url : "http?://*/*"
}

function getPearls(pearlType){
   var key = getKey(pearlType)
    if(debug) console.log("Getting Pearl! " + pearlType + " key: " + key)
   try {
      value = localStorage[key];
    }catch(e) {
      if(debug) console.log("Error inside getItem() for key:" + key);
      if(debug) console.log(e);      
    }
  if(debug) console.log("Pearl caught! " + value)
  if(value){
    return value;
  }
  return "";
}

function getAllPearls(){
  if(debug) console.log("Getting all pearls")
  localPearls = getPearls("localpearls")
  globalPearls = getPearls("globalpearls")
  if(debug) console.log("All pearls caught")
  return localPearls + ( localPearls.length > 0 ? "," : "") + globalPearls + "";

}
  

function storePearls(pearlType,value){
  if(debug) console.log("Storing pearl: " + pearlType);
  var key = getKey(pearlType)
  
  try {
      if(debug) console.log("Inside setItem:" + key + ":" + value);
      localStorage[key] =  value;
    }catch(e) {
      if(debug) console.log("Error inside setItem");
      if(debug) console.log(e);
    }
}

function saveToggle(value){
  try {
	localStorage['toggled'] = value;
      }catch(e) {
	if(debug) console.log("Error inside getItem() for key:" + key);
	if(debug) console.log(e);      
      }
  }
         
function loadToggle(){
    try {
      value = localStorage['toggled'];
    }catch(e) {
      if(debug) console.log("Error inside getItem() for key:" + key);
      if(debug) console.log(e);      
    }
  return value == "false" ? false : true;  
}



