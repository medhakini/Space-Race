// Name any p5.js functions we use in the global so Glitch can recognize them.
/* global createCanvas, random, background, fill, color, rect, ellipse, square, image, keyIsDown, round, textAlign, LEFT, soundFormats, loadSound,
stroke, noStroke, noFill, ml5, createCapture, VIDEO, strokeWeight, colorMode,  width, height, text, HSB, textSize, loadImage, tint, noTint, io, textFont
line, mouseX, mouseY, mouseIsPressed, collideRectCircle, windowWidth, windowHeight, keyCode, abs, collideCircleCircle, createInput, createButton
keyIsPressed, UP_ARROW, RIGHT_ARROW, LEFT_ARROW, DOWN_ARROW, imageMode, CENTER, CORNER, translate, rotate, angleMode, DEGREES key translate scale pop push*/

let asteroids = [];
let stars = [];
let mode = 0;
let speed;
let socket;
let mlImage, arrowsImg;

let backgroundMusic, starCollect;

let video;
let flippedVideo;
let label = "initializing...";
let classifier;
let videoStarted = false;

let isStarted = 0;
let startButton;

// let Endgame = false;
let endgame = false;
let cColor = [];
let confetti = [];

let rocket1, rocket2, rocketImage;
let starImage;

let asteroidImages = [];
let numPlayers = 1;

let room = "";
let room_input;
let submit_button;

let player_rocket = "rocket_2";

function preload() {
  soundFormats('ogg');
  backgroundMusic = loadSound('https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fmusic%20-%20chiptune.ogg?v=1596217509197');
  starCollect = loadSound('https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fsound%20-%20coin%20collect.ogg?v=1596218136003');
  classifier = ml5.imageClassifier('https://teachablemachine.withgoogle.com/models/7TEWqokk9/model.json');
}

function setUpVideo() {
  //holds video image in flippedVideo variable
  video = createCapture(VIDEO);
  video.size(240, 140);
  video.hide();
  flippedVideo = ml5.flipImage(video);
  //classify 
  classifyVideo();
  videoStarted = true;
}


function setup() {
  createCanvas(1400, 700);
  colorMode(HSB, 360, 100, 100);
  textFont("Luckiest Guy");
  
  // initalize socket
  socket = io.connect("https://spacerace-cssifinalproject.glitch.me/");
  socket.on("arrowKey", updateRocket2);
  socket.on("letter", updateRocket1);
  socket.on("asteroids", updateAsteroidPos);
  socket.on("stars", updateStarsPos);
  socket.on("ready to play", player2Joined);
  socket.on("send data", sendAsteroidData);
  socket.on("player left room", other_player_left);
  socket.on("room is already full", joinRoomError);
  socket.on("scores", updateRocketScore);
  
  // setup rockets
  speed = 3;
  rocketImage = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Frocket.png?v=1595025002320");
  starImage = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2F25-258596_white-star-clip-art-at-clker-star-clipart.png?v=1595891807558")
  rocket1 = new Rocket(width/4, height-80);
  rocket2 = new Rocket(width*3/4, height-80); 

  mlImage = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2FIMG_0907.PNG?v=1596163715839");
  arrowsImg = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Farrows.png?v=1596164192754");
  
  // create asteroids
  loadAsteroidImages();
  let numAsteroids = 40;  // 50 - medium,
  for (let i = 0; i < numAsteroids; i++) {
    asteroids.push(new Asteroid());
  }
  
  // create stars
  for (let i = 0; i < 3; i++) {
    stars.push(new Star("left"));
    stars.push(new Star("right"));
  }
  
  // setup confetti!!
  cColor = [color('#00ff00'), color('#ff99cc'), color('#cc0099'), color('#3366ff')];
  for (let i = 0; i < 500; i++) {
    confetti[i] = new Confetti(random(0, width), random(-height, 0), random(-1, 1));
  }
}

function other_player_left() {
  numPlayers = 1;
  console.log("Your opponent left the game.");
}

//update rocket 2 pos on remote
function updateRocket2(data) {
  if (data.room == room) {
    rocket2.x = data.x;
    rocket2.y = data.y;
    rocket2.angle = data.angle;
    //console.log(data);
  }
  //console.log("update rocket with data: " + data.x + ", " + data.y);
  //image(rocketImage, data.x, data.y, 40, 75);
}

function arrowPressed() {
  if (keyIsPressed) {
    if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
      var data = {
	      x: rocket2.x,
	      y: rocket2.y,
        angle: rocket2.angle,
        room: room
      }
      //console.log(data);
			socket.emit("arrowKey", data);
    }
  }
}

// update rocket 1 pos on remote
function updateRocket1(data2) {
  rocket1.x = data2.x;
  rocket1.y = data2.y;
  rocket1.angle = data2.angle;
  //console.log(data2);
  //console.log("update rocket with data: " + data2.x + ", " + data2.y);
  //image(rocketImage, data.x, data.y, 40, 75);
}

function letterPressed() {
  //send position over as json object
  if (keyIsPressed) {
      var data2 = {
	      x: rocket1.x,
	      y: rocket1.y,
        angle: rocket1.angle,
        room: room
      }
      //console.log(data2);
			socket.emit("letter", data2);
    }
  }

function sendAsteroidData() {
  player_rocket = "rocket_1";
  let asteroids_data = {};
  asteroids_data["room"] = room;
  for (let i = 0; i < asteroids.length; i++) {
    //asteroids[i].xVelocity = 0;
    asteroids_data[i] = {
      x: asteroids[i].x,
      y: asteroids[i].y,
      size: asteroids[i].size,
      speed: asteroids[i].xVelocity,
      //speed: 0,
      angle: asteroids[i].angle,
      color: asteroids[i].color,
    }
  }
  //console.log(asteroids_data);
  socket.emit("asteroids", asteroids_data);
  sendStarsData();
}

function updateAsteroidPos(asteroids_data) {
  //sending asteroid data
  if (asteroids_data["room"] == room) {
    for (let i = 0; i < asteroids.length; i++) {
      asteroids[i].x = asteroids_data[i].x;
      asteroids[i].y = asteroids_data[i].y;
      asteroids[i].size = asteroids_data[i].size;
      asteroids[i].xVelocity = asteroids_data[i].speed;
      asteroids[i].angle = asteroids_data[i].angle;
      asteroids[i].color = asteroids_data[i].color;
      asteroids[i].image = getAsteroidImage(asteroids[i].color);
    }
    console.log("received asteroid data");
  }
}

function sendStarsData() {
  //sending star position and size
  let stars_data = {};
  stars_data["room"] = room;
  for (let i = 0; i < stars.length; i++) {
    //asteroids[i].xVelocity = 0;
    stars_data[i] = {
      x: stars[i].x,
      y: stars[i].y,
      size: stars[i].size
    }
  }
  //console.log(stars_data);
  socket.emit("stars", stars_data);
}

function updateStarsPos(stars_data) {
  if (stars_data["room"] == room) {
    for (let i = 0; i < stars.length; i++) {
      stars[i].x = stars_data[i].x;
      stars[i].y = stars_data[i].y;
      stars[i].size = stars_data[i].size;
    }
    console.log("received star data");
  }
}

// update rocket 1 pos on remote
function sendRocketScore() {
  let rocket_data = {
    room: room,
    name: player_rocket
  }
  if (player_rocket == "rocket_1") {
    rocket_data["score"] = rocket1.score;
  } else if (player_rocket == "rocket_2") {
    rocket_data["score"] = rocket2.score;
  }
  console.log("send rocket score of " + rocket_data.score);
  socket.emit("scores", rocket_data);
}

function updateRocketScore(rocket_data) {
  if (rocket_data["room"] == room) {
    if (rocket_data["name"] == "rocket_1") {
      rocket1.score = rocket_data.score;
    } else if (rocket_data["name"] == "rocket_2") {
      rocket2.score = rocket_data.score;
    }
  }
  console.log("update rocket score to " + rocket_data.score);
}

function draw() {
  background(0);
  if (isStarted === 0) {
    startPage();
  // } else if (endgame) {
  //   endgamePage();
  } else if (isStarted === 1) {
    multiplayer_mode();
  } else if (isStarted === 2) {
    singleplayer_mode();
  } else if (isStarted === 3) {
    endPage();
  } else if (isStarted === 4) {
    tyPage();
  } else if (isStarted === 5) {
    endPageSingle();
  } else if (isStarted === 6) {
    roomPage();
  } else if (isStarted === 7) {
    loadingPage();
  } else if (isStarted === 8) {
    singleplayer_ml();
  } else if (isStarted === 9) {
    startSingleChoice();
  }
}

function multiplayer_mode() {
  drawCenterLine();
  arrowPressed();
  letterPressed();
 
  // displays stars
  for (let i = 0; i < stars.length; i++) {
    stars[i].display();
  }
  
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].float();
    asteroids[i].display();
  }
  
  // displays rockets
  rocket1.show();
  rocket2.show();
  
  // keeps rockets on screen and on their side of the screen
  rocket1.checkIfHitAxis();
  rocket2.checkIfHitAxis();
  hitCenter();
  
  // star1.show();
  
  // checks for collisions between asteroids and either rocket
  checkCollision();
  
  // detects keyboard clicks to move rockets (wasd for rocket #1 and arrow keys for rocket #2)
  moveRockets();
  
  showWinMulti();
  
  // displays player's scores
  textAlign(LEFT);
  textSize(48);
  fill(0, 0, 100);
  text(rocket1.score, width/4-50, height-30);
  text(rocket2.score, width*3/4-50, height-30);
  
  // displays instructions and other game information
  textSize(15);
  text(`Speed: ${mode} \n\nDouble click to \nincrease difficulty. \n\nPress space to \ndecrease difficulty.`, 30, 30);
  //text("Avoid the space debris and \nmake it to the top to score a point! \n\nFirst to 5 points wins.", width-250, 30);
  text("(use arrow keys)", 30, height-30);
  text("(use arrow keys)", width-160, height-30);
}

function singleplayer_mode() {
  arrowPressed();
  for (let i = 0; i < stars.length; i++) {
    stars[i].display();
  }
  
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].float();
    asteroids[i].display();
  }
  
  // displays rockets
  rocket2.show();
  
  // keeps rockets on screen and on their side of the screen
  rocket2.checkIfHitAxis();
  
  // star1.show();
  
  // checks for collisions between asteroids and either rocket
  checkCollision();
  
  // detects keyboard clicks to move rockets (wasd for rocket #1 and arrow keys for rocket #2)
  moveRockets();
  
  showWinSingle();
  
  // displays player's scores
  textAlign(LEFT);
  textSize(48);
  fill(0, 0, 100);
  text(rocket2.score, width/2-50, height-30);
  
  // displays instructions and other game information
  textSize(15);
  text(`Mode: ${mode} \n\nDouble click to \nincrease difficulty. \n\nPress space to \ndecrease difficulty.`, 30, 30);
  // text("Avoid the space debris and \nmake it to the top / collect stars \nto score a point! \n\nFirst to 5 points wins.", width-260, 30);

  //text("Avoid the space debris and \nmake it to the top to score a point! \n\nFirst to 5 points wins.", width-250, 30);
  text("(use arrow keys)", 30, height-30);
}

function singleplayer_ml() {
  if (!videoStarted) {
    setUpVideo();
  } else if (videoStarted) {
  text(label, 1250, 200);
  image(flippedVideo, 1150, 15);
  console.log("show vid");
    
  singleMoveRocket();

  for (let i = 0; i < stars.length; i++) {
    stars[i].display();
  }
  
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].float();
    asteroids[i].display();
  }
  
  // displays rockets
  rocket2.show();
  
  // keeps rockets on screen and on their side of the screen
  rocket2.checkIfHitAxis();
  
  // star1.show();
  
  // checks for collisions between asteroids and either rocket
  checkCollision();
  
  // detects keyboard clicks to move rockets (wasd for rocket #1 and arrow keys for rocket #2)
  
  showWinSingle();
  
  // displays player's scores
  textAlign(LEFT);
  textSize(48);
  fill(0, 0, 100);
  text(rocket2.score, width*3/4-50, height-30);
  
  // displays instructions and other game information
  textSize(15);
  text(`Mode: ${mode} \n\nDouble click to \nincrease difficulty. \n\nPress space to \ndecrease difficulty.`, 30, 30);
  // text("Avoid the space debris and \nmake it to the top / collect stars \nto score a point! \n\nFirst to 5 points wins.", width-260, 30);
  text("Use arrow keys to move.", 100, height-30);
  }
}

// displays start page for space race game
function startPage() {
  textAlign(CENTER);
  background(0);
  
   for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].float();
    asteroids[i].display();
  }
  
  noFill();
  stroke(0);
  textSize(40);
  //text('Welcome to...', width/2, height/2-230);
  textSize(110);
  fill(0, 80, 100);
  noStroke();
  text('Space Race!', width/2, height/2-160);
  
  fill(0);
  rect(width/2-125, height/2-95, 250, 30);
  rect(width/2-180, height/2+60, 360, 75);
  rect (width/2-240, height/2-50, 470, 90);

  
  // game instructions
  fill(230, 80, 80);
  noStroke();
  textSize(30);
  text('INSTRUCTIONS', width/2, height/2-70);
  
  textFont("Sarpanch");
  textSize(24);
  fill(200, 80, 70);
  text('Avoid the space debris and make it to\nthe top / collect stars to earn points. \nFirst to 5 points wins!', width/2, height/2-30); 

  fill(200, 80, 100);
  text('Press M to start multiplayer!', width/2, height/2+90); 
  fill(290, 60, 100);
  text('Press S to start single player!', width/2, height/2 + 125);

  textFont("Luckiest Guy");
  
  if (keyIsPressed) {
    if (keyIsDown(77)) {
      room_input = createInput("");
      submit_button = createButton('submit');
      isStarted = 6;
    } else if (keyIsDown(83)) {
      isStarted = 9;
      player_rocket = "rocket_2";
      rocket2.x0 = width/2;
      rocket2.x = width/2;
    }
  }
}

function startSingleChoice() {
  fill(200, 80, 100);
  noStroke();
  textSize(25);
  text('Press G to start gesture based!', width/2, height/2+30); 
  fill(290, 60, 100);
  image(mlImage, width/2-290, height/2 + 50, 600, 200);
  text('Press A to start arrow based!', width/2, height/2-230);
  //text('Press M to start multiplayer!', width/2-160, height/2); 
  image(arrowsImg, width/2 - 120, height/2 - 200, 225, 125);
  if (keyIsPressed) {
    if (keyIsDown(65)) {
      isStarted = 2; //arrow
    } else if (keyIsDown(71)) {
      isStarted = 8; //ml
    }
  }
}

function player2Joined(player_room) {
  console.log("Player Room: " + player_room);
  if (player_room == room) {
    numPlayers = 2;
  }
}

function roomPage() {
  textFont("Luckiest Guy");
  textAlign(CENTER);
  background(0);
  fill(0, 80, 100);
  textSize(70);
  text('Space Race!', width/2, height/2-230);
  textSize(50);
  fill(200, 80, 100);
  text('Join/Create Room', width/2, height/2-140);
  
  textFont("Sarpanch");
  textSize(30);
  fill(230, 80, 100);
  text('Input room name:', width/2, height/2-40);
  textFont("Luckiest Guy");
  room_input.position(width/2-room_input.width/2+10, height/2);

  submit_button.position(width/2-submit_button.width/2+10, height/2+50);
  submit_button.mousePressed(create_or_join_room);
}

function create_or_join_room() {
  console.log(room_input.value());
  room = room_input.value();
  socket.emit("joinedRoom", room);
  
  room_input.remove();
  submit_button.remove();
  
  isStarted = 7;
}

function joinRoomError() {
  isStarted = 6;
}

function loadingPage() {
  textAlign(CENTER);
  background(0);
  fill(0, 80, 100);
  textSize(70);
  text('Space Race!', width/2, height/2-230);
  textSize(50);
  fill(200, 80, 100);
  text('Waiting for Player 2...', width/2, height/2-130);
  
  textFont("Sarpanch");
  fill(230, 80, 80);
  textSize(30);
  text(`Room Name: ${room}`, width/2, height/2-40);
  
  textFont("Luckiest Guy");
  
  if (numPlayers == 2) {
    isStarted = 1;
  }
}

function endPage() {
  background(0);
  textAlign(CENTER);
  fill(0, 80, 80);
  textSize(80);
  textFont("Luckiest Guy");
  text('GAME OVER!', width/2, height/2-100);
  fill(200, 80, 100);
  textSize(50);
  // text('Press R to restart', width/2, height/2);  
  if (rocket1.score > rocket2.score) {
    text("PLAYER 1 WINS!", width/2, height/2);
  } else if (rocket2.score > rocket1.score) {
    text("PLAYER 2 WINS!", width/2, height/2);
  } 
  textSize(30);
  fill(240, 80, 100);
  text("Play again? Y/N", width/2, height/2 + 100);
  if (keyIsPressed) {
    if (keyIsDown(89)) {
      // resets rocket positions and scores
      rocket1.reset();
      rocket2.reset();
      rocket1.score = 0;
      rocket2.score = 0;
      numPlayers = 1;
      isStarted = 0;
			socket.emit("new game");
    } else if (keyIsDown(78)) {
      isStarted = 4;
    }
    textAlign(CORNER);
  }
  for (let i = 0; i < confetti.length / 2; i++) {
    confetti[i].display();
    if (confetti[i].y > height) {
      confetti[i] = new Confetti(random(0, width), random(-height, 0), random(-1, 1));
    }
  }
}

function endPageSingle() {
  background(0);
  textAlign(CENTER);
  fill(0, 80, 80);
  textSize(80);
  textFont("Luckiest Guy");
  text('GAME OVER!', width/2, height/2-100);
  fill(200, 80, 100);
  textSize(50);
  // text('Press R to restart', width/2, height/2);  
  
  text("You won!", width/2, height/2);

  textSize(40);
  fill(240, 80, 100);
  // textFont("Sarpanch");
  text("Play again? Y/N", width/2, height/2 + 100);
  if (keyIsPressed) {
    if (keyIsDown(89)) {
      // resets rocket positions and scores
      rocket1.reset();
      rocket2.reset();
      rocket1.score = 0;
      rocket2.score = 0;
      isStarted = 0;
    } else if (keyIsDown(78)) {
      isStarted = 4;
    }
    textAlign(CORNER);
  }
  for (let i = 0; i < confetti.length / 2; i++) {
    confetti[i].display();
    if (confetti[i].y > height) {
      confetti[i] = new Confetti(random(0, width), random(-height, 0), random(-1, 1));
    }
  }
}

function tyPage() {
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].float();
    asteroids[i].display();
  }
  fill(351, 35, 100);
  textSize(50);
  text("Thank you for playing!", width/2, height/2);
}

// when mouse is double clicked, it increases difficulty
function doubleClicked() {
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].xVelocity *= 1.5;
  }
  mode++;
}

// when space bar is pressed, it decreases difficulty
function keyPressed() {
  if (keyCode === 32) {
    for (let i = 0; i < asteroids.length; i++) {
      asteroids[i].xVelocity *= 0.75;
    }
    mode--;
  }
}

// when a player reaches a score of 5, then they win and this displays a message on the screen and stops all asteroids from moving
function showWinMulti() {
  fill(100);
  textSize(60);
  if (rocket1.score >= 3|| rocket2.score >= 3) {
    // endgame = true;
    isStarted = 3;
  }  
  textFont("Luckiest Guy");
  noFill();
}

function showWinSingle() {
  fill(100);
  textSize(60);
  if (rocket1.score == 3|| rocket2.score == 3) {
    // endgame = true;
    isStarted = 5;
  }  
  textFont("Luckiest Guy");
  noFill();
}

function resetGamePage() {
  for (let i = 0; i < asteroids.length; i++) {
    asteroids[i].xVelocity = random(0.5, 2) * random([-1, 1]);
  }
}

function singleMoveRocket() {
  if (label === 'up') {
      rocket2.y -= speed;  // up
  } else if (label === 'down') {
      rocket2.y += speed;  // down
  } else if (label === 'right') {
      rocket2.x += speed;  // right
  } else if (label === 'left') {
      rocket2.x -= speed;  // left
  }
}

// checks if either rocket has collided with any of the asteroids, if so, then it resets that rocket's position to the bottom of the screen
function checkCollision() {
  let hit_rocket1 = false;
  let hit_rocket2 = false;
  for (let i = 0; i < asteroids.length; i++) {
    hit_rocket1 = collideRectCircle(rocket1.x, rocket1.y, rocket1.w, rocket1.h, asteroids[i].x, asteroids[i].y, asteroids[i].size);
    hit_rocket2 = collideRectCircle(rocket2.x, rocket2.y, rocket2.w, rocket2.h, asteroids[i].x, asteroids[i].y, asteroids[i].size);
    if (hit_rocket1) {
      rocket1.reset();
    } 
    if (hit_rocket2) {
      rocket2.reset();
    }
  }
  let i = 0;
  while (i < stars.length) {
    let star_hit = false;
    if (collideRectCircle(rocket1.x, rocket1.y, rocket1.w, rocket1.h, stars[i].x, stars[i].y, stars[i].size+3)) {
      star_hit = true;
      rocket1.score += 1;
      stars.splice(i, 1);
      starCollect.play();
    } else if (collideRectCircle(rocket2.x, rocket2.y, rocket2.w, rocket2.h, stars[i].x, stars[i].y, stars[i].size+3)) {
      star_hit = true;
      rocket2.score += 1;
      stars.splice(i, 1);
      starCollect.play();
    }
    if (!star_hit) {
      i += 1;
    }
  }
}



// Rocket Class - used to create player's rockets and keep track of player's scores
class Rocket {
  
  constructor(xPos, yPos) {
    // starting x and y positions for rocket
    this.x0 = xPos;
    this.y0 = yPos;
    this.x = this.x0;
    this.y = this.y0;
    this.w = 40;
    this.h = 75;
    this.score = 0;
    this.angle = 0;
  }
  
  show() {
    angleMode(DEGREES);
    imageMode(CENTER);
    translate(this.x + this.w/2, this.y + this.h/2);
    rotate(this.angle);
    image(rocketImage, 0, 0, this.w, this.h);
    rotate(-this.angle);
    translate(-(this.x + this.w/2), -(this.y + this.h/2));
    imageMode(CORNER);
  }
  
  reset() {
    this.y = this.y0;
    this.x = this.x0;
    this.angle = 0;
  }
  
  checkIfHitAxis() {
    if (this.y <= 0) {
      this.score += 1;
      sendRocketScore();
      this.reset();
    } else if (this.y > height) {
      this.y = this.y0;
    } else if (this.x < 0) {
      this.x = 0;
    } else if (this.x > width - this.w) {
      this.x = width - this.w;
    } 
  }
}

// depending on which keys are being pressed it moves the rockets around the screen
function moveRockets() {
  if (keyIsPressed) {
    
    if (player_rocket == "rocket_1") {
      if (keyIsDown(38)) {
        rocket1.y -= speed;  // up
      } else if (keyIsDown(40)) {
        rocket1.y += speed;  // down
      } 

      if (keyIsDown(37)) {
        rocket1.x -= speed;  // left
        tiltRocket(rocket1, -1);
      } else if (keyIsDown(39)) {
        rocket1.x += speed;  // right
        tiltRocket(rocket1, 1);
      } else {
        tiltRocket(rocket1, 0);
      }
    } else {
      if (keyIsDown(38)) {
        rocket2.y -= speed;  // up
      } else if (keyIsDown(40)) {
        rocket2.y += speed;  // down
      } 

      if (keyIsDown(37)) {
        rocket2.x -= speed;  // left
        tiltRocket(rocket2, -1);
      } else if (keyIsDown(39)) {
        rocket2.x += speed;  // right
        tiltRocket(rocket2, 1);
      } else {
        tiltRocket(rocket2, 0);
      }
    }
    
    
    // Rocket #1 Movement (aka left rocket)
//     if (keyIsDown(87)) {
//       rocket1.y -= speed;  // up
//     } else if (keyIsDown(83)) {
//       rocket1.y += speed;  // down
//     } 
  
//     if (keyIsDown(65)) {
//       rocket1.x -= speed;  // left
//       tiltRocket(rocket1, -1);
//     } else if (keyIsDown(68)) {
//       rocket1.x += speed;  // right
//       tiltRocket(rocket1, 1);
//     } else {
//       tiltRocket(rocket1, 0);
//     }
    
//     // Rocket #2 Movement (aka right rocket)
//     if (keyIsDown(38)) {
//       rocket2.y -= speed;  // up
//     } else if (keyIsDown(40)) {
//       rocket2.y += speed;  // down
//     } 
    
//     if (keyIsDown(37)) {
//       rocket2.x -= speed;  // left
//       tiltRocket(rocket2, -1);
//     } else if (keyIsDown(39)) {
//       rocket2.x += speed;  // right
//       tiltRocket(rocket2, 1);
//     } else {
//       tiltRocket(rocket2, 0);
//     }
  } 
}

function tiltRocket(rocket, dir) {
  if (dir == 1 && rocket.angle < 30) {
    // tilt rocket right
    rocket.angle += 5;
  } else if (dir == -1 && rocket.angle > -30) {
    // tile rocket left
    rocket.angle -= 5;
  } else if (dir == 0) {
    if (rocket.angle < 0) {
      rocket.angle += 3;
    } else if (rocket.angle > 0) {
      rocket.angle -= 3;
    }
  }
}

// draws the dividing line between rocket #1's area and rocket #2's area
function drawCenterLine() {
  stroke(0, 0, 20);
  strokeWeight(1);
  line(width/2, 0, width/2, height);
  noStroke();
}

// keeps rockets on their side of the screen
function hitCenter() {
  if (rocket1.x + rocket1.w > width/2) {
      rocket1.x = width/2 - rocket1.w;
  } else if (rocket2.x < width/2) {
      rocket2.x = width/2;
  }
}

// Asteroid Class - used to create asteroids that players have to avoid to make it to the top and earn points
class Asteroid {
  
  constructor() {
    // random size
    this.size = random(12, 34); 
    // random x, y in the asteroid field
    this.x = random(width-this.size);  
    this.y = random(height-this.size-100);
    // random angle for asteroid image
    this.angle = round(random(360));
    // picks a random x velocity
    this.xVelocity = random(0.5, 2) * random([-1, 1]);
    // chooses a random asteroid image
    this.color = random(["blue", "green", "orange", "pink", "purple", "teal", "red", "gray"]);
    this.image = getAsteroidImage(this.color);
  }

  float() {
    // makes asteroids float around
    this.x += this.xVelocity;
    // and if they hit a wall it reverses their direction
    if (this.x + this.size > width || this.x < 0) {
      this.xVelocity *= -1;
    }
  }

  display() {
    // displays the rocket at an angle, so they don't all look the same
    angleMode(DEGREES);
    imageMode(CENTER);
    translate(this.x + this.size/2, this.y + this.size/2);
    rotate(this.angle);
    image(this.image, 0, 0, this.size, this.size);
    rotate(-this.angle);
    translate(-(this.x + this.size/2), -(this.y + this.size/2));
    imageMode(CORNER);
  }
  
}

function getAsteroidImage(color) {
  if (color == "green") {
    return asteroidImages[0];
  } else if (color == "blue") {
    return asteroidImages[1];
  } else if (color == "orange") {
    return asteroidImages[2];
  } else if (color == "pink") {
    return asteroidImages[3];
  } else if (color == "purple") {
    return asteroidImages[4];
  } else if (color == "teal") {
    return asteroidImages[5];
  } else if (color == "red") {
    return asteroidImages[6];
  } else if (color == "gray") {
    return asteroidImages[7];
  }
}

// loads in 8 asteroid images of varying colors
function loadAsteroidImages() {
  // green asteroid
  asteroidImages[0] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-green.png?v=1595890977665");
  // blue asteroid
  asteroidImages[1] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fthumbnails%2Fasteroid-blue.png?1595890977146");
  // orange asteroid
  asteroidImages[2] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-orange.png?v=1595890977967");
  // pink asteroid
  asteroidImages[3] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-pink.png?v=1595890978238");
  // purple asteroid
  asteroidImages[4] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-purple.png?v=1595890979376");
  // teal asteroid
  asteroidImages[5] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-teal.png?v=1595890980275");
  // red asteroid
  asteroidImages[6] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-red.png?v=1595890980318");
  // gray asteroid
  asteroidImages[7] = loadImage("https://cdn.glitch.com/b0fd9356-3a28-4dfb-9fc8-7f1df34e8cfb%2Fasteroid-gray.png?v=1595891245478");
}

// used to rotate asteroid images, so they don't all look the same
function rotateImage(img, x, y, w, h, angle) {
  angleMode(DEGREES);
  imageMode(CENTER);
  translate(x + w/2, y + h/2);
  rotate(angle);
  image(img, 0, 0, w, h);
  rotate(-angle);
  translate(-(x + w/2), -(y + h/2));
  imageMode(CORNER);
}

// Star Class - used to create stars that player's can collect to earn points
class Star {
  
  constructor(side_of_screen) {
    if (side_of_screen == "left") {
      this.x = random((width/2) - 30);
    } else {
      this.x = random(width/2 + 30, width);
    }
    this.y = random(height-150);
    this.size = 25;
  }
  
  display() {
    // left star
    image(starImage, this.x, this.y, this.size, this.size);
  }
  
}

// Confetti Class - used on end game screen
class Confetti {
  
  constructor(xpos, ypos, speed) {
    this.x = xpos;
    this.y = ypos;
    this.speed = speed;
    this.time = random(0, 100);
    this.color = random(cColor);
    this.size = random(width/20, height/20);
  }

  display() {
    fill(this.color);
    // blendMode(SCREEN);
    noStroke();
    push();
    translate(this.x, this.y);
    rotate(this.time);
    scale(0.2, 0.2);
    rect(0, 0, this.size, this.size / 4);
    pop();

    this.time = this.time + 0.1;

    this.speed += 0.09;

    this.y += this.speed;
  }
  
}

function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove();

  }

  // When we get a result
  function gotResult(error, results) {
    // If there is an error
    if (error) {
      console.error(error);
      return;
    }
    // The results are in an array ordered by confidence.
    // console.log(results[0]);
    label = results[0].label;
    // Classifiy again!
    classifyVideo();
  }




