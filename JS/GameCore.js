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
	
	this.Distance = {};
	this.Distance.Between = function(o1, o2) {
		o2 = o2 || GameObjects[0];
		var a, b;
		a = Math.abs(o1.x - o2.x);
		b = Math.abs(o1.y - o2.y);
		
		return Math.sqrt((a * a) + (b * b));
	}
	
	this.Distance.Closest = function (o1) {
		//TODO: add a second object to compare (e.x. Closest(item) or Closest(hostile));
		var rtnObject = {title: 'none'};
		var shortestDistance = 1000;
		
		for(var i = 0; i < GameObjects.length; i++) {
			var thisDistance = DistanceBetween(o1, GameObjects[i]);
			if(thisDistance < shortestDistance && o1 != GameObjects[i]) {
				shortestDistance = thisDistance;
				rtnObject = GameObjects[i];
			}
		}
		
		return rtnObject;
	}
	
	this.GameObjects = new Array();
	GameObjects[0] = TG.Engines.Generate.Player();
	
	GameObjects.push(TG.Engines.Generate.NPC('A'));
	GameObjects.push(TG.Engines.Generate.NPC('B'));
	GameObjects.push(TG.Engines.Generate.NPC('C'));
	GameObjects.push(TG.Engines.Generate.NPC('D'));
	
	
	for(var i = 0; i < GameObjects.length; i++) {
		GameObjects[i].Equip(TG.Engines.Generate.Item());
	}
	
	return this;
}
