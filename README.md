# Welcome to Space Race!
Multi-player web application created as our Google CSSI Final Project

## Game Play
Features: multiplayer, single player (gesture based and arrow based)

The multiplayer feature allows you to play Space Race across multiple computers, with each player seeing the other in real-time! The waiting room allows for 2 players per room, and the server can host multiple rooms. 

The single player feature allows for an arrow based version in which the rocket is controlled by arrow keys, and a gesture based, where the user can rely on gestures to control the rocket. 

Use the arrow keys to move, and get 5 points to win!

## Building Space Race
On the front-end,

- Edit `views/index.html` to change the content of the webpage and imported libraries
- `public/script.js` runs when webpage is loaded, contains all UI javascript

On the back-end,

- Application starts at `server.js`
- Add frameworks and packages in `package.json`

Features:

- Waiting room for multiplayer and public server created with websockets and node.js, hosted on Glitch
- Gesture based single player utilizes Google's Teachable Machine API

Play the game at https://spacerace-cssifinalproject.glitch.me/

## Made with [Glitch](https://glitch.com/) 
