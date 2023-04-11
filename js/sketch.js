
let serialNumber = 0; // initialize serial number
let ringRadius = 150; // radius of the ring
let cursorRadius = 10; // radius of the cursor
var startAngle = 0;

function setup() {
    var canvas = createCanvas(410, 400);
    canvas.parent('sketch-container');
//   createCanvas(400, 400);
    stroke(150); // set stroke color to white
    noFill(); // set fill color to transparent
    
}

function draw() {
  background(255); // set background color to black
  stroke(150);
  // calculate the x and y coordinates of the center of the canvas
  let centerX = width / 2;
  let centerY = height / 2;
  
  // calculate the angle of the cursor based on the serial number
  let angle_2pi = map(serialNumber, 0, 3600, 0, TWO_PI);
  let torque_visual = map(abs(torque), 0, 50, 0, 50);
  
  // calculate the x and y coordinates of the cursor based on the angle and ring radius
  let cursorX = centerX + sin(angle_2pi) * ringRadius;
  let cursorY = centerY - cos(angle_2pi) * ringRadius;

  
  // draw the ring
  noFill();
  ellipse(centerX, centerY, (ringRadius-cursorRadius-3) * 2);
  ellipse(centerX, centerY, (ringRadius+cursorRadius+3) * 2);

  let textColor = 150;//map(torque, -100, 100, 10, 250);
  fill(textColor);
  textSize(15);
  text('90', centerX+(ringRadius+cursorRadius)+15, centerY+5);
  text('0', centerX-3, centerY-(ringRadius+cursorRadius)-10);
  text('-90', centerX-(ringRadius+cursorRadius)-35, centerY+5);
  text('180', centerX-10, centerY+(ringRadius+cursorRadius)+25);
  // draw the cursor
  noStroke();
  fill('rgb(82,150,230)');
  ellipse(cursorX, cursorY, cursorRadius * 2);
  rect(centerX-13,centerY+80-torque_visual, 25, 25+torque_visual);

  noFill();
  
  // update the serial number every frame (this should be replaced with real-time data from the serial port)
  if(isNaN(angle)==false) serialNumber = (angle-zeroAngle+3600)%3600;
  // console.log("angle out1", angle)
}
