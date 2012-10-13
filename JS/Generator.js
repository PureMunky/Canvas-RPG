var Generator = (function (){
		function oGameObject(inX, inY, inHeight, inWidth) {
		    var that = this;
		    
		    that.x = inX;
		    that.y = inY;
		    
		    that.height = inHeight;
		    that.width = inWidth;
		    
		    
		    that.setDimensions = function(h, w) {
		    	that.height = h;
		    	that.width = w;
		    }
		    
		    that.setPosition = function (x, y) {
		    	that.x = x;
		    	that.y = y;
		    }
		}
	
		oNPC.prototype = new oGameObject();
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
		    that.image = new Image();
		    
			that.setImage = function (imgSrc) {
		    	that.image.src = imgSrc;
		    	return that;
		    }
		    
		    that.setPosition = function (x, y) {
		    	that.x = x;
		    	that.y = y;
		    	return that;
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

	function _Player() {
		var newPlayer = new oNPC();
		newPlayer
			.setPosition(0,0)
			.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT)
			.setDimensions(16, 16);
			
		return newPlayer;
	}
	
	function _NPC () {
		var newNPC = new oNPC();
		
		newNPC
			.setPosition((Math.random() % 100) * 1000, (Math.random() % 100) * 1000)
			.setImage(TG.Engines.GlobalVars._PlayerImageDOWN)
			.setDimensions(16, 16);
		
		return newNPC;
	}
	
	return {
		Player: function () {
			return _Player();
		},
		NPC: function () {
			return _NPC();
		}		
	};
})();
