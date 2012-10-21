function GameCore(){
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    
	this.Tick = function () {
		//TG.Engines.Action.MoveOneStep();
		for(var i = 0; i < GameObjects.length; i++){
			GameObjects[i]
				.MoveOneStep();
		}
	};
	
	this.Distance = {
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
	
	this.GameObjects = new Array();
	GameObjects[0] = TG.Engines.Generate.Player('Player', TG.Engines.Generate.Sex.Male());
	
	GameObjects[1] = TG.Engines.Generate.NPC('A', TG.Engines.Generate.Sex.Male());
	GameObjects[2] = TG.Engines.Generate.NPC('B', TG.Engines.Generate.Sex.Male());
	GameObjects[3] = TG.Engines.Generate.NPC('C', TG.Engines.Generate.Sex.Female());
	GameObjects[4] = TG.Engines.Generate.NPC('D', TG.Engines.Generate.Sex.Female());
	
	TG.Engines.Relationships.Mate(GameObjects[2], GameObjects[3]); //test mating
	
	for(var i = 0; i < GameObjects.length; i++) {
		GameObjects[i].Inventory.Equip(TG.Engines.Generate.Item());
	}
	
	return this;
}
