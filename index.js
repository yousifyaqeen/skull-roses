/* the game server
* when the player joins the game server , he eather has a refferal from the chat server or
* is joinning without referal , in the first case we get the player username and info from the other server
* in the second case we refuse the connection
*/

/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

function log(message){
    var options = {year: 'numeric', month: 'long', day: 'numeric' ,hour : 'numeric',minute: 'numeric'  ,second: 'numeric' };
    var date = new Date(Date.now())
    console.log(date.toLocaleString(options) + " : " + message)
 }

// Chargement des modules
var express = require('express');
var app = express();
var server = app.listen(8080, function() {
    log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/chat/chat.html');
});
app.get('/skullandroses', function(req, res) {
    res.sendFile(__dirname + '/public/game/gameServer.html');
});

app.post('/skullandroses', function (req, res) {
    log(req.body)
  })


/* represents a game room
* Each room has an id and a key
* to connect a player to the room use addplayer
*/
class Room {

    constructor(roomId,isPrivate){
     this.roomId = null;
     this.roomKey = null;
     this.players = {};
     this.Room(roomId,isPrivate);
    }

    Room(roomId,isPrivate){
     if(isPrivate)
      this.roomKey = this.generateKey()
     else
         this.roomKey =null;

     this.roomId = roomId
     log("new room created with id " + this.roomId + "key : " + this.roomKey);

    }
    /** add a player to the room
    *
    * @param socket the player socket
    * @param string the player id
    */
    addPlayer(socket,clientId){
        socket.emit("getKey",this.roomKey,this.roomId)
            io.to(this.roomId).emit("messageGame",this.roomId, { from: null, to: null,roomId:this.roomId ,text: clientId + " a rejoint le jeu", date: Date.now() } );
            this.players[clientId] =  socket;
            this.players[clientId].join(this.roomId);
                    //Send connection notification to room
            // todo change get key
            this.players[clientId].emit("bienvenue", {clientId : clientId,roomKey: this.roomKey});
            io.to(this.roomId).emit("Gameliste", this.roomId,Object.keys(this.players));
    }

    /** add a player to the room
    *
    * @param string the player id
    */
    removePlayer(clientId){
        if(this.players[clientId]){
            this.players[clientId].leave(this.roomId);
            io.to(this.roomId).emit("message", { from: null, to: null,roomId:this.roomId, text: clientId + " vient de se déconnecter de l'application", date: Date.now() });
            delete this.players[clientId]
            io.to(this.roomId).emit("Gameliste", this.roomId,Object.keys(this.players));
        }

    }
     /** return room key  */
    getKey(){
        return this.roomKey;
    }
     /** return room id  */

    getId(){
        return this.roomId;
    }
    /** generate room private key */
    generateKey(){
            return '_' + Math.random().toString(36).substr(2, 9);
    }
    /** send a message to the group */
    sendMessage(msg){
        msg.date = Date.now();
        if(this.players[msg.from]){
            if(this.roomKey==msg.roomKey){
                if(msg.to==null){
                    io.to(this.roomId).emit("messageGame",this.roomId, msg);
                    log("message Sent");
                }else{
                    if(this.players[msg.to]!=null)
                        this.players[msg.to].emit("messageGame",this.roomId, msg);
                }
            }
            else
                log("the sender has the wrong key");
        }

    }
    sendInvitation(sender,players,roomKey){
        players.forEach( p => {
            if(clients[p]!=null){
                log("sent invitation")
                clients[p].emit("invitation",{date:Date.now(),from:sender,game_name:"SkullAndRoses",key:roomKey})
            }
        });
    }
};

class Game {
    players = []
    factions = ['amazons', 'indians', 'carnivorous', 'cyborgs', 'jokers', 'swallows']

    constructor(roomId, userlist){
        this.roomId = null;
        userlist.forEach(p => {
            log("name = " + p);
            var user = new Player(p, this.factions[this.players.length-1])
            this.addPlayer(user)
            log(this.players[p].hand.cards[0])
        })
    }

    addPlayer(player) {
        if ((this.players.length + 1) < 7) {
            this.players.push(player);
            // var game = document.getElementById("table");
            // var playerDiv = document.createElement("div");
            // playerDiv.dataset.playerId = this.players.length-1;
            // playerDiv.classList = "player"
            // var i = 0;
            // this.players[this.players.length - 1].hand.cards.forEach(c => {
            //     var card = document.createElement("div")
            //     card.dataset.cardIndex = c.id;
            //     card.classList = "card"
            //     if (c.type == 0)
            //         card.innerHTML =
            //             '<div class="flip-card-inner">' +
            //             '<div class="flip-card-front '+ player.faction + '"></div>' +
            //             '<div class="flip-card-back roses"></div></div>'
            //     else
            //         card.innerHTML =
            //             '<div class="flip-card-inner">' +
            //             '<div class="flip-card-front '+ player.faction+'"></div>' +
            //             '<div class="flip-card-back skull"></div></div>'
            //
            //     playerDiv.appendChild(card);
            //
            //     i++
            // });
            // playerDiv.addEventListener('click', function(){
            //     console.log(" inde x: " + playerDiv.dataset.playerId )
            // });
            // game.appendChild(playerDiv);
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
};

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



//history management
var history = [];

function addToHistory(message){
    if(history.length >= 100)
        history.pop();
    history.push(message)
5
}



var rooms =[];

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    log("Un client s'est connecté");
    var currentID = null;
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     *  @param  key  string RoomKey
     */
    socket.on("join", function(id,key) {
        //if someone is trying to join without a valid id
        var room=null;
        if(id==null)
            delete socket;
        //if someone is joinning wihtout a key
        if(key!=null)
            {
                //if the key is provided we check if we can find the room
                rooms.forEach
                (
                    r=>{
                        if(r.roomKey==key)
                            room = r;
                    }
                )
            }
        //creating new room
        if(room==null){
                var roomId =  Math.random().toString(10).substr(2, 5);
                room= new Room(roomId,true);
                rooms.push(room)
            }
            log(room)
            log(room.players)

        if(room.players[id]){
            log("User with same username is alredy loged in ");
            return
        }
        currentID = id;
        //add player to room
        room.addPlayer(socket,id);
        //log to server terminal
        log("new User connected : " + id + " to Room " + room.getId() + " key " + room.getKey());
        //add message to server history
    });

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
        //todo
        while (clients[id]) {
            id = id + "(1)";
        }

        currentID = id;
        clients[currentID] = socket;

        log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", id);
        // envoi aux autres clients

        socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() } );

        addToHistory({ from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() })
        // envoi de la nouvelle liste à tous les clients c{ from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() }onnectés
        io.sockets.emit("liste", Object.keys(clients));
        clients[currentID].emit("history", history);
    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("messageSkullAndRoses", function(msg) {
        log("Message recieved");
        // Add the date if missing
        msg.date = Date.now();
        // si message privé, envoi seulement au destinataire
       /* if (msg.to != null && clients[msg.to] !== undefined) {
            log(" --> message privé");
            clients[msg.to].emit("message", msg);
            if (msg.from != msg.to) {
                socket.emit("message", msg);
            }
        }
        else {
            log(" --> broadcast");
            io.sockets.emit("message", msg);
            addToHistory(msg)
        }*/
        if(msg.from !=null){
            log(" --> broadcast");
            rooms.forEach(room => {
                room.sendMessage(msg)
            });
            addToHistory(msg)
         }else{
            log("Ignoring message because the sender is null ");

         }
    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("invite", function(sender,players,roomId,roomKey) {
        log("invite recieved");
        if(clients[sender]==socket){
            log(" --> Invitation is being sent");
            rooms.forEach(room => {
                if(room.roomId==roomId)
                room.sendInvitation(sender,players,roomKey)
            });
        }else{
        log("someone is trying to cheat ");
        }

    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("message", function(msg) {
        log("Reçu message");
        // si jamais la date n'existe pas, on la rajoute
        msg.date = Date.now();
        // si message privé, envoi seulement au destinataire
        if (msg.to != null && clients[msg.to] !== undefined) {
            log(" --> message privé");
            clients[msg.to].emit("message", msg);
            if (msg.from != msg.to) {
                socket.emit("message", msg);
            }
        }
        else {
            log(" --> broadcast");
            io.sockets.emit("message", msg);
            addToHistory(msg)
        }
    });


    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logoutGame", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion

            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
            addToHistory( { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() })
        }
    });

    // fermeture
    socket.on("logout", function() {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
            addToHistory( { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() })
        }
    });

    // déconnexion de la socket
    socket.on("disconnectGame", function(reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            rooms.forEach(room => {
                room.removePlayer( currentID)
            });
            addToHistory({ from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() })
        }
        log("Client déconnecté");
    });

    // déconnexion de la socket
    socket.on("disconnect", function(reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() } );
                // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
            addToHistory({ from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() })
        }
        log("Client déconnecté");
    });

    socket.on("startGame", function(roomId, userlist){
        var g = new Game(roomId, userlist)
        rooms.forEach(room => {
            if(room.id == roomId)
                g.addPlayer()
        });
    });

});
