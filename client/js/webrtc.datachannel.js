//To iron over browser implementation anomalies like prefixes
GetUserMedia();
GetRTCPeerConnection();
GetRTCSessionDescription();
GetRTCIceCandidate();

//Initializing a peer connection
var caller = new window.RTCPeerConnection();
var remoteCaller = new window.RTCPeerConnection();
var dataChannel = caller.createDataChannel('myChannel');
var remoteDataChannel;
var remoteUserMessage = document.getElementById("remoteUser");
var sendMessage = document.getElementById("self");

//Handler for receiving remote channel
caller.ondatachannel = function(channel){
    remoteDataChannel = channel.channel;
};
dataChannel.onopen = function(){
    console.log("Channel Opened");
};

dataChannel.onclose = function(){
    console.log("Channel Closed");
};

dataChannel.onmessage = function(event){
    remoteUserMessage.value = event.data;
};

dataChannel.onerror = function(){

};
//Listen for ICE Candidates and send them to remote peers
caller.onicecandidate = function(evt){
    if(!evt.candidate) return;
    console.log("onicecandidate called");
    onIceCandidate(caller, evt);    
};

//onaddstream handler to receive remote feed and show in remoteview video element
caller.onaddstream = function(evt){
    console.log("onaddstream called");
    
};    

function GetRTCIceCandidate(){
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate
                || window.mozRTCIceCandidate || window.msRTCIceCandidate;

    return window.RTCIceCandidate;
}
function GetUserMedia(){
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
                    || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return navigator.getUserMedia;
}
function GetRTCPeerConnection(){
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection
                        || window.mozRTCPeerConnection || window.msRTCPeerConnection;
    return window.RTCPeerConnection;
}
function GetRTCSessionDescription(){
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription
                    ||  window.mozRTCSessionDescription || window.msRTCSessionDescription;
    return window.RTCSessionDescription;
}

//Create and send offer to remote peer on button click
document.getElementById("makeCall").addEventListener("click", function(){   
    caller.createOffer().then(function(desc){
        caller.setLocalDescription(new RTCSessionDescription(desc));
        socket.emit("sdp", JSON.stringify({"sdp": desc}));
    });
});

sendMessage.addEventListener("keyup", function(evt){
    
    remoteDataChannel.send(sendMessage.value);
});
//Send the ICE Candidate to the remote peer
function onIceCandidate(peer, evt){
    if(evt.candidate){        
        socket.emit("candidate", JSON.stringify({"candidate": evt.candidate}));
    }
}

//Communications with the remote peer through signaling server
socket.on("connect", function(client){
    //Connection established with the signaling server
    console.log("connected!");

    //Listening for the candidate message from a peer sent from onicecandidate handler
    socket.on("candidate", function(msg){
        console.log("candidate received");
        caller.addIceCandidate(new RTCIceCandidate(JSON.parse(msg).candidate));
        
    });

    //Listening for Session Description Protocol message with session details from remote peer
    socket.on("sdp", function(msg){
        console.log("sdp received");
        var sessionDesc = new RTCSessionDescription(JSON.parse(msg).sdp);
        caller.setRemoteDescription(sessionDesc);
        caller.createAnswer().then(function(sdp){
            caller.setLocalDescription(new RTCSessionDescription(sdp));
            socket.emit("answer", JSON.stringify({"sdp": sdp}));
        });         
    });

    //Listening for answer to offer sent to remote peer
    socket.on("answer", function(answer){
        console.log("answer received");
        caller.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer).sdp));
    });
});