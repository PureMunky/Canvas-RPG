//GV1

TG.Engines.GlobalVars = (function(that) {
	that._STEPPIXELS = .5;
    that._STEPTIMER;
    that._PANBOUNDARYPIX = 100;
    that._RUNPERC = 1;
    that._BorderPadding = 100;
    
    that._PlayerImage = new Image();
    that._PlayerImage.src = 'images/player/player.png';
    
    that._PlantImage = new Image();
    that._PlantImage.src = 'images/scenery/plant.png';
    
    that._GamePadThreshold = .2;
    
	return that;
})(TG.Engines.GlobalVars || {});