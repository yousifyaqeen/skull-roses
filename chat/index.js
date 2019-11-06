var history = []

function log(message){
    var options = {year: 'numeric', month: 'long', day: 'numeric' ,hour : 'numeric',minute: 'numeric'  ,second: 'numeric' };
    var date = new Date(Date.now())
    console.log(date.toLocaleString(options) + " : " + message)
 }

function addToHistory(message){
    if(history.length >= 100)
        history.pop();
    history.push(message)
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
    res.sendFile(__dirname + '/public/chat.html');
});



/*** Gestion des clients et des connexions ***/
var clients = {};       // id -> socket

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    
    // message de debug
    log("Un client s'est connecté");
    var currentID = null;
    
    /**
     *  Doit être la première action après la connexion.
     *  @param  id  string  l'identifiant saisi par le client
     */
    socket.on("login", function(id) {
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
    
    
});