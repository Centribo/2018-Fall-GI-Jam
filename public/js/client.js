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
// Websockets
var roomID;
var ws = new WebSocket(location.origin.replace(/^http/, 'ws'), "ottertainment-protocol");
var heartbeatInterval = 10000;

// Game stuff
var gameState = 0;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;

const GameStates = {
	ERROR               : -1,
	WAITING_TO_CONNECT  :  0,
	CONNECTING          :  1,
	WAITING_FOR_START   :  2
};

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

function gameLoop(){
	window.requestAnimationFrame(gameLoop);
	
	currentTime = (new Date()).getTime();
	deltaMilli = (currentTime-lastTime);
	deltaTime = deltaMilli/1000.0;

	x += 1*deltaTime;

	if(deltaMilli > interval) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		switch(gameState){
			case GameStates.WAITING_TO_CONNECT:
				var x = 50;
				var y = canvas.height/2;
				ctx.font = "24px serif";
				ctx.fillText("Room ID: " + roomID, x, y);

			break;
		}
		
		
		lastTime = currentTime - (deltaMilli % interval);
	}
}

function onDocumentMouseDown(event) {
	// mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	// mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	mouse.x = event.clientX;
	mouse.y = event.clientY;
	mousePressed = true;

	if(mouse.y >= window.innerHeight * 0.9){ //Not in canvas
		return;
	}
	console.log(inputBox.value);
	joinGame(inputBox.value);
}
function onDocumentMouseUp(event) { mousePressed = false; syncframe = 0; }
function onDocumentMouseMove(event) { }

ws.onmessage = function(message) {
	console.log(message);
	var msg = JSON.parse(message.data);
	console.log(msg);
};

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

function joinGame(roomID){
	sendMessage({
		type: "message",
		action: "join",
		source: "player",
		roomID: roomID
	});
}