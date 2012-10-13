function GameCore(){
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    
	this.Tick = function () {
		//TG.Engines.Action.MoveOneStep();
		for(var i = 0; i < GameObjects.length; i++){
			GameObjects[i].MoveOneStep();
		}
	};
	
	this.GameObjects = new Array();
	GameObjects[0] = TG.Engines.Generate.Player();
	GameObjects[0].Give(TG.Engines.Generate.Item());
	
	GameObjects.push(TG.Engines.Generate.NPC('A'));
	GameObjects.push(TG.Engines.Generate.NPC('B'));
	GameObjects.push(TG.Engines.Generate.NPC('C'));
	GameObjects.push(TG.Engines.Generate.NPC('D'));

	return this;
}
