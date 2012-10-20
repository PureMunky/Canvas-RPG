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
		
		function oSex(title) {
			var that = this;
			that.title = title;
			
			that.toString = function () {
				return that.title + (that.state.pregnant || '');
			}
		}
		
		var _Sex = {
			male: function () {
				var rtnMale = new oSex('male');
				
				rtnMale.state = {
					
				};
				
				return rtnMale;
			},
			female: function () {
				var rtnFemale = new oSex('female');
				
				rtnFemale.state = {
					pregnant: false
				};
				
				rtnFemale.giveBirth = function () {
					return TG.Engines.Generate.NPC('baby', TG.Engines.Generate.Sex.Female());
				}
				
				return rtnFemale;
			}
		}
		
		//oNPC.prototype = new oGameObject();
		function oNPC(inTitle, inSex) {
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
		    
		    that.stats = {
		    	strength: 10,
		    	speed: 10,
		    	perception: 10,
		    	magic: 10
		    }
		    
		    that.DNA = {
		    	strength: 10,
		    	speed: 10,
		    	perception: 10,
		    	magic: 10
		    }
		    
		    var state = {
		    	AI: {},
		    	Core: {},
		    	Environment: {}
		    };
		    
		    var inv = new Array();
		    var equipment = new Array();
		    
		    that.title = inTitle;
		    that.image = new Image();
		    that.debugInfo = '';
		    that.sex = inSex;

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
		    
		    that.setAIState = function(inState) {
		    	state.AI = inState;
		    	return state;
		    }
		    
		    that.getAIState = function () {
		    	return state.AI;
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
		    	_TickClean();
		    	if(_AI) _AI(that, state.AI);
		    	
		        that.setFacing(moving);
		        
		        that.setPosition(
		        	that.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1)),
		        	that.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1))
		        );
		        
		        that.setDebugInfo(that.sex.toString());
		        return that;
		    };
		    
		    that.setDebugInfo = function (txt) {
		    	that.debugInfo = txt;
		    	return that;
		    }
		    
		    var _AI = function (that) {
		    	
		    };
		    
		    var _TickClean = function () {
		    	state.Core.attackCooldown = state.Core.attackCooldown || 0;
		    	
				if(state.Core.attackCooldown > 0) state.Core.attackCooldown--;
				that.setDebugInfo(state.Core.attackCooldown);
		    }
		    
		    that.setAI = function (newAI) {
		    	_AI = newAI;
		    };
		    
		    that.Inventory = {
		    	Give: function(item) {
		    		inv.push(item);
		    	},
		    	Equip: function(item) {
		    		inv.push(item);
		    		equipment.push(item);
		    	},
		    	PrimaryWeapon: function() {
		    		return equipment[0];
		    	}
		    };
		    
		    that.Combat = {
		    	Attack: function () {
		    		if(state.Core.attackCooldown <= 0) {
		    			var w = that.Inventory.PrimaryWeapon();
						state.Core.attackCooldown = w.speed;
						TG.Engines.Debug.Log(that.title + ' attack with ' + w.title + ' - ' + w.damage + 'dmg');
					}
		    	}
		    };
		    
		}

	function oItem() {
		var that = this;
		
		that.title = 'sword';
		that.damage = 30;
		that.range = 20;
		that.speed = 300;
		that.level = 1;
		
	}
	
	function _Player(inName, inSex) {
		var newPlayer = new oNPC(inName, inSex);
		newPlayer
			.setPosition(0,0)
			.setImage(TG.Engines.GlobalVars._PlayerImageRIGHT)
			.setDimensions(16, 16);
			
		//newPlayer.title = 'Player';
			
		return newPlayer;
	}
	
	function _NPC (inTitle, inSex) {
		var newNPC = new oNPC(inTitle, inSex);
		
		newNPC
			.setPosition((Math.random() % 100) * 1000, (Math.random() % 100) * 300)
			.setImage(TG.Engines.GlobalVars._PlayerImageDOWN)
			.setDimensions(16, 16)
			.setAI(TG.Engines.AI.hostile(GameObjects[0]));
		
		//newNPC.title = inTitle;
		
		return newNPC;
	}
	
	function _Item() {
		var newItem = new oItem();
		
		return newItem;
	}
	
	return {
		Player: function (inName, inSex) {
			return _Player(inName, inSex);
		},
		NPC: function (inTitle, inSex) {
			return _NPC(inTitle, inSex);
		},
		Item: function () {
			return _Item();
		},
		Sex: {
			Male: function() {
				return _Sex.male();
			},
			Female: function() {
				return _Sex.female();
			}
		}
	};
})();
