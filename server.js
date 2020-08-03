//Space Race Server
const express = require("express");
const app = express();
const server = app.listen(process.env.PORT || 3000);
const io = require("socket.io")(server);

// Make sure our scripts and styles can be seen.
app.use(express.static("public"));

// The "webapp" portion just delivers the main page.
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// The real work is done with the web sockets. When a
// client connects, we set things up to respond to its 
// "mouse" events by broadcasting its position to every 
// other client.
let rooms = {};
let users = {};
io.on("connection", socket => {
  
  socket.on("joinedRoom", room => {
    users[socket.id] = room;
    if (rooms[room] == 2) {
      // room is full
      socket.emit("room is already full");
    } else if (rooms[room] == 1) {
      // if room only has 1 player in it, it lets a second player join the room
      rooms[room] = 2;
      io.emit("ready to play", room);
      // the 2nd player to join the room sends the asteroid and star data
      socket.emit("send data");
    } else {
      // craetes new room
      rooms[room] = 1;
    }
  });
  
  socket.on("arrowKey", data => {
    // adds room name to data to send, so player's can only pay attention to data from their room
    data.room = users[socket.id];
    socket.broadcast.emit("arrowKey", data);
  });
  socket.on("letter", data2 => {
    // adds room name to data to send, so player's can only pay attention to data from their room
    data2.room = users[socket.id];
    socket.broadcast.emit("letter", data2);
  });
  socket.on("asteroids", data3 => {
    // adds room name to data to send, so player's can only pay attention to data from their room
    data3.room = users[socket.id];
    socket.broadcast.emit("asteroids", data3);
  });
  socket.on("stars", data4 => {
    // adds room name to data to send, so player's can only pay attention to data from their room
    data4.room = users[socket.id];
    socket.broadcast.emit("stars", data4);
  });
  socket.on("scores", data5 => {
    // adds room name to data to send, so player's can only pay attention to data from their room
    data5.room = users[socket.id];
    socket.broadcast.emit("scores", data5);
  });
  
  socket.on('new game', function() {
    // when user disconnects, it removes them from the room and notifies other player that they left
    let room_user_left = users[socket.id];
    rooms[room_user_left] -= 1;
    if (rooms[room_user_left] == 0) {
      // if room is empty, it deletes the room from the room array
      delete rooms[room_user_left];
    }
    socket.broadcast.emit("player left room");
  });
  socket.on('disconnect', function() {
    // when user disconnects, it removes them from the room and notifies other player that they left
    let room_user_left = users[socket.id];
    rooms[room_user_left] -= 1;
    if (rooms[room_user_left] == 0) {
      // if room is empty, it deletes the room from the room array
      delete rooms[room_user_left];
    }
    socket.broadcast.emit("player left room");
  });
});
