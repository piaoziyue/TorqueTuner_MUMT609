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
      document.getElementById("haps4").addEventListener("click", function() {
        // update date the mode to vibrate
         thisMode = 'v';
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
       

        let splitArray = value.split(" ");
        console.log("split", splitArray)

        for (i=0; i<value.length-1; i++){
            if (splitArray[i] == "Velocity") {
                if(isNaN(splitArray[i+1])==false) velocity = parseInt(splitArray[i+1]);
                else velocity=0;
            }
            else if (splitArray[i] =="Angle") {
                angle = parseInt(splitArray[i+1]);
                if(abs(angle-lastAngle)>20){
                    if(isNaN(velocity))angle = lastAngle+2;
                    else angle = lastAngle+velocity;
                    // console.log('value1', parseInt(angle)/10, parseInt(lastAngle)/10);
                    // lastAngle = parseInt(splitArray[i+1]);
                }else{
                    lastAngle = angle;
                    
                    // console.log('value2', parseInt(angle)/10, parseInt(lastAngle)/10);
                }
                // if((angle<90 && (isNaN(lastAngle) || lastAngle>90)) || isNaN(angle)) {
                //     angle = lastAngle;
                //     // console.log('value', parseInt(angle)/10, parseInt(lastAngle)/10);
                //     lastAngle = lastAngle;
                // }else {
                //     // console.log('value', parseInt(angle)/10, parseInt(lastAngle)/10);
                //     lastAngle = angle;
                // }
                    
            }
            else if (splitArray[i] =="Torque") {
                if(isNaN(splitArray[i+1])==false) torque = parseInt(splitArray[i+1]);
                else torque=0;
            }
            else if (splitArray[i] =="AngleOut"){
                if(isNaN(splitArray[i+1])==false) angleOut = parseInt(splitArray[i+1]);
                else angleOut=0;
            }
            else if (splitArray[i] =="VelocityOut"){
                if(isNaN(splitArray[i+1])==false) velocityOut = parseInt(splitArray[i+1]);
                else velocityOut=0;
            }
            else if (splitArray[i] =="Mode"){
                mode = splitArray[i+1];
                if(mode == 'w') mode_string="no resistance";
                else if(mode == 'c') mode_string="click";
                else if(mode == 'm') mode_string="magnet";
                else if(mode == 'i') mode_string="inertia";
                else if(mode == 'e') mode_string="exp spring";
                else if(mode == 'l') mode_string="liner spring";
                else if(mode == 'f') mode_string="free";
                else if(mode == 's') mode_string="spin";
                else if(mode == 'v') mode_string="vibrate";
                document.getElementById("mode").innerHTML = mode_string;
                

            }
            
  
        
        }
        // setTimeout(function(){
        // }, 200); 
        // console.log("log", torque, angle, angleOut, velocity, velocityOut, mode);
        if(splitArray[i+1] != NaN) console.log("check", splitArray[i+1]);

    }
}