var socket = io.connect('http://localhost:8080',{'forceNew':true });
var username = "";
var connected = false;
var max_search_results = 32;
var API_KEY = "0X5obvHJHTxBVi92jfblPqrFbwtf1xig";
var currentlyPlaying = -1;
var tabs = []
var keys = []
var playersList = []
/**
 * search for gifs using the giphy API
 * @param   {JSON String} response [the parsed response]
 */
function getSearchGiphyRequest(searchString){
    const Http = new XMLHttpRequest();
    const url='http://api.giphy.com/v1/gifs/search?q='+searchString+'&api_key=' + API_KEY + '&limit=' +max_search_results ;
    console.log(url)
    Http.open("GET", url);
    Http.send();
    Http.onreadystatechange = (e) => {
    console.log(Http.responseText)
    if(Http.responseText!=""){
            var response = JSON.parse(Http.responseText);
            displaySearchResults(response);
        }
    }
}
/**
 * this function adds the images to the html document
 * @param   {JSON String} response [the parsed response]
 */
function displaySearchResults(response){
    //div holding all the gifs
    var container  = document.getElementById("bcResults");
    //console.log("parsing response")
    //for each item in the list (ideally 32 but could be 0)
    response.data.forEach(element => {
        var img = document.createElement("img")

        img.src =  element.images.downsized.url
        img.addEventListener("click", function(){
            sendMessage('<img src=\"'+element.images.downsized.url+'\">');
        })
        container.appendChild(img)
    });
}

function sendMessage(text){
    if(username=="" || username ==null){
        return
    }
    if(text== ""){
        return
    }
    //is it being sent as a private message ?
    var patt_to = /^@(\w*)/;
    var to = text.match(patt_to);
    //setting up all the emojis
    var emojis = {
        ':D' : '<img class="emoji rire"/>',
        ':z' : '<img class="emoji zzz"/>',
        '^_^':'<img class="emoji love"/>',
        '8-|':'<img class="emoji holala"/>:',
        'X(' : '<img class="emoji grrr"/>',
        ':(' : '<img class="emoji triste"/>',
        ':)' : '<img class="emoji sourire"/>',
        ':O':'<img class="emoji banane"/>',
        ':(-':'<img class="emoji malade"/>'
    }
    var patt_img = /^\[img:.*?\]/;
    var img = text.match(patt_img);

    if(img!=null)
        img.forEach( match => {
            text = text.replace(match,"<img src=\""+match.slice(5,match.length-1)+"\"/>")
        });
        //we check if there are emojis in the message
    Object.keys(emojis).forEach(function(key) {
        text = text.replace(key,emojis[key])
    });
    if(to==null){
        if(currentlyPlaying==-1)
            socket.emit("message", {from : username, to : null,text : text,date : Date.now()});
        else
            socket.emit("messageSkullAndRoses", {from : username, roomKey:keys[currentlyPlaying] ,to : null,text : text,date : Date.now()});

    }
    else{
        if(currentlyPlaying==-1)
         socket.emit("message", {from : username, to :to[0].substr(1),text : text.substr(to[0].length+1),date : Date.now()});
        else
         socket.emit("messageSkullAndRoses", {from : username,roomkey:keys[currentlyPlaying], to :to[0].substr(1),text : text.substr(to[0].length+1),date : Date.now()});

    }
    document.getElementById("monMessage").value=""

}
//connect to server
function connect(){
    socket.open();
    if(!connected){
        username = document.getElementById("pseudo").value
    if(username != "")
     socket.emit("login", username);
    }
}
document.addEventListener('keydown', (event) => {
    const keyName = event.key;

    if (keyName === 'Enter') {
        if(connected){
            var message = document.getElementById("monMessage").value
            sendMessage(message)
        }
        if(!connected){
            connect();
        }
        }});

window.onload = main;

function main(){
    tabs.push(document.getElementById("generalchat"))

    document.getElementById("btnQuitter").addEventListener("click",function(){
        socket.emit("logout");
        socket.close();
        connected = false;
        document.getElementById("radio1").checked = true;
        document.getElementById("radio2").removeAttribute("checked")

    });
    document.getElementById("btnGeneralChat").addEventListener("click",function(){
        tabs.forEach(t => {
            t.style.display = "none"
        });
        document.getElementById("generalchat").style.display = "contents"
        currentlyPlaying=-1;
    })


    document.getElementById("btnConnecter")
        .addEventListener("click",function(){
           connect();
        });
        //openning giphy menu
        document.getElementById("btnImage")
        .addEventListener("click",function(){
            document.getElementById("bcImage").style.display ="block";
        });

        document.getElementById("btnRechercher")
        .addEventListener("click",function(){
            console.log("search clicked")
            var searchText = document.getElementById("recherche").value
            if(searchText!=""){
                console.log("searching for " + searchText)
                getSearchGiphyRequest(searchText);
             }
        });

        document.getElementById("btnFermer").addEventListener(
            "click",function(){
                document.getElementById("bcImage").style.display ="none";
            })

        document.getElementById("selectGuestbtnFermer").addEventListener(
            "click",function(){
                document.getElementById("selectGuest").style.display ="none";
            })

        document.getElementById("btnEnvoyer")
            .addEventListener("click",function(){
                    var message = document.getElementById("monMessage").value
                    sendMessage(message)

            });

        document.getElementById("btnHeberger")
            .addEventListener("click",function(){

              //  socket.on("liste", function(msg) {
                   document.getElementById("selectGuest").style.display="block"
                    var main = document.getElementById("selectGuestResult")
                    main.innerHTML = ""
                    playersList.forEach(element => {
                        console.log("lala");
                        var childNode = document.createElement("input")
                        childNode.type = "checkbox"
                        childNode.value = element
                        main.appendChild(childNode)
                    });
                joinGame(null)
            });

}

function joinGame(key){
    socket.emit("join",username,key)

}
socket.on("bienvenue", function(msg) {
    if(!connected){
        console.log("Le serveur me souhaite la bienvenue : " + msg);
        username = msg
        //document.getElementById("radio1").removeAttribute("checked")
        document.getElementById("radio2").checked = true;
        // document.getElementById("login").innerHTML = msg;
        connected = true;
    }
});

socket.on("message", function(msg) {
    var date = new Date (msg.date);
    var dateString = date.getHours() + ":"
    dateString += date.getMinutes() + ":"
    dateString += date.getSeconds()
    var childNode = document.createElement("p")
    childNode.innerText = dateString + " - ";
    if(msg.from!= null){
        if(msg.from == username){
            childNode.setAttribute("class" , "moi")
        }
        childNode.innerText +=msg.from
    }else{
        childNode.setAttribute("class" , "system")
        childNode.innerText += "[admin]"
    }
    if(msg.to != null){
        childNode.innerText += "(to " + msg.to + " )"
        childNode.setAttribute("class" , "mp")
    }
    childNode.innerText += " : "
    var patt = /^<img[^>]+src="([^">]+)"/
    if(msg.text.match(patt)!=null){
        childNode.innerHTML += msg.text
    }else
        childNode.innerText +=msg.text

    document.querySelector("#generalchat main").appendChild(childNode)

});

socket.on("invite", function(msg) {
    var date = new Date (msg.date);
    var dateString = date.getHours() + ":"
    dateString += date.getMinutes() + ":"
    dateString += date.getSeconds()

    var childNode = document.createElement("p")
    childNode.innerText = dateString + " - ";
    if(msg.from == null)
        return;
    childNode.innerText += msg.from
    childNode.innerText += " Invited you to play " + msg.game_name;
    var invitationUrl = document.createElement("a")
    .innerText = "Click to Join"
    .addEventListener("click",function(){
        joinGame(msg.key)
    })

    childNode.appendChild(invitationUrl);
    document.querySelector("#generalchat main").appendChild(childNode)

});

socket.on("liste", function(msg) {
    var main = document.getElementById("asideChat")
    main.innerHTML = ""
    playersList = msg
    msg.forEach(element => {
        var childNode = document.createElement("p")
        childNode.innerText = element
        main.appendChild(childNode)
    });
});

//------------------------------------//
socket.on("messageGame", function(id,msg) {
    console.log("I got this shit")
    var date = new Date (msg.date);
    var dateString = date.getHours() + ":"
    dateString += date.getMinutes() + ":"
    dateString += date.getSeconds()
    var childNode = document.createElement("p")
    childNode.innerText = dateString + " - ";
    if(msg.from!= null){
        if(msg.from == username){
            childNode.setAttribute("class" , "moi")
        }
        childNode.innerText +=msg.from
    }else{
        childNode.setAttribute("class" , "system")
        childNode.innerText += "[admin]"
    }
    if(msg.to != null){
        childNode.innerText += "(to " + msg.to + " )"
        childNode.setAttribute("class" , "mp")
    }
    childNode.innerText += " : "
    var patt = /^<img[^>]+src="([^">]+)"/
    if(msg.text.match(patt)!=null){
        childNode.innerHTML += msg.text
    }else
        childNode.innerText +=msg.text

    document.querySelector("div[data-id='"+id+"'] div[id='thingsAside']").appendChild(childNode)

});


socket.on("getKey",function(key,id){
    keys[id] = key;
    console.log("my fucking key is  " + key);

    var createGame = document.getElementById("tabs")

    var game =document.createElement("div")
    game.class = "content"
    game.dataset.id = id
    game.dataset.game_name = "skullandroses"

    game.style.display ="none"
    tabs.push(game);
    document.getElementById("content").appendChild(game)

     $(function(){
         $("[data-game_name='skullandroses']").load("/game/gameServer.html");
       });
       console.log("HEllo")
       var button = document.createElement("input");
       button.type = "button"
       button.value = "Skull & Roses"
       button.classList = "btn btn-primary btn-lg"
       button.id = "btnSkullAndRoses"
       button.dataset.index = id;
       button.addEventListener("click",function(){
           tabs.forEach(t => {
               t.style.display = "none"
           });
           game.style.display = "contents"
           currentlyPlaying=button.dataset.index;
           console.log("MY fucking id2 :  "+ id)
       })
       createGame.appendChild(button);

});

//------------------------------------//
socket.on("messageGame", function(id,msg) {
    console.log("I got this shit")
    var date = new Date (msg.date);
    var dateString = date.getHours() + ":"
    dateString += date.getMinutes() + ":"
    dateString += date.getSeconds()
    var childNode = document.createElement("p")
    childNode.innerText = dateString + " - ";
    if(msg.from!= null){
        if(msg.from == username){
            childNode.setAttribute("class" , "moi")
        }
        childNode.innerText +=msg.from
    }else{
        childNode.setAttribute("class" , "system")
        childNode.innerText += "[admin]"
    }
    if(msg.to != null){
        childNode.innerText += "(to " + msg.to + " )"
        childNode.setAttribute("class" , "mp")
    }
    childNode.innerText += " : "
    var patt = /^<img[^>]+src="([^">]+)"/
    if(msg.text.match(patt)!=null){
        childNode.innerHTML += msg.text
    }else
        childNode.innerText +=msg.text

    document.querySelector("div[data-id='"+id+"'] main").appendChild(childNode)
});

/*
socket.on("Gameliste", function(roomId,msg) {
    if(keys[roomId]!=null){
           var checkIsReady =  setInterval(function(main){
                var main = document.querySelector("div[data-id='"+roomId+"'] div[id='thingsAside']")
                if(main!=null){
                main.innerHTML = ""
                msg.forEach(element => {
                    var childNode = document.createElement("p")
                    childNode.innerText = element
                    main.appendChild(childNode)
                    });
                    clearInterval(checkIsReady)
                }
            }, 500);
}

});
*/
function initilizeGames(){

    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btnImage")
    .addEventListener("click",function(){
        document.querySelector("div[data-id='"+currentlyPlaying+"'] #bcImage").style.display ="block";
    });

    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btnRechercher")
    .addEventListener("click",function(){
        console.log("search clicked")
        var searchText = document.querySelector("div[data-id='"+currentlyPlaying+"'] #recherche").value
        if(searchText!=""){
            console.log("searching for " + searchText)
            getSearchGiphyRequest(searchText);
         }
    });

    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btnFermer").addEventListener(
        "click",function(){
            document.querySelector("div[data-id='"+currentlyPlaying+"'] #bcImage").style.display ="none";
        })

    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btn_messages").addEventListener(
        "click",function(){
            document.querySelector("div[data-id='"+currentlyPlaying+"'] #div_messages").style.display ="block";
            document.querySelector("div[data-id='"+currentlyPlaying+"'] #div_users").style.display ="none";

        })
    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btn_users").addEventListener(
        "click",function(){
            document.querySelector("div[data-id='"+currentlyPlaying+"'] #div_users").style.display ="block";
            document.querySelector("div[data-id='"+currentlyPlaying+"'] #div_messages").style.display ="none";

        })

    document.querySelector("div[data-id='"+currentlyPlaying+"'] #btnEnvoyer")
        .addEventListener("click",function(){
                var message = document.querySelector("div[data-id='"+currentlyPlaying+"'] #monMessage").value
                sendMessage(message)

        });



}
