/*
    By Javier Andrés Solís Flores
*/
console.log("client.js executing");
const socket = io();
let roomUniqueID = null;

let playerID = -1;
let playersData = [];
let deck = [];
let currentHand = []
let currentDeckCard = []
let errorCooldown = 1200;
let roundCooldown = 1000;
let username = "";
let score = 0;
let isGameEnded = false;

//client wants to create a new game
function CreateGame(){

    let username = document.getElementById("fname").value;
    //host's ID
    playerID = 0;
    deck = GenerateShuffledDeck();

    socket.emit('createGame', {username: username, deck: deck});

    EnterLobby();
}

//client wants to join a game
function JoinGame(){
    roomUniqueID = document.getElementById("input_roomUniqueID").value;
    username = document.getElementById("fname").value;
    socket.emit('joinGame', {roomUniqueID: roomUniqueID, username: username});
}

//I let the host start the game
function EnableGameStart(){
    if(playerID == 0){
        let startButton = document.getElementById("StartButton");
        if(startButton == null){
            startButton = document.createElement('button');
            startButton.id = "StartButton";
            startButton.style.display = 'block';
            startButton.classList.add("regular-button");
            startButton.innerText = "Start Game";
            startButton.addEventListener('click', () => {
                StartGame();
            })
            document.getElementById('waitingArea').appendChild(startButton);
        }
    } else {
        document.getElementById('gameplayZone').style.display = "block";
        document.getElementById('waitingArea').innerHTML = 'Waiting for host to start...';
    }
}

//game is set to start
function StartGame(){
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('winnerArea').innerHTML = '';
    socket.emit('startGame', {roomUniqueID: roomUniqueID});
}

//unlocks the starting button if a player enters
socket.on('playerConnected', (data) => {
    EnterLobby();
    EnableGameStart();
})

//generate deck for server
socket.on('getNewDeck', () => {
    deck = GenerateShuffledDeck();
    socket.emit('newDeckReady', {roomUniqueID: roomUniqueID, newDeck: deck});
})

//set ID
socket.on('setNewID', (data) => {
    if(playerID != 0) playerID = data.newID;
    username = data.username;
})

//show room's code
socket.on('newGame', (data) => {
    roomUniqueID = data.roomUniqueID;
    console.log('joined room ' + roomUniqueID + '!')
    document.getElementById('initialZone').style.display = 'none';
    document.getElementById('gameplayZone').style.display = 'block';
    document.getElementById('waitingArea').innerHTML = "Waiting for opponents. Share code '" + roomUniqueID + "' to join.";

    let copyButton = document.createElement('button');
    copyButton.style.display = 'block';
    copyButton.classList.add("regular-button");
    copyButton.innerText = "Copy Code";
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(roomUniqueID).then(function() {
            console.log('copied to clipboard successfully!!');
        }, function(err){
            console.error('could not copy text.');
        });
    })

    document.getElementById('waitingArea').appendChild(copyButton);
});

function PrepareRoundOne(){
    document.getElementById('leaderboardContainer').style.display = "none";
    document.getElementById('waitingArea').innerHTML = '';
    document.getElementById('winnerArea').innerHTML = '';
    document.getElementById("exit").style.display = "none";

    CreateLeaderboard();
    StartCountdown();
    PrepareFirstHand();
}

function StartRoundOne(){
    ShowGame();
    UpdateButtons();
}

function PrepareFirstHand(){
    for(let i = 0; i < playersData.length; i++){
        if(i == playerID) currentHand = deck.shift();
        else deck.shift();
    }
    currentDeckCard = deck.shift();
    UpdateSymbols(currentHand, false);
    UpdateSymbols(currentDeckCard, true);
}

//updates symbols' images
function UpdateSymbols(card, isFromDeck = true){
    let auxStr = isFromDeck ? "deck" : "card";
    for(let i = 0; i < 8; i++){
        let symbol = document.getElementById(auxStr + "-sym-" + i);
        symbol.style.backgroundImage = "url(" + TranslateIDToSymbolSrc(card[i]) + ")";
        symbol.children[0].value = card[i];
    }
}

//updates buttons' images
function UpdateButtons(){
    for(let i = 0; i < 8; i++){
        let symbol = currentDeckCard[i];
        let button = document.getElementById("btn-" + i);
        button.value = symbol;
        button.children[0].src = TranslateIDToSymbolSrc(symbol);
    }
}

//checks if player chose the right answer. If not, cooldown punishment
function CheckIfChoiceWasCorrect(id){

    if(currentHand.includes(parseInt(document.getElementById(id).value))){
        //win round
        OnCorrectButton();
    } else {
        OnWrongButton();
    }
}

//tells the server someone won the round
function OnCorrectButton(){
    socket.emit('onCorrectButton', {playerID: playerID, roomUniqueID: roomUniqueID});
}

function OnWrongButton(){
    DisableButtons(true);
    setTimeout(DisableButtons, errorCooldown);
}

//if someone else than me scored
function OnRoundLost(evaluatedPlayerID){
    UpdateScoreBoard(evaluatedPlayerID);
    DisableButtons(true);
    DisableCards(true);
    setTimeout(ShowRoundLost, roundCooldown);
}

function ShowRoundWon(){
    currentHand = currentDeckCard;
    UpdateSymbols(currentHand, false);
    ShowRoundAux();
}

function ShowRoundLost(){
    ShowRoundAux();
}

function ShowRoundAux(){
    if(deck.length <= 0){
        EndGame();
    }
    else{
        currentDeckCard = deck.shift();
        DisableCards(false);
        DisableButtons(false);
        UpdateSymbols(currentDeckCard);
        UpdateButtons();
    }
}

function EndGame(){
    document.getElementById('dobble-elements').style.display = "none";
    document.getElementById('playAgain').style.display = 'block';
    document.getElementById('exit').style.display = 'block';
}

function DisableButtons(action = false){
    for(let i = 0; i < 8; i++){
        let button = document.getElementById("btn-" + i);
        button.disabled = action;
        let opacity = 1;
        if(action) opacity = 0.5;
        button.style.opacity = opacity;
    }
}

function DisableCards(action = false){
    let opacity = action ? 0.5 : 1;
    document.getElementById("d-deck-card").style.opacity = opacity;
    document.getElementById("d-player-card").style.opacity = opacity;
}

function OnRoundWon(){
    UpdateScoreBoard(playerID);
    DisableButtons(true);
    DisableCards(true);
    setTimeout(ShowRoundWon, roundCooldown);
}

//adds 1 point to whoever scored and updates ranking
function UpdateScoreBoard(evaluatedPlayerID){
    let currentScore = document.getElementById("player-" + evaluatedPlayerID + "-score");
    currentScore.value = (parseInt(currentScore.value) + 1)
    document.getElementById("td-score-" + evaluatedPlayerID).innerText = currentScore.value;
    SortTable();
}

//once server says the game starts
socket.on('showGame', (data) => {
    playersData = data.playersData
    deck = data.deck
    PrepareRoundOne();
})

//assign player ID
socket.on('assignPlayerID', (newID) => {
    playerID = newID;
})

//if one player leaves, the room is closed
socket.on('deleteRoom', () => {
    location.reload();
})

//when I score a point
socket.on('onRoundWon', () => {
    OnRoundWon();
})
//when other player scores a point
socket.on('onRoundLost', (data) => {
    OnRoundLost(data.playerID);
})

function EnterLobby(){
    console.log('entering lobby');
    document.getElementById('initialZone').style.display = 'none';
    document.getElementById('winnerArea').innerHTML = "";
}

function ShowGame(){
    console.log("entering game...")
    document.getElementById('dobble-elements').style.display = "block";
    document.getElementById('leaderboardContainer').style.display = "block";
    DisableButtons(false);
    DisableCards(false);
    document.getElementById('gameplayZone').style.display = 'block';
    document.getElementById('gameArea').style.display = 'flex';
}

function PlayAgain(){

    document.getElementById("winnerArea").innerHTML = "Waiting for opponents' response...";
    document.getElementById("playAgain").style.display = "none";

    socket.emit('playAgain', {
        roomUniqueID: roomUniqueID
    });

}

function Exit(){
    console.log("exiting...")
    location.reload();
}