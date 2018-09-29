var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(window.innerWidth/2, window.innerWidth/-2, window.innerHeight/2, window.innerHeight/-2, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var fontLoader = new THREE.FontLoader();
var font = fontLoader.load(
	// resource URL
	'fonts/Sniglet_Regular.json',

	// onLoad callback
	function (font) {
		// do something with the font
		var textGeometry = new THREE.TextGeometry("Patrick Sullivan", {
			font: font,
			size: 40,
			height: 15
		});
		var textMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
		var textMesh = new THREE.Mesh(textGeometry, textMaterial);
		textMesh.position.z = -1;
		scene.add(textMesh);
	},

	// onProgress callback
	function (xhr) {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},

	// onError callback
	function (err) {
		console.log( 'An error happened', err );
	}
);



function animate() {
	requestAnimationFrame(animate);
	renderer.render( scene, camera );
}
animate();

Canvas
var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

ctx.fillStyle = 'rgb(200, 0, 0)';
ctx.fillRect(10, 10, 50, 50);