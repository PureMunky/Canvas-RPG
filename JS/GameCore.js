function GameCore(){
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    
	this.Tick = function () {
		TG.Engines.Action.MoveOneStep();
		//GameObjects.push(TG.Engines.Generate.NPC());
	};
	
	this.GameObjects = new Array();
	GameObjects[0] = TG.Engines.Generate.Player();
	
	
	return this;
}
