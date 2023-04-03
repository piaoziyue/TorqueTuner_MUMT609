let inData; // for incoming serial data
var torqueList = [];
var torDeltaList = [];
var torque=0;
var angle =0;
var lastTorque=0;
var torDelta=0;
var startTwist = false;
var veloInputOrNot=false;
var pitchBendOrNot=false;

// if ('serial' in navigator) {
//     const notSupported = document.getElementById('notSupported');
//     notSupported.classList.add('hidden');
// }

// const log = document.getElementById("log")


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
            if (splitArray[i] =="Velocity") lastTorque = parseInt(splitArray[i+1]);
            else if (splitArray[i] =="Angle") angle = parseInt(splitArray[i+1]);
        }

        console.log('value', parseInt(lastTorque), parseInt(angle)/10);

        // torDelta = value-lastTorque;
        // lastTorque=value;
        if(Math.abs(lastTorque)<=4) lastTorque=0;
        // console.log('tor', lastTorque);
        // console.log('done', done);

        // if (done) {
        //     console.log('[readLoop] DONE', done);
        //     reader.releaseLock();
        //     break;
        // }
    }
}

// function gotData() {

//     // if(currentString != '229') console.log(currentString)
    
//     if (currentString != velocity){ //} && currentString != '229'){
//         startTwist = true;
//         append(velocityList, currentString)
//         velDelta = Math.abs(currentString-lastVelocity);
//         lastVelocity=velocity;
//         velocity = currentString;
//         append(veloDeltaList, velDelta)
//         // console.log(velDelta)
//     }
// }