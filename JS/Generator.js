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
		    
		    var stats = {
		    	strength: 10,
		    	speed: 10,
		    	perception: 10,
		    	magic: 10
		    }
		    
		    var state = {};
		    
		    var inv = new Array();
		    var equipment = new Array();
		    
		    that.title = '';
		    that.image = new Image();
		    that.debugInfo = '';
		    
		    that.toString = function() {
		    	return that.title + ' ' + that.debugInfo;
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
		    	if (direction.horizontal > 0 && direction.horizontal > Math.abs(direction.vertical)) {
		            that.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT);
		        } else if (direction.horizontal < 0 && Math.abs(direction.horizontal) > Math.abs(direction.vertical)) {
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
		        //TODO: Create action cooldowns to prevent from spamming attacks...see weapon attack speed.
		        that.setPosition(
		        	that.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1)),
		        	that.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1))
		        );
		        
		        return that;
		    };
		    
		    that.setDebugInfo = function (txt) {
		    	that.debugInfo = txt;
		    	return that;
		    }
		    var _AI = function (that) {
		    	
		    };
		    
		    that.setAI = function (newAI) {
		    	_AI = newAI;
		    };
		    
		    that.Give = function(item) {
		    	inv.push(item);
		    }
		    
		    that.Equip = function(item) {
		    	inv.push(item);
		    	equipment.push(item);
		    }
		    
		    that.getAttackRange = function () {
		    	if(equipment[0]) {
		    		return equipment[0].range || 10;
		    	}
		    	return 0;
		    }
		    that.getAttackSpeed = function () {
		    	if(equipment[0]) {
		    		return equipment[0].speed || 500;
		    	}
		    	return 500;
		    }
		    
		    that.Attack = function () {
		    	TG.Engines.Debug.Log(that.title + ' attack with ' + inv[0].title + ' - ' + inv[0].damage + 'dmg');
		    };
		    
		    that.getStats = function() {
		    	return stats;
		    }
		}

	function oItem() {
		var that = this;
		
		that.title = 'sword';
		that.damage = 30;
		that.range = 20;
		that.speed = 300;
		that.level = 1;
		
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
			.setAI(TG.Engines.AI.hostile(GameObjects[0]));
		
		newNPC.title = inTitle;
		
		return newNPC;
	}
	
	function _Item() {
		var newItem = new oItem();
		
		return newItem;
	}
	
	return {
		Player: function () {
			return _Player();
		},
		NPC: function (inTitle) {
			return _NPC(inTitle);
		},
		Item: function () {
			return _Item();
		}	
	};
})();
