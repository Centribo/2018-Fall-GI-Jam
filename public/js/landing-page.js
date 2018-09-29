function createGame(){
	var message = {
		request: "create-room"
	};

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function(e) {
		if (this.readyState == 4 && this.status == 200) {
			// Response ready
			var response = JSON.parse(this.responseText);
			console.log(response);
			if(response.response){
				hostGame(response.id);
			} else {
				console.log("Unable to create room");
			}

		} else if (this.readyState == 4 && this.status != 200){
			console.log(this.status);
		}
	};
	xhttp.open("POST", location.origin + "/rooms/create", true);
	xhttp.setRequestHeader("Content-type", "application/json");
	xhttp.send(JSON.stringify(message));
}

function joinGame(){
	console.log("Join a game!");
}

function hostGame(id){
	window.location = window.location.origin + "/host?id=" + id;
}
