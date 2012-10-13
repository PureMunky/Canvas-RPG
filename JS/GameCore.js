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
				//.setDebugInfo(Closest(GameObjects[i]).title);
		}
	};
	
	this.DistanceBetween = function(o1, o2) {
		o2 = o2 || GameObjects[0];
		var a, b;
		a = Math.abs(o1.x - o2.x);
		b = Math.abs(o1.y - o2.y);
		
		return Math.sqrt((a * a) + (b * b));
	}
	
	this.Closest = function (o1) {
		//TODO: Fix this from timing out;
		var rtnObject = null;
		var shortestDistance = null;
		
		for(var j = 0; j < GameObjects.length; j++) {
			var thisDistance = DistanceBetween(o1, GameObjects[j]);
			if(thisDistance < shortestDistance) {
				shortestDistance = thisDistance;
				rtnObject = GameObjects[j];
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
