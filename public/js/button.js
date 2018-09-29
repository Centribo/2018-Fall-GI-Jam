class Button extends Rectangle {
	constructor(x, y, w, h, c = "#000000"){
		super(x, y, w, h);
		this.colour = c;
	}

	click(){
		if(this.onclick != null){
			this.onclick();
		}
	}
}