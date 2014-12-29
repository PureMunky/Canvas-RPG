'use strict';
TG.Engines.Game = (function (that) {
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    
	that.Tick = function () {
		TG.Engines.Debug.WriteOutput(timeSpeed);
		
		that.CurrentHistoryLocation += timeSpeed;
		if(that.CurrentHistoryLocation <= 0) {
			that.CurrentHistoryLocation = 1;
			timeSpeed = 0;
		}
		
		GameObjects[0].MoveOneStep();
		
		if (timeSpeed > 0) {
			for(var t = 0; t < timeSpeed; t++) {
				for(var i = 1; i < GameObjects.length; i++){
					GameObjects[i]
						.MoveOneStep();
				}
			}
		} else {
			for(var i = 1; i < GameObjects.length; i++){
				if(GameObjects[i].SetPositionAt) {
					GameObjects[i].SetPositionAt(that.CurrentHistoryLocation);	
				}
			}
		}
		
	};
	
	that.History = new Array();
	that.CurrentHistoryLocation = 0;
	that.CurrentHistory = function () {
	    /*
	    if(that.CurrentHistoryLocation == null || that.History.length < that.CurrentHistoryLocation) {
	        return GameObjects;
	    } else {
	        return that.History[that.CurrentHistoryLocation-1];
	    }
	    */
	   return GameObjects || new Array();
	}
	
	var timeSpeed = 1;
	that.Pause = function () {
		if(timeSpeed != 0) {
			timeSpeed = 0;
		} else {
			timeSpeed = 1;
		}
        //that.CurrentHistoryLocation = that.CurrentHistoryLocation == null ? that.History.length - 1 : null;
    }
    that.Rewind = function () {
    	if(timeSpeed >= 0) {
    		timeSpeed = -1;
    	}
        if(that.CurrentHistoryLocation != null) timeSpeed *= 2;
    }
    that.Forward = function () {
        if(timeSpeed < 0) {
    		timeSpeed = 1;
    	}
    	if(that.CurrentHistoryLocation != null) timeSpeed *= 2;
    }
    that.Player = function () {
    	return GameObjects[0];
    }
    var RecordHistory = function () {
        //that.History.push(that.GameObjects);
    }
    
    that.AddObject = function (o) {
    	GameObjects.push(o);
    }
    
	that.Distance = {
		Between: function(o1, o2) {
			o2 = o2 || GameObjects[0];
			var p1 = o1.getPosition();
			var p2 = o2.getPosition();
			
			var a, b;
			a = Math.abs(p1.x - p2.x);
			b = Math.abs(p1.y - p2.y);
			
			return Math.sqrt((a * a) + (b * b));
		},
		BetweenforCompare: function(o1, o2) {
		    o2 = o2 || GameObjects[0];
            var p1 = o1.getPosition();
            var p2 = o2.getPosition();
            
            var a, b;
            a = Math.abs(p1.x - p2.x);
            b = Math.abs(p1.y - p2.y);
            
            return (a * a) + (b * b);
		},
		Closest: function (o1, propertyFilter, action, propertyEquals) {
			var rtnObject = {title: 'none'};
			var shortestDistance = 1000000;
			
			for(var i = 0; i < GameObjects.length; i++) {
				var thisDistance = that.Distance.BetweenforCompare(o1, GameObjects[i]);
				if(o1 != GameObjects[i] && GameObjects[i].getProperties(propertyFilter, propertyEquals) && thisDistance < shortestDistance) {
					if(action) action(GameObjects[i]);
					shortestDistance = thisDistance;
					rtnObject = GameObjects[i];
				}
			}
			
			return rtnObject;
		},
		Within: function (o1, distance, action) {
			var rtnArray = new Array();
			
			for(var i = 0; i < GameObjects.length; i++) {
				var thisDistance = that.Distance.Between(o1, GameObjects[i]);
				if(thisDistance < distance && o1 != GameObjects[i]) {
					if(action) action(GameObjects[i]);
					rtnArray.push(GameObjects[i]);
				}
			}
			
			return rtnArray;
		}
	};
	
	var GameObjects = new Array();

	GameObjects[0] = TG.Engines.Generate.Player('Player', TG.Engines.Generate.Sex.Male(), {x: 100, y: 100});

	TG.Test.Setup(GameObjects);

	return that;
})(TG.Engines.Game || {});
