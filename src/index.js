const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const rooms = []
const roomIdLength = 6;
const maxRoomSize = 10;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/healthcheck', (req, res) => {
    res.send('<h1>Hello World!!</h1>');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

io.on('connection', (socket) => {
    
    console.log('a user just connected!');
    
    socket.on('disconnecting', () => {
        console.log('user disconnected...');
        let allRooms = socket.rooms.values();
        let room = allRooms.next();
        room = allRooms.next();
        //if the disconnected user was connected to a room...
        if(room.value != undefined && room.value.length == roomIdLength){
            console.log("User disconnected - kicking all other players")
            socket.to(room.value).emit('deleteRoom', {});
        }
    });

    //al recibir el mensaje createGame (cuando el usuario quiere crear un juego nuevo)
    socket.on('createGame', (data) => {
        //crea una ID única de 6 caracteres para la room
        const roomUniqueID = generateID();
        console.log("creating game...");
        rooms[roomUniqueID] = {};
        let username = data.username;
        if(username == "") username = "Player 1";
        rooms[roomUniqueID].playersData = [username];
        rooms[roomUniqueID].deck = data.deck;
        rooms[roomUniqueID].playAgainCount = 0;
        
        //unirse a room y avisar de ello con la ID usada
        socket.join(roomUniqueID);
        socket.emit('newGame', {roomUniqueID: roomUniqueID});
    });
    //al recibir el mensaje joinGame (cuando el usuario quiere entrar a un juego)
    socket.on('joinGame', (data) => {

        let room = io.sockets.adapter.rooms.get(data.roomUniqueID);

        //compruebo si la sala a la que quiere entrar ya existe
        console.log('trying to join game ' + data.roomUniqueID + '...');
        if(room != undefined && room.size < maxRoomSize){
            console.log('joining game');
            socket.join(data.roomUniqueID);
            //update last ID
            room = rooms[data.roomUniqueID];
            let username = data.username;
            if(username == "") username = "Player " + (rooms[data.roomUniqueID].playersData.length + 1);
            room.playersData.push(username);
            socket.to(data.roomUniqueID).emit('playerConnected');
            socket.emit('playerConnected');
            socket.emit('setNewID', {username: username, newID: (rooms[data.roomUniqueID].playersData.length - 1)});
        } else {
            console.log("room already full");
        }
    });
    
    //host decides to start game; server tells clients to start game
    socket.on('startGame', (data) => {
        //no one else can enter once the game starts
        rooms[data.roomUniqueID].size = 100;
        socket.to(data.roomUniqueID).emit('showGame', {playersData: rooms[data.roomUniqueID].playersData, deck: rooms[data.roomUniqueID].deck});
        socket.emit('showGame', {playersData: rooms[data.roomUniqueID].playersData, deck: rooms[data.roomUniqueID].deck});
    });

    //all players must agree on starting new game
    socket.on('playAgain', (data) => {
        rooms[data.roomUniqueID].playAgainCount += 1;
        if(rooms[data.roomUniqueID].playAgainCount >= rooms[data.roomUniqueID].playersData.length){
            rooms[data.roomUniqueID].playAgainCount = 0;
            socket.emit('getNewDeck');
        }
    });
    //once new deck is generated, start new game
    socket.on('newDeckReady', (data) => {
        rooms[data.roomUniqueID].deck = data.newDeck;
        socket.to(data.roomUniqueID).emit('showGame', {playersData: rooms[data.roomUniqueID].playersData, deck: rooms[data.roomUniqueID].deck});
        socket.emit('showGame', {playersData: rooms[data.roomUniqueID].playersData, deck: rooms[data.roomUniqueID].deck});
    });

    //al recibir el mensaje createGame (cuando el usuario quiere crear un juego nuevo)
    socket.on('onCorrectButton', (data) => {
        socket.to(data.roomUniqueID).emit('onRoundLost', {playerID: data.playerID});
        socket.emit('onRoundWon');
    });

});

server.listen(3000, () => {
    console.log('listening on *: 3000');
});

//--------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------

function generateID() {
    let length = roomIdLength;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}