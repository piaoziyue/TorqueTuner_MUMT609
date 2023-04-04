let inData; // for incoming serial data
var torqueList = [];
var torDeltaList = [];
var velocity=0;
var velocityOut = 0;
var angle = 0;
var angleOut = 0;
var torque = 0;
var mode;
var mode_string;

var startTwist = false;
var veloInputOrNot=false;
var pitchBendOrNot=true;

var lastTorque=0;
var lastVelocity=0;
var lastAngle =0;

var thisMode = 'f';

function handle(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
    }
}


async function connect() {
    // const inputField = document.getElementById("input");
    // inputField.disabled = false;
    // inputField.focus();
    // inputField.select();
    // document.getElementById("sendButton").disabled = false;
    document.getElementById("connect").disabled = true;

    port = await navigator.serial.requestPort();
    // - Wait for the port to open.
    await port.open({ baudRate: 115200 });
    console.log('Open');

    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    reader = inputStream.getReader();
    readLoop();

    document.getElementById("haps1").addEventListener("click", function() {
        // update date the mode to wallet
        thisMode = 'w';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
    document.getElementById("haps2").addEventListener("click", function() {
        // update date the mode to click
        thisMode = 'c';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
      document.getElementById("haps3").addEventListener("click", function() {
       // update date the mode to free spring
        thisMode = 'f';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
      document.getElementById("hapd1").addEventListener("click", function() {
        // update date the mode to linear spring
        thisMode = 'l';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
      document.getElementById("hapd2").addEventListener("click", function() {
        // update date the mode to exp spring
        thisMode = 'e';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
      document.getElementById("hapd3").addEventListener("click", function() {
        // update date the mode to magnet
        thisMode = 'm';
        console.log("clickmode", thisMode);
        writeToStream(thisMode);
      });
      document.getElementById("hapc1").addEventListener("click", function() {
        // change the value of A1
        // thisMode = 'w';
      });
}

function writeToStream(line) {
    const writer = outputStream.getWriter();
    console.log('[SEND]', line);
    writer.write(line);
    writer.releaseLock();
}

async function readLoop() {
    console.log('Readloop');

    while (true) {
        const { value, done } = await reader.read();
        console.log(value)

        let splitArray = value.split(" ");

        for (i=0; i<value.length-1; i++){
            if (splitArray[i] == "Velocity") {
                velocity = parseInt(splitArray[i+1]);
                    
            }
            else if (splitArray[i] =="Angle") {
                angle = parseInt(splitArray[i+1]);
                if((angle<90 && (isNaN(lastAngle) || lastAngle>90)) || isNaN(angle)) {
                    angle = lastAngle;
                    // console.log('value', parseInt(angle)/10, parseInt(lastAngle)/10);
                    lastAngle = lastAngle;
                }else {
                    // console.log('value', parseInt(angle)/10, parseInt(lastAngle)/10);
                    lastAngle = angle;
                }
                    
            }
            else if (splitArray[i] =="Torque") {
                torque = parseInt(splitArray[i+1]);
            }
            else if (splitArray[i] =="AngleOut"){
                angleOut = parseInt(splitArray[i+1]);
            }
            else if (splitArray[i] =="VelocityOut"){
                velocityOut = parseInt(splitArray[i+1]);
            }
            else if (splitArray[i] =="Mode"){
                mode = splitArray[i+1];
                if(mode == 'w') mode_string="wall";
                else if(mode == 'c') mode_string="click";
                else if(mode == 'm') mode_string="magnet";
                else if(mode == 'i') mode_string="inertia";
                else if(mode == 'e') mode_string="exp spring";
                else if(mode == 'l') mode_string="liner spring";
                else if(mode == 'f') mode_string="free";
                else if(mode == 's') mode_string="spin";
                document.getElementById("mode").innerHTML = mode_string;
                

            }
            
  
        
        }
        setTimeout(function(){
        }, 500); 
        console.log("log", torque, angle, angleOut, velocity, velocityOut, mode);
        if(splitArray[i+1] != NaN) console.log("check", splitArray[i+1]);

    }
}