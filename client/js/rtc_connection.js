var g_active_connections={}
var g_channel_ids={}
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

var is_active_channel=function(_channel_id){
    if(_channel_id in g_channel_ids){
        return true
    }
    return false
}

var add_active_channel=function(_channel_id,_on_receive_callback){
    if(_channel_id in g_channel_ids){
        return
    }
    g_channel_ids[_channel_id]={'on_receive':_on_receive_callback}
}

var remove_active_channel=function(_channel_id){
    if(_channel_id in g_channel_ids){
        return
    }
    delete g_channel_ids[_channel_id]
}


var read_message_brdcast=function(_msg){
    if(is_active_channel(_msg.channel_id)==false){
        return false
    }
    if(g_session_id==_msg.msg_from){
        return false
    }
    return 
}

var read_message=function(_msg){
    if(is_active_channel(_msg.channel_id)==false){
        return false
    }
    if(g_session_id!=_msg.msg_to){
        return false
    }
    if(g_session_id==_msg.msg_from){
        return false
    }
    return 
}

//Communications with the remote peer through signaling server
socket.on("connect", function(client){
    //Connection established with the signaling server
    console.log("connected!");

    //Listening for the candidate message from a peer sent from onicecandidate handler
    socket.on("candidate", function(_msg){
        let msg=JSON.parse(_msg)
        if (read_message(msg)==false){
            return
        }
        console.log("candidate received");
        let connection_id=msg.connection_id
        g_active_connections[connection_id].set_icecandidate(msg)       
        
    });

    //Listening for Session Description Protocol message with session details from remote peer
    socket.on("sdp", function(_msg){
        let msg=JSON.parse(_msg)
        if (read_message(msg)==false){
            return
        }
        console.log("sdp received");
        let connection_id=msg.connection_id
        let channel_id=msg.channel_id
        let msg_from=msg.msg_from
        let receive_callback=g_channel_ids[channel_id]['on_receive']
        g_active_connections[connection_id]= new Connection(connection_id,
            socket,channel_id,msg_from,receive_callback)
        g_active_connections[connection_id].send_answer(msg)
    });

    socket.on("call_me",function(_msg){
        let msg=JSON.parse(_msg)
        if (read_message_brdcast(msg)==false){
            return
        }
        let connection_id=generate_connection_id()
        let channel_id=msg.channel_id
        let msg_from=msg.msg_from
        let receive_callback=g_channel_ids[channel_id]['on_receive']
        g_active_connections[connection_id]= new Connection(connection_id,
                                            socket,channel_id,msg_from,receive_callback)
        console.log("Calling ",msg_from)
        g_active_connections[connection_id].send_offer()
    })

    //Listening for answer to offer sent to remote peer
    socket.on("answer", function(_msg){
        let msg=JSON.parse(_msg)
        if (read_message(msg)==false){
            return
        }
        console.log("answer received");
        let connection_id=msg.connection_id
        g_active_connections[connection_id].receive_answer(msg)
    });
});

var socket_send_msg_to=function(_msg_type,_msg_from,_msg_to,_connection_id,_channel_id,_data_type,_data_value){
    let msg_dict={}
    msg_dict[_data_type]=_data_value
    msg_dict["connection_id"]=_connection_id
    msg_dict["msg_from"]=_msg_from
    msg_dict["msg_to"]=_msg_to
    msg_dict["channel_id"]=_channel_id
    let msg=JSON.stringify(msg_dict)
    socket.emit(_msg_type, msg);
}

var socket_send_msg_brdcst=function(_msg_type,_msg_from,_channel_id,_data_type,_data_value){
    let msg_dict={}
    msg_dict[_data_type]=_data_value
    msg_dict["channel_id"]=_channel_id
    msg_dict["msg_from"]=_msg_from
    let msg=JSON.stringify(msg_dict)
    socket.emit(_msg_type,msg)
}


var join_network=function(_channel_id,_on_receive_callback){
    add_active_channel(_channel_id,_on_receive_callback)
    socket_send_msg_brdcst("call_me",g_session_id,_channel_id,"channel_id",_channel_id)
}

var send_peer_message=function(_channel_id,_msg){
    for(let conn_id in g_active_connections){
        if(g_active_connections[conn_id].is_channel(_channel_id)){
            g_active_connections[conn_id].send_message(_msg)
        }
    }
}

class Connection{
    constructor(_connection_id,_socket,_channel_id,_connection_to,_callback_on_message){
        this.connection_id=_connection_id
        this.socket=_socket
        this.channel_id=_channel_id
        this.connection_to=_connection_to
        this.connection=new window.RTCPeerConnection();        
        this.remoteDataChannel;        
        this.data_channel=this.connection.createDataChannel(_channel_id);
        this.set_channel(_callback_on_message)
    }

    is_channel(_channel_id){
        return _channel_id==this.channel_id
    }

    send_offer(){
        let this_obj=this
        this.connection.createOffer().then(function(desc){
            this_obj.connection.setLocalDescription(new RTCSessionDescription(desc));
            this_obj.send_signal_message("sdp","sdp",desc)
        });
    }

    send_answer(_msg){
        let sessionDesc = new RTCSessionDescription(_msg.sdp);
        let this_obj=this
        this.connection.setRemoteDescription(sessionDesc);
        this.connection.createAnswer().then(function(sdp){
            this_obj.connection.setLocalDescription(new RTCSessionDescription(sdp));
            this_obj.send_signal_message("answer","sdp",sdp)
        });  
    }

    receive_answer(_msg){
        this.connection.setRemoteDescription(new RTCSessionDescription(_msg.sdp));
    }

    send_signal_message(_msg_type,_data_type,_data_value){
        socket_send_msg_to(_msg_type,g_session_id,this.connection_to,this.connection_id,this.channel_id,_data_type,_data_value)
    }

    set_icecandidate(_msg){
        console.log(_msg)
        this.connection.addIceCandidate(new RTCIceCandidate(_msg.candidate)); 
    }
        
    
    set_channel(_callback_on_message){
        //Handler for receiving remote channel
        let this_obj=this
        this.connection.ondatachannel = function(channel){
            this_obj.remoteDataChannel = channel.channel;
        };
        this.data_channel.onopen = function(){
            console.log("Channel Opened");
        };

        this.data_channel.onclose = function(){
            console.log("Channel Closed");
        };

        this.data_channel.onmessage = function(event){
            _callback_on_message(event.data)
        };

        this.data_channel.onerror = function(){
            console.log("error data channel")
        };

        //Listen for ICE Candidates and send them to remote peers
        this.connection.onicecandidate = function(evt){
            if(!evt.candidate){ 
                return;
            }
            console.log("onicecandidate called");
            //Send the ICE Candidate to the remote peer
            if(evt.candidate){
                console.log("sending candidate",evt.candidate)
                this_obj.send_signal_message("candidate","candidate",evt.candidate)        
            }
        };
        //onaddstream handler to receive remote feed and show in remoteview video element
        this.connection.onaddstream = function(evt){
            console.log("onaddstream called");
        };    
    }

    send_message(_msg){
        this.remoteDataChannel.send(_msg);
    }
}