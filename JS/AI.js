var AI1 = (function(){
	var _still = function () {
		return function (that) {
			
		}
	}
	
	var _idle = function () {
		return function (that) {
			var facing = {
				vertical: 0,
				horizontal: 0
			};
			
			if(Math.random() * 100 < 1) {
				var rnd = Math.random() * 100;
				switch (true){
					case rnd < 25:
						facing.vertical = 0;
						facing.horizontal = -1;
						break;
					case rnd < 50:
						facing.vertical = 0;
						facing.horizontal = 1;
						break;
					case rnd < 75:
						facing.veritcal = -1;
						facing.horizontal = 0;
						break;
					case rnd < 100:
						facing.vertical = -1;
						facing.horizontal = 0;
						break;
				}
			}
			
			that.setFacing(facing);
			return facing;
		}
	}
	
	var _wander = function (distance) {
		var distance = distance || 100;
		
		return function (that) {
			var state = that.getState();
			
			if(state.initialized) {
				var newMove = _idle()(that);
				
				if(Math.random() * 100 < 10) {
					//TODO: Make the wander algorithm have a distance boundary.
					that.setMoving({horizontal: 0, vertical: 0});
				} else {
					if (
						newMove.horizonal == 1 ||
						newMove.horizontal == -1 ||
						newMove.vertical == 1 ||
						newMove.vertical == -1
					) {
						that.setMoving(newMove);
					}
				}
				
			} else {
				state.initialized = true;
				state.originPoint = that.getPosition();
				
			}
			that.setState(state);
		}
	}
	
	var _pace = function (distance, direction) {
		var distance = distance || 100;
		var newMoving = direction || {
			vertical: 0,
			horizontal: 1
		};
		
		return function (that) {
			var state = that.getState();
			
			if(state.initialized == 'pace') {
				state.moveTick++;
				if (state.moveLoop == state.moveTick) {
					state.moveTick = 0;
					newMoving = state.moving;
					
					newMoving.vertical = state.moving.vertical * -1;
					newMoving.horizontal = state.moving.horizontal * -1;
					
					state.moving = newMoving;
					
					that.setMoving(newMoving);
				}
			} else {
				state.initialized = 'pace';
				state.moveLoop = distance;
				state.moveTick = 0;
				state.moving = newMoving;
				
				that.setMoving(newMoving);
			}
			
			that.setState(state);
		}
	};
	
	var _toward = function (position) {
		
		return function (that) {
			var newMoving = {
				vertical: 0,
				horizontal: 0
			}
			
			if (that.x < position.x) newMoving.horizontal = 1;
			if (that.x > position.x) newMoving.horizontal = -1;
			if (that.y < position.y) newMoving.vertical = 1;
			if (that.y > position.y) newMoving.vertical = -1;
			
			that.setMoving(newMoving);
		}	
	};
	
	var _hostile = function (npc) {
		//TODO: Fix the pacing algorithm to stop moving diagonally after the player has escaped the AIs perception.
		return function (that) {
			var state = that.getState();
			
			if(that.getStats().perception * 10 < Distance.Between(that, npc)) {
				that.setDebugInfo('pacing');
				_pace()(that);
			} else if (that.getAttackRange() > Distance.Between(that, npc)) {
				state.timeSinceLastAttack = state.timeSinceLastAttack || 0;
				state.timeSinceLastAttack++;
				//TODO: Put attack cooldown in the action and attack before the cooldown occurs for AI.
				if(state.timeSinceLastAttack > that.getAttackSpeed()) {
					state.timeSinceLastAttack = 0;
					that.Attack();
				}
				that.setDebugInfo('attacking: ' + state.timeSinceLastAttack);
			} else {
				_toward(npc)(that);
				that.setDebugInfo('tracking');
			}
			
			that.setState(state);
		}
	};
	
	return {
		still: function() {
			return _still();
		},
		idle: function() {
			return _idle();
		},
		wander: function(distance) {
			return _wander(distance);
		},
		pace: function(distance, direction) {
			return _pace(distance, direction);
		},
		toward: function(position) {
			return _toward(position);
		},
		hostile: function(npc) {
			return _hostile(npc);
		}
	};
})();
