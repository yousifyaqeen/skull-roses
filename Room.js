/* represents a server room
* Each room has an id and a key
* to connect a player to the room use addplayer
* could be extended by games class to create a game
* room or could be used to create chat rooms
*/
function log(message) {
    var options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    var date = new Date(Date.now())
    console.log(date.toLocaleString(options) + " : " + message)
}

class Player {
    constructor(socket) {
        this.socket = socket;
    }
};

class Room {

    constructor(io, roomId, isPrivate) {
        this.roomId = null;
        this.io = io
        this.roomKey = null;
        this.players = {}
        this.Room(roomId, isPrivate);
        this.inGame = false;
    }

    Room(roomId, isPrivate) {
        if (isPrivate)
            this.roomKey = this.generateKey()
        else
            this.roomKey = null;

        this.roomId = roomId
        log("new room created with id " + this.roomId + "key : " + this.roomKey);

    }

    getNumberOfPlayers(){
        return Object.keys(this.players).length
    }
    /** add a player to the room
    *
    * @param socket the player socket
    * @param string the player id
    */
    addPlayer(socket, clientId) {
        if(!this.inGame){
            socket.emit("getKey", this.roomKey, this.roomId)
            this.io.to(this.roomId).emit("messageGame", this.roomId, { from: null, to: null, roomId: this.roomId, text: clientId + " a rejoint le jeu", date: Date.now() });
            this.players[clientId] = new Player(socket);
            this.players[clientId].socket.join(this.roomId);
            sendWelcomeMessage(clientId);
            sendPlayerList() ;
        }

    }

    sendWelcomeMessage(clientId) {
        if (this.players[clientId])
            this.players[clientId].socket.emit("bienvenue", { clientId: clientId, roomKey: this.roomKey });

    }

    sendPlayerList() {
        this.io.to(this.roomId).emit("Gameliste", this.roomId, Object.keys(this.players));
    }

    /** add a player to the room
    *
    * @param string the player id
    */
    removePlayer(clientId) {
        if (this.players[clientId]) {
            this.players[clientId].socket.leave(this.roomId);
            this.io.to(this.roomId).emit("messageGame", this.roomId, { from: null, to: null, roomId: this.roomId, text: clientId + " vient de quitter le jeu", date: Date.now() });
            this.players[clientId].socket.emit("leaveRoom", this.roomId);
            delete this.players[clientId]
            // sendPlayerList()
        }
    }
    /** return room key  */
    getKey() {
        return this.roomKey;
    }
    /** return room id  */

    getId() {
        return this.roomId;
    }
    /** generate room private key */
    generateKey() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    /** send a message to the group */
    sendMessage(msg) {
        msg.date = Date.now();
        if (this.players[msg.from]) {
            if (this.roomKey == msg.roomKey) {
                if (msg.to == null) {
                    this.io.to(this.roomId).emit("messageGame", this.roomId, msg);
                    log("message Sent");
                } else {
                    if (this.players[msg.to] != null)
                        this.players[msg.to].socket.emit("messageGame", this.roomId, msg);
                }
            }
            else
                log("the sender has the wrong key");
        }

    }
};



module.exports = { Room, Player };
