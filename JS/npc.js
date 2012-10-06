function oGameObject(inX, inY, inHeight, inWidth) {
    var that = this;
    
    that.x = inX;
    that.y = inY;
    
    that.height = inHeight;
    that.width = inWidth;
    
    that.imgSrc = inImageSrc;
    
    that.image = new Image();
    that.image.src = inImageSrc;
    
    that.setPosition = function (x, y) {
    	that.x = x;
    	that.y = y;
    }
}

oVisibleObject.prototype = new oGameObject();
//inherit game object from oGameObject and use the TG.Engines.Game.GameObjects to manage location/interation instead of TG.Engines.Render.drawings

function oNPC() {
	var that = this;
	
	var moving = {
        vertical: 0,
        horizontal: 0,
        left: false,
        right: false,
        up: false,
        down: false,
        running: false
    }
    
	that.setImage = function (imgSrc) {
    	that.image.src = imgSrc;
    }
    
    that.setPosition = function (x, y) {
    	that.x = x;
    	that.y = y;
    }
    
    that.SetMoving = function (move) {
        if (move.vertical === 0) moving.vertical = 0;
        if (move.horizontal === 0) moving.horizontal = 0;

        moving.vertical = move.vertical ? move.vertical : moving.vertical;
        moving.horizontal = move.horizontal ? move.horizontal : moving.horizontal;
    };

    that.SetRun = function (run) {
        moving.running = run;
    };
    
    that.MoveOneStep = function () {
    	moving.left = (Math.random() % 10 == 1);
    	moving.right = (Math.random() % 10 == 1);
    	moving.up = (Math.random() % 10 == 1);
    	moving.down = (Math.random() % 10 == 1);
    }
}
