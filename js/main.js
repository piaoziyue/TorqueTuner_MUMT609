import { play } from "./render.js"
import { addNote } from "./js/pianoRollClass"

// Get midi file from user
document.querySelector("#play-file").addEventListener("click", async function () {
    // Starts the Tone AudioContext, which must be done as the result of direct user input
    await Tone.start();

    // User has not selected a file
    if (document.querySelector("#file").value == "") {
        alert("No file selected. Please press the \"Choose File\" button and choose a file that has a .mid or .midi extension.");
        return;
    }

    // Reads the binary data in the file given by the user and passes it to out main play function
    // let file = document.querySelector("#file").files[0];
    let reader = new FileReader();
    // reader.onload = function (e) {
    //     play(e.target.result);
    // };
    // reader.onerror = function (e) {
    //     console.log("Error : " + e.type);
    // };
    // reader.readAsArrayBuffer(file);
});