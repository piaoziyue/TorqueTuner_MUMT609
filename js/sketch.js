

function setup() {
    createCanvas(1500, 200);

}

function average(array) {
    return array.reduce((x,y) => x+y)/array.length
}
  
function draw() {
    var height = 200;
    var velocity_old = 0;
    let note;
    var xmove = 30;
    let ybase = height-80;
    let frameWidth = pianoRoll.quarterNoteWidth;
    var velocity_new;

    stroke(150);
    // if (mouseIsPressed === true) {
    // if (!startTwist) {
    //     for (let i =0; i<numNotes; i+=1){
    //         text("Velocity", 10, 150);
    //         note = allNotes[i];
    //         velocity_new = note.velocity;
    //         let duration = Math.floor(note.deltaTime/475);
    //         let startx = Math.floor(note.startTime/475);

    //         // console.log(startx*frameWidth+xmove, ybase-velocity_old/127*height, (startx+duration)*frameWidth+xmove, ybase-velocity_new/127*height);
    //         line(startx*frameWidth+xmove, ybase-velocity_old/127*height, (startx+duration)*frameWidth+xmove, ybase-velocity_new/127*height);
    //         ellipse(startx*frameWidth+xmove, ybase-velocity_old/127*height, 10, 10);

    //         velocity_old = velocity_new;
    //     }
    // }
    // else{clear();
    //     let window = 10;
    //     let gap = 5;
    //     for (let j=0; j<veloDeltaList.length-window; j+=gap){
    //         frameWidth = 3;
    //         // line(j*frameWidth+xmove, ybase-veloDeltaList[j]/400*height,
    //         // (j+gap)*frameWidth+xmove ,ybase-veloDeltaList[j+gap]/400*height);
    //         avej = average(veloDeltaList.slice(j, j+window));
    //         avej_gap = average(veloDeltaList.slice(j+gap, j+gap+window));

    //         if(veloDeltaList[j]==0 && veloDeltaList[j+gap]==0) {
    //             line(j*frameWidth+xmove, ybase-0, (j+gap)*frameWidth+xmove, ybase-0);
    //         }else if (veloDeltaList[j]==0 && veloDeltaList[j+gap]!=0){
    //             line(j*frameWidth+xmove, ybase-0, 
    //             (j+gap)*frameWidth+xmove, ybase-avej_gap/400*height);
    //         }else if (veloDeltaList[j]!=0 && veloDeltaList[j+gap]==0){
    //             line(j*frameWidth+xmove, ybase-avej/400*height, 
    //             (j+gap)*frameWidth+xmove, ybase-0);
    //         }else{
    //             line(j*frameWidth+xmove, ybase-avej/400*height, 
    //             (j+gap)*frameWidth+xmove, ybase-avej_gap/400*height);
    //         }
    //     }
    // }
    
    // clear();
    // noLoop();

    // if (mouseIsPressed === true) {
    //     line(mouseX, mouseY, pmouseX, pmouseY);
    // }
}

