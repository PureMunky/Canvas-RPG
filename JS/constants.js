'use strict';
//GV1

TG.Engines.GlobalVars = (function(that) {
	that._STEPPIXELS = .5;
    that._STEPTIMER;
    that._PANBOUNDARYPIX = 100;
    that._RUNPERC = 1;
    that._BorderPadding = 100;
    
    that._PlayerImage = new Image();
    that._PlayerImage.src = 'images/player/player.png';
    
    // demo images borrowed from http://www.famitsu.com/freegame/tool/chibi/index1.html
    that._PlayerImageDemo = new Image();
    that._PlayerImageDemo.src = 'images/player/demo_player.png';
    
    that._NPCMale = new Image();
    that._NPCMale.src = 'images/npc/male.png';
    
    that._NPCFemale = new Image();
    that._NPCFemale.src = 'images/npc/female.png';
    
    that._PlantImage = new Image();
    that._PlantImage.src = 'images/scenery/plant.png';
    
    that._GamePadThreshold = .2;
    
	return that;
})(TG.Engines.GlobalVars || {});