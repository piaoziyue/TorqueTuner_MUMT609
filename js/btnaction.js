
document.getElementById("veloInput").onclick = function() {
    veloInputOrNot = true;
    pitchBendOrNot = false;
    console.log("click veloInput");
};

document.getElementById("pitchBend").onclick = function() {
    pitchBendOrNot = true;
    veloInputOrNot = false;
    console.log("click pitchBend");
}; 

document.getElementById("haps1").addEventListener("click", function() {
    // update date the mode to wallet
    thisMode = 'w';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000); 
    zeroAngle = angle;
  });
document.getElementById("haps2").addEventListener("click", function() {
    // update date the mode to click
    thisMode = 'c';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000);
    zeroAngle = angle;
  });
  document.getElementById("haps3").addEventListener("click", function() {
   // update date the mode to free spring
    thisMode = 'f';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000);
    zeroAngle = angle;
  });
  document.getElementById("haps4").addEventListener("click", function() {
    // update date the mode to vibrate
     thisMode = 'v';
     console.log("clickmode", thisMode);
     writeToStream(thisMode);
     setTimeout(function(){
    }, 8000);
     zeroAngle = angle;
   });
  document.getElementById("hapd1").addEventListener("click", function() {
    // update date the mode to linear spring
    thisMode = 'l';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000);
    zeroAngle = angle;
  });
  document.getElementById("hapd2").addEventListener("click", function() {
    // update date the mode to exp spring
    thisMode = 'e';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000);
    zeroAngle = angle;
  });
  document.getElementById("hapd3").addEventListener("click", function() {
    // update date the mode to magnet
    thisMode = 'm';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    setTimeout(function(){
    }, 8000);
    zeroAngle = angle;
  });
  document.getElementById("hapc1").addEventListener("click", function() {
    // change the value of A1
    // thisMode = 'w';
  });
  