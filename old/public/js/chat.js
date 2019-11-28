var socket = io.connect('http://localhost:8080',{'forceNew':true });


var username = "";
var connected = false;
var max_search_results = 32;
var API_KEY = "0X5obvHJHTxBVi92jfblPqrFbwtf1xig";

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
        socket.emit("message", {from : username, to : null,text : text,date : Date.now()});
    }
    else{
        socket.emit("message", {from : username, to :to[0].substr(1),text : text.substr(to[0].length+1),date : Date.now()});
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
    document.getElementById("btnQuitter").addEventListener("click",function(){
        socket.emit("logout");
        socket.close();
        connected = false;
        document.getElementById("radio1").checked = true;
        document.getElementById("radio2").removeAttribute("checked")

    });
    document.getElementById("h3Skull_game")
    .addEventListener("click", function(e){
        document.getElementById("asideChat").style.display = "none"
        document.getElementById("asideGame").style.display = "block"
    });
    document.getElementById("h3Client")
    .addEventListener("click", function(e){
        document.getElementById("asideChat").style.display = "block"
        document.getElementById("asideGame").style.display = "none"
    });
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

        document.getElementById("btnEnvoyer")
            .addEventListener("click",function(){
                    var message = document.getElementById("monMessage").value
                    sendMessage(message)

            });

            document.getElementById("btnHeberger")
                .addEventListener('click',function(){
                    var http = new XMLHttpRequest();
                    var url = 'http://localhost:8081';
                    var params = 'id=' + username + '&key=null';
                    http.open('POST', url, true);
                    
                    //Send the proper header information along with the request
                    http.setRequestHeader('Content-type', 'text/plain');
                    
                    http.onreadystatechange = function() {//Call a function when the state changes.
                        if(http.readyState == 4 && http.status == 200) {
                            alert(http.responseText);
                        }
                    }
                    http.send(params);
            })
            


}
socket.on("bienvenue", function(msg) {
    if(!connected){
        console.log("Le serveur me souhaite la bienvenue : " + msg);
        username = msg
        document.getElementById("radio1").removeAttribute("checked")
        document.getElementById("radio2").checked = true;
        document.getElementById("login").innerHTML = msg;
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

    document.querySelector("div#content>main").appendChild(childNode)

});
/*
socket.on("history", function(historyArray) {
    historyArray.forEach( msg=>{
        var date = new Date (msg.date);
        var dateString = date.getHours() + ":"
        dateString += date.getMinutes() + ":"
        dateString += date.getSeconds()

    var childNode = document.createElement("p")
    childNode.innerText = dateString
    childNode.innerText += " - "
    if(msg.from!= null){
        if(msg.from == username){
            childNode.setAttribute("class" , "moi")
        }
            childNode.innerText +=msg.from
    }else{
        childNode.setAttribute("class" , "system")
        childNode.innerText += "[admin]"
    }

    if(msg.to!= null){
        childNode.innerText += "(to " + msg.to + " )"
        childNode.setAttribute("class" , "mp")
    }
    childNode.innerText += " : "
    childNode.innerText +=msg.text
    document.querySelector("div#content>main").appendChild(childNode)

});

});
*/

socket.on("liste", function(msg) {
    var main = document.getElementById("asideChat")
    main.innerHTML = ""
    msg.forEach(element => {
        var childNode = document.createElement("p")
        childNode.innerText = element
        main.appendChild(childNode)

    });

});
