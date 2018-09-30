// Canvas stuff
var vendors = ['webkit', 'moz'];
var canvas = document.getElementById('main-canvas'),
ctx = null,
fps = 60,
interval     =    1000/fps,
lastTime     =    (new Date()).getTime(),
currentTime  =    0,
deltaMilli = 0;

// Websocket stuff
var roomID;
var ws = new WebSocket(location.origin.replace(/^http/, 'ws'), "ottertainment-protocol");
var heartbeatInterval = 10000;

// Game stuff
var ROOM_SIZE = 4;
var players = [];
var gameState = 0;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var buttons = [];
const GameStates = {
	ERROR               : -1,
	WAITING_FOR_PLAYERS :  0,
	WAITING_FOR_START   :  1
};

for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	window.cancelAnimationFrame =
		window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}


if (typeof (canvas.getContext) !== undefined) {
	ctx = canvas.getContext('2d');
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	gameLoop();
}

function gameLoop(){
	window.requestAnimationFrame(gameLoop);
	
	currentTime = (new Date()).getTime();
	deltaMilli = (currentTime-lastTime);
	deltaTime = deltaMilli/1000.0;

	x += 1*deltaTime;

	if(deltaMilli > interval) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		switch(gameState){
			case GameStates.WAITING_FOR_PLAYERS:
				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				var x = canvas.width/2 - ctx.measureText("Room ID: XXXXX").width/2;
				var y = canvas.height/2 - 100;
				ctx.fillText("Room ID: " + roomID, x, y);

				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				for(i in players){
					// var text = "[" + players[i].id + "] : " + players[i].name;
					var text = "Otter #" + players[i].playerID + ": " + players[i].name + " [" + players[i].id + "]";
					x = canvas.width/2 - ctx.measureText(text).width/2;
					ctx.fillText(text, x, y+30 + (i*26));
				}

				var playersNamesSet = true;
				for(i in players){
					if(players[i].name == null){
						playersNamesSet = false;
					}
				}

				if(players.length >= ROOM_SIZE && playersNamesSet){
					gameState = GameStates.WAITING_FOR_START;
					var b = new Button(0, ctx.canvas.height * 0.9, ctx.canvas.width, ctx.canvas.height * 0.1, "#00FF00");
					b.onclick = function (){
						var msg = {
							type: "message",
							action: "start-game",
							source: "host",
							roomID: roomID
						};
						sendMessage(msg);
						deleteButton(b);
					}
					buttons.push(b);
				}
			break;
			case GameStates.WAITING_FOR_START:
				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				var x = canvas.width/2 - ctx.measureText("Room ID: XXXXX").width/2;
				var y = canvas.height/2 - 100;
				ctx.fillText("Room ID: " + roomID, x, y);

				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				for(i in players){
					// var text = "[" + players[i].id + "] : " + players[i].name;
					var text = "Otter #" + players[i].playerID + ": " + players[i].name + " [" + players[i].id + "]";
					x = canvas.width/2 - ctx.measureText(text).width/2;
					ctx.fillText(text, x, y+30 + (i*26));
				}

				for(i in buttons){
					ctx.fillStyle = buttons[i].colour;
					ctx.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);
				}
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				var text = "Start!"
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height*0.95 + 24/2;
				ctx.fillText(text, x, y);
			break;
		}
		
		lastTime = currentTime - (deltaMilli % interval);
	}	
}

canvas.onmousedown = function(event){
	// mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	mouseX = event.x;
	mouseY = event.y;
	mousePressed = true;

	// if(mouseY >= window.innerHeight * 0.9){ //Not in canvas
	// 	return;
	// }
	
	for(i in buttons){
		if(buttons[i].isInBounds(mouseX, mouseY)){
			buttons[i].onclick();
		}
	}
}
canvas.onmouseup = function(event) { mousePressed = false; syncframe = 0; }
canvas.onmousemove = function(event) { 
	// console.log(event);
}

// Websockets
ws.onmessage = function(message) {
	// console.log(message);
	var msg = JSON.parse(message.data);
	if(msg.type == "message"){
		switch(msg.action){
			case "join":
				if(players.length >= ROOM_SIZE){
					return;
				}

				var playerID = getRandomInt(0, ROOM_SIZE);
				var p = getPlayerByPlayerID(playerID);
				while(p != null){
					playerID = getRandomInt(0, ROOM_SIZE);
					p = getPlayerByPlayerID(playerID);
				}
				
				var playerEntry = {
					id: msg.id,
					name: null,
					playerID: playerID
				};
				players.push(playerEntry);

				console.log("Player joined: " + msg.id + ", given playerID: " + playerID);
				sendMessage({
					type: "message",
					action: "set-player-id",
					source: "host",
					roomID: roomID,
					id: msg.id,
					playerID: playerID
				});
			break;
			case "leave":
				console.log("Player left: " + msg.id);
				for(i in players){
					if(players[i].id == msg.id){
						players.splice(i, 1);
					}
				}
			break;
			case "name-change":
				for(i in players){
					if(players[i].id == msg.id){
						players[i].name = msg.name;
					}
				}
			break;
		}

		console.log(players);
	}
	// console.log(msg);
};

ws.onopen = function(event){
	clearInterval(heartbeatInterval);
	heartbeatInterval = setInterval(heartbeat, heartbeatInterval);
	
	var urlParams = new URLSearchParams(window.location.search);
	roomID = urlParams.get("roomID");
	sendMessage({
		type: "message",
		action: "join",
		source: "host",
		roomID: roomID
	});
}

function sendMessage(message){
	if(typeof message != "string"){
		message = JSON.stringify(message);
	}
	if(ws.readyState != 1){
		closeConnection();
		return false;
	}
	try {
		ws.send(message);
	} catch (error){
		closeConnection();
	}
}

function sendPing(){
	var message = {
		type: "ping",
		time: Date.now()
	};
	if(ws.readyState != 1){
		closeConnection();
		return false;
	}
	ws.send(JSON.stringify(message));
}

function closeConnection(){
	ws.close();
	clearInterval(heartbeatInterval);
}

function heartbeat(){
	sendPing();
}

function deleteButton(button){
	for(i in buttons){
		if(buttons[i] == button){
			delete buttons[i];
			buttons.splice(i, 1);
		}
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}

function getPlayerByPlayerID(playerID){
	for(i in players){
		if(players[i].playerID == playerID){
			return players[i];
		}
	}

	return null;
}

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