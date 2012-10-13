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
		    
		    var state = {};
		    
		    that.title = '';
		    that.image = new Image();
		    
		    that.toString = function() {
		    	return that.title + ': ' + state.moving;
		    }
		    
			that.setImage = function (imgSrc) {
		    	that.image.src = imgSrc;
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
		    
		    that.MoveOneStep = function () {
		    	if(_AI) _AI(that);
		    	
		    	var vPan, hPan, vMove, hMove;

		        hPan = 0;
		        vPan = 0;
		        hMove = moving.horizontal;
		        vMove = moving.vertical;
		
		        if (hMove > 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT);
		        } else if (hMove < 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageLEFT);
		        } else if (vMove > 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageDOWN);
		        } else if (vMove < 0) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageUP);
		        }
		        
		        that.setPosition(that.x + (hMove * TG.Engines.GlobalVars._STEPPIXELS), that.y + (vMove * TG.Engines.GlobalVars._STEPPIXELS));
		    };
		    
		    var _AI = function (that) {
		    	
		    };
		    
		    that.setAI = function (newAI) {
		    	_AI = newAI;
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
			.setAI(function (that) {
				var state = that.getState();
				
				if(state.initialized) {
					state.moveTick++;
					if (state.moveLoop == state.moveTick) {
						state.moveTick = 0;
						state.moving = state.moving * -1;
						that.setMoving({
							vertical: state.moving,
							horizontal: 0
						});
					}
				} else {
					state.initialized = true;
					state.moveLoop = 200;
					state.moveTick = 0;
					state.moving = 1;
					that.setMoving({
						vertical: 1,
						horizontal: 0
					});
				}
				
				that.setState(state);
			});
		
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
