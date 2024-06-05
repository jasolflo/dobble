//generates a deck for dobble / spot it!
//regular dobble => 8 symbols per card, 57 cards
function DeckGenerator(){
    let deck = []
    let card = []
    //indexes will be used to create each card. They will later be transformed into icons
    //1st card uses symbols from 0 to 7 (first 8 symbols)
    for(let i = 0; i < 8; i++) card.push(i);
    deck.push(card);

    //all other cards start with any of the first 8 indexes and are filled with the rest of indexes ordered
    //(cards go in a 7x7 grid (49) + projective points (8) = 57)
    for(let i = 0; i < 8; i++){
        let auxIndex = 8;
        for(let j = 1; j <= 7; j++){
            card = [];
            card.push(i);
            for(let k = 1; k <= 7; k++){
                card.push(auxIndex);
                auxIndex += 1;
            }
            deck.push(card);
        }
    }
    
    return deck;
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

export function GenerateShuffledDeck(){
    let res = DeckGenerator();
    res = ShuffleDeck(res);
    return res;
}

/*
let debug = DeckGenerator();
debug = ShuffleDeck(debug);
for(let i = 0; i < debug.length; i++){
    console.log((i + 1) + ": " + debug[i]);
}
*/