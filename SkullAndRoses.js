
var roomModuels = require("./Room.js")
var Room = roomModuels.Room
var Room_Player = roomModuels.Player

class SkullAndRosesGame extends Room {

    constructor(io,roomId,isPrivate, userlist){
        super(io,roomId,isPrivate)
        this.factions = ['amazons', 'indians', 'carnivorous', 'cyborgs', 'jokers', 'swallows']
        if(Array.isArray(userlist))
            userlist.forEach(p => {
                this.addPlayer(p)
            })
    }

    addPlayer(socket,clientId) {
        console.log("Hello")
        if(this.getNumberOfPlayers() < 7) {
            socket.emit("getKey", this.roomKey, this.roomId)
            this.io.to(this.roomId).emit("messageGame", this.roomId, { from: null, to: null, roomId: this.roomId, text: clientId + " a rejoint le jeu", date: Date.now() });
            this.players[clientId] = new Player(socket,clientId, this.factions[this.getNumberOfPlayers()]);
            this.players[clientId].socket.join(this.roomId);
            this.sendWelcomeMessage(clientId);
            this.sendPlayerList() ;
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


    getHand(){
        var players = this.players
        var roomId = this.roomId
        Object.keys(players).map(function(clientId, index) {
            var p = players[clientId]
            console.log(p)
            // io.to(this.roomId).emit("giveHand",p.faction, p.hand.cards, this.roomId)
            p.socket.emit("giveHand",p.faction, p.hand.cards,roomId)
            // io.sockets.emit("giveHand",p.faction, p.hand.cards, this.roomId)
        });
    }
};

class Hand {

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

class Player extends Room_Player{
    constructor(socket ,name, faction) {
        super(socket)
        this.points=0
        this.bet = 0
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

module.exports = SkullAndRosesGame
