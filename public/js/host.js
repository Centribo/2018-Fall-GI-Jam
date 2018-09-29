// var scene = new THREE.Scene();
// var camera = new THREE.OrthographicCamera(window.innerWidth/2, window.innerWidth/-2, window.innerHeight/2, window.innerHeight/-2, 0.1, 1000 );

// var renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// document.body.appendChild( renderer.domElement );

// var fontLoader = new THREE.FontLoader();
// var font = fontLoader.load(
// 	// resource URL
// 	'fonts/Sniglet_Regular.json',

// 	// onLoad callback
// 	function (font) {
// 		// do something with the font
// 		var textGeometry = new THREE.TextGeometry("Patrick Sullivan", {
// 			font: font,
// 			size: 40,
// 			height: 15
// 		});
// 		var textMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
// 		var textMesh = new THREE.Mesh(textGeometry, textMaterial);
// 		textMesh.position.z = -1;
// 		scene.add(textMesh);
// 	},

// 	// onProgress callback
// 	function (xhr) {
// 		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
// 	},

// 	// onError callback
// 	function (err) {
// 		console.log( 'An error happened', err );
// 	}
// );



// function animate() {
// 	requestAnimationFrame(animate);
// 	renderer.render( scene, camera );
// }
// animate();

// Canvas
// var canvas = document.getElementById("main-canvas");
// var ctx = canvas.getContext("2d");
// ctx.canvas.width  = window.innerWidth;
// ctx.canvas.height = window.innerHeight;

// ctx.fillStyle = 'rgb(200, 0, 0)';
// ctx.fillRect(10, 10, 50, 50);

var vendors = ['webkit', 'moz'];
for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

var canvas = document.getElementById('main-canvas'),
ctx = null,
fps = 60,
interval     =    1000/fps,
lastTime     =    (new Date()).getTime(),
currentTime  =    0,
deltaMilli = 0;

if (typeof (canvas.getContext) !== undefined) {
	ctx = canvas.getContext('2d');
	ctx.canvas.width  = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	gameLoop();
}

var x = 0;

function gameLoop(){
	window.requestAnimationFrame(gameLoop);
	
	currentTime = (new Date()).getTime();
	deltaMilli = (currentTime-lastTime);
	deltaTime = deltaMilli/1000.0;

	x += 1*deltaTime;

	if(deltaMilli > interval) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = "48px serif"
		ctx.fillText("Hello World!", x, canvas.height/2);
		
		lastTime = currentTime - (deltaMilli % interval);
	}
}

// Websockets
var roomID;
var ws = new WebSocket(location.origin.replace(/^http/, 'ws'), "ottertainment-protocol");
var heartbeatInterval = 10000;

ws.onmessage = function(message) {
	console.log(message);
	var msg = JSON.parse(message.data);
	console.log(msg);
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