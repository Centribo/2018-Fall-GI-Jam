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
var ROOM_SIZE = 2;
var players = [];
var questionPairs = [];
var questionNumber = 0;
var currentQuestion = "????";
var currentQuestionPlayerA = -1;
var currentQuestionPlayerB = -1;
var questionAnswerA = null;
var questionAnswerB = null;
var votes = {};
var gameState = 0;
var mouseX = 0;
var mouseY = 0;
var mousePressed = false;
var buttons = [];
var timer = 0;
var mapImage = new Image();
mapImage.src = "../art/bg_spaces.png";
var playerImages = [
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	},
	{
		face: new Image(),
		side: new Image()
	}
];

for(let i = 0; i < ROOM_SIZE; i++){
	playerImages[i].face.src = "../art/Character/" + i + "face.png";
	playerImages[i].side.src = "../art/Character/" + i + "side.png";
}


const GameStates = {
	ERROR               : -1,
	WAITING_FOR_PLAYERS :  0,
	WAITING_FOR_START   :  1,
	MAP_SCREEN          :  2,
	PRE_BATTLE          :  3,
	BATTLE_START        :  4,
	WAITING_FOR_ANSWERS :  5,
	WAITING_FOR_VOTES   :  6,
	SHOWING_VOTES       :  7,
	GAME_OVER           :  8
};
const TimeLimits = {
	MAP_SCREEN          :  10.0,
	PRE_BATTLE          :  1.0,
	BATTLE_START        :  1.0,
	WAITING_FOR_ANSWERS :  30.0,
	WAITING_FOR_VOTES   :  20.0,
	SHOWING_VOTES       :  10.0
}

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
	// ctx.canvas.width  = window.innerWidth;
	// ctx.canvas.height = window.innerHeight;
	window.requestAnimationFrame(gameLoop);
	
	currentTime = (new Date()).getTime();
	deltaMilli = (currentTime-lastTime);
	deltaTime = deltaMilli/1000.0;
	timer += deltaTime;

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
						startGame();
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
			case GameStates.MAP_SCREEN:
				ctx.fillStyle = "#116DD0";
				var originX = canvas.width/2;
				var originY = canvas.height/2;
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.drawImage(mapImage, originX - mapImage.naturalWidth/2, originY - mapImage.naturalHeight/2);

				if(timer >= TimeLimits.MAP_SCREEN){
					timer = 0;
					gameState = GameStates.PRE_BATTLE;
				}
			break;
			case GameStates.PRE_BATTLE:
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				var text = "PRE BATTLE SCREEN GOES HERE (Draw otters on map), OTTER #" + questionPairs[questionNumber].playerIDA + " VS OTTER #" + questionPairs[questionNumber].playerIDB;
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height*0.95 + 24/2;
				ctx.fillText(text, x, y);

				if(timer >= TimeLimits.PRE_BATTLE){
					timer = 0;
					gameState = GameStates.BATTLE_START;
				}
			break;
			case GameStates.BATTLE_START:
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				var text = "BATTLE START SCREEN GOES HERE (Draw the two otters), OTTER #" + questionPairs[questionNumber].playerIDA + " VS OTTER #" + questionPairs[questionNumber].playerIDB;
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height*0.95 + 24/2;
				ctx.fillText(text, x, y);

				if(timer >= TimeLimits.BATTLE_START){
					sendQuestion(questionNumber);
					questionNumber ++;
					timer = 0;
					gameState = GameStates.WAITING_FOR_ANSWERS;
				}
			break;
			case GameStates.WAITING_FOR_ANSWERS:
				// Draw question
				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				var text = currentQuestion;
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height*0.25 - 48/2;
				ctx.fillText(text, x, y);

				// Draw placeholders
				text = "?????";
				x = canvas.width*0.25 - ctx.measureText(text).width/2;
				y = canvas.height*0.8 - 48/2;
				ctx.fillText(text, x, y);
				x = canvas.width*0.75 - ctx.measureText(text).width/2;
				y = canvas.height*0.8 - 48/2;
				ctx.fillText(text, x, y);

				// Draw timer
				text = "" + (TimeLimits.WAITING_FOR_ANSWERS - timer).toFixed(1);
				x = canvas.width/2 - ctx.measureText(text).width/2;
				y = canvas.height/2 - 48/2;
				ctx.fillText(text, x, y);
				
				if(timer >= TimeLimits.WAITING_FOR_ANSWERS){
					sendMessage({
						type: "message",
						action: "end-question",
						source: "host",
						playerIDA: currentQuestionPlayerA,
						playerIDB: currentQuestionPlayerB,
						answerA: questionAnswerA,
						answerB: questionAnswerB,
						question: currentQuestion,
						roomID: roomID
					});

					for(let i = 0; i < ROOM_SIZE; i++){
						votes = {};
						if(i != currentQuestionPlayerA && i != currentQuestionPlayerB){
							votes[i] = null;
						}
					}

					timer = 0;
					gameState = GameStates.WAITING_FOR_VOTES;
				}
			break;

			case GameStates.WAITING_FOR_VOTES:
				// Draw question
				ctx.fillStyle = "#000000";
				ctx.font = "48px Life-Is-Messy";
				var text = currentQuestion;
				var x = canvas.width/2 - ctx.measureText(text).width/2;
				var y = canvas.height*0.25 - 48/2;
				ctx.fillText(text, x, y);

				// Draw answers
				text = questionAnswerA;
				x = canvas.width*0.25 - ctx.measureText(text).width/2;
				y = canvas.height*0.8 - 48/2;
				ctx.fillText(text, x, y);

				text = questionAnswerB;
				x = canvas.width*0.75 - ctx.measureText(text).width/2;
				y = canvas.height*0.8 - 48/2;
				ctx.fillText(text, x, y);

				// Draw timer
				text = "" + (TimeLimits.WAITING_FOR_VOTES - timer).toFixed(1);
				x = canvas.width/2 - ctx.measureText(text).width/2;
				y = canvas.height/2 - 48/2;
				ctx.fillText(text, x, y);
				
				if(timer >= TimeLimits.WAITING_FOR_VOTES){
					sendMessage({
						type: "message",
						action: "end-voting",
						source: "host",
						roomID: roomID
					});

					for(let i = 0; i < ROOM_SIZE; i++){
						if(votes[i] != null){
							addScore(votes[i], 100);
						}
					}

					timer = 0;
					gameState = GameStates.SHOWING_VOTES;
				}
			break;
			case GameStates.SHOWING_VOTES:
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				var text = "";
				var startX = ctx.canvas.width/2;
				var startY = ctx.canvas.height*0.3;

				var x = 0;
				var y = 0;

				for(let i = 0; i < ROOM_SIZE; i++){
					if(votes[i] != null){
						text = getPlayerByPlayerID(i).name + " voted for " + getPlayerByPlayerID(votes[i]).name;
						x = (-1) * (ctx.measureText(text).width / 2);
						y = i * 25;
						ctx.fillText(text, startX + x, startY + y);
					}
				}

				if(timer >= TimeLimits.SHOWING_VOTES){
					votes = {};
					if(questionNumber >= ROOM_SIZE/2){
						endGame();
					} else {
						timer = 0;
						gameState = GameStates.MAP_SCREEN;
					}
				}
			break;

			case GameStates.GAME_OVER:			
				ctx.fillStyle = "#000000";
				ctx.font = "24px Life-Is-Messy";
				var text = "";
				var startX = ctx.canvas.width/2;
				var startY = ctx.canvas.height*0.3;

				var x = 0;
				var y = 0;

				for(i in players){
					var placement = 0;
					placement += i;
					placement ++;
					text = "#" + placement + ": " + players[i].name + " with " + players[i].score + " points!";
					x = (-1) * (ctx.measureText(text).width / 2);
					y = i * 25;
					ctx.fillText(text, startX + x, startY + y);
				}
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
					playerID: playerID,
					score: 0
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
			case "answer":
				if(msg.playerID == currentQuestionPlayerA){
					questionAnswerA = msg.answer;
				}
				if(msg.playerID == currentQuestionPlayerB){
					questionAnswerB = msg.answer;
				}
				console.log(questionAnswerA, questionAnswerB);
			break;
			case "vote":
				votes[msg.playerID] = msg.vote;
			break;
		}
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

var questions = [
	"Fill in the blank: Everyone who knows me knows that I _____.",
	"Fill in the blank: Making games is as easy as _____.",
	"Fill in the blank: _____ got be fired from my last job.",
	"Who would make a great president of the United States?",
	"Who would make a great prime minister of Canada?",
	"What's the best example of \"the bigger the better\"?",
	"What's the best topping on pizza?",
	"What's the best spaghetti sauce?",
	"Never stick this in your mouth:",
	"What is something you should never reveal on a first date?"
];

function startGame(){
	var msg = {
		type: "message",
		action: "start-game",
		source: "host",
		roomID: roomID
	};
	// sendMessage(msg);

	// Assume ROOM_SIZE is divisible by 2 (we can make pairs)
	var playerOrder = [];
	for(let i = 0; i <= ROOM_SIZE-1; i++){
		playerOrder.push(i);
	}
	shuffleArray(playerOrder);
	shuffleArray(questions);
	for(let i = 0; i <= ROOM_SIZE/2 - 1; i++){
		questionPairs.push({
			playerIDA: playerOrder[i],
			playerIDB: playerOrder[ROOM_SIZE-1-i],
			question: questions[i]
		});
	}
	console.log(questionPairs);

	questionNumer = 0;
	timer = 0;
	gameState = GameStates.MAP_SCREEN;
}

// Taken from: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

function sendQuestion(i){
	// Note, this sends it to all clients, could be optimized to only send to the two players, but whatever KISS
	var msg = {
		type: "message",
		action: "new-question",
		source: "host",
		roomID: roomID,
		playerIDA: questionPairs[i].playerIDA,
		playerIDB: questionPairs[i].playerIDB,
		question: questionPairs[i].question
	};
	currentQuestion = questionPairs[i].question;
	currentQuestionPlayerA = questionPairs[i].playerIDA;
	currentQuestionPlayerB = questionPairs[i].playerIDB;
	sendMessage(msg);
}

function addScore(playerID, score){
	for(i in players){
		if(playerID == players[i].playerID){
			players[i].score += score;
		}
	}
}

function endGame(){
	players.sort(playerScoreCompare);
	console.log(players);
	gameState = GameStates.GAME_OVER;
	sendMessage({
		type: "message",
		action: "end-game",
		source: "host",
		roomID: roomID,
		scores: players
	});
	ws.close();
}

function playerScoreCompare(a, b){
	if(a.score > b.score){
		return -1;
	}
	if(a.score < b.score){
		return 1;
	}
	return 0;
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