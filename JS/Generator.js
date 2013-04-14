TG.Engines.Generate = (function(that) {
	function oPosition(inX, inY) {
		this.x = inX;
		this.y = inY;
	}
	
	function oGameObject(inX, inY, inHeight, inWidth) {
		var that = this;
		
		var _position = new oPosition(inX, inY);

		that.height = inHeight;
		that.width = inWidth;

		that.setDimensions = function(h, w) {
			that.height = h;
			that.width = w;
		}

		that.setPosition = function(x, y) {
			that.x = x;
			that.y = y;
		}
	}

	function oSex(title) {
		var that = this;
		that.title = title;

		that.toString = function() {
			return that.title + (that.state.pregnant || '');
		}
	}

	function oNPC(inTitle, inSex, inPosition) {
		var that = this;
		var properties = {
			food: false,
			sexA: inSex.title == 'male' ? 'female' : 'male',
			sexB: inSex.title == 'male' ? 'male' : 'female'
		};
		that.getProperties = function (getName, getEquals) {
			getEquals = getEquals || true;
			
			if(getName) {
				return (properties[getName] == getEquals);
			} else {
				return properties;
			}
		};
		
		var moving = {
			vertical : 0,
			horizontal : 0,
			left : false,
			right : false,
			up : false,
			down : false,
			running : false
		};
		
		that.setMoving = function(move) {
			if (move.vertical === 0)
				moving.vertical = 0;
				
			if (move.horizontal === 0)
				moving.horizontal = 0;

			moving.vertical = !!move.vertical ? move.vertical : moving.vertical;
			moving.horizontal = !!move.horizontal ? move.horizontal : moving.horizontal;
			
			if(moving.vertical != 0 || moving.horizontal != 0) {
			    _render.setAnimation('walk');
			} else {
			    // TODO: Prevent idle animation from firing when dead. Maybe set up a "what is the character doing" function.
			    _render.setAnimation('idle');
			}
		};
		that.setRun = function(run) {
			moving.running = run;
		};

		var DNA = {
			strength : 10,
			speed : 10,
			perception : 10,
			magic : 10
		};
		that.getDNA = function() {
			return DNA;
		}
		
		var state = {
			AI : {},
			Core : {},
			Environment : {},
			Combat : {
				HP : 1000,
				MaxHP : 1000
			},
			Needs: {
				Food: 430,
				Water: 450,
				Sleep: 400,
				Sex: 400
			},
			Memory: new Array(),
			consious: 'awake'
		};
		that.Sleepy = function () {
			return (state.Needs.Sleep <= 400);
		};
		that.Hungry = function () {
			return (state.Needs.Food <= 400);
		};
		that.Thirsty = function () {
			return (state.Needs.Water <= 400);
		};
		that.Eat = function (amount) {
			state.Needs.Food += amount;
		};
		that.Drink = function (amount) {
			state.Needs.Water += amount;
		}
		that.Is = {
			Horny: function () {
				return (state.Needs.Sex <= 200);
			}
			
		};
		
		var inv = new Array();
		var equipment = new Array();
		that.title = inTitle;
		that.sex = inSex;
		
		that.getInventory = function () {
			return inv;
		}

		that.toString = function() {
			return that.title + ' HP: ' + Math.round(state.Combat.HP) + '/' + Math.round(state.Combat.MaxHP) + that.debugInfo;
		}
		
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
		that.getPosition = function() {
			return _position;
		}
		var _posHistory = new Array();
		
		var _render = TG.Engines.Animation.Player();
		that.getRender = function() {
			var rtnRender = _render.CurrentFrame();
			rtnRender.x = _position.x;
			rtnRender.y = _position.y;
			
			return rtnRender;
		}

		that.setFacing = function(direction) {
			if (direction.horizontal > 0 && direction.horizontal > Math.abs(direction.vertical)) {
			    _render.imageX = 0;
			} else if (direction.horizontal < 0 && Math.abs(direction.horizontal) > Math.abs(direction.vertical)) {
				_render.imageX = 32;
			} else if (direction.vertical > 0) {
			    _render.imageX = 16;
			} else if (direction.vertical < 0) {
			    _render.imageX = 48;
			}
		};
		
		that.setAnimationFrame = function (inFrameNumber) {
		    _render.imageY = inFrameNumber * _render.height;
		}
		
		that.incAnimationFrame = function (inTotalFrames) {
		    _render.imageY += _render.height;
		    if (_render.imageY >= (_render.height * 4)) _render.imageY = 0;
		}

		that.MoveOneStep = function() {			
			_TickClean();
			_TickNeeds();
			if (_AI)
				_AI(that, state.AI);

			that.setFacing(moving);
            //that.incAnimationFrame(4);
           	_render.Tick();
           	
			_position.x = _position.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));
			_position.y = _position.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));
			
			_posHistory[TG.Engines.Game.CurrentHistoryLocation] = clone(_position); //{x: _position.x || 0, y: _position.y || 0};
			
			return that;
		};
		
		that.SetPositionAt = function(historyLocation) {
			_position.x = _posHistory[historyLocation].x;
			_position.y = _posHistory[historyLocation].y;
		}
		
		var _TickClean = function() {
			state.Core.attackCooldown = state.Core.attackCooldown || 0;

			if (state.Core.attackCooldown > 0) state.Core.attackCooldown--;
		}
		var _TickNeeds = function() {
			state.Needs.Food -= (state.Needs.Food > 0.0) ? .1 : 0;
			state.Needs.Water -= (state.Needs.Water > 0.0) ? .1 : 0;
			state.Needs.Sleep -= (state.Needs.Sleep > 0.0) ? .1 : 0;
			state.Needs.Sex -= (state.Needs.Sex > 0.0) ? .1 : 0;
			
			if(state.Needs.Food <= 100) that.Combat.ReduceHP(.1, 'Starvation');
			if(state.Needs.Water <= 100) that.Combat.ReduceHP(.1, 'Dehydration');
		}

		that.debugInfo = '';
		that.setDebugInfo = function(txt) {
			that.debugInfo = txt;
			return that;
		}
		var _AI = function(that) {

		};
		that.setAI = function(newAI) {
			_AI = newAI;
		};
		
		var stats = {
			strength : 10,
			speed : 10,
			perception : 10,
			magic : 10
		}
		that.Can = {
			See : function(o) {
				return (stats.perception * 10 ) > TG.Engines.Game.Distance.Between(that, o);
			},
			Attack : function(o) {
				return (that.Combat.Range() > TG.Engines.Game.Distance.Between(that, o));
			},
			Interact: function (o) {
				return (30 > TG.Engines.Game.Distance.Between(that, o));
			}
		}

		that.Inventory = {
			Give : function(item) {
				inv.push(item);
			},
			Equip : function(item) {
				inv.push(item);
				equipment.push(item);
			},
			PrimaryWeapon : function() {
				// TODO: when no weapon is equiped default to fists.
				return equipment[0];
			},
			Use: function (inItem) {
				for (var i = 0; i < inv.length; i++) {
					var found = false;
					if (inv[i] == inItem && !found) {
						found = true;
						inv.splice(i, 1);
						inItem.Use(that);
					}	
				}
				
			}
		};
		
		that.Combat = {
			Attack : function() {
				if (state.Core.attackCooldown <= 0) {
					var w = that.Inventory.PrimaryWeapon();
					state.Core.attackCooldown = w.speed;
					_render.setAnimation('attackMelee');
					var hitObjects = TG.Engines.Game.Distance.Within(that, that.Combat.Range(), function(acted) {
						acted.Combat.HitFor(that);
				        that.Inventory.PrimaryWeapon().XPUp();
					});
					TG.Engines.Debug.Log(that.title + ' attack with ' + w.title + ' - ' + that.Combat.Damage() + 'dmg');
				}
			},
			Damage : function() {
				var w = that.Inventory.PrimaryWeapon();
				return (stats.strength * w.getDamage());
			},
			Range : function() {
				var w = that.Inventory.PrimaryWeapon();
				return (w.range);
			},
			HitFor: function(attacker) {
			    var dmg = (attacker.Combat.Damage() - that.Defence.DamageReduction());
			    
			    that.Combat.ReduceHP(dmg);
				
			},
			ReduceHP: function(amount, source) {
				if (amount >= state.Combat.HP) {
					that.Interact.Say(source);
			        state.Combat.HP = 0;
			        that.setAI(TG.Engines.AI.still());
			        _render.setAnimation('dead');
			    } else {
			     state.Combat.HP -= amount;    
			    }
			}
		};

		that.Interact = {
			Perform: function () {
				var hitObjects = TG.Engines.Game.Distance.Within(that, 30, function(acted) {
					acted.Interact.Receive(that, that.Interact.Say(Comm.greetingpositive));
				});
			},
			Receive: function (performer, conversation) {
				// TODO: Open Dialog
				// that.Interact.Say('Hello ' + performer.title + ' (from ' + that.title + ')');
				that.Interact.Say(conversation);
				TG.Engines.Relationships.Mate(that, performer);
			},
			Say: function (saying) {
				if(typeof saying == 'string') {
					that.speak = saying;
				} else if(typeof saying == 'object') {
					that.speak = saying.say;
				}
				return saying;
			}
		}
		that.Defence = {
			DamageReduction : function() {
				return 0;
			}
		};
	}

	function oPlant(inTitle, inPosition) {
		var that = {};
		
		that.title = inTitle;
		that.toString = function () {
			return that.title + ' ' + Math.round(amount);
		};
		
		var amount = 3000;
		
		var properties = {
			food: true
		};
		that.getProperties = function (getName) {
			if(getName) {
				return properties[getName];
			} else {
				return properties;
			}
		};
		
		var _render = TG.Engines.Animation.Plant();
		_render.setAnimation('slowBreeze');
		that.getRender = function() {
			var rtnRender = _render.CurrentFrame();
			rtnRender.x = _position.x;
			rtnRender.y = _position.y;

			return rtnRender;
		}
		
		that.MoveOneStep = function () {
			_render.Tick();
			
			amount += .001;
			
			properties['food'] = true;
			
		}
		
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
		that.getPosition = function() {
			return _position;
		}
		
		that.Combat = {
			HitFor: function(attacker) {
				if(TG.Engines.Game.Distance.Between(attacker, that) < 30) {
					amount -= 800;
					if (amount <= 0) {
						amount = 0;
						properties.food = false;
					}
					attacker.Eat(800);	
				}
			}
		}
		
		that.Interact = {
			Receive: function (performer) {
				if(TG.Engines.Game.Distance.Between(performer, that) < 30) {
					performer.Interact.Say(Comm.eat);
					amount -= 800;
					if (amount <= 0) {
						amount = 0;
						properties.food = false;
					} else {
						performer.Inventory.Give(Items.Consumables.Corn(800))
					}
					
					
				}
			}
		}
		return that;
	}
	
	function oWater(inTitle, inPosition) {
		var that = this;
		
		that.title = inTitle;
		that.toString = function () {
			return that.title + ' ' + Math.round(amount);
		};
		
		var amount = 5000;
		
		var properties = {
			water: true
		};
		that.getProperties = function (getName) {
			if(getName) {
				return properties[getName];
			} else {
				return properties;
			}
		};
		
		var _render = TG.Engines.Animation.Plant();
		_render.setAnimation('slowBreeze');
		that.getRender = function() {
			var rtnRender = _render.CurrentFrame();
			rtnRender.x = _position.x;
			rtnRender.y = _position.y;

			return rtnRender;
		}
		
		that.MoveOneStep = function () {
			_render.Tick();
			amount += .001;
			
			properties['water'] = true;
		}
		
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
		that.getPosition = function() {
			return _position;
		}
		
		that.Combat = {
			HitFor: function(attacker) {
				if(TG.Engines.Game.Distance.Between(attacker, that) < 30) {
					amount -= 700;
					if (amount <= 0) {
						amount = 0;
						properties.water = false;
					}
					attacker.Drink(700);	
				}
			}
		}
		
		that.Interact = {
			Receive: function (performer) {
				if(TG.Engines.Game.Distance.Between(performer, that) < 30) {
					performer.Interact.Say(Comm.drink);
					amount -= 700;
					if (amount <= 0) {
						amount = 0;
						properties.food = false;
					} else {
						performer.Inventory.Give(Items.Consumables.Water(700))	
					}
					
					
				}
			}
		}
		return that;
	}
	
	function oItem(inTitle, inDamage, inRange, inSpeed, inType, inProperties, inUse) {
		var that = this;

		that.title = inTitle || 'Fist';
		that.damage = inDamage || 5;
		that.range = inRange || 10;
		that.speed = inSpeed || 10;
		that.type = inType || 'melee';
		
		var level = 1;
		var XP = 0;
		
		var properties = {
			item: true
		};
		properties[inType] = true;
		
		that.getProperties = function (getName) {
			if(getName) {
				return properties[getName];
			} else {
				return properties;
			}
		};
		
		that.getDamage = function () {
		    return that.damage * level;
		}
		
		that.Use = function (target) {
			switch(that.type) {
				case 'food':
					target.Eat(that.damage);
					break;
				case 'water': 
					target.Drink(that.damage);
					break;
				}
		}
		
		that.XPUp = function() {
		    XP++;
		}
	}
	
	var Items = {
	    Weapons: {
	        Fist:  function () { return new oItem('Fist', 5, 10, 10);},
	        Sword: function () { return new oItem('Sword', 30, 20, 10);},
	        BigSword: function () { return new oItem('Sword', 30, 50, 10);},
	        Bow:   function () { return new oItem('Bow', 20, 200, 50, 'ranged');}
	    },
	    Consumables: {
	    	Corn: function (amount) { return new oItem('Corn', amount, 0, 0, 'food');},
	    	Water: function (amount) { return new oItem('Water', amount, 0, 0, 'water');}
	    }
	}

// object defaults
	function _Player(inName, inSex, inPosition) {
		var newPlayer = new oNPC(inName, inSex, inPosition);

		newPlayer.Inventory.Equip(Items.Weapons.BigSword());

		return newPlayer;
	}

	function _NPC(inTitle, inSex, inPosition) {
		var newNPC = new oNPC(inTitle, inSex, inPosition);

		//newNPC.setAI(TG.Engines.AI.hostile(TG.Engines.Game.Player()));
		newNPC.setAI(TG.Engines.AI.normal());
		newNPC.Inventory.Equip(Items.Weapons.Fist());

		return newNPC;
	}

	var _Sex = {
		male : function() {
			var rtnMale = new oSex('male');

			rtnMale.state = {

			};

			return rtnMale;
		},
		female : function() {
			var rtnFemale = new oSex('female');

			rtnFemale.state = {
				pregnant : false
			};

			rtnFemale.giveBirth = function() {
				return TG.Engines.Generate.NPC('baby', TG.Engines.Generate.Sex.Female());
			}

			return rtnFemale;
		}
	}
	
	var _Corn = function (inPosition) {
		var newPlant = new oPlant('Corn', inPosition);
		
		return newPlant;
	}
	
	var _Water = function (inPosition) {
		var newWater = new oWater('Water', inPosition);
		
		return newWater;
	}
	
	function _Item() {
		var newItem = new oItem();

		return newItem;
	}

	that = {
		Player : function(inName, inSex, inPosition) {
			return _Player(inName, inSex, inPosition);
		},
		NPC : function(inTitle, inSex, inPosition) {
			return _NPC(inTitle, inSex, inPosition);
		},
		Item : function() {
			return _Item();
		},
		Sex : {
			Male : function() {
				return _Sex.male();
			},
			Female : function() {
				return _Sex.female();
			}
		}, 
		Plant: {
			Corn: function (inPosition) {
				return _Corn(inPosition);
			}
		},
		Water: function (inPosition) {
			return _Water(inPosition);
		}
	};
	
	return that;
})(TG.Engines.Generate || {});

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}
