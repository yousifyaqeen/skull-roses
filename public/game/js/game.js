var current = 0;
var bet = 0;
class Hand {
    cards = [];//1 skull : 0 roses
    blocked = [];
    constructor() {
        this.cards = [{ id: 0, type: 0 }, { id: 1, type: 0 }, { id: 2, type: 0 }, { id: 3, type: 0 }]
        this.cards[Math.floor(Math.random() * 4)].type = 1;
        //shuffle(this.cards)


    }

    reveal(nb) {
        if (nb <= 0)
            return;
        var revealed = []
        var currentIndex = 0
        while (currentIndex < nb) {
            revealed = this.blocked[currentIndex];
            currentIndex += 1
        }
        return revealed
    }

    block(index) {
        if (this.cards[index] != null) {
            this.blocked.push(this.cards[index])
            this.cards[index] = null;
            return this.blocked[this.blocked.length - 1];
        }
    }

    unblock() {
        this.cards.forEach(card => {
            if (card == null) {
                card = this.blocked.pop();
            }
        });

        if (this.blocked.length > 0) {
            console.log("Error Unblock");
        }
    }

    removeFromHand(index) {
        if (index < this.cards.length)
            this.cards.splice(index, 1);
    }

}

class Player {
    name = "";
    faction;
    hand;
    points;
    bet;
    constructor(name, faction) {
        this.name = name;
        this.hand = new Hand();
        this.faction = faction;
    }

    pushCard(index) {
        return this.hand.block(index);
    }
    raise(nb) {
        bet += nb;
    }

    fold() {
        bet = 0;
    }
    reveal(nb) {
        this.hand.reveal(nb);
    }
    restart() {
        this.bet = 0;
        this.hand.unblock();
    }
    removeCard(index) {
        return this.hand.removeFromHand(index);
    }
}

class gameManager {
    players = [];
    factions = ['amazons', 'indians', 'carnivorous', 'cyborgs', 'jokers', 'swallows']
    currentPlayer = 0;
    constructor(player) {
        this.players.push(player);
        var playerDiv = document.getElementById("myHand");
        playerDiv.dataset.playerId = this.players.length-1;
        playerDiv.classList = "player" 
        var i = 0;
        this.players[this.players.length - 1].hand.cards.forEach(c => {
            var card = document.createElement("div")
            card.dataset.cardIndex = c.id;
            card.classList = "card"
            if (c.type == 0)
                card.innerHTML =
                    '<div class="flip-card-inner">' +
                    '<div class="flip-card-front '+ player.faction+'"></div>' +
                    '<div class="flip-card-back roses"></div></div>'
            else
                card.innerHTML =
                    '<div class="flip-card-inner">' +
                    '<div class="flip-card-front '+ player.faction+'"></div>' +
                    '<div class="flip-card-back skull"></div></div>'
           
            playerDiv.appendChild(card);
            card.addEventListener('click', function(){
                console.log("card pushed" + player.pushCard(c.id).id);
            });
            i++
        });
    }

    addPlayer(player) {
        if ((this.players.length + 1) < 7) {
            player.faction = this.factions[this.players.length];
            this.players.push(player);
            var game = document.getElementById("table");
            var playerDiv = document.createElement("div");
            playerDiv.dataset.playerId = this.players.length-1;
            playerDiv.classList = "player" 
            var i = 0;
            this.players[this.players.length - 1].hand.cards.forEach(c => {
                var card = document.createElement("div")
                card.dataset.cardIndex = c.id;
                card.classList = "card"
                if (c.type == 0)
                    card.innerHTML =
                        '<div class="flip-card-inner">' +
                        '<div class="flip-card-front '+ player.faction+'"></div>' +
                        '<div class="flip-card-back roses"></div></div>'
                else
                    card.innerHTML =
                        '<div class="flip-card-inner">' +
                        '<div class="flip-card-front '+ player.faction+'"></div>' +
                        '<div class="flip-card-back skull"></div></div>'
               
                playerDiv.appendChild(card);
                
                i++
            });
            playerDiv.addEventListener('click', function(){
                console.log(" inde x: " + playerDiv.dataset.playerId )
            });
            game.appendChild(playerDiv);
        }

    }


    startRoundinit() {
        this.players.forEach(pl => {
            console.log(pl.pushCard(0));
        })
    }

    startRound(playerIndex) {
        var tmp = [];
        tmp = this.players.splice(playerIndex);
        tmp.concat(this.players.splice(0, playerIndex - 1));
        return tmp;

    }

}

function testHand() {
    var hand = new Hand();
    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)

    hand.block();
    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)
    hand.block();
    hand.block();

    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)
    console.log("reveal Array :  ", hand.reveal(1))

    hand.unblock()
    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)

    hand.block();
    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)
    var revealed = hand.reveal(1)
    console.log("reveal Array :  ", revealed)
    hand.unblock()

    hand.removeFromHand(2)
    console.log("Cards Array :  ", hand.cards)
    console.log("Blocked Array :  ", hand.blocked)
}

window.onload = main

function main() {
    p1 = new Player("hello Kitty", "con");

    p2 = new Player("Bye kitty", "cat")
    p3 = new Player("Bye kitty", "cat")
    p4 = new Player("Bye kitty", "cat")
    p5 = new Player("Bye kitty", "cat")
    p6 = new Player("Bye kitty", "cat")

    gm = new gameManager(p1);
    gm.addPlayer(p2);
    gm.addPlayer(p3);
    gm.addPlayer(p4);
    gm.addPlayer(p5);
    gm.addPlayer(p6);
    gm.startRoundinit()
    gm.startRound(current);

    document.getElementById("betButton").addEventListener('click', function () {
        console.log("HELLO")

    })
 
}

