
"use strict";

// const { Tone } = require("tone/build/esm/core/Tone");

var pitchOfNote;
let getBPM = () =>  Tone.Transport.bpm.value;

function pianoRollToToneEvents(pianoRoll){
    let notes = pianoRoll.notes;
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
let pianoRollIsPlaying = false;
let playingPart;
var durThisNote;
var durLoop;
var sumVeloDel = 0;
var numVeloDel = 0;
var noteVelo;
var prePitch;
var preDur;

function playPianoRoll(pianoRoll){
    let toneEvents = pianoRollToToneEvents(pianoRoll);

    let playTime = toneEvents.slice(-1)[0].time + toneEvents.slice(-1)[0].dur;
    let playStartPos = pianoRoll.cursorPosition * pianoRoll.quarterNoteWidth;
    let playScreenDist = playTime * getBPM() / 60 * pianoRoll.quarterNoteWidth;
    let bpm = getBPM();
    var preInd = 0;
    
    pianoRoll.playCursorElement.opacity(1);

    playCursorLoop = animitter(function(deltaTime, elapsedTime, frameCount){
        if(elapsedTime/1000 >= playTime){
            noteVelo=sumVeloDel/numVeloDel/20;
            console.log(noteVelo);

            pianoRoll.playCursorElement.opacity(0);
            this.complete();
            console.log("finished playing", elapsedTime/1000, playTime);
        }
        let playFrac = elapsedTime/1000/playTime;
        pianoRoll.playCursorElement.x(playStartPos + playFrac*playScreenDist);
    }).start();

    function mapValue(value, oldMin, oldMax, newMin, newMax) {
        return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
      }

    
    playingPart = new Tone.Part((time, value) => {
        durThisNote = Math.round(value.dur*2)/2;
        pitchOfNote = value.pitch;

        if (veloInputOrNot) pianoRoll.playHandler(value.pitch, value.dur, noteVelo); //and velocity once that's in the piano roll
        else pianoRoll.playHandler(value.pitch, value.dur, 0.5);

        preInd = value.info.ind;

        if(value.info.numNotes == value.info.ind+1) {
            pianoRollIsPlaying = false;
            preInd = -1;
        }
    }, toneEvents).start();
    pianoRollIsPlaying = true;
    
    
    const loop = new Tone.Loop((time) => {
        // console.log("begin loop", sumVeloDel, numVeloDel);
        // triggered every eighth note.

        let pitchMidi = pitchStringToMidiPitch(pitchOfNote);
        let midiChanges = mapValue(angle, 0, 3600, -6, 6);
        let newPitchMidi = midiChanges+pitchMidi; //Math.floor(midiChanges+pitchMidi);
        // let newPitch = midiPitchToPitchString(newPitchMidi);

        let newPitchTonefre = Tone.Frequency(newPitchMidi, "midi");

        // console.log("pitch change", pitchOfNote, midiChanges, pitchMidi, newPitchMidi);

        synth.setNote(newPitchTonefre);
        
    }, "16n").start();
    
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
        playingPart.stop();
        playingPart.dispose();
    }
}

let pianoRoll;
let synth = new Tone.Synth().toDestination();

StartAudioContext(Tone.context, 'body', () => {
    Tone.Transport.start();
});

var startNoteTime;
SVG.on(document, 'DOMContentLoaded', function() {
    let playHandler = function(pitch_, duration_='16n', velocity_=1){
        let pitch = pitch_;
        let duration = duration_;
        let velocity = velocity_;
        //if duration is "on" then just do noteOn, if its "off" just do note off
        let pitchString = typeof pitch === 'string' ? pitch : this.midiPitchToPitchString(pitch);
        startNoteTime = Tone.now();
        console.log("startNoteTime", startNoteTime, duration, startNoteTime)
        synth.triggerAttackRelease(pitchString, duration, startNoteTime, velocity);
        
    }


    let onOffHanlder = function(pitch, onOff){
        let pitchString = typeof pitch === 'string' ? pitch : this.midiPitchToPitchString(pitch);
        if(onOff == 'on'){
            synth.triggerAttack(pitchString);
        } else {
            synth.triggerRelease(pitchString);
        }
    }
    pianoRoll = new PianoRoll("drawing", playHandler, onOffHanlder);
});
/*
WORKING BUG LOG 
- X prefix means good workaround found, but the "common sense" approach still fails and idk why



*/

