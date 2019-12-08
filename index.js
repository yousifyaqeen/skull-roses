/* Main server
* when the player joins the chat server , he could play a game with other clients 
*/

function log(message) {
    var options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    var date = new Date(Date.now())
    console.log(date.toLocaleString(options) + " : " + message)
}

// Chargement des modules
var express = require('express');
var app = express();
var server = app.listen(8080, function () {
    log("C'est parti ! En attente de connexion sur le port 8080...");
});

// Ecoute sur les websockets
var io = require('socket.io').listen(server);

// Configuration d'express pour utiliser le répertoire "public"
app.use(express.static('public'));
// set up to
var Game = require('./SkullAndRoses.js')

var clients = {};       // id -> socket

var games = [];

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    log("Un client s'est connecté");
    var currentID = null;
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     *  @param  key  string RoomKey
     */
    socket.on("join", function (id, key) {
        //if someone is trying to join without a valid id
        var room = null;
        if (id == null)
            delete socket;
        //if someone is joinning wihtout a key
        if (key != null) {
            //if the key is provided we check if we can find the room
            games.forEach
                (
                    r => {
                        if (r.roomKey == key)
                            room = r;
                    }
                )
        }
        //creating new room
        if (room == null) {
            var roomId = Math.random().toString(10).substr(2, 5);
            room = new Game(io, roomId, true, null);
            games.push(room)
        }
        if (room.players[id]) {
            log("User with same username is alredy loged in ");
            return
        }
        currentID = id;
        //add player to room
        room.addPlayer(socket, id);
        //log to server terminal
        if (!room.state != 0)
            log("new User connected : " + id + " to Room " + room.getId() + " key " + room.getKey());
        else {
            log("The room is in game, impossible to join");
            clients[id].emit("message", { from: null, to: null, roomId: room.roomId, text: "Impossible de rejoindre une partie en cours", date: Date.now() });
        }
    });

    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function (id) {

        while (clients[id]) {
            id = id + "(1)";
        }
        currentID = id;
        clients[currentID] = socket;
        log("Nouvel utilisateur : " + currentID);
        // envoi d'un message de bienvenue à ce client
        socket.emit("bienvenue", id);
        // envoi aux autres clients
        socket.broadcast.emit("message", { from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() });
        // envoi de la nouvelle liste à tous les clients c{ from: null, to: null, text: currentID + " a rejoint la discussion", date: Date.now() }onnectés
        io.sockets.emit("liste", Object.keys(clients));
    });

    /**
     *  Réception d'un message et transmission au jeu.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("messageSkullAndRoses", function (msg) {
        log("Message recieved");
        // Add the date if missing
        msg.date = Date.now();
        // si message privé, envoi seulement au destinataire
        if (msg.from != null) {
            log(" --> broadcast");
            games.forEach(room => {
                room.sendMessage(msg)
            });
        } else {
            log("Ignoring message because the sender is null ");

        }
    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("invite", function (sender, players, roomId, roomKey) {
        log("invite recieved");
        if (clients[sender] == socket) {
            log(" --> Invitation is being sent");
            players.forEach(p => {
                if (clients[p] != null)
                    clients[p].emit("invitation", { date: Date.now(), from: sender, game_name: "SkullAndRoses", key: roomKey })
            });
        } else {
            log("someone is trying to cheat ");
        }

    });

    /**
     *  Réception d'un message et transmission à tous.
     *  @param  msg     Object  le message à transférer à tous
     */
    socket.on("message", function (msg) {
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
        }
    });


    /**
     *  Gestion des déconnexions
     */

    // fermeture
    socket.on("logoutGame", function (roomId) {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            games.forEach(r => {
                if (r.roomId == roomId) {
                    r.removePlayer(currentID)
                }
            })
        }
    });

    // fermeture
    socket.on("logout", function () {
        // si client était identifié (devrait toujours être le cas)
        if (currentID) {
            log("Sortie de l'utilisateur " + currentID);
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " a quitté la discussion", date: Date.now() });
            // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
    });

    // déconnexion de la socket
    socket.on("disconnectGame", function (reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            games.forEach(room => {
                room.removePlayer(currentID)
            });
        }
        log("Client déconnecté");
    });

    // déconnexion de la socket
    socket.on("disconnect", function (reason) {
        // si client était identifié
        if (currentID) {
            // envoi de l'information de déconnexion
            socket.broadcast.emit("message",
                { from: null, to: null, text: currentID + " vient de se déconnecter de l'application", date: Date.now() });
            // suppression de l'entrée
            delete clients[currentID];
            // envoi de la nouvelle liste pour mise à jour
            socket.broadcast.emit("liste", Object.keys(clients));
        }
        log("Client déconnecté");
    });
    socket.on("startGame", function (roomId) {
        games.forEach(g => {
            if (g.roomId == roomId) {
                g.startRoundinit()
            }
        });

    });
    socket.on("playCard", function (roomId, cardIndex) {
        games.forEach(g => {
            if (g.roomId == roomId) {
                g.playCard(socket, cardIndex)
            }
        });
    })
    socket.on("getHand", function (roomId) {
        games.forEach(g => {
            if (g.roomId == roomId) {
                g.getHand()
            }
        });
    });

    socket.on("placeBet", function (roomId) {
        games.forEach(g => {
            if (g.roomId == roomId) {
                g.bet(socket, 1)
            }
        });
    });

    socket.on("getTable", function (roomId) {
        games.forEach(g => {
            if (g.roomId == roomId) {
                g.getTable()
            }
        });
    });

});
