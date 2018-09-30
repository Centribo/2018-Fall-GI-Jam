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

var ROOM_SIZE = 2;
var rooms = {};
var roomCount = 0;
const GameStates = {
	ERROR               : -1,
	WAITING_FOR_PLAYERS :  0,
	WAITING_FOR_START   :  1
};

app.use(express.static(publicRoot));
app.use(bodyParser.json());

// HTML endpoints
app.get("/", function(req, res){
	res.sendFile(publicRoot + "/landing-page.html");
});
app.get("/host/", function(req, res){
	if(rooms[req.query.roomID] != null){
		res.sendFile(publicRoot + "/host.html");
	} else {
		res.sendFile(publicRoot + "/no-room.html");
	}
});
app.get("/player/", function(req, res){
	res.sendFile(publicRoot + "/client.html");
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
	
	var id = clientCount++;
	clients[id] = ws;
	console.log(new Date() + " Accepted connection [" + id + "]");

	ws.on("message", function(message){
		var msg = JSON.parse(message);
		switch(msg.type){
			case "ping":
				console.log(new Date() + " Received ping from [" + id + "]");
			break;
			case "message":
				switch(msg.action){
					case "join":
						if(rooms[msg.roomID] != null){
							if(msg.source == "host"){ // Host joining room

								rooms[msg.roomID].host = ws;
								console.log(new Date() + " Host joined room: " + msg.roomID);

							} else if(msg.source == "player"){ // Player attempts to join room
								var response = { 
									type: "message",
									action: "join",
									source: "server"
								};
								if(rooms[msg.roomID].players.length >= ROOM_SIZE){ // Too many players
									response["joined"] = false;
									response["reason"] = "Too many players";

									ws.send(JSON.stringify(response));
									return;
								}

								ws.id = id;
								// Add player to room, and add room to player
								rooms[msg.roomID].players.push(ws);
								clients[id].room = msg.roomID;
								clients[id].name = null;
								
								if(rooms[msg.roomID].players.length == ROOM_SIZE){
									rooms[msg.roomID].gameState = GameStates.WAITING_FOR_START;
								}
								console.log(new Date() + " Player: " + id +  " joined room: " + msg.roomID);
								
								// Send responses
								response["joined"] = true;
								response["id"] = id;
								response["roomID"] = msg.roomID;
								ws.send(JSON.stringify(response));

								if(rooms[msg.roomID].host != null && rooms[msg.roomID].host.readyState == 1){
									rooms[msg.roomID].host.send(JSON.stringify(response));
								}
							}
						} else {
							var response = { 
								type: "message",
								action: "join",
								source: "server",
								joined: false,
								reason: "Room does not exist"
							};
							ws.send(JSON.stringify(response));
						}
					break;
					case "name-change":
						console.log(msg);
						if(rooms[msg.roomID] != null && msg.source == "player"){
							if(rooms[msg.roomID].host != null){
								var response = { 
									type: "message",
									action: "name-change",
									source: "server",
									roomID: msg.roomID,
									name: msg.name,
									id: msg.id
								};
								if(rooms[msg.roomID].host.readyState == 1){
									rooms[msg.roomID].host.send(JSON.stringify(response));
								}
							}
						}
					break;
					default: // Forward messages
						if(msg.source == "host"){
							if(msg.id != null){ //Send to specific player (This is super gross, but whatever. KISS)
								msg.source = "server";
								clients[msg.id].send(JSON.stringify(msg));
							} else { //Echo to all players
								msg.source = "server";
								for(i in rooms[msg.roomID].players){
									rooms[msg.roomID].players[i].send(JSON.stringify(msg));
								}
							}
							
						}
					break;
				}
				// for(var i in clients){
				// 	clients[i].send(msg.message);
				// }
			break;
		}

	});
	
	ws.on("close", function() {
		var roomID = clients[id].room;
		if(roomID != null){
			for(i in rooms[roomID].players){
				if(rooms[roomID].players[i].id == id){
					// delete rooms[roomID].players[i];
					rooms[roomID].players.splice(i, 1);
				}
			}

			console.log(new Date() + " Player " + id + " left room " + roomID);

			var response = { 
				type: "message",
				action: "leave",
				source: "server",
				id: id,
				roomID: roomID
			};
			if(rooms[roomID].host.readyState == 1){
				rooms[roomID].host.send(JSON.stringify(response));
			}
		}
		console.log(new Date() + " Websocket connection closed [" + id + "]");
		delete clients[id];
	});
});

function createRoom(){
	var id = randomstring.generate({
			length: 5,
			charset: "alphabetic",
			capitalization: "uppercase"
		});

	var room = {
		id: id,
		players: [],
		gameState: GameStates.WAITING_FOR_HOST,
		host: null
	};

	while(rooms[id] != null){
		id = randomstring.generate({
			length: 5,
			charset: "alphabetic",
			capitalization: "uppercase"
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

function findClient(id){
	for(i in clients){
		console.log(clients[i]);
		if(i == id){
			return clients[i];
		}
	}
	return null;
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