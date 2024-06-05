console.log("client.js executing");
let a = GenerateShuffledDeck();
console.log(a);
//esto hace la conexión con el servidor
const socket = io();
let roomUniqueID = null;
//let amIPlayer1 = false;
let playerID = -1;
const playersData = [];
const deck = [];

//informa que el cliente quiere crear un juego nuevo
function CreateGame(){
    let username = document.getElementById("fname").value;
    //soy el host
    playerID = 0;
    deck = GenerateShuffledDeck();

    socket.emit('createGame', {username: username});

    EnterLobby();
}

//informa que el cliente quiere unirse a un juego, y pasa la ID de la sala a la que quiere entrar
function JoinGame(){
    roomUniqueID = document.getElementById("input_roomUniqueID").value;
    let username = document.getElementById("fname").value;
    socket.emit('joinGame', {roomUniqueID: roomUniqueID, username: username});
}

//permito que el host pueda empezar la partida
function EnableGameStart(){
    if(playerID == 0){
        console.log("veamos tu botoncito");

        let startButton = document.getElementById("StartButton");
        if(startButton == null){
            console.log("vamo' a crearlo");

            startButton = document.createElement('button');
            startButton.id = "StartButton";
            startButton.style.display = 'block';
            startButton.innerText = "Start Game";
            startButton.addEventListener('click', () => {
                StartGame();
            })
            document.getElementById('waitingArea').appendChild(startButton);
        }
    } else {
        console.log("no hagas eso pibe");
    }
}

//empieza la partida 
function StartGame(){
    socket.emit('startGame', {roomUniqueID: roomUniqueID});
}

//si soy el host y veo que alguien más se conectó, ya se desbloquea el el botón de empezar
socket.on('playerConnected', () => {
    EnterLobby();
    EnableGameStart();
})


//cuando el servidor ya ha creado una sala, mostrar al jugador el código que debe compartir
socket.on('newGame', (data) => {
    roomUniqueID = data.roomUniqueID;
    console.log('joined room ' + roomUniqueID + '!')
    document.getElementById('initialZone').style.display = 'none';
    document.getElementById('gameplayZone').style.display = 'block';
    document.getElementById('waitingArea').innerHTML = "Waiting for opponent. Share code '" + roomUniqueID + "' to join.";

    let copyButton = document.createElement('button');
    copyButton.style.display = 'block';
    copyButton.innerText = "Copy Code";
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(roomUniqueID).then(function() {
            console.log('Async: copied to clipboard successfully!!');
        }, function(err){
            console.error('Async: could not copy text.');
        });
    })

    document.getElementById('waitingArea').appendChild(copyButton);
});

function PrepareRoundOne(){
    ShowGame();
    UpdateScoreBoard();
}

function UpdateScoreBoard(){
    console.log('my ID is ' + playerID);
    console.log(playersData);
}

//cuando el server indica que empieza el juego
socket.on('showGame', (data) => {
    playersData = data.playersData
    PrepareRoundOne();
})

//assign player ID
socket.on('assignPlayerID', (newID) => {
    playerID = newID;
})

//si uno se sale de la partida se borra la sala
socket.on('deleteRoom', () => {
    console.log("alguien se fue, nos vamos también")
    location.reload();
})

//al obtener un ganador
socket.on('result', (data) => {
    //let winnerText = DecideWinner(data);

    document.getElementById('opponentButton').style.display = 'block';
    document.getElementById('winnerArea').innerHTML = winnerText;

    document.getElementById('playAgain').style.display = 'block'
    document.getElementById('exit').style.display = 'block'
})

//cuando se confirma una nueva partida
socket.on('confirmedPlayAgain', (data) => {
    ShowGame();
})

function EnterLobby(){
    console.log('entering lobby');
    document.getElementById('initialZone').style.display = 'none';
    document.getElementById('winnerArea').innerHTML = '';
}

function ShowGame(){
    console.log('vamos a entrar al juego');

    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('winnerArea').innerHTML = '';
    
    document.getElementById('gameplayZone').style.display = 'block';
    document.getElementById('gameArea').style.display = 'block';
}

function PlayAgain(){
    //quita botones creados para mostrar elecciones hechas
    document.getElementById("PlayerChoiceButton").remove();
    document.getElementById("opponentButton").remove();

    document.getElementById("winnerArea").innerHTML = "Waiting for opponent's response...";
    document.getElementById("player1Choice").style.display = "block";
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("playAgain").style.display = "none";

    socket.emit('playAgain', {
        roomUniqueID: roomUniqueID
    });

}

function Exit(){
    console.log("oka, salgamos de acá")
    location.reload();
}

function CreateOpponentChoiceButton(data){
    //para mostrar más tarde qué había elegido el rival.
    //OJO: tal cual está aquí, se puede hacer trampa inspeccionando el elemento y viendo qué eligió.
    let opponentButton = document.createElement('button');
    opponentButton.id = "opponentButton";
    opponentButton.style.display = 'none';
    opponentButton.innerText = data.choice;
    document.getElementById('player2Choice').appendChild(opponentButton);
}