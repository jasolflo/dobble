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
    
    console.log('a user just connected! ' + socket.id);
    
    socket.on('disconnecting', () => {
        console.log('user disconnected :( ' + socket.id);
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
        console.log("creando el juego...");
        rooms[roomUniqueID] = {};
        rooms[roomUniqueID].lastID = 0;
        rooms[roomUniqueID].playersData = [data.username];
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
            room.lastID += 1;
            room.playersData.push(data.username);
            socket.to(data.roomUniqueID).emit('playerConnected', {lastID: room.lastID});
            socket.emit('playerConnected', {lastID: room.lastID});
        } else {
            console.log("room already full");
        }
    });
    
    //host decides to start game; server tells clients to start game
    socket.on('startGame', (data) => {
        socket.to(data.roomUniqueID).emit('showGame', {});
        socket.emit('showGame', {playersData: rooms[data.roomUniqueID].playersData});
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