'use strict';
function rObject(imgSrc, imgWidth, imgHeight, posX, posY) {
	var that = this;
	
	that.image = new Image();
	that.image.src = imgSrc;
	
	that.width = imgWidth;
	that.height = imgHeight;
	
	that.x = posX;
	that.y = posY;
	
	that.setPosition = function (x, y) {
		that.x = x;
		that.y = y;
	}
}


