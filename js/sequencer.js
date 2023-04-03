// import { addNote } from "/lib/pianoRollClass.js";
var midiUpload = new Dropzone('#midi-upload', {url:'/', autoProcessQueue:false});
var midiClear = document.querySelector("#midi-clear");

var song = {};

var keys = $('.keys');
var allNotes = [];
var allEvents = [];
var pxPerMillis = 0;
var millisPerTick = 0;
var endTime = 0;
var numNotes = 0;
var velocity =0.5;

for(var pitch=108; pitch>=21; pitch--) { // A0 to C8
  var note = noteFromMidiPitch(pitch);
  var keyClass = note.indexOf('#')>-1 ? 'key sharp':'key';
  var keyHtml = '<div class="'+keyClass+'">'+note+'</div>';
  keys.append('<li pitch='+pitch+'>'+keyHtml+'<div class="notes"></div></li>');
}
// keys.scrollTop(keys.offset().top + (keys.height() / 2));

function noteFromMidiPitch(p) {
  var noteDict = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var octave = Math.floor((p-12)/12);
  var note = noteDict[p-octave*12-12];
  return note+octave;
}

function drawSong() {
  allEvents = [];
  allNotes = [];
  endTime = 0;
  var openNotes = [];
  song.tracks.forEach(function(track) {
    var time = 0;
    track.forEach(function(event) {
      time += parseInt(event.deltaTime*millisPerTick);
      if(event.subtype === 'noteOn') {
        var pitch = event.noteNumber;
        openNotes[pitch] = time;
      }
      else if(event.subtype === 'noteOff') {
        var pitch = event.noteNumber;
        var channel = event.channel;
        var startTime = openNotes[pitch];
        var deltaTime = event.deltaTime;
        var velocity = event.velocity;
        openNotes[pitch] = null;
        var newNote = {
          pitch: pitch,
          startTime: startTime,
          deltaTime: deltaTime,
          channel: channel,
          velocity: velocity
        };
        numNotes += 1;

        pianoRoll.addNote(pitch, startTime/millisPerTick/480, event.deltaTime/480, true);
        allNotes.push(newNote);

      }
      else if(event.subtype === 'setTempo') {
        // FIXME account for multiple changes in tempo throughout song
        millisPerTick = event.microsecondsPerBeat/(1000*song.header.ticksPerBeat);
      }
      allEvents.push({
        subtype:event.subtype,
        pitch:event.noteNumber,
        channel:event.channel,
        velocity:event.velocity,
        time:time
      });
    });
    if(endTime<time) endTime = time;
  });

  pxPerMillis = 10000/endTime;
  $('.keys li .notes').html('');
  allNotes.forEach(function(note) {
    var notePos = ~~(pxPerMillis*note.startTime);
    var noteWidth = ~~(pxPerMillis*note.deltaTime);
    var noteStyle = 'left:'+notePos+'px; width:'+noteWidth+'px;';
    var noteHtml = '<div class="note" style="'+noteStyle+'"></div>';
    $('.keys li[pitch="'+note.pitch+'"] .notes').append(noteHtml);
  });

  

  allEvents = allEvents.sort(function(a, b) {
    if(a.time === b.time) {
      if(a.subtype === 'noteOff') {
        return -1;
      }
      else {
        return 1;
      }
    }
    return a.time-b.time;
  });
}

function playSong() {
  var time = 0;
  var currentTransform = 0;
  MIDI.loadPlugin({
    soundfontUrl: "./soundfont/",
    instrument: 0,
    callback: function() {
      $('.notes').css('transform', 'translate(-10000px)');
      $('.notes').css('transition', 'linear all ' + endTime + 'ms');
      nextEvent(0, 0, Date.now());
    }
  });

  function nextEvent(i, prevTime, startTime) {
    var event = allEvents[i];
    var time = event.time;
    var dt = Date.now()-startTime;
    if(dt > time) {
      time -= dt-time; // adjust for time delay
    }
    setTimeout(function() {
      if(event.subtype === 'noteOn') {
        $('.keys li[pitch="'+event.pitch+'"] .key').addClass('active');
        MIDI.noteOn(event.channel, event.pitch, event.velocity, 0);
      }
      else if(event.subtype === 'noteOff') {
        $('.keys li[pitch="'+event.pitch+'"] .key').removeClass('active');
        MIDI.noteOff(event.channel, event.pitch, 0);
      }
      if(i<allEvents.length-1)
        nextEvent(i+1, event.time, startTime);
    }, time-prevTime);
  }
}


Blob = (function() {
  var nativeBlob = Blob;

  // Add unprefixed slice() method.
  if (Blob.prototype.webkitSlice) {
    Blob.prototype.slice = Blob.prototype.webkitSlice;
  }
  else if (Blob.prototype.mozSlice) {
    Blob.prototype.slice = Blob.prototype.mozSlice;
  }

  // Temporarily replace Blob() constructor with one that checks support.
  return function(parts, properties) {
    try {
      // Restore native Blob() constructor, so this check is only evaluated once.
      Blob = nativeBlob;
      return new Blob(parts || [], properties || {});
    }
    catch (e) {
      // If construction fails provide one that uses BlobBuilder.
      Blob = function (parts, properties) {
        var bb = new (WebKitBlobBuilder || MozBlobBuilder), i;
        for (i in parts) {
          bb.append(parts[i]);
        }
        return bb.getBlob(properties && properties.type ? properties.type : undefined);
      };
    }
  };
}());

midiUpload.on('addedfile', function(file) {
  pianoRoll.clearAllNotes();
  uploadMidiFile(file);
});

midiClear.addEventListener("click", event=> {
  pianoRoll.clearAllNotes();
})

function uploadMidiFile(file) {
  if (file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var buffer = e.target.result;
      song = midiConverter.midiToJson(buffer);
      drawSong(song);
      updateDownloadLink();
      document.getElementById("midi-info").innerHTML = file.name;
      
    };
    reader.readAsBinaryString(file);
  }
}

function updateDownloadLink() {
  var midi = midiConverter.jsonToMidi(song);
  var blob = new Blob([stringToArrayBuffer(midi)], {type:'audio/midi'});
  if(window.webkitURL) window.URL = window.webkitURL;
  var url = window.URL.createObjectURL(blob);
  $('#midi-download').attr('href', url);
}

function stringToArrayBuffer(string) {
  return stringToUint8Array(string).buffer;
}
function stringToBinary(string) {
  var chars, code, i, isUCS2, len, _i;

  len = string.length;
  chars = [];
  isUCS2 = false;
  for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      code = String.prototype.charCodeAt.call(string, i);
      if (code > 255) {
          isUCS2 = true;
          chars = null;
          break;
      } else {
          chars.push(code);
      }
  }
  if (isUCS2 === true) {
      return unescape(encodeURIComponent(string));
  } else {
      return String.fromCharCode.apply(null, Array.prototype.slice.apply(chars));
  }
}
function stringToUint8Array(string) {
  var binary, binLen, buffer, chars, i, _i;
  binary = stringToBinary(string);
  binLen = binary.length;
  buffer = new ArrayBuffer(binLen);
  chars  = new Uint8Array(buffer);
  for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
      chars[i] = String.prototype.charCodeAt.call(binary, i);
  }
  return chars;
}

