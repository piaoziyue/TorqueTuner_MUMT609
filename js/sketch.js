
let serial; // variable to hold an instance of the serialport library
let portName = '/dev/cu.usbserial-020D14BA';
let inData; // for incoming serial data
var velocityList = [];

function setup() {
    createCanvas(1500, 200);

    serial = new p5.SerialPort();
    serial.list();
    serial.open('/dev/tty.usbserial-020D14BA');
    serial.on('connected', serverConnected);
   //  serial.on('list', gotList);
    serial.on('data', gotData);

}
  
function draw() {
    var height = 200;
    var velocity_old = 0;

    stroke(150);
    // if (mouseIsPressed === true) {

    for (let i =0; i<numNotes; i+=1){
        text("Velocity", 10, 150);

        let note = allNotes[i];
        var velocity_new = note.velocity;
        let duration = Math.floor(note.deltaTime/475);
        let startx = Math.floor(note.startTime/475);
        var xmove = 30;
        let ybase = height-80;
        let frameWidth = pianoRoll.quarterNoteWidth;
        // console.log(startx*frameWidth+xmove, ybase-velocity_old/127*height, (startx+duration)*frameWidth+xmove, ybase-velocity_new/127*height);
        line(startx*frameWidth+xmove, ybase-velocity_old/127*height, (startx+duration)*frameWidth+xmove, ybase-velocity_new/127*height);
        ellipse(startx*frameWidth+xmove, ybase-velocity_old/127*height, 10, 10);

        velocity_old = velocity_new;
    }
    // clear();
    // noLoop();

    // if (mouseIsPressed === true) {
    //     line(mouseX, mouseY, pmouseX, pmouseY);
    // }
}


function serverConnected() {
    print("Connected to Server");
}

function gotList(thelist) {
    print("List of Serial Ports:");

    for (let i = 0; i < thelist.length; i++) {  
        console.log(i + " " + thelist[i]);
    }
}

function gotOpen() {
    print("Serial Port is Open");
}

function gotClose(){
    print("Serial Port is Closed");
    latestData = "Serial Port is Closed";
}

function gotError(theerror) {
    print(theerror);
}

function gotData() {
    let currentString = serial.read();
    // trim(currentString);
    // if (!currentString) return;
    console.log("gotData", currentString);
    latestData = currentString;
}
