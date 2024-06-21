/*
    By Javier Andrés Solís Flores
*/
console.log("client.js executing");

const socket = io();

//data
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
let waitingToStart = false;

/*
 * Emits <= Client hosts a new game
 *
 * Sends a new shuffled deck and the username to the server
 * Hides 
 */
function CreateGame(){
    //host's ID is 0
    playerID = 0;
    username = document.getElementById("fname").value;
    deck = GenerateShuffledDeck();
    EnterLobby();
    socket.emit('createGame', {username: username, deck: deck});
}

/*
 * Emits <= Client attempts to join a game
 *
 * Sends the given room code + username
 */
function JoinGame(){
    roomUniqueID = document.getElementById("input_roomUniqueID").value;
    username = document.getElementById("fname").value;
    
    socket.emit('joinGame', {roomUniqueID: roomUniqueID, username: username});
}

/*
 * Enables host to start the game
 *
 * Once at least there are two players in the room, if the player is the host then
 * the "start" button will appear. if it is not the host, the "waiting lobby" will appear
 */
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
        document.getElementById('waitingArea').innerHTML = "Waiting for host to start...";
    }
}

/*
 * Emits <= Host clicks the "Start" button
 *
 * Hides the host's waiting area and asks the server to start the game
 */
function StartGame(){
    document.getElementById('waitingArea').style.display = 'none';
    document.getElementById('winnerArea').innerHTML = '';
    socket.emit('startGame', {roomUniqueID: roomUniqueID});
}

/*
 * Receives => a new player has joined the room
 *
 * Actions when a new player joins the room (unless it had already been loaded)
 */
socket.on('playerConnected', (data) => {
    //if has already entered lobby
    if(waitingToStart) return;
    waitingToStart = true;

    //host had already entered the lobby
    if(playerID != 0) EnterLobby();
    EnableGameStart();
})

/*
 * Receives => petition to get a new deck
 * Emits <= new deck
 *
 * Generate new deck for a new game
 */
socket.on('getNewDeck', () => {
    deck = GenerateShuffledDeck();
    socket.emit('newDeckReady', {roomUniqueID: roomUniqueID, newDeck: deck});
})

/*
 * Receives => new ID
 *
 * Updates ID if player is not the host
 */
socket.on('setNewID', (data) => {
    if(playerID != 0) playerID = data.newID;
    username = data.username;
})

/*
 * Receives => verification that a new room has been created with this player as host
 *
 * Action when a room is created
 */
socket.on('newGame', (data) => {
    roomUniqueID = data.roomUniqueID;
    console.log('joined room ' + roomUniqueID + '!')
    CreateHostLobby()
});

/*
 * Creates the host's lobby
 *
 * "Waiting for players" + start button
 */
function CreateHostLobby(){
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
}

/*
 * Prepares the first round
 *
 * Loads data and UI elements + countdown
 */
function PrepareRoundOne(){
    document.getElementById('leaderboardContainer').style.display = "none";
    document.getElementById('waitingArea').innerHTML = '';
    document.getElementById('winnerArea').innerHTML = '';
    document.getElementById("exit").style.display = "none";

    CreateLeaderboard();
    StartCountdown();
    PrepareFirstHand();
}

/*
 * Loads game once countdown finishes
 */
function StartRoundOne(){
    ShowGame();
    UpdateButtons();
}

/*
 * Prepares first hand
 *
 * Removes a card from deck for every player and keeps one for itslef
 * Updates symbols for self card and deck's top card
 */
function PrepareFirstHand(){
    for(let i = 0; i < playersData.length; i++){
        if(i == playerID) currentHand = deck.shift();
        else deck.shift();
    }
    currentDeckCard = deck.shift();
    UpdateSymbols(currentHand, false);
    UpdateSymbols(currentDeckCard, true);
}

/*
 * Updates symbols on UI card
 *
 * Changes each image container's url
 * Works for both players and deck
 */
function UpdateSymbols(card, isFromDeck = true){
    let auxStr = isFromDeck ? "deck" : "card";
    for(let i = 0; i < 8; i++){
        let symbol = document.getElementById(auxStr + "-sym-" + i);
        symbol.style.backgroundImage = "url(" + TranslateIDToSymbolSrc(card[i]) + ")";
        symbol.children[0].value = card[i];
    }
}

/*
 * Updates symbols on UI buttons
 *
 * Changes each image container's url
 */
function UpdateButtons(){
    for(let i = 0; i < 8; i++){
        let symbol = currentDeckCard[i];
        let button = document.getElementById("btn-" + i);
        button.value = symbol;
        button.children[0].src = TranslateIDToSymbolSrc(symbol);
    }
}

/*
 * Check if player chose the right answer
 *
 * Right answer: wins round
 * Wrong answer: cooldown punishment
 */
function CheckIfChoiceWasCorrect(id){
    //if chosen symbol's id exists in player's hand
    if(currentHand.includes(parseInt(document.getElementById(id).value))){
        //win round
        OnCorrectButton();
    } else {
        OnWrongButton();
    }
}

/*
 * Emit <= player got the right answer
 *
 * Sends player ID and room's ID
 */
function OnCorrectButton(){
    socket.emit('onCorrectButton', {playerID: playerID, roomUniqueID: roomUniqueID});
}

/*
 * When player chooses a wrong option
 *
 * Disable all buttons until cooldown ends or someone wins the round
 */
function OnWrongButton(){
    DisableButtons(true);
    setTimeout(DisableButtons, errorCooldown);
}

/*
 * When a different player scores
 *
 * Changes each image container's url
 * Works for both players and deck
 */
function OnRoundLost(evaluatedPlayerID){
    UpdateScoreBoard(evaluatedPlayerID);
    DisableButtons(true);
    DisableCards(true);
    setTimeout(ShowRoundLost, roundCooldown);
}

/*
 * Shows UI when player wins a round (TODO)
 *
 * Updates card's data and starts new round
 */
function ShowRoundWon(){
    currentHand = currentDeckCard;
    UpdateSymbols(currentHand, false);
    ShowRoundAux();
}

/*
 * Shows UI when player loses a round (TODO)
 *
 * Starts new round
 */
function ShowRoundLost(){
    NextRound();
}

/*
 * Starts new round or ends game if there are no more cards in deck
 *
 * Updates UI's and buttons
 */
function NextRound(){
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

/*
 * Shows UI when game ends
 *
 * Hides game zone and loads buttons to play again / exit
 */
function EndGame(){
    document.getElementById('dobble-elements').style.display = "none";
    document.getElementById('playAgain').style.display = 'block';
    document.getElementById('exit').style.display = 'block';
}

/*
 * Disable card buttons
 *
 * Changes appearance and disables clicking actions
 */
function DisableButtons(action = false){
    for(let i = 0; i < 8; i++){
        let button = document.getElementById("btn-" + i);
        button.disabled = action;
        let opacity = 1;
        if(action) opacity = 0.5;
        button.style.opacity = opacity;
    }
}

/*
 * Disable UI cards drom deck + player's hand
 *
 * Changes the opacity
 */
function DisableCards(action = false){
    let opacity = action ? 0.5 : 1;
    document.getElementById("d-deck-card").style.opacity = opacity;
    document.getElementById("d-player-card").style.opacity = opacity;
}

/*
 * Actions when player scores a point
 *
 * Updates scoreboard, UI elements
 */
function OnRoundWon(){
    UpdateScoreBoard(playerID);
    DisableButtons(true);
    DisableCards(true);
    setTimeout(ShowRoundWon, roundCooldown);
}

/*
 * Adds 1 point to the player that just scored
 *
 * Updates scoreboard
 */
function UpdateScoreBoard(evaluatedPlayerID){
    let currentScore = document.getElementById("player-" + evaluatedPlayerID + "-score");
    currentScore.value = (parseInt(currentScore.value) + 1)
    document.getElementById("td-score-" + evaluatedPlayerID).innerText = currentScore.value;
    SortTable();
}

/*
 * Receives => Confirmation that the game starts
 *
 * Receives data (username, ids) from all players
 * Prepares game (first round)
 */
socket.on('showGame', (data) => {
    playersData = data.playersData
    deck = data.deck
    PrepareRoundOne();
})

/*
 * Receive => new player ID
 */
socket.on('assignPlayerID', (newID) => {
    playerID = newID;
})

/*
 * Receives => a player left the room => delete room
 *
 * Reloads page for all players, thus deleting the room
 */
//if one player leaves, the room is closed
socket.on('deleteRoom', () => {
    location.reload();
})

/*
 * Receives => player scored a point
 */
socket.on('onRoundWon', () => {
    OnRoundWon();
})

/*
 * Receives => a different player scored a point
 */
socket.on('onRoundLost', (data) => {
    OnRoundLost(data.playerID);
})

/*
 * Loads lobby UI
 *
 * Unloads initial zone, including buttons, and
 * loads new zone with default message in case server has a slow response
 */
function EnterLobby(){
    console.log('entering lobby');
    document.getElementById('initialZone').style.display = 'none';
    document.getElementById('gameplayZone').style.display = 'block';
    document.getElementById('waitingArea').innerHTML = "Waiting for server's response...";
}

function ShowGame(){
    console.log("entering game...")
    document.getElementById('dobble-elements').style.display = "block";
    document.getElementById('leaderboardContainer').style.display = "block";
    DisableButtons(false);
    DisableCards(false);
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