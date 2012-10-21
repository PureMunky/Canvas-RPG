var Generator = (function() {
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

			moving.vertical = move.vertical ? move.vertical : moving.vertical;
			moving.horizontal = move.horizontal ? move.horizontal : moving.horizontal;
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
			}
		};
		var inv = new Array();
		var equipment = new Array();
		that.title = inTitle;
		that.sex = inSex;

		that.toString = function() {
			return that.title + ' HP: ' + state.Combat.HP + '/' + state.Combat.MaxHP + ' - ' + that.debugInfo;
		}
		
		var _position = new oPosition(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
		that.getPosition = function() {
			return _position;
		}
		
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
			    _render.setAnimation('walk');
			} else if (direction.horizontal < 0 && Math.abs(direction.horizontal) > Math.abs(direction.vertical)) {
				_render.imageX = 32;
				_render.setAnimation('walk');
			} else if (direction.vertical > 0) {
			    _render.imageX = 16;
			    _render.setAnimation('walk');
			} else if (direction.vertical < 0) {
			    _render.imageX = 48;
			    _render.setAnimation('walk');
			} else {
				_render.setAnimation('idle');
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
			if (_AI)
				_AI(that, state.AI);

			that.setFacing(moving);
            //that.incAnimationFrame(4);
           	_render.Tick();
           	
			_position.x = _position.x + (moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));
			_position.y = _position.y + (moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * (moving.running ? 1 + TG.Engines.GlobalVars._RUNPERC : 1));

			var r = that.getRender();
			// FIXME: animation class doesn't work
			that.setDebugInfo(r.imageX + ' ' + r.imageY);
			return that;
		};
		var _TickClean = function() {
			state.Core.attackCooldown = state.Core.attackCooldown || 0;

			if (state.Core.attackCooldown > 0)
				state.Core.attackCooldown--;
			that.setDebugInfo(state.Core.attackCooldown);
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
			}
		};

		that.Combat = {
			Attack : function() {
				if (state.Core.attackCooldown <= 0) {
					var w = that.Inventory.PrimaryWeapon();
					state.Core.attackCooldown = w.speed;
					_render.setAnimation('attackMelee');
					// TODO: Invoke "hit" on all objects within range.
					TG.Engines.Debug.Log(that.title + ' attack with ' + w.title + ' - ' + that.Combat.Damage() + 'dmg');
				}
			},
			Damage : function() {
				var w = that.Inventory.PrimaryWeapon();
				return (stats.strength * w.damage);
			},
			Range : function() {
				var w = that.Inventory.PrimaryWeapon();
				return (w.range);
			}
		};

		that.Defence = {
			DamageReduction : function() {
				return 0;
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

// object defaults
	function _Player(inName, inSex) {
		var newPlayer = new oNPC(inName, inSex, {
			x : 0,
			y : 0
		});

		//newPlayer.title = 'Player';

		return newPlayer;
	}

	function _NPC(inTitle, inSex) {
		var newNPC = new oNPC(inTitle, inSex, {
			x : (Math.random() % 100) * 1000,
			y : (Math.random() % 100) * 300
		});

		newNPC.setAI(TG.Engines.AI.hostile(GameObjects[0]));

		//newNPC.title = inTitle;

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
	function _Item() {
		var newItem = new oItem();

		return newItem;
	}

	return {
		Player : function(inName, inSex) {
			return _Player(inName, inSex);
		},
		NPC : function(inTitle, inSex) {
			return _NPC(inTitle, inSex);
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
		}
	};
})();
