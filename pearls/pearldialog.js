debug = false

getid=function(id){return document.getElementById(id);}

function setFoundPearls() {
  chrome.tabs.getSelected(null,function(tab) {
    chrome.tabs.sendRequest(tab.id,{type: 'wordsColors'}, function(response) {
      if (response) {  
        node = getid('pearlsFound')
        node.innerHTML ="";
        wordsColors = response.wordsColors.split(',')
        show = false
        for(i=1; i < wordsColors.length ; i+=3){  
          var span = document.createElement('FONT');        
          span.innerText = wordsColors[i-1];                    
          span.style.color = wordsColors[i]; 
          span.style.background = wordsColors[i+1];    
          node.appendChild(span);
          var space = document.createTextNode(' ');
          node.appendChild(space);
          show = true
        }   
        if(show){
          getid('wordsFound').style.display = 'block'
        }else{
          getid('wordsFound').style.display = 'none'
        }
      }else{
        getid('wordsFound').style.display = 'none'
      }
    })
  })
}

var TimeToFade = 2000
function animateFade(lastTick, eid) {  
  var curTick = new Date().getTime();
  var elapsedTicks = curTick - lastTick;  
  var element = getid(eid); 
  if(element.FadeTimeLeft <= elapsedTicks)
  {
    element.style.opacity = 0
    return;
  } 
  element.FadeTimeLeft -= elapsedTicks;
  var newOpVal = element.FadeTimeLeft/TimeToFade;
  element.style.opacity = newOpVal;
  setTimeout(function(){animateFade(curTick,eid)}, 33);
}

function fade(eid) {
  var element = getid(eid);  
  if(element == null)
    return;
  element.FadeTimeLeft = TimeToFade
  setTimeout(function(){animateFade(new Date().getTime(),eid)}, 33);
  return;
}

function setPearls(pearltype) {
  chrome.tabs.getSelected(null, function(tab) {
    setUrl(tab.url)
    pearlsInput = getid(pearltype);
    pearlsInput.value = getPearls(pearltype);
  });
}

function setToggle() { 
  toggleInput = getid("toggleBtn")
  toggled = loadToggle();  
  toggleInput.className = toggled ? 'on' : 'off';
  toggleInput.value = toggled ? "Pearl On" : "Pearl Off";  
}

function turnOnOff() {  
  toggled = loadToggle();     
  saveToggle(!toggled);  
  chrome.tabs.getSelected(null,function(tab) {
    updatePage(tab)
  })
  setToggle();
  setFoundPearls();
}

function setExact() { 
  exactInput = getid("exactBtn")
  exact = loadExact();  
  exactInput.className = exact ? 'exact' : 'partial';
  exactInput.value = exact ? "Exact" : "Partial";  
}

function turnExactPartial() {
  exact = loadExact();     
  saveExact(!exact);  
  chrome.tabs.getSelected(null, function(tab) {
    updatePage(tab)
  })
  setExact();
  setFoundPearls();
}

function mystorePearls(pearltype) {
  if(debug) console.log('hey')

    chrome.tabs.getSelected(null,function(tab) {
      if(debug) console.log(tab.url)
        setUrl(tab.url)
      pearlvalue = getid(pearltype).value
      storePearls(pearltype,pearlvalue)    
      updatePage(tab)
      getid("loaded").style.opacity = 100;
      fade("loaded")
      setFoundPearls();
    });
}

function hide(eid){
  getid(eid).style.display = 'none'; 
  //getid(eid).style.visibility = 'hidden' 
}

function hideUnhide(elementId) {
  el = getid(elementId);
  if( el.style.display == 'none' ){
    el.style.display = 'block'; 
    cursorend(getid("localpearls"));
  }else{
    el.style.display = 'none'; 
  }
}

function hideUnhideConfig() {
  hideUnhide('wordsConfig')
}

function myMovePage(type) {
  hide('wordsConfig')
  if(debug) console.log('move')
    chrome.tabs.getSelected(null,function(tab) {
      movePage('pos',type,tab)
    });
}

function loadFound(wordsColors) {
  alert(wordsColors);
}

function cursorend(element) {
  if(debug) console.log('focused')
    element.value = element.value;
}

function inputkeypressed(e,element) {
  if( e.which == 13 && ( element.id == 'localpearls' ) ){
    e.preventDefault();
    getid("domainpearls").focus()
    return;
  }
  
  if( e.which == 13 && ( element.id == 'domainpearls' ) ){
    e.preventDefault();
    getid("globalpearls").focus()
    return;
  }

  if( e.which == 13 && (  element.id == 'globalpearls'  ) ){
    e.preventDefault();
    getid('moveNextBtn').focus()
    return;
  }
  
  if( e.which == 27 ){
    e.preventDefault();
    element.blur();
  }
}

function testingPopup(evt) {
  alert('bye')
}


function registerHandlers() {
  getid("configBtn").addEventListener("click",hideUnhideConfig);
  getid("movePrevBtn").addEventListener("click",
    function(){myMovePage("prevHilightedNode")});
  getid("moveNextBtn").addEventListener("click",
    function(){myMovePage("nextHilightedNode")});
  getid("exactBtn").addEventListener("click",turnExactPartial);
  getid("toggleBtn").addEventListener("click",turnOnOff);

  localpearls = getid("localpearls")
  localpearls.addEventListener("focus", function(){cursorend(localpearls)});
  localpearls.addEventListener("keydown", function(e){inputkeypressed(e,localpearls)});
  localpearls.addEventListener("change", function(e){mystorePearls('localpearls')});

  domainpearls = getid("domainpearls")
  domainpearls.addEventListener("focus", function(){cursorend(domainpearls)});
  domainpearls.addEventListener("keydown", function(e){inputkeypressed(e,domainpearls)});
  domainpearls.addEventListener("change", function(e){mystorePearls('domainpearls')});

  globalpearls = getid("globalpearls")
  globalpearls.addEventListener("focus", function(){cursorend(globalpearls)});
  globalpearls.addEventListener("keydown", function(e){inputkeypressed(e,globalpearls)});
  globalpearls.addEventListener("change", function(e){mystorePearls('globalpearls')});
}

function main(){
  registerHandlers()
  if(debug) console.log("Popup loading")
  setPearls("localpearls");
  setPearls("domainpearls");
  setPearls("globalpearls");
  setToggle();
  setExact();
  setFoundPearls();
  if(debug) console.log("Popup loaded")
  getid("localpearls").focus()
  window.addEventListener("unload", testingPopup, false);
}

// Calling onload
window.addEventListener("load", main);
