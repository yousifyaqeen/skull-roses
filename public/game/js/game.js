function arrayRemove(arr, toRemove) {
    return arr.filter(elem=>elem!=toRemove);
}

 /**
 * Shuffles array in place. ES6 version
 * source :https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 */

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class Hand{
    cards = [];//1 skull : 0 roses
    blocked=[];
    constructor(){
        this.cards = [{id:0,type:0},{id:1,type:0},{id:2,type:0},{id:3,type:0}]
        this.cards[Math.floor(Math.random() * 4)].type=1;
       // shuffle(this.cards)

    }

    reveal(nb){
        if(nb<=0)
            return;
        var revealed =[]
        var currentIndex = 0
        while(currentIndex<nb){
            revealed = this.blocked[currentIndex];
            currentIndex+=1
        }
        return revealed
    }

    block(index){
        if (this.cards[index] !=null){
            this.blocked.push(this.cards[index])
            this.cards[index] = null;
            return this.blocked[this.blocked.length-1];
        }
    }

    unblock(){
        this.cards.forEach(card => {
            if(card==null){
                card = this.blocked.pop();
            }
        });

        if(this.blocked.length>0){
            console.log("Error Unblock");
        }
    }

    removeFromHand(index){
        if(index<this.cards.length)
            this.cards.splice(index, 1);
    }

}

class Player  {
    name ="";
    faction;
    hand;
    points;
    bet;
    constructor(name,faction){
        this.name=name;
        this.hand = new Hand();
        this.faction=faction;
    }

    pushCard(index){
        return this.hand.block(index);
    }
    raise(nb){
        bet+=nb;
    }

    fold(){
        bet=0;
    }
    reveal(nb){
        this.hand.reveal(nb);
    }
    restart(){
        this.bet =0;
        this.hand.unblock();
    }
    removeCard(index){
        return this.hand.removeFromHand(index);
    }
}

class gameManager{
    players = [];

    currentPlayer=0;
    constructor(player){
       this.players.push(player);
    }

    addPlayer(player){
        if(this.players.length<6){
            this.players.push(player);
        }
    }

    startRoundinit(){
        this.players.forEach(pl=>{

            console.log(pl.pushCard(0));
        })
    }

    startRound(playerIndex){
        var tmp = [];
        tmp = this.players.splice(playerIndex);
        tmp.concat(this.players.splice(0,playerIndex-1));
        return tmp;

    }

}

function testHand(){
    var hand = new Hand();
    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)

    hand.block();
    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)
    hand.block();
    hand.block();

    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)
    console.log("reveal Array :  " ,hand.reveal(1))

    hand.unblock()
    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)

    hand.block();
    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)
    var revealed = hand.reveal(1)
    console.log("reveal Array :  " ,revealed)
    hand.unblock()

    hand.removeFromHand(2)
    console.log("Cards Array :  " ,hand.cards)
    console.log("Blocked Array :  " ,hand.blocked)
}

p1 = new Player("hello Kitty","con");

p2 = new Player("Bye kitty","cat")

gm = new gameManager(p1);


gm.addPlayer(p2);
console.log(gm.players);

gm.startRoundinit();

console.log(p1.hand.blocked)

gm.startRound(1)

console.log(p2.hand.blocked)
