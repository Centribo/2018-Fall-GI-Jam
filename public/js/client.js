// Canvas stuff
var vendors = ['webkit', 'moz'];
var inputBox = document.getElementById("input-box");
var canvas = document.getElementById('main-canvas'),
ctx = null,
fps = 60,
interval     =    1000/fps,
lastTime     =    (new Date()).getTime(),
currentTime  =    0,
deltaMilli = 0;

// Websocket stuff
// Websockets
var roomID;
var ws = new WebSocket(location.origin.replace(/^http/, 'ws'), "ottertainment-protocol");
var heartbeatInterval = 10000;

// Game stuff
var gameState = 0;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var buttons = [];
var name;
var id;
var playerID;
var currentQuestion = "";

const GameStates = {
	ERROR               : -1,
	WAITING_TO_CONNECT  :  0,
	CONNECTING          :  1,
	SETTING_NAME        :  2,
	WAITING_FOR_START   :  3,
	WAIITING            :  4,
	WAITING_FOR_ANSWER  :  5,
	VOTING              :  6
};

// ******************
// Startup:
// ******************
for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	window.cancelAnimationFrame =
		window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

if (typeof (canvas.getContext) !== undefined) {
	ctx = canvas.getContext('2d');
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight * 0.9;
	gameLoop();
}
var joinButton = new Button(ctx.canvas.width * 0.25, ctx.canvas.height * 0.25, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, "orange");
joinButton.onclick = joinGame;
buttons.push(joinButton);

function gameLoop(){
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	window.requestAnimationFrame(gameLoop);
	
	currentTime = (new Date()).getTime();
	deltaMilli = (currentTime-lastTime);
	deltaTime = deltaMilli/1000.0;

	if(deltaMilli > interval) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		switch(gameState){
			case GameStates.WAITING_TO_CONNECT:
				var x = canvas.width/2 - canvas.width*0.25;
				var y = canvas.height/2 - canvas.height*0.25 - 30;
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				ctx.fillText("Enter room ID at bottom of page", x, y);
				ctx.fillStyle = joinButton.colour;
				ctx.fillRect(joinButton.x, joinButton.y, joinButton.width, joinButton.height);
				ctx.fillStyle = "#000000";
				var text = "Connect to Room!";
				x = canvas.width/2 - (ctx.measureText(text).width/2);
				y = canvas.height/2;
				ctx.fillText(text, x, y);
			break;
			case GameStates.SETTING_NAME:
				var x = canvas.width/2 - canvas.width*0.25;
				var y = canvas.height/2 - canvas.height*0.25 - 30;
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				ctx.fillText("Enter your name!", x, y);
				for(i in buttons){
					ctx.fillStyle = buttons[i].colour;
					ctx.fillRect(buttons[i].x, buttons[i].y, buttons[i].width, buttons[i].height);
				}
				ctx.fillStyle = "#000000";
				var text = "Set name!";
				x = canvas.width/2 - (ctx.measureText(text).width/2);
				y = canvas.height/2;
				ctx.fillText(text, x, y);
			break;
			case GameStates.WAIITING:
			case GameStates.WAITING_FOR_START:
				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				var text = name + ", you are otter #" + playerID;
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height * 0.2;
				ctx.fillText(text, x, y);

				// Draw otter

				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				text = "Please wait...";
				x = canvas.width/2 - ctx.measureText(text).width/2;
				y = canvas.height * 0.8;
				ctx.fillText(text, x, y);
			break;
			case GameStates.WAITING_FOR_ANSWER:
				
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

ws.onmessage = function(message) {
	var msg = JSON.parse(message.data);
	console.log(msg);

	if(msg.type != "message"){
		console.log("Unknown message received.");
		return;
	}
	switch(msg.action){
		case "join":
			if(msg.joined){
				id = msg.id;
				roomID = msg.roomID;
				gameState = GameStates.SETTING_NAME;
				var b = new Button(ctx.canvas.width * 0.25, ctx.canvas.height * 0.25, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, "#00FF00");
				b.onclick = function (){
					if(inputBox.value == ""){
						return;
					}
					name = inputBox.value;
					var msg = {
						type: "message",
						action: "name-change",
						source: "player",
						name: name,
						id: id,
						roomID: roomID
					};
					sendMessage(msg);
					inputBox.value = "";
					deleteButton(b);
					gameState = GameStates.WAITING_FOR_START;
				}
				buttons.push(b);
			} else {
				alert("Room does not exist or room is full, try again.");
				gameState = GameStates.WAITING_TO_CONNECT;
				joinButton = new Button(ctx.canvas.width * 0.25, ctx.canvas.height * 0.25, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, "orange");
				joinButton.onclick = joinGame;
				buttons.push(joinButton);
			}
		break;
		
		case "set-player-id":
			playerID = msg.playerID;
		break;

		case "new-question":
			if(playerID == msg.playerIDA || playerID == msg.playerIDB){
				currentQuestion = msg.question;
				gameState = GameStates.WAITING_FOR_ANSWER;
					var b = new Button(0, ctx.canvas.height * 0.9, ctx.canvas.width, ctx.canvas.height * 0.1, "#00FF00");
					b.onclick = function (){
						startGame();
						deleteButton(b);
					}
					buttons.push(b);
				console.log(currentQuestion);
			}
		break;
	} //switch
}; //onmessage

ws.onopen = function(event){
	clearInterval(heartbeatInterval);
	heartbeatInterval = setInterval(heartbeat, heartbeatInterval);

	var urlParams = new URLSearchParams(window.location.search);
	roomID = urlParams.get("id");
	sendMessage({
		type: "message",
		action: "Join",
		source: "Host",
		id: roomID
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

function joinGame(roomID = inputBox.value){
	if(roomID == ""){
		return;
	}
	sendMessage({
		type: "message",
		action: "join",
		source: "player",
		roomID: roomID
	});
	deleteButton(joinButton);
	gameState = GameStates.CONNECTING;
	inputBox.value = "";
}

function deleteButton(button){
	for(i in buttons){
		if(buttons[i] == button){
			delete buttons[i];
			buttons.splice(i, 1);
		}
	}
}