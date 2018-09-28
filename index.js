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

// var subjects = ["SUB_0", "SUB_1", "SUB_2"];
// var rooms = {};
// var roomCount = 0;

app.use(express.static(publicRoot));
app.use(bodyParser.json());

app.get("/", function(req, res){
	res.sendFile(publicRoot + "/host.html");
});

// app.get("/room/:roomID/", function(req, res){
// 	console.log(new Date() + " Serving room: " + req.params.roomID + " to " + req.query.username);
// 	console.log(rooms[req.params.roomID]);
// 	res.sendFile(publicRoot + "/quizzer-game.html");
// });

// app.post("/rooms/create/", function(req, res){
// 	//Check if request type is valid, and fields are valid
// 	if(req.body.type == null || req.body.username == null || req.body.subjectCode == null){
// 		res.send({
// 			type: "create-room-response",
// 			response: "null-fields",
// 			explanation: "One or more expected fields are empty or null"
// 		});
// 		return;
// 	}
// 	if(req.body.type != "create-room-request"){
// 		res.send({
// 			type: "create-room-response",
// 			response: "invalid-type",
// 			explanation: "Given request type is not valid for this endpoint"
// 		});
// 		return;
// 	}
// 	if(subjects.indexOf(req.body.subjectCode) <= -1){
// 		res.send({
// 			type: "create-room-response",
// 			response: "invalid-subject",
// 			explanation: "Given subjectCode is not valid/does not exist"
// 		});
// 		return;
// 	}
// 	if(req.body.username == ""){ //Could possibly replace to check for other stuff
// 		res.send({
// 			type: "create-room-response",
// 			response: "invalid-username",
// 			explanation: "Given username is not valid or is empty"
// 		});
// 		return;
// 	}

// 	//Now handle the request by making a room and returning the information
// 	var room = createCopy(createRoom(req.body.username, req.body.subjectCode));
// 	room.type = "create-room-response";
// 	room.response = "creation-success";
// 	res.send(room);
// });

// app.get("/rooms/get-info/", function(req, res){
// 	if(req.body.type == null || req.body.username == null || req.body.roomID == null){
// 		res.send({
// 			type: "get-room-info-response",
// 			response: "null-fields",
// 			explanation: "One or more expected fields are empty or null"
// 		});
// 		return;
// 	}
// 	if(req.body.type != "get-room-info-request"){
// 		res.send({
// 			type: "get-room-info-response",
// 			response: "invalid-type",
// 			explanation: "Given request type is not valid for this endpoint"
// 		});
// 		return;
// 	}
// 	// TODO: finish this resposne
// });

var server = http.createServer(app);
server.listen(port);

console.log(new Date() + " HTTP server listening on port " + port);

// var wss = new WebSocketServer({server: server});
// console.log(new Date() + " Websocket server created: " + JSON.stringify(wss.address()));

// wss.on("connection", function(ws) {
// 	if(ws.protocol != "meme-protocol"){
// 		console.log(new Date() + " Rejected connection");
// 		ws.close();
// 		return;
// 	}
// 	// var id = setInterval(function() {
// 	// 	ws.send(JSON.stringify(new Date()), function() {  });
// 	// }, 1000);
	
// 	var id = clientCount++;
// 	clients[id] = ws;
// 	console.log(new Date() + " Accepted connection [" + id + "]");

// 	ws.on("message", function(message){
// 		var messageObj = JSON.parse(message);
// 		switch(messageObj.type){
// 			case "ping":
// 				console.log(new Date() + " Recieved ping from [" + id + "]");
// 			break;
// 			case "message":
// 				for(var i in clients){
// 					clients[i].send(messageObj.message);
// 				}
// 			break;
// 		}

// 	});
	
// 	ws.on("close", function() {
// 		console.log(new Date() + " Websocket connection closed [" + id + "]");
// 		delete clients[id];
// 	});
// });

// function createRoom(username, subjectCode){
// 	var id = randomstring.generate({
// 			length: 5,
// 			charset: "alphabetic"
// 		});
// 	var password = randomstring.generate({
// 		length: 5,
// 		charset: "alphabetic"
// 	});
// 	var room = {
// 		id: id,
// 		owner: username,
// 		password: password,
// 		subjectCode: subjectCode,
// 		subjectName: getSubjectName(subjectCode),
// 		connectedUsers: []
// 	};

// 	if(rooms[id] == null){
// 		rooms[id] = room;
// 	} else {
// 		while(rooms[id] != null){
// 			id = randomstring.generate({
// 				length: 5,
// 				charset: "alphabetic"
// 			});
// 		}
// 		room.id = id;
// 		rooms[id] = room;
// 	}
	
	
// 	console.log(new Date() + " Created new room: " + room.id);

// 	return room;
// }

// function getSubjectName(subjectCode){
// 	switch(subjectCode){
// 		case "SUB_0":
// 			return "History";
// 		break;
// 		case "SUB_1":
// 			return "Math";
// 		break;
// 		case "SUB_2":
// 			return "Video Games";
// 		break;
// 		default:
// 			return "Subject not found";
// 		break;
// 	}
// }

// // Returns a copy of a javascript object by iterating over properties
// function createCopy(object){
// 	var copy = {};

// 	for(var prop in object){
// 		copy[prop] = object[prop];
// 	}

// 	return copy;
// }

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