var roomModuels = require("./Room.js")
var Room = roomModuels.Room
var Room_Player = roomModuels.Player

class SkullAndRosesGame extends Room {

    constructor(io, roomId, isPrivate, userlist) {
        super(io, roomId, isPrivate)
        this.currentPlayer = 0;
        this.state = 0
        this.gameStarted = false;
        this.turnDeter = []//store the playing order
        this.factions = ['amazons', 'indians', 'carnivorous', 'cyborgs', 'jokers', 'swallows']
        if (Array.isArray(userlist))
            userlist.forEach(p => {
                this.addPlayer(p)
            })
    }

    addPlayer(socket, clientId) {
        console.log("Hello")
        if ((this.getNumberOfPlayers() < 7) && !this.gameStarted) {
            var playerindex = this.getNumberOfPlayers();
            socket.emit("getKey", this.roomKey, this.roomId)
            this.io.to(this.roomId).emit("messageGame", this.roomId, { from: null, to: null, roomId: this.roomId, text: clientId + " a rejoint le jeu", date: Date.now() });
            this.players[clientId] = new Player(playerindex, socket, clientId, this.factions[this.getNumberOfPlayers()]);
            this.players[clientId].socket.join(this.roomId);
            this.turnDeter.push(clientId);
            this.sendWelcomeMessage(clientId);
            this.sendPlayerList();
        }

    }


    startRoundinit() {
        if (!this.gameStarted) {
            //startRound(0);
            this.state = 1;
            this.gameStarted = true;
            this.getTable();
            this.getHand()
            this.io.to(this.roomId).emit("beginMatch",this.roomId);
        }
    }


    startRound(index) {
        var tmp = []
        tmp = this.turnDeter.splice(index);

        tmp.concat(this.turnDeter.splice(0, index - 1));

        this.turnDeter = tmp;
        return tmp;

    }

    getHand() {
        var roomId = this.roomId
        Object.keys(this.players).map(function (clientId, index) {
        var p = this.players[clientId]
            //console.log("giving hand" + p.hand.cards)
            p.socket.emit("giveHand", p.faction, p.hand.cards, roomId)
        },this);
    }

    getTable() {
        var onTable = []
        Object.keys(this.players).map(function (clientId, index) {
            var p = this.players[clientId]
            onTable.push({ name: p.name, faction: p.faction, blocked: p.hand.blocked })
        },this);
        this.io.to(this.roomId).emit("giveTable", onTable, this.roomId)
    }

    playCard(socket, id) {
        if (this.gameStarted) {
            Object.keys(this.players).map(function (clientId, index) {
                console.log(this.turnDeter[this.currentPlayer] + " "+ clientId + " " + this.currentPlayer )
                if (this.players[clientId].socket == socket && this.turnDeter[this.currentPlayer] == clientId ) {
                    this.players[clientId].pushCard(id);
                    this.currentPlayer+=1;
                    if( !this.turnDeter[this.currentPlayer]){
                        console.log("shit")
                        this.startRound(0)
                        this.currentPlayer = 0;
                    }
                }
            },this)
            this.getTable()
            this.getHand()
        }
    }
};

class Hand {

    constructor() {
        this.blocked = []
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
        } else {
            return null
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

class Player extends Room_Player {
    constructor(index, socket, name, faction) {
        super(socket)
        this.points = 0
        this.bet = 0
        this.index = index;
        this.name = name;
        this.hand = new Hand();
        this.faction = faction;
    }

    pushCard(index) {
        if (this.hand.block(index) == null)
            return null
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

module.exports = SkullAndRosesGame
