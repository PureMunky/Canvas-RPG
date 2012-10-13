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
		var newMoving = {
			vertical: direction.vertical || 0,
			horizontal: direction.horizontal || 1
		};
		
		return function (that) {
			var state = that.getState();
			
			if(state.initialized) {
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
				state.initialized = true;
				state.moveLoop = distance;
				state.moveTick = 0;
				state.moving = newMoving;
				
				that.setMoving(newMoving);
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
		}
	};
})();
