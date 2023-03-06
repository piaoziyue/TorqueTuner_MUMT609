// import { Midi } from "/lib/ToneMidi.js";

// Holds information for a point in terms of time and note (which is converted to coordinates later)
class Point {
    constructor(note, time, isStart = false, isEnd = false) {
        this.note = note;
        this.time = time;
        this.isStart = isStart;
        this.isEnd = isEnd;
    }
}

// Holds all of the points for a track (starts and ends of lines are determined by fields in Point)
class Line {
    constructor() {
        this.points = [];
        this.length = 0;
        // drawStart and drawEnd are used in play.js to keep track of what is currently on screen to draw only that
        this.drawStart = 0;
        this.drawEnd = 0;
        this.hue = Math.round(Math.random() * 360);
        this.hsl = `hsl(${this.hue}, 100%, 50%)`;
    }

    addPoint(point) {
        this.points.push(point);
        this.length = this.points.length;
        this.drawEnd = this.length - 1;
    }

    hsla(alpha) {
        return `hsla(${this.hue}, 100%, 50%, ${alpha})`;
    }
}

// Holds all of the information needed to draw and play a midi file
export class MidiData {
    constructor(midiBin, offset) {
        this.midi = new Midi(midiBin);
        this.cleanMidi = new Midi();
        this.cleanMidi.addTrack();
        this.duration = this.midi.duration;
        this.lines = [];
        let minNote = -1;
        let maxNote = -1;

        let scope = this;

        // Iterates through each track
        for (let track of scope.midi.tracks) {
            if (track.channel == 9 || track.channel == 10 || track.notes.length == 0)
                // Track is likely percussion, which is not displayed at this time, or contains no notes
                continue;

            let lineIndex = scope.lines.push(new Line()) - 1;

            // Iterates through each note in the track
            for (let note of track.notes) {
                let trackIndex = 0;
                // Offset time of note so that there is a delay before we start playing
                note.time += offset;

                // Gets the most recent note of this track
                function getPrevNote() {
                    let notes = scope.cleanMidi.tracks[trackIndex].notes;
                    if (notes.length == 0)
                        return null;

                    return notes[notes.length - 1];
                }

                // Finds (or creates) the first track in which the new note can be placed without overlapping a previous
                // note or being adjacent to the same note
                let prevNote = getPrevNote();
                while (trackIndex < scope.cleanMidi.tracks.length && prevNote != null
                    && (note.time <= prevNote.time + prevNote.duration
                        || note.time - (prevNote.time + prevNote.duration) < 0.1
                        && note.midi == prevNote.midi)) {
                    trackIndex++;
                    if (trackIndex == scope.cleanMidi.tracks.length) {
                        scope.cleanMidi.addTrack();
                    }
                    prevNote = getPrevNote();
                }

                // Adds note to our new "clean" midi
                scope.cleanMidi.tracks[trackIndex].notes.push(note);

                // Update overall min and max notes
                if (minNote == -1 || note.midi < minNote)
                    minNote = note.midi;
                if (maxNote == -1 || note.midi > maxNote)
                    maxNote = note.midi;

                let newLineIndex = -1;

                // Gets the most recent point of this line
                function getPrevPoint(index = lineIndex + newLineIndex) {
                    if (index >= scope.lines.length)
                        return null;

                    let points = scope.lines[index].points;
                    if (points.length == 0)
                        return null;

                    return points[points.length - 1];
                }

                // Finds (or creates) the first line that belongs to this track in which new points can be added without overlapping a previous point
                let prevPoint;
                let noteDiff = -1;
                for (let [i, line] of scope.lines.slice(lineIndex).entries()) {
                    prevPoint = getPrevPoint(lineIndex + i);
                    if (prevPoint == null) {
                        newLineIndex = i;
                        break;
                    }
                    if (note.time >= prevPoint.time && (noteDiff == -1 || Math.abs(note.midi - prevPoint.note) < noteDiff)) {
                        noteDiff = Math.abs(note.midi - prevPoint.note);
                        newLineIndex = i;
                    }
                }
                // Creates a new line with the same color to add the point to
                if (newLineIndex == -1) {
                    let newLine = new Line();
                    let oldLine = scope.lines[lineIndex];
                    newLine.hue = oldLine.hue;
                    newLine.hsl = oldLine.hsl;
                    newLineIndex = scope.lines.length - lineIndex;
                    scope.lines.push(newLine);
                }
                prevPoint = getPrevPoint();

                let line = scope.lines[lineIndex + newLineIndex];

                // Connect this note with last if they are separated by less than 0.25 seconds and not in a chord (sorta)
                let isStart = true;
                if (prevPoint != null && note.time - prevPoint.time < 0.25 && prevPoint.note != note.midi) {
                    line.points[line.points.length - 1].isEnd = false;
                    isStart = false;
                }

                // Add points for the beginning and end of the note
                line.addPoint(new Point(note.midi, note.time, isStart, false));
                line.addPoint(new Point(note.midi, note.time + note.duration, false, true));
            };
        };

        scope.minNote = minNote;
        scope.maxNote = maxNote;
    }
}

