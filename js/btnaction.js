
// document.getElementById("veloInput").onclick = function() {
//     veloInputOrNot = true;
//     pitchBendOrNot = false;
//     console.log("click veloInput");
// };
var plotsData = []; // Initial plot data
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

// // Generate random data
// function generateRandomData() {
//   const data = [];

//   while(pianoRollIsPlaying) {
//     angleData = mapValue((angle-zeroAngle)%3600, -3600, 3600, 0, 100);
//     data.push(angleData); // push data (0-100)
//     console.log("ran", angleData, pianoRollIsPlaying)
//   }

//   return data;
// }

// Plot the data using D3.js
function plotData(xCoords, yCoords, plotIndex) {
  const plotContainer = d3.select("#plot-container");

  // Clear existing plot
  plotContainer.selectAll("svg").remove();

  // Set the dimensions of the plot
  const plotWidth = plotContainer.node().getBoundingClientRect().width;
  const plotHeight = plotContainer.node().getBoundingClientRect().height;

  // Create an SVG container within the "plot-container" div with translation
  var svg = d3.select("#plot-container")
              .append("svg")
              .attr("width", plotWidth)
              .attr("height", plotHeight)
              .append("g")
              .attr("transform", "translate(50, 10)"); // Adjust the translation as needed

  // Define the line generator
  var line = d3.line()
               .x(function(d) { return d.x; })
               .y(function(d) { return d.y; });
  
  // Combine the x and y coordinates into an array of objects
  var data = xCoords.map(function(d, i) {
    return { x: d, y: yCoords[i] };
  });

  // Append a path element to the SVG and set its "d" attribute using the line generator
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("d", line);

  // Highlight selected plot
  const numberButtons = document.getElementsByClassName("number-button");
  Array.from(numberButtons).forEach(function (button, index) {
    button.classList.toggle("active", index === plotIndex - 1);
  });
}





// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
  const addButton = document.getElementById("add-button");
  const deleteButton = document.getElementById("delete-button");
  const numberButtonsContainer = document.getElementById("number-buttons");

  
  let currentPlotIndex = 0; // Index of the currently selected plot

  
  // Plot initial data
  plotData(plotsData[currentPlotIndex], currentPlotIndex);

  // Number button click event listeners
  function numberButtonClickHandler(index) {
    return function () {
      currentPlotIndex = index;
      plotData(plotsData[currentPlotIndex], currentPlotIndex);
    };
  }

  function createNumberButton(index) {
    const button = document.createElement("button");
    button.className = "number-button";
    button.textContent = index;
    button.addEventListener("click", numberButtonClickHandler(index));
    return button;
  }

  // Add button click event listener
  addButton.addEventListener("click", function () {
    // plotsData.push(angle);
    const newPlotIndex = plotsData.length - 1;
    const newNumberButton = createNumberButton(newPlotIndex);
    numberButtonsContainer.appendChild(newNumberButton);
    // plotData(plotsData[newPlotIndex], newPlotIndex);
  });

  // Delete button click event listener
  deleteButton.addEventListener("click", function () {
    if (plotsData.length === 1) {
      return; // Prevent deleting the last plot
    }

    plotsData.splice(currentPlotIndex, 1);
    const numberButtons = document.getElementsByClassName("number-button");
    numberButtonsContainer.removeChild(numberButtons[currentPlotIndex]);

    if (currentPlotIndex >= plotsData.length) {
      currentPlotIndex = plotsData.length - 1;
    }

    plotData(plotsData[currentPlotIndex], currentPlotIndex);
  });

  // Create initial number button
  const initialNumberButton = createNumberButton(0);
  initialNumberButton.classList.add("active");
  numberButtonsContainer.appendChild(initialNumberButton);
});

const pages = document.querySelectorAll(".page");
    const translateAmount = 100; 
    let translate = 0;

    slide = (direction) => {

      direction === "next" ? translate -= translateAmount : translate += translateAmount;

      pages.forEach(
        pages => (pages.style.transform = `translateX(${translate}%)`)
      );
    }
  