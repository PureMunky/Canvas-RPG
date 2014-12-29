TG.Engines.Generate = (function (that) {
    'use strict';

    // Generic position object
    function oPosition(inX, inY) {
		this.x = inX;
		this.y = inY;
	}
	
    // Generic Game object
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

    // Generic sex object.
	function oSex(title) {
		var that = this;
		that.title = title;

		that.toString = function() {
			return that.title + (that.state.pregnant || '');
		}
	}

    // Generic NPC Object
	function oNPC(inTitle, inSex, inPosition) {
		var that = this;

        // various properties of an NPC.
		var properties = {
			food: false,
			sexA: inSex.title == 'male' ? 'female' : 'male',
			sexB: inSex.title == 'male' ? 'male' : 'female'
		};

        // Gets and tests a property for data.
		that.getProperties = function (getName, getEquals) {
			getEquals = getEquals || true;
			
			if(getName) {
				return (properties[getName] == getEquals);
			} else {
				return properties;
			}
		};
		
        // Data about the npc's movement.
		var moving = {
			vertical : 0,
			horizontal : 0,
			left : false,
			right : false,
			up : false,
			down : false,
			running : false
		};
		
        // Set movement.
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

        // Set if NPC is running.
		that.setRun = function(run) {
			moving.running = run;
		};

        // General stats for the NPC.
		var DNA = {
			strength : 10,
			speed : 10,
			perception : 10,
			magic : 10
		};

        // get DNA
		that.getDNA = function() {
			return DNA;
		}
		
	    // state for the NPC
        // This should probably be broken up into different state types.
		var state = {
			AI : {},
			Core : {},
			Environment : {},
			TickCount: 0, 
			Combat : {
				HP : 1000.0,
				MaxHP : 1000.0,
				Energy : 100.0,
				MaxEnergy : 100.0
			},
			Needs: {
				Food: 150,
				Water: 150,
				Sleep: 150,
				Sex: 1000
			},
			Memory: new Array(),
			consious: 'awake'
		};

        // returns if the npc needs to sleep.
		that.Sleepy = function () {
			return (state.Needs.Sleep <= 400);
		};
        
        // returns if the npc needs to eat.
		that.Hungry = function () {
			return (state.Needs.Food <= 400);
		};

        // returns if the npc needs to drink.
		that.Thirsty = function () {
			return (state.Needs.Water <= 400);
		};

        // Eats the amount specified.
		that.Eat = function (amount) {
			state.Needs.Food += amount;
		};

        // Drinks the ammount specified.
		that.Drink = function (amount) {
			state.Needs.Water += amount;
		}

        // generic Is function for various needs.
		that.Is = {
			Horny: function () {
				return (state.Needs.Sex <= 200);
			}
			
		};
		
        // inventory array.
		var inv = new Array();

        // equipment
		var equipment = new Array();

        // NPC's title/name
		that.title = inTitle;

        // NPC's sex
		that.sex = inSex;
		
        // returns the inventory.
		that.getInventory = function () {
			return inv;
		}

        // display for the NPC
		that.toString = function() {
			return that.title + ' HP: ' + Math.round(state.Combat.HP) + '/' + Math.round(state.Combat.MaxHP) + ' En: ' + Math.round(state.Combat.Energy) + that.debugInfo;
		}
		
        // current position
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);

        // gets the current position
		that.getPosition = function() {
			return _position;
		}

        // stores the history of the npc's position
		var _posHistory = new Array();
		
		// TODO: improve how to determine what render an npc gets
        // Specify what render sheet to use for the npc.
		var _render = (inTitle == 'Player') ? TG.Engines.Animation.Demo() : (inSex == 'male') ? TG.Engines.Animation.NPCMale() : TG.Engines.Animation.NPCFemale();
		if(inTitle == 'Pony') _render = TG.Engines.Animation.NPCPony();
		
        // returns the current render information.
		that.getRender = function() {
			var rtnRender = _render.CurrentFrame();
			rtnRender.x = _position.x;
			rtnRender.y = _position.y;
			
			return rtnRender;
		}

        // sets the direction the NPC is facing
		that.setFacing = function(direction) {
			if (direction.horizontal > 0 && direction.horizontal > Math.abs(direction.vertical)) {
			    // DOWN
			    _render.imageY = 64;
			} else if (direction.horizontal < 0 && Math.abs(direction.horizontal) > Math.abs(direction.vertical)) {
				// LEFT
				_render.imageY = 32;
			} else if (direction.vertical > 0) {
				// Down
			    _render.imageY = 0;
			} else if (direction.vertical < 0) {
				// UP
			    _render.imageY = 96;
			}
		};
		
        // sets the current frame of animation.
		that.setAnimationFrame = function (inFrameNumber) {
		    _render.imageY = inFrameNumber * _render.height;
		}
		
        // increments the animation frame to the next frame.
		that.incAnimationFrame = function (inTotalFrames) {
		    _render.imageY += _render.height;
		    if (_render.imageY >= (_render.height * 4)) _render.imageY = 0;
		}

        // what to execute on a single tick of the clock
		that.MoveOneStep = function() {			
			_TickClean();
			_TickNeeds();
			state.TickCount = (state.TickCount >= 50) ? 0 : state.TickCount + 1;
			
            // evaluate the current state of AI every so many ticks.
			if(state.TickCount == 0) {
				if (_AI)
					_AI(that, state.AI);
			}
			
            // correct the facing if the movement has changed.
			that.setFacing(moving);
            
            //that.incAnimationFrame(4);
           	_render.Tick();
           	
            // Update the position of the render.
			_position.x = _position.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));
			_position.y = _position.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));
			
            // write the position to history.
			_posHistory[TG.Engines.Game.CurrentHistoryLocation] = clone(_position); //{x: _position.x || 0, y: _position.y || 0};

			return that;
		};
		
        // resets the position back to it was a previous time.
		that.SetPositionAt = function(historyLocation) {
			_position.x = _posHistory[historyLocation].x;
			_position.y = _posHistory[historyLocation].y;
		}
		
        // cleans up 
		var _TickClean = function() {
			state.Core.attackCooldown = state.Core.attackCooldown || 0;

			if (state.Core.attackCooldown > 0) state.Core.attackCooldown--;
		}

        // increments the NPC's needs
		var _TickNeeds = function() {
			if(state.consious == 'sleeping') {
				state.Needs.Food -= (state.Needs.Food > 0.0) ? .01 : 0;
				state.Needs.Water -= (state.Needs.Water > 0.0) ? .01 : 0;
				state.Needs.Sleep += (state.Needs.Sleep < 1000.0) ? 1 : 0;
			} else {
				state.Needs.Food -= (state.Needs.Food > 0.0) ? .1 : 0;
				state.Needs.Water -= (state.Needs.Water > 0.0) ? .1 : 0;
				state.Needs.Sleep -= (state.Needs.Sleep > 0.0) ? .1 : 0;
				state.Needs.Sex -= (state.Needs.Sex > 0.0) ? .1 : 0;
			}
			
			if (state.Combat.Energy < state.Combat.MaxEnergy) {
				var baseEnergy = .1;
				
				if(state.Needs.Food > 700) baseEnergy += .1;
				if(state.Needs.Water > 700) baseEnergy += .1;
				if(state.Needs.Sleep > 700) baseEnergy += .1;
				
				state.Combat.Energy += baseEnergy;
				
				if(state.Combat.Energy > state.Combat.MaxEnergy) state.Combat.Energy = state.Combat.MaxEnergy;
			}
			
			
			if(state.Needs.Food <= 100) that.Combat.ReduceHP(.1, 'Starvation');
			if(state.Needs.Water <= 100) that.Combat.ReduceHP(.1, 'Dehydration');
		}

        // debug info for this NPC
		that.debugInfo = '';
		that.setDebugInfo = function(txt) {
			that.debugInfo = txt;
			return that;
		}

        // current AI for the NPC
		var _AI = function(that) {

		};

        // Sets a new AI
		that.setAI = function(newAI) {
			_AI = newAI;
		};
		
        // Stats for the npc
		var stats = {
			strength : 10,
			speed : 10,
			perception : 10,
			magic : 10
		}

        // Determines ability to perform actions
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

        // Inventory object
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
		
        // Combat functions
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
				if (state.Combat.HP == 0) {
					// legitimately blank to prevent HP reduction logic from firing if there is no HP for it to effect
				} else if (amount >= state.Combat.HP) {
					that.Interact.Say(source);
			        state.Combat.HP = 0;
			        that.setAI(TG.Engines.AI.still());
			        _render.setAnimation('dead');
			    } else {
			    	var enPerc = (state.Combat.Energy / state.Combat.MaxEnergy);
		    		state.Combat.Energy -= (amount * enPerc);
			    	state.Combat.HP -= (amount * (1 - enPerc));
			    }
			}
		};

        // Interaction actions
		that.Interact = {
			Perform: function () {
				var hitObjects = TG.Engines.Game.Distance.Within(that, 30, function(acted) {
					acted.Interact.Receive(that, that.Interact.Say(TG.Content.Comm.greetingpositive));
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

        // Defense properties
		that.Defence = {
			DamageReduction : function() {
				return 0;
			}
		};
	}

    // Generic plant object
	function oPlant(inTitle, inPosition) {
		var that = {};
		
        // plant title/name
		that.title = inTitle;

        // string representation of object
		that.toString = function () {
			return that.title + ' ' + Math.round(amount);
		};
		
        // value for current state
		var amount = 3000;

        // number of ticks
		var tickCount = 0;

        // current direction of reproduction
		var reproduceDirection = 1;
		
        // current properties
		var properties = {
			food: true
		};

        // tests and return property
		that.getProperties = function (getName) {
			if(getName) {
				return properties[getName];
			} else {
				return properties;
			}
		};
		
        // current render of the plant.
		var _render = TG.Engines.Animation.Plant();
		_render.setAnimation('slowBreeze');
		that.getRender = function() {
			var rtnRender = _render.CurrentFrame();
			rtnRender.x = _position.x;
			rtnRender.y = _position.y;

			return rtnRender;
		}
		
        // occurs at every tick of the game
		that.MoveOneStep = function () {
		    tickCount++;

			_render.Tick();
			
			amount += .001;
			
			if (tickCount >= 3000 && reproduceDirection < 9) {
			    tickCount = 0;

			    _reproduce();
			    reproduceDirection++;
			}

			if(amount > 1) properties['food'] = true; // TODO: determine a good threshold for when a food source regains it's "food" status.
		}

        // reproduction function
		function _reproduce() {
		    var pos = { x: _position.x + 40, y: _position.y + 40 };
		    var d = 20; // distance

		    if (reproduceDirection == 1) { pos.y -= d; }
		    if (reproduceDirection == 2) { pos.x += d; pos.y -= d; }
		    if (reproduceDirection == 3) { pos.x += d; }
		    if (reproduceDirection == 4) { pos.x += d; pos.y += d; }
		    if (reproduceDirection == 5) { pos.y += d; }
		    if (reproduceDirection == 6) { pos.x -= d; pos.y += d; }
		    if (reproduceDirection == 7) { pos.x -= d; }
		    if (reproduceDirection == 8) { pos.x -= d; pos.y -= d; }

		    TG.Engines.Game.AddObject(new oPlant(that.title, pos));
		}

        // current position of the plant
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
		that.getPosition = function() {
			return _position;
		}
		
        // Combat properties for the plant.
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
		
        // Interaction actions
		that.Interact = {
			Receive: function (performer) {
				if(TG.Engines.Game.Distance.Between(performer, that) < 30) {
					performer.Interact.Say(TG.Content.Comm.eat);
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
	
    // generice water object
	
	
	var Items = {
	    Consumables: {
	    	Corn: function (amount) { return new TG.Objects.Item('Corn', amount, 0, 0, 'food');},
	    	Water: function (amount) { return new TG.Objects.Item('Water', amount, 0, 0, 'water');}
	    }
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
	

	
	function _Item() {
		var newItem = new TG.Objects.Item();

		return newItem;
	}

	that = {
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
