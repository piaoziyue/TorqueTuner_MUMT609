
"use strict";

// const { Tone } = require("tone/build/esm/core/Tone");

var pitchOfNote;
let getBPM = () =>  Tone.Transport.bpm.value;
var newPitchMidi;
var playingFlagX;
var notes;
var pitchSignal = new Tone.Signal(0);
var pitchRange = 7;

function pianoRollToToneEvents(pianoRoll){
    notes = pianoRoll.notes;
    let bpm = getBPM();
    let toneEvents = Object.values(notes).map(noteInfo => {
        let note = noteInfo.info;
        return {
            time: note.position,
            pitch: noteInfo.label.text(), 
            dur: note.duration,
        }
    });
    toneEvents.sort((a, b) => a.time-b.time);
    toneEvents = toneEvents.filter(e => e.time+e.dur > pianoRoll.cursorPosition);
    toneEvents.forEach(e => {
        if(e.time < pianoRoll.cursorPosition) {
            e.dur = e.dur - (pianoRoll.cursorPosition-e.time);
            e.time = 0;
        } else {
            e.time -= pianoRoll.cursorPosition;
        }
    });
    toneEvents = toneEvents.map((note, i) => {
        return {
            time: note.time * 60 / bpm,
            pitch: note.pitch, 
            dur: note.dur  * 60 / bpm,
            info: {
                numNotes: toneEvents.length,
                ind: i
            }
        }
    });
    return toneEvents;
}


//TODO: maybe move part and playing-flag variables to inside toneclass?
let playCursorLoop;
let pianoRollIsPlaying = false; //is the cursor is moving which means the piece is playing and the pianoRollIsPlaying is "true"
let playingPart;
var durThisNote;
var durLoop;
var sumVeloDel = 0;
var numVeloDel = 0;
var noteVelo;
var prePitch;
var preDur;
var shifter = new Tone.PitchShift().toDestination();;
var playingNote = null;
var angleData;
var pitchscale = 0;
var torqueData;
var dataX_ang = [];
var dataY_ang = [];
var dataY_score = [];
var noteIndex = 0;
var playingFlagBeat;

var angleDelta;
var midiChanges;

function dataUpdate(dataX, dataY, label) {
    if (label =="angle"){
        let angleDelta = angle-zeroAngle;
        if (angleDelta>1800) angleDelta = 3600-angleDelta;
        else if (angleDelta<-1800) angleDelta = -3600-angleDelta;

        angleData = mapValue(angleDelta, -1800, 1800, 0, 60);
        torqueData = mapValue(torque, -80, 100, 0, 100);

        dataY.push(angleData); // push data (0-100
        dataY_score.push(playingNote);
        dataX.push(playingFlagX-50); //here 44 is the x axis position adjustment.
        
    }else if(label =="torque"){
        
        dataY.push(torqueData); // push data (0-100
        dataX.push(playingFlagX-50); //here 44 is the x axis position adjustment.
    }
    
    return dataX, dataY;
}


function playPianoRoll(pianoRoll){
    let toneEvents = pianoRollToToneEvents(pianoRoll);

    let playTime = toneEvents.slice(-1)[0].time + toneEvents.slice(-1)[0].dur;
    let playStartPos = pianoRoll.cursorPosition * pianoRoll.quarterNoteWidth;
    let playScreenDist = playTime * getBPM() / 60 * pianoRoll.quarterNoteWidth;
    let bpm = getBPM();
    var preInd = 0;
    
    
    pianoRoll.playCursorElement.opacity(1);
    dataX_ang = [];
    dataY_ang = [];
    

    playCursorLoop = animitter(function(deltaTime, elapsedTime, frameCount){
        if(elapsedTime/1000 >= playTime){
            noteVelo=sumVeloDel/numVeloDel/20;
            pianoRoll.playCursorElement.opacity(0);
            this.complete();
        }
        let playFrac = elapsedTime/1000/playTime;
        pianoRoll.playCursorElement.x(playStartPos + playFrac*playScreenDist);
        playingFlagX = playStartPos + playFrac*playScreenDist
        
        
        dataX_ang, dataY_ang = dataUpdate(dataX_ang, dataY_ang, "angle")
        plotData(dataX_ang, dataY_ang, 0, "blue");
        
        // if(playingNote)console.log("value", playingNote.info.ind, playStartPos + playFrac*playScreenDist) //pianoRoll.noteCount); //playingNote.pitch)
        
    }).start();


    function mapValue(value, oldMin, oldMax, newMin, newMax) {
        return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
      }

   

    playingPart = new Tone.Part((time, value) => {
        // console.log("pitch", pianoRoll.notes[noteIndex].info.pitch)
        let keysArray = Object.keys(pianoRoll.notes);
        let noteNum = keysArray.length;
        // console.log("modethis", thisMode[0] == 'l');
        if (noteNum>noteIndex)
            noteIndex += 1;
        changeOnce = 0;
        
        durThisNote = Math.round(value.dur*2)/2;
        pitchOfNote = value.pitch;
        
        angleDelta = angle - zeroAngle;
        if (angleDelta > 1800) angleDelta = 3600 - angleDelta;
        else if (angleDelta < -1800) angleDelta = -3600 - angleDelta;

        midiChanges = mapValue(angleDelta, -1800, 1800, -pitchRange, pitchRange);
        pitchSignal.linearRampTo(midiChanges, 0.1);
        shifter.pitch = midiChanges;
        
        // Use the adjusted pitch for triggering the note
        let adjustedPitch = new Tone.Frequency(value.pitch).transpose(midiChanges).toNote();
        sampler.triggerAttackRelease(adjustedPitch, durThisNote, time, 0.5);

        preInd = value.info.ind;

        if (value.info.numNotes == value.info.ind + 1) {
            pianoRollIsPlaying = false;
            preInd = -1;
        }
         
    }, toneEvents)
    .start();
    pianoRollIsPlaying = true;
     
    // NProgress.start();
    
    var changeOnce = 0;
    const loop = new Tone.Loop((time) => {
        angleDelta = angle - zeroAngle;
        if (angleDelta > 1800) angleDelta = 3600 - angleDelta;
        else if (angleDelta < -1800) angleDelta = -3600 - angleDelta;

        midiChanges = mapValue(angleDelta, -1800, 1800, -pitchRange, pitchRange);

        pitchSignal.linearRampTo(midiChanges, 0.1);
        shifter.pitch = pitchSignal.value;

        playingFlagBeat = (playingFlagX + 50) / 64;

        let keysArray = Object.keys(pianoRoll.notes);
        let noteNum = keysArray.length;

        if (noteNum > noteIndex) {
        } else {
            noteIndex = 0;
        }
        
        // console.log("change", noteIndex, noteNum)
        
    }, 0.05).start(0);
    playingNote = null;
    
}
function pitchStringToMidiPitch(pitch){ 
    let midi = (parseInt(pitch.slice(-1))+2)*12 + pianoRoll.pitchStrings.indexOf(pitch.slice(0, -1));
    return parseInt(midi)
}

function midiPitchToPitchString(pitch){ 
    let pitchString = pianoRoll.pitchStrings[pitch%12] + (Math.floor(pitch/12)-2);
    return pitchString
}

function stopPianoRoll(pianoRoll){
    if(playingPart){
        playCursorLoop.complete()
        pianoRoll.playCursorElement.opacity(0);
        pianoRollIsPlaying = false;
        noteIndex = 0;
        playingPart.stop();
        playingPart.dispose();
    }
}

let pianoRoll;
// let synth = new Tone.PluckSynth().toDestination();

StartAudioContext(Tone.context, 'body', () => {
    Tone.Transport.start();
});

var startNoteTime;
// var samples = SampleLibrary.load({
//     instruments: ['guzheng'], //, 'guitar-acoustic', 'guitar-electric','guitar-nylon', 'violin'],
//     baseUrl: "samples/"
// })
// var current = samples['guzheng'];
const sampler = new Tone.Sampler({
    ext: '.mp3', // use setExt to change the extensions on all files // do not change this variable //
    urls: {
        'A1': 'A1.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'C1': 'C1.mp3',
        'C2': 'C2.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'D1': 'D1.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'E1': 'E1.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'G1': 'G1.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        // 'G4': 'G4.mp3',
    },

    // Cela règle la durée de permanence des notes jouées
    // release: 10,
    baseUrl: "samples/guzheng/"
}).toDestination();
sampler.connect(shifter);


SVG.on(document, 'DOMContentLoaded', function() {
    let currentlyPlayingNotes = [];

    let playHandler = function(pitch_, duration_='16n', velocity_=1){
        let pitch = pitch_;
        let duration = duration_;
        let velocity = velocity_;

        //if duration is "on" then just do noteOn, if its "off" just do note off
        // let pitchString = typeof pitch === 'string' ? pitch : this.midiPitchToPitchString(pitch);
        // startNoteTime = Tone.now();
        // Stop any previously playing notes
        currentlyPlayingNotes.forEach(note => sampler.triggerRelease(note));

        // Clear the array
        currentlyPlayingNotes = [];

        // Trigger the new note
        let pitchString = typeof pitch === 'string' ? pitch : this.midiPitchToPitchString(pitch);
        startNoteTime = Tone.now();

        // sampler.triggerAttackRelease(pitchString, duration, startNoteTime, velocity);

        // Keep track of the currently playing note
        currentlyPlayingNotes.push(pitchString);
    }


    let onOffHanlder = function(pitch, onOff){
        let pitchString = typeof pitch === 'string' ? pitch : this.midiPitchToPitchString(pitch);
    }
    pianoRoll = new PianoRoll("drawing", playHandler, onOffHanlder);
});


