function GameCore(){
	$(function () {
        //TG.Engines.Render.displayLogin();
        TG.Engines.GlobalVars._STEPTIMER = setInterval(TG.Engines.Game.Tick, 16);
    });
    
	this.Tick = function () {
		TG.Engines.Action.MoveOneStep();
	};
	
	var _GameObjects = new Array();
	
	this GameObjects = function () {
		return _GameObjects;
	}
	
	return this;
}
