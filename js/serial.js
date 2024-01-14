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
var pitchBendOrNot=true;

var lastTorque=0;
var lastVelocity=0;
var lastAngle =0;
var zeroAngle = 0;
var firstInTheLoop = true;

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
    

    if(angle_2pi>=900 && angle_2pi<=2700) writeToStream("max");
    else writeToStream("normal");
    
}

function writeToStream(line) {
    console.log("write");
    const writer = outputStream.getWriter();
    writer.write(line);
    writer.releaseLock();
}

async function readLoop() {

    while (true) {
        // console.log('Readloop', pianoRoll.cursorPosition);
        const { value, done } = await reader.read();

        let splitArray = value.split(",");
        for (i=0; i<value.length-1; i++){
            if (splitArray[i] == "Velocity") {
                if(isNaN(splitArray[i+1])==false) velocity = parseInt(splitArray[i+1]);
                else velocity=0;
            }
            else if (splitArray[i] =="Angle") {
                // console.log("log1", Math.floor(lastAngle/10), Math.floor(lastAngle/100), Math.floor(lastAngle/1000))
                if(isNaN(splitArray[i+1])==false 
                  && (splitArray[i+1]>Math.floor(lastAngle/10)+10 || splitArray[i+1]<Math.floor(lastAngle/10)-10)
                  && (splitArray[i+1]>Math.floor(lastAngle/100)+10 || splitArray[i+1]<Math.floor(lastAngle/100)-10)
                  && (splitArray[i+1]>Math.floor(lastAngle/1000)+10 || splitArray[i+1]<Math.floor(lastAngle/1000)-10) ) 
                    angle = parseInt(splitArray[i+1]);
                else angle=lastAngle;
                // setTimeout(function(){
                //         }, 200);
                lastAngle = angle;
                
                if(firstInTheLoop){
                    console.log("here");
                    // setTimeout(function(){
                    // }, 200);
                    zeroAngle = angle;
                }
                firstInTheLoop = false;
                    
            }
            else if (splitArray[i] =="Torque")
            {
                if(isNaN(splitArray[i+1])==false) 
                    torque = parseInt(splitArray[i+1]);
                else torque=lastTorque;
                lastTorque = torque;
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
        // console.log("print", zeroAngle, angleOut, angleOut);
        // if(splitArray[i+1] != NaN) console.log("check", splitArray[i+1]);
        
        
    }
}