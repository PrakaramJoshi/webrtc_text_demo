//To iron over browser implementation anomalies like prefixes
GetUserMedia();
GetRTCPeerConnection();
GetRTCSessionDescription();
GetRTCIceCandidate();

//Initializing a peer connection
var caller = new window.RTCPeerConnection();
var remoteCallers = {}
var remoteDataChannel;

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

//Listen for ICE Candidates and send them to remote peers
caller.onicecandidate = function(evt){
    if(!evt.candidate) return;
    console.log("onicecandidate called");
    onIceCandidate(caller, evt);    
};

//Send the ICE Candidate to the remote peer
function onIceCandidate(peer, evt){
    if(evt.candidate){        
        socket.emit("candidate", JSON.stringify({"candidate": evt.candidate}));
    }
}
 
console.log("rtc.js")