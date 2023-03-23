let inData; // for incoming serial data
var torqueList = [];
var torDeltaList = [];
var torque=0;
var lastTorque=0;
var torDelta=0;
var startTwist = false;
var veloInputOrNot=false;

// if ('serial' in navigator) {
//     const notSupported = document.getElementById('notSupported');
//     notSupported.classList.add('hidden');
// }

// const log = document.getElementById("log")


// function send() {
//     const toSend = document.getElementById("input").value
//     writeToStream(toSend)
//     document.getElementById("input").value = ""

// }

function handle(e) {
    if (e.keyCode === 13) {
        e.preventDefault();
        send();
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
    writer.write(line + '\r');
    writer.releaseLock();
}

async function readLoop() {
    console.log('Readloop');

    while (true) {
        const { value, done } = await reader.read();
        // console.log('value', value);

        torDelta = Math.abs(value-lastTorque);
        lastTorque=value;
        console.log('torDelta', torDelta);
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