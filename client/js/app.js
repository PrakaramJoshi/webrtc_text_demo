var socket = io();
var remoteUserMessage = document.getElementById("remoteUser");
var sendMessage = document.getElementById("self");
var chat_channel=""
function uuid() {
    function randomDigit() {
        if (crypto && crypto.getRandomValues) {
            var rands = new Uint8Array(1);
            crypto.getRandomValues(rands);
            return (rands[0] % 16).toString(16);
        } else {
            return ((Math.random() * 16) | 0).toString(16);
        }
    }
    var crypto = window.crypto || window.msCrypto;
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}

var generate_connection_id=function(){
    return String(Date.now())+uuid()
}


var g_session_id=""



var chat_receive_callback=function(_msg){
    remoteUserMessage.value=_msg
}

var set_session_id=function(){
    g_session_id=generate_connection_id()
    document.getElementById("session_id").value=g_session_id
}
var set_channel_id=function(){
    chat_channel=String(document.getElementById("channel_id").value)
}

//Create and send offer to remote peer on button click
document.getElementById("makeCall").addEventListener("click", function(){
    set_channel_id()
    join_network(chat_channel,chat_receive_callback)
});

sendMessage.addEventListener("keyup", function(evt){
    console.log("sending message")
    send_peer_message(chat_channel,sendMessage.value)

});


set_session_id()
set_channel_id()
