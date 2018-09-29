var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate();

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