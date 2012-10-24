function GameCore(){
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    var that = this;
    
	that.Tick = function () {
		RecordHistory();
		
		for(var i = 0; i < GameObjects.length; i++){
			GameObjects[i]
				.MoveOneStep();
		}
	};
	
	that.History = new Array();
	that.CurrentHistoryLocation = 200;
	
	that.CurrentHistory = function () {
	    /*
	    if(that.CurrentHistoryLocation == null || that.History.length < that.CurrentHistoryLocation) {
	        return GameObjects;
	    } else {
	        return that.History[that.CurrentHistoryLocation-1];
	    }
	    */
	   return that.History[0];
	}
	
	that.Pause = function () {
        that.CurrentHistoryLocation = that.CurrentHistoryLocation == null ? that.History.length - 1 : null;
    }
    that.Rewind = function () {
        if(CurrentHistoryLocation != null) CurrentHistoryLocation--;
    }
    that.Forward = function () {
        if(CurrentHistoryLocation != null) CurrentHistoryLocation++;
    }
    
    var RecordHistory = function () {
        that.History.push(that.GameObjects);
    }
    
	that.Distance = {
		Between: function(o1, o2) {
			o2 = o2 || GameObjects[0];
			p1 = o1.getPosition();
			p2 = o2.getPosition();
			
			var a, b;
			a = Math.abs(p1.x - p2.x);
			b = Math.abs(p1.y - p2.y);
			
			return Math.sqrt((a * a) + (b * b));
		},
		Closest: function (o1, o2, action) {
			//TODO: add a second object to compare (e.x. Closest(item) or Closest(hostile));
			var rtnObject = {title: 'none'};
			var shortestDistance = 1000;
			
			for(var i = 0; i < GameObjects.length; i++) {
				var thisDistance = Distance.Between(o1, GameObjects[i]);
				if(thisDistance < shortestDistance && o1 != GameObjects[i]) {
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
				var thisDistance = Distance.Between(o1, GameObjects[i]);
				if(thisDistance < distance && o1 != GameObjects[i]) {
					if(action) action(GameObjects[i]);
					rtnArray.push(GameObjects[i]);
				}
			}
			
			return rtnArray;
		}
	};
	
	that.GameObjects = new Array();
	that.GameObjects[0] = TG.Engines.Generate.Player('Player', TG.Engines.Generate.Sex.Male());
	that.GameObjects[1] = TG.Engines.Generate.NPC('A', TG.Engines.Generate.Sex.Male());
	that.GameObjects[2] = TG.Engines.Generate.NPC('B', TG.Engines.Generate.Sex.Male());
	that.GameObjects[3] = TG.Engines.Generate.NPC('C', TG.Engines.Generate.Sex.Female());
	that.GameObjects[4] = TG.Engines.Generate.NPC('D', TG.Engines.Generate.Sex.Female());
	
	TG.Engines.Relationships.Mate(GameObjects[2], GameObjects[3]); //test mating
	
	for(var i = 0; i < GameObjects.length; i++) {
		GameObjects[i].Inventory.Equip(TG.Engines.Generate.Item());
	}
	
	return that;
}
