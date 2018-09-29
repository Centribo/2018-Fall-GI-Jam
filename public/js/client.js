var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight * 0.9), 0.1, 1000 );
var inputBox;
var mousePressed;
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();



window.onload = function (){
	inputBox = document.getElementById("input-box");
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
}

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight * 0.9);
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
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