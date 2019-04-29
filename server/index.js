const express = require("express");
const app = express();
const hostname = "127.0.0.1";
const port = 8090;

var http = require('http').Server(app);
var io = require("socket.io")(http);
app.use(express.static('../client/'));
var active_client={}

io.on('connection', function(client){
    let clientIp = client.request.connection.remoteAddress
    console.log("Connection established!",clientIp,client.id);
    active_client[client.id]={ip:clientIp,socket:client}


    client.on("candidate", function(msg){
        console.log("candidate message recieved!");
        client.broadcast.emit("candidate", msg);
    });
    client.on("sdp", function(msg){
        console.log("sdp message broadcasted!");
        client.broadcast.emit("sdp", msg);
    });
    client.on("desc", function(desc){
        console.log("description received!");
        client.broadcast.emit("desc", desc);
    });
    client.on("answer", function(answer){
        console.log("answer broadcasted");
        client.broadcast.emit("answer", answer);
    });
    client.on("call_me",function(_msg){
        console.log("call me recevied",_msg)
        client.broadcast.emit("call_me", _msg);
    })

    client.on('disconnect', function() {
		console.log('Got disconnect! from ',client.request.connection.remoteAddress);
		delete active_client[client.id];
   });
});

app.get('*', function (req, res) {
    console.log("http connection request...");
		res.sendFile('/client/index.html');
});

http.listen(port, hostname);