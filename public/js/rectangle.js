class Rectangle {
	constructor(x, y, w, h){
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
	}

	isInBounds(xPos, yPos){
		return xPos > this.x && 
			xPos < this.x + this.width && 
			yPos < this.y + this.height && 
			yPos > this.y;
	}
}