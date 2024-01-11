
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
  document.getElementById("hapd1").addEventListener("click", function() {
    //TODO: update date the mode to linear spring
     pitchscale = 5;
     thisMode = 'l' + pitchscale.toString() ;
     console.log("linear", thisMode);
     writeToStream(thisMode);

     zeroAngle = angle;
   });
  document.getElementById("hapd2").addEventListener("click", function() {
    // update date the mode to new mode
    thisMode = 'f';
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



// Plot the data using D3.js
function plotData(xCoords, yCoords, plotIndex, color) {

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
    .attr("stroke", color)
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
  plotData(plotsData_angle[currentPlotIndex], currentPlotIndex, "blue");

  // Number button click event listeners
  function numberButtonClickHandler(index) {
    return function () {
      currentPlotIndex = index;
      plotData(plotsData_angle[currentPlotIndex], currentPlotIndex, "blue");
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
    // plotsData_angle.push(angle);
    const newPlotIndex = plotsData_angle.length - 1;
    const newNumberButton = createNumberButton(newPlotIndex);
    numberButtonsContainer.appendChild(newNumberButton);
  });

  // Delete button click event listener
  deleteButton.addEventListener("click", function () {
    if (plotsData_angle.length === 1) {
      return; // Prevent deleting the last plot
    }

    plotsData_angle.splice(currentPlotIndex, 1);
    const numberButtons = document.getElementsByClassName("number-button");
    numberButtonsContainer.removeChild(numberButtons[currentPlotIndex]);

    if (currentPlotIndex >= plotsData_angle.length) {
      currentPlotIndex = plotsData_angle.length - 1;
    }

    plotData(plotsData_angle[currentPlotIndex], currentPlotIndex, "blue");
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
      dataX_ang = [];
      dataY_ang = [];

      pages.forEach(
        pages => (pages.style.transform = `translateX(${translate}%)`)
      );
    }
  

// save button
document.getElementById('saveButton').addEventListener('click', function () {
  ID = document.getElementById('username').value;
  const updatedDataX_ang = dataX_ang.map(value => (value + 50) / 64); //how many 1/4 notes
  const updatedDataY_ang = dataY_ang.map(value => (value-30) / 10); //how many half notes
  let dataY_time = []; //how many half notes
  let dataY_pitch = []; //how many half notes
  let dataY_dur = []; //how many half notes
  
  // Iterate through the list
  for (let i = 0; i < dataY_score.length; i++) {
    // Check if the value is null
    if (dataY_score[i] === null) {
      // If it's null, set it to 0
      dataY_time[i] = 0;
      dataY_pitch[i] = 0;
      dataY_dur[i] = 0;
    } else {
      // If it's an object with a 'time' property, replace it with the value of 'time'
      dataY_time[i] = dataY_score[i].time*2;
      dataY_pitch[i] = dataY_score[i].pitch;
      dataY_dur[i] = dataY_score[i].dur*2;

      if (dataY_time[i]+dataY_dur[i] < updatedDataX_ang[i]) {
        dataY_time[i] = 0;
        dataY_pitch[i] = 0;
        dataY_dur[i] = 0;
      } 
    }

  }
  
  // Combine data into a CSV string
  const csvData = updatedDataX_ang.map((x, index) => `${x},${updatedDataY_ang[index]},${dataY_time[index]},${dataY_pitch[index]},${dataY_dur[index]}`).join('\n');


  // Create a Blob from the CSV data
  const blob = new Blob([csvData], { type: 'text/csv' });

  // Create a download link
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);

  // Set the download attribute with the desired file name
  link.download = `${ID}_${name}.csv`;

  // Append the link to the body
  document.body.appendChild(link);

  // Trigger the download
  link.click();

  // Remove the link from the DOM
  document.body.removeChild(link);

});