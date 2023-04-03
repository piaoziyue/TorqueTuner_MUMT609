
let serialNumber = 0; // initialize serial number
let ringRadius = 150; // radius of the ring
let cursorRadius = 10; // radius of the cursor

function setup() {
    var canvas = createCanvas(400, 400);
    canvas.parent('container');
//   createCanvas(400, 400);
    stroke(150); // set stroke color to white
    noFill(); // set fill color to transparent
}

function draw() {
  background(255); // set background color to black
  
  // calculate the x and y coordinates of the center of the canvas
  let centerX = width / 2;
  let centerY = height / 2;
  
  // calculate the angle of the cursor based on the serial number
  let angle_2pi = map(serialNumber, 0, 360, 0, TWO_PI);
  
  // calculate the x and y coordinates of the cursor based on the angle and ring radius
  let cursorX = centerX + cos(angle_2pi) * ringRadius;
  let cursorY = centerY + sin(angle_2pi) * ringRadius;

  cursorRadius = 10+ abs(lastTorque/5);
  
  // draw the ring
  ellipse(centerX, centerY, ringRadius * 2);
  
  // draw the cursor
  ellipse(cursorX, cursorY, cursorRadius * 2);
  
  // update the serial number every frame (this should be replaced with real-time data from the serial port)
  serialNumber = angle/10;
}
