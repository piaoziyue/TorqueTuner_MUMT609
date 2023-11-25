
// document.getElementById("veloInput").onclick = function() {
//     veloInputOrNot = true;
//     pitchBendOrNot = false;
//     console.log("click veloInput");
// };
var plotsData_angle = []; // Initial plot angle data
var plotsData_torque = []; // Initial plot torque data
document.getElementById("resetAngle").onclick = function() {
    zeroAngle = angle;
    console.log("reset angle");
}; 

document.getElementById("haps1").addEventListener("click", function() {
    // update date the mode to wallet
    thisMode = 'w';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    zeroAngle = angle;
  });
document.getElementById("haps2").addEventListener("click", function() {
    // update date the mode to click
    thisMode = 'c';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    zeroAngle = angle;
  });
  // document.getElementById("haps3").addEventListener("click", function() {
  //  // update date the mode to free spring
  //   thisMode = 'f';
  //   console.log("clickmode", thisMode);
  //   writeToStream(thisMode);
  //   zeroAngle = angle;
  // });
  document.getElementById("hapd2").addEventListener("click", function() {
    //TODO: update date the mode to new mode
     thisMode = 'l';
     console.log("clickmode", thisMode);
     writeToStream(thisMode);
     zeroAngle = angle;
   });
  document.getElementById("hapd1").addEventListener("click", function() {
    // update date the mode to linear spring
    thisMode = 'l';
    console.log("clickmode", thisMode);
    writeToStream(thisMode);
    zeroAngle = angle;
  });

  // Get the modal
const modal = document.getElementById("myModal");

// Get the button that opens the modal
const btn = document.getElementById("openModal");

// Get the <span> element that closes the modal
const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.addEventListener("click", function() {
  modal.style.display = "block";
});

// When the user clicks on <span> (x), close the modal
span.addEventListener("click", function() {
  modal.style.display = "none";
});

// When the user clicks outside the modal, close it
window.addEventListener("click", function(event) {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

const slider = document.getElementById('xlimSlider');

slider.addEventListener('input', function(event) {
  let sliderValue = parseFloat(slider.value);
  // let sliderMax = parseFloat(slider.maxSliderValue);
  let viewBox = pianoRoll.svgRoot.viewbox();
  const viewBoxX = parseFloat(viewBox.x);
  let viewBoxY = parseFloat(viewBox.y);
  let viewBoxWidth = parseFloat(viewBox.width);
  let viewBoxHeight = parseFloat(viewBox.height);
  let canvasWidth = parseFloat(pianoRoll.viewportWidth);
  
  let maxSliderValue = canvasWidth ;
  
  let newViewBoxX = parseFloat((sliderValue / 100) * 1.5 * maxSliderValue);
  pianoRoll.svgRoot.viewbox(newViewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight);

});

function mapValue(value, oldMin, oldMax, newMin, newMax) {
  return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
}

