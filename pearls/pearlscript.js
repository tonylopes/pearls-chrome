
dlogInfo("pearlscript.js loaded")
// The background page is asking us to find the words
var exact = true;

var colors = [
  ['black', '#FF6'],
  ['black', '#A0FFFF'], 
  ['black', '#9F9'],
  ['black', '#F99'],
  ['black', '#F6F'],
  ['white', '#800'],
  ['white', '#0A0'],
  ['white', '#886800'],
  ['white', '#004699'],
  ['white', '#909']]

var wordsColorsStr = '';
var hilightedNodes = Array();
var wordsColors = {};
var wordCounts = {};
var total = 0;
var currentNode = null;
var currentPos = -1;

function resetGlobals() {
  wordsColorsStr = '';
  hilightedNodes = Array();
  wordsColors = {};
  wordCounts = {};
  total = 0;
  currentNode = null;
  currentPos = null;  
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {        
  dlogInfo("pearlscript.js listened", req);
  if (window != top) {
    dlogInfo("pearlscript not top window");
    return;
  }
  const isToggledOff = (req.toggled === false || req.toggled === "false");
  if (req.type === "hilight" && !isToggledOff) {
    exact = (req.exact === true || req.exact === "true");  
    sendResponse(hilightWords(req.wordsString));
  } else if (req.type === "hilight" && isToggledOff) {
    sendResponse(unhighlite());
  } else if (req.type == "nextHilightedNode") {
    sendResponse(goToNextHilightedNode());
  } else if (req.type == "prevHilightedNode") {
    sendResponse(goToPrevHilightedNode());
  } else if (req.type == "wordsColors") {
    sendResponse({ wordsColors: wordsColorsStr, wordCounts: wordCounts });
  } else if (req.type == "scrollToWord") {
    sendResponse(scrollToWord(req.word));
  } else {
    sendResponse({});
  }
});

var wordIndices = {};

function scrollToWord(targetWord) {
  if (!targetWord || hilightedNodes.length === 0) {
    return { word: targetWord || "", pos: 0, totalWordMatches: 0, total: hilightedNodes.length };
  }
  const wordLower = targetWord.toLowerCase();
  
  const matchingNodes = hilightedNodes.filter(node => {
    return node && node.textContent && node.textContent.toLowerCase() === wordLower;
  });

  if (matchingNodes.length === 0) {
    return { word: targetWord, pos: 0, totalWordMatches: 0, total: hilightedNodes.length };
  }

  const currentIndex = ((wordIndices[wordLower] ?? -1) + 1) % matchingNodes.length;
  wordIndices[wordLower] = currentIndex;

  const targetNode = matchingNodes[currentIndex];

  if (currentNode && currentNode !== targetNode) {
    currentNode.className = 'pearl-hilighted-word';
    var prevVal = currentNode.childNodes[0] ? currentNode.childNodes[0].data.toLowerCase() : '';
    if (wordsColors[prevVal]) {
      currentNode.style.color = wordsColors[prevVal][0]; 
      currentNode.style.background = wordsColors[prevVal][1];
    }
  }

  currentNode = targetNode;
  currentPos = hilightedNodes.indexOf(targetNode);
  targetNode.className = 'pearl-current-hilighted-word';

  targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return {
    word: targetWord,
    pos: currentIndex + 1,
    totalWordMatches: matchingNodes.length,
    globalPos: currentPos >= 0 ? currentPos + 1 : 1,
    total: hilightedNodes.length
  };
}

function normalizeWords(pearlsString) {
  return (pearlsString+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")
}

function getWords(pearlsString) {
  if (!pearlsString) return [];
  const str = String(pearlsString);
  dlogInfo(" Pearl String INI: " + str);
  const pearls = str.length > 0 ? str.split(",") : [];
  const new_pearls = [];
  for (let i = 0; i < pearls.length; i++) {
    const one_pearl = pearls[i].replace(/^\s+|\s+$/g, "");
    if (one_pearl !== "") {
      new_pearls.push(one_pearl);
    }
  }
  dlogInfo(" Pearl String END: " + new_pearls);
  return new_pearls; 
}

/**
* Highlight a DOM element with a list of keywords.
*/
function hiliteElement(elm, wordsArray) {
  if (!wordsArray || wordsArray.length === 0 || elm.childNodes.length === 0)
    return;

  var qre_inse_parts = new Array(); // insensitive words
  var qre_sens_parts = new Array();  // sensitive words
  for (var i = 0; i < wordsArray.length; i ++) {
    word = wordsArray[i];  //.toLowerCase();
    if (word.length > 2 && word[0] == "\"" && word[word.length - 1] == "\"") {
      var cleanWord = word.slice(1, word.length - 1);
      var leadSens = /^\w/.test(cleanWord) ? '\\b' : '(?<!\\w)';
      var trailSens = /\w$/.test(cleanWord) ? '\\b' : '(?!\\w)';
      qre_sens_parts.push(leadSens + normalizeWords(cleanWord) + trailSens);
    } else if (exact) {
      var leadInse = /^\w/.test(word) ? '\\b' : '(?<!\\w)';
      var trailInse = /\w$/.test(word) ? '\\b' : '(?!\\w)';
      qre_inse_parts.push(leadInse + normalizeWords(word) + trailInse);
    } else { 
      qre_inse_parts.push(normalizeWords(word));
    }
  }

  if (qre_inse_parts.length === 0 && qre_sens_parts.length === 0)
    return;

  qre_inse = new RegExp(qre_inse_parts.join("|"), "i");
  qre_sens = new RegExp(qre_sens_parts.join("|"));
  
  dlogInfo("qre_inse", qre_inse);
  dlogInfo("qre_sens", qre_sens);
  

  curColor = 0

  var textproc = function(node) {
    function paintPearlFound(val, pos) {      
      var node2 = node.splitText(pos);
      var node3 = node2.splitText(val.length);
      var span = node.ownerDocument.createElement('FONT');

      node.parentNode.replaceChild(span, node2);
      span.className = 'pearl-hilighted-word';
      if (!wordsColors[val]) {
        wordsColors[val] = colors[curColor];
        curColor = (curColor + 1) % colors.length;
      }            
      span.style.color = wordsColors[val][0]; 
      span.style.background = wordsColors[val][1];

      span.appendChild(node2);
      hilightedNodes[hilightedNodes.length] = span;            
      total++;
      wordCounts[val] = (wordCounts[val] || 0) + 1;
      return span;
    }
    var inse_match = qre_inse.exec(node.data);
    var sens_match = qre_sens.exec(node.data);
    var inse_matched = (inse_match !== null && inse_match[0].length > 0);
    var sens_matched = (sens_match !== null && sens_match[0].length > 0);
    
    if (inse_matched && !sens_matched ||      
        (inse_matched && sens_matched &&
         inse_match.index <= sens_match.index)) {      
      return paintPearlFound(inse_match[0].toLowerCase(), inse_match.index);
    } else if (sens_matched) {
      return paintPearlFound(sens_match[0].toLowerCase(), sens_match.index);      
    }
    return node;
  };
  walkElements(elm.childNodes[0], 1, textproc);    
};

function walkElements(node, depth, textproc) {
  var skipre = /^(script|style|textarea|option)/i;
  var count = 0;
  while (node && depth > 0) {
    count ++;
    if (count >= 10000000) {
      var handler = function() {
        walkElements(node, depth, textproc);
      };
      setTimeout(handler, 50);
      return;
    }

    if (node.nodeType == 1) { // ELEMENT_NODE
      if (!skipre.test(node.tagName) && 
        node.className != 'pearl-hilighted-word' &&
        node.className != 'pearl-current-hilighted-word' && 
        node.childNodes.length > 0) {
        node = node.childNodes[0];
        depth ++;
        continue;
      }
    } else if (node.nodeType == 3 && 
      node.className != 'pearl-current-hilighted-word' && 
      node.className != 'pearl-hilighted-word') { // TEXT_NODE
      node = textproc(node);
    }

    if (node.nextSibling) {
      node = node.nextSibling;
    } else {
      while (depth > 0) {
        node = node.parentNode;
        depth --;
        if (node.nextSibling) {
          node = node.nextSibling;
          break;
        }
      }
    }
  }
};

function unhighlite() {
  for (let i = 0; i < hilightedNodes.length; i++) {
    const node = hilightedNodes[i];
    if (!node || !node.parentNode) continue;

    const textNode = node.ownerDocument.createTextNode(node.textContent);
    node.parentNode.replaceChild(textNode, node);
    if (textNode.parentNode) {
      textNode.parentNode.normalize();
    }
  }
  dlogInfo('Unhighlite: ' + hilightedNodes.length);

  resetGlobals();

  return { total: 0 };
}


function nextHilightedNode(){
  var pos = currentPos+1;    
  while (pos < hilightedNodes.length && hilightedNodes[pos].className == "") {
    pos++
  };
  currentNode = pos < hilightedNodes.length ? hilightedNodes[pos] : hilightedNodes[hilightedNodes.length-1]
  currentPos = pos < hilightedNodes.length ? pos : hilightedNodes.length - 1;
}

function prevHilightedNode() {
  var pos = currentPos-1;  
  while(pos > 0 && hilightedNodes[pos].className == ""){ pos--}
    currentNode = pos > 0 ? hilightedNodes[pos] : hilightedNodes[0]
  currentPos = pos > 0 ? pos : 0;
}

function absolutePos() {
  var abspos=-1;
  for (var pos=0; pos < hilightedNodes.length; pos++){
    if (hilightedNodes[pos].className != "") abspos++;
    if (hilightedNodes[pos] == currentNode) return abspos;
  }
  return -1;
}

function findPosXY(obj) {
  var curleft = 0, curtop = 0;
  if (obj && obj.offsetParent){
    while (obj.offsetParent) {
      curleft += obj.offsetLeft
      curtop += obj.offsetTop
      obj = obj.offsetParent;
    }
  }
  else if (obj && obj.x && obj.y){
    curleft += obj.x;
    curtop += obj.y;
  }
  return {x: curleft, y: curtop};
}


function goToNextHilightedNode(){   
  if(currentNode != undefined){
    currentNode.className = 'pearl-hilighted-word'
    val = currentNode.childNodes[0] ? currentNode.childNodes[0].data.toLowerCase() : ''
    dlogInfo(val)
    if (wordsColors[val]) {
      currentNode.style.color = wordsColors[val][0]; 
      currentNode.style.background = wordsColors[val][1];
    }
  }
  nextHilightedNode();
  if (currentNode) {
    pos = findPosXY(currentNode)
    currentNode.className = 'pearl-current-hilighted-word'
    window.scroll(pos.x,pos.y)
    dlogInfo("Next currentNode: " + currentPos + " AbsPos " + absolutePos() + " Pos (" + pos.x + "," + pos.y + ")")
  }
  return absolutePos();
}

function goToPrevHilightedNode(){  
  if (currentNode != undefined) {
    currentNode.className = 'pearl-hilighted-word'
    val = currentNode.childNodes[0] ? currentNode.childNodes[0].data.toLowerCase() : ''
    if (wordsColors[val]) {
      currentNode.style.color = wordsColors[val][0]; 
      currentNode.style.background = wordsColors[val][1];
    }
  }
  prevHilightedNode();
  if (currentNode) {
    pos = findPosXY(currentNode)
    currentNode.className = 'pearl-current-hilighted-word'
    window.scroll(pos.x,pos.y)
    dlogInfo("Prev currentNode: " + currentPos + " AbsPos " + absolutePos() + " Pos (" + pos.x + "," + pos.y + ")")
  }
  return absolutePos();
}

var lastText = "";
var lastWords = "";
function hilightWords(wordsString) {
  var found;  
  var node = document.body;
  var done = false;
  var wordsArray = getWords(wordsString);
  
  unhighlite();

  if (wordsArray.length > 0) {
    hiliteElement(document.body, wordsArray);
    dlogInfo("Hilight!!!")
    for(var f = 0; f < frames.length; f++){
      try {
        hiliteElement(frames[f].document.body, wordsArray);
      } catch(err) {
        logError("Chrome bug doesn't allow the suppression of this exception: https://code.google.com/p/chromium/issues/detail?id=17325")
      }
    }
  }
  // Ordering highlighted nodes from left to right, top to bottom.
  hilightedNodes = hilightedNodes.sort(
    function (nodea,nodeb) {
      posnodea = findPosXY(nodea);
      posnodeb = findPosXY(nodeb);
      return posnodea.y == posnodeb.y ? posnodea.x - posnodeb.x : posnodea.y - posnodeb.y;
    })

  dlogInfo('Frames ' + window.frames.length)
  /*if(window.frames.length > 1){
    for(var f in document){
      dlogInfo(f)
    }
}*/
  /*    if(window.parent.frames[f].document)
  hiliteElement(window.parent.frames[f].document.body,wordsArray);
      dlogInfo("Frame Undef " + f + "  " + window.frames[f].document );
    }
  }else{*/    
  //}
  /*hilightedNodes.sort(function (nodea,nodeb) {
    return nodea.scrollTop - nodeb.scrollTop; })
  currentNode = null;
  currentNode = nextNode();
  positionScroll(currentNode);*/    
  for(var val in wordsColors)
    wordsColorsStr += val +',' + wordsColors[val][0] + ',' + wordsColors[val][1] + ',';       
  
  return {total: total};
}

/*function requestOpenPopup(){
 	chrome.runtime.sendMessage({ type: "requestOpenPopup" })
}

window.addEventListener('keydown', function(e) {if ((e.which == 'y' && e.altKey)) {
                                e.preventDefault();
                                requestOpenPopup();
                        }},false );
*/

if (typeof module !== 'undefined' && module.exports !== undefined) {
  module.exports.getWords = getWords;
  module.exports.normalizeWords = normalizeWords;
  module.exports.hiliteElement = hiliteElement;
  module.exports.unhighlite = unhighlite;
  module.exports.hilightedNodes = function() { return hilightedNodes; };
  module.exports.resetGlobals = resetGlobals;
  module.exports.setExact = function(val) { exact = val; };
}