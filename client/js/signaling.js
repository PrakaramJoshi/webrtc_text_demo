//Communications with the remote peer through signaling server
socket.on("connect", function(client){
    //Connection established with the signaling server
    console.log("connected to webserver");
    socket.on("session_id",function(_id){
        set_session_id(_id)
    })
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
console.log("signaling.js")