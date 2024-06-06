function DeckGenerator(){
    var N = 8;     // number of symbols on each card
    var nC = 0;    // progressive number of cards
    var sTot = []; // array of series (cards)

    // Generate series from #01 to #N
    for (i=0; i <= N-1; i++)  {
        var s = [];
        nC++;
        s.push(1-1);
        for (i2=1; i2 <= N-1; i2++) {
            s.push((N-1) + (N-1) * (i-1) + (i2+1) - 1);
        }
        sTot.push(s);
    }

    // Generate series from #N+1 to #N+(N-1)*(N-1)
    for (i= 1; i<= N-1; i++) {
        for (i2=1; i2 <= N-1; i2++) {
            var s = [];
            nC++;
            s.push(i);
            for (i3=1; i3<= N-1; i3++) {
                s.push((N+1) + (N-1) * (i3-1) + ( ((i-1) * (i3-1) + (i2-1)) ) % (N-1) - 1);
            }
            sTot.push(s);
        }
    }

    return sTot;
}

function ShuffleDeck(deck){
    
    let currentIndex = deck.length - 1;
    // While there remain elements to shuffle...
    while (currentIndex >= 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        // And swap it with the current element.
        [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
        currentIndex--;

    }
    return deck;
}

function ShuffleCards(deck){
    for(let i = 0; i < deck.length; i++){
        deck[i] = ShuffleDeck(deck[i]);
    }
    return deck;
}

function GenerateShuffledDeck(){
    let res = DeckGenerator();
    res = ShuffleDeck(res);
    res = ShuffleCards(res);
    return res;
}

function TranslateIDToSymbolSrc(symbolID){
    let extension = ".png";
    return "./assets/img/" + symbolID + extension;
}

function StartCountdown(){
    var counter = 3;
    
    var timer = setInterval( function() { 
        
        let container = document.getElementById("countdown");
        if(container != null) container.remove();
        
        let countdown = document.createElement("span");
        countdown.id = "countdown";
        countdown.innerHTML = "" + counter==0 ? 'Go!' : counter;
        document.getElementById('countdown-container').appendChild(countdown);
        setTimeout( () => {
            countdown.style.fontSize = '40vw'; 
            countdown.style.opacity = 1; 
        },20);
        counter--;
        if (counter < -1){
            clearInterval(timer);
            document.getElementById("countdown").remove();
            StartRoundOne();
        }
    }, 1000);
}

function CreateLeaderboard(){

    let table = document.getElementById("table-leaderboard");
    //clears last leaderboard if any
    while (table.firstChild) {
        table.removeChild(table.lastChild);
    }

    for(let i = 0; i < playersData.length; i++){
        let username = playersData[i];
        let tr = document.createElement("tr");
        tr.id = "tr-" + i;

        let tdPosition = document.createElement("td");
        tdPosition.innerText = (i+1);
        tdPosition.classList.add("number");

        let tdName = document.createElement("td");
        tdName.innerText = username
        tdPosition.classList.add("name");

        let tdScore = document.createElement("td");
        tdScore.innerText = 0;
        tdScore.id = "td-score-" + i;
        tdPosition.classList.add("points");
        
        let inputID = document.createElement("input");
        inputID.type = "hidden";
        inputID.value = i;
        inputID.id = "player-" + i + "-ID";
        let inputScore = document.createElement("input");
        inputScore.type = "hidden";
        inputScore.value = 0;
        inputScore.id = "player-" + i + "-score";
        
        tr.appendChild(tdPosition);
        tr.appendChild(tdName);
        tr.appendChild(tdScore);
        tr.appendChild(inputID);
        tr.appendChild(inputScore);

        table.appendChild(tr);
    }
}


function SortTable() {
    let table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("table-leaderboard");
    switching = true;
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 0; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("input")[1];
        y = rows[i + 1].getElementsByTagName("input")[1];
        // Check if the two rows should switch place:
        if (parseInt(x.value) < parseInt(y.value)) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        let td1 = rows[i].getElementsByTagName("td")[0];
        let td2 = rows[i + 1].getElementsByTagName("td")[0];
        let aux = td1.innerText;
        td1.innerText = td2.innerText;
        td2.innerText = aux;
        switching = true;
      }
    }
  }