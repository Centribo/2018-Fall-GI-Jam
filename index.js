var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var bodyParser = require("body-parser");
var randomstring = require("randomstring");
var app = express();
var port = process.env.PORT || 5000;

var clients = {};
var clientCount = 0;
var publicRoot = __dirname + "/public";

var rooms = {};
var roomCount = 0;

app.use(express.static(publicRoot));
app.use(bodyParser.json());

// HTML endpoints
app.get("/", function(req, res){
	res.sendFile(publicRoot + "/landing-page.html");
});
app.get("/host/", function(req, res){
	if(rooms[req.query.id] != null){
		console.log(new Date() + " Host joining: " + req.query.id);
		res.sendFile(publicRoot + "/host.html");
	} else {
		console.log(new Date() + " Host attempted to join: " + req.query.id);
		res.sendFile(publicRoot + "/no-room.html");
	}
});

// API endpoints
app.post("/rooms/create/", function(req, res){
	// TODO in future: Check if message is safe, not null, etc.
	// KISS for now.

	var reponse;

	if(req.body.request == "create-room"){
		response = createCopy(createRoom());
		response["response"] = true;
	} else {
		response = {
			reponse: false
		};
	}

	res.send(response);
});

var server = http.createServer(app);
server.listen(port);

console.log(new Date() + " HTTP server listening on port " + port);

var wss = new WebSocketServer({server: server});
console.log(new Date() + " Websocket server created: " + JSON.stringify(wss.address()));

wss.on("connection", function(ws) {
	if(ws.protocol != "ottertainment-protocol"){
		console.log(new Date() + " Rejected connection");
		ws.close();
		return;
	}
	// var id = setInterval(function() {
	// 	ws.send(JSON.stringify(new Date()), function() {  });
	// }, 1000);
	
	var id = clientCount++;
	clients[id] = ws;
	console.log(new Date() + " Accepted connection [" + id + "]");

	ws.on("message", function(message){
		var messageObj = JSON.parse(message);
		switch(messageObj.type){
			case "ping":
				console.log(new Date() + " Received ping from [" + id + "]");
			break;
			case "message":
				for(var i in clients){
					clients[i].send(messageObj.message);
				}
			break;
		}

	});
	
	ws.on("close", function() {
		console.log(new Date() + " Websocket connection closed [" + id + "]");
		delete clients[id];
	});
});

function createRoom(){
	var id = randomstring.generate({
			length: 5,
			charset: "alphabetic"
		});

	var room = {
		id: id,
		connectedUsers: []
	};

	while(rooms[id] != null){
		id = randomstring.generate({
			length: 5,
			charset: "alphabetic"
		});
	}
	room.id = id;
	rooms[id] = room;
	
	
	console.log(new Date() + " Created new room: " + room.id);

	return room;
}

// Returns a copy of a javascript object by iterating over properties
function createCopy(object){
	var copy = {};

	for(var prop in object){
		copy[prop] = object[prop];
	}

	return copy;
}

// var http = require("http");
// var WebSocketServer = require("ws").Server;
// var express = require('express');
// var path = require("path");
// var app = express();

// var server = http.createServer(app);
// var clientCount = 0;
// var clients = {}; 

// app.use(express.static("public"));
// app.get('/', function(req, res){
// 	// res.send("Hello world!");
// 	res.sendFile(path.join(__dirname + "/index.html"));
// });

// app.listen(process.env.PORT || 3000, () => console.log('Example app listening on port 80!'));

// var wss = new WebSocketServer({
// 	server: server
// });

// console.log("websocket server created");

// wss.on("connection", function(ws) {
// 	console.log(ws);

// 	var id = setInterval(function() {
// 		ws.send(JSON.stringify(new Date()), function() {  })
// 	}, 1000);

// 	console.log("websocket connection open");

// 	ws.on("close", function() {
// 		console.log("websocket connection close");
// 		clearInterval(id);
// 	});
// })

// server.listen(3000, function(){
// 	console.log(new Date() + " Server is listening on port 3000!");
// });

// wsServer = new WebSocketServer({
// 	httpServer: server
// });

// wsServer.on("request", function(req){
// 	if(req.requestedProtocols.indexOf("protocol-one") <= -1){
// 		req.reject(404, "Rejected protocol");
// 		return;
// 	}
// 	var connection = req.accept("protocol-one", req.origin);
// 	var id = clientCount++;
// 	clients[id] = connection;
// 	console.log(new Date() + " Accepted connection [" + id + "]");

// 	connection.on("message", function(message){
// 		var msgString = message.utf8Data;
// 		for(var i in clients){
// 			clients[i].sendUTF(msgString);
// 		}
// 	});

// 	connection.on("close", function(reason, description){
// 		delete clients[id];
// 		console.log(new Date() + " peer " + connection.remoteAddress + " disconnected.");
// 	});
// });

// app.use(express.static("public"));
// app.get('/', function(req, res){
// 	// res.send("Hello world!");
// 	res.sendFile(path.join(__dirname + "/index.html"));
// });

// app.listen(process.env.PORT || 80, () => console.log('Example app listening on port 80!'));