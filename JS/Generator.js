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
		    
		    var state = {};
		    
		    var inv = new Array();
		    
		    that.title = '';
		    that.image = new Image();
		    
		    that.toString = function() {
		    	return that.title;
		    }
		    
			that.setImage = function (imgSrc) {
		    	if(that.image.src != imgSrc) {
		    		that.image.src = imgSrc;
		    	}
		    	return that;
		    }
		    that.setDimensions = function(h, w) {
		    	that.height = h;
		    	that.width = w;
		    	return that;
		    }
		    
		    that.setPosition = function (x, y) {
		    	that.x = x;
		    	that.y = y;
		    	return that;
		    }
		    that.getPosition = function () {
		    	return {
		    		x: that.x,
		    		y: that.y
		    	}
		    }
		    
		    that.setMoving = function (move) {
		        if (move.vertical === 0) moving.vertical = 0;
		        if (move.horizontal === 0) moving.horizontal = 0;
		
		        moving.vertical = move.vertical ? move.vertical : moving.vertical;
		        moving.horizontal = move.horizontal ? move.horizontal : moving.horizontal;
		    };
		
		    that.setRun = function (run) {
		        moving.running = run;
		    };
		    
		    that.setState = function(inState) {
		    	state = inState;
		    	return state;
		    }
		    
		    that.getState = function () {
		    	return state;
		    }
		    
		    that.setFacing = function(direction) {
		    	if (direction.horizontal > 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT);
		        } else if (direction.horizontal < 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageLEFT);
		        } else if (direction.vertical > 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageDOWN);
		        } else if (direction.vertical < 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageUP);
		        }
		    }
		    
		    that.MoveOneStep = function () {
		    	if(_AI) _AI(that);
		
		        that.setFacing(moving);
		        
		        that.setPosition(
		        	that.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS),
		        	that.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS)
		        );
		    };
		    
		    var _AI = function (that) {
		    	
		    };
		    
		    that.setAI = function (newAI) {
		    	_AI = newAI;
		    };
		    
		    that.Attack = function () {
		    	
		    };
		}

	function _Player() {
		var newPlayer = new oNPC();
		newPlayer
			.setPosition(0,0)
			.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT)
			.setDimensions(16, 16);
			
		newPlayer.title = 'Player';
			
		return newPlayer;
	}
	
	function _NPC (inTitle) {
		var newNPC = new oNPC();
		
		newNPC
			.setPosition((Math.random() % 100) * 1000, (Math.random() % 100) * 300)
			.setImage(TG.Engines.GlobalVars._PlayerImageDOWN)
			.setDimensions(16, 16)
			.setAI(TG.Engines.AI.wander());//.setAI(TG.Engines.AI.pace(50, {vertical: 0, horizontal: 0}));
		
		newNPC.title = inTitle;
		
		return newNPC;
	}
	
	return {
		Player: function () {
			return _Player();
		},
		NPC: function (inTitle) {
			return _NPC(inTitle);
		}		
	};
})();
