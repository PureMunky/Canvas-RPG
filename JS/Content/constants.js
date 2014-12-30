'use strict';
//GV1

TG.Engines.GlobalVars = (function(that) {
	that._STEPPIXELS = .5;
    that._STEPTIMER;
    that._PANBOUNDARYPIX = 100;
    that._RUNPERC = 1;
    that._BorderPadding = 100;
    
    that._PlayerImage = 'images/player/player.png';
    
    // demo images borrowed from http://www.famitsu.com/freegame/tool/chibi/index1.html
    // and other sites for amusement
    that._PlayerImageDemo = 'images/player/demo_player.png';
    that._NPCMale = 'images/npc/male.png';
    that._NPCFemale = 'images/npc/female.png';
    that._NPCPony = 'images/npc/pony_princess.png';
        
    that._PlantImage = 'images/scenery/plant.png';
    that._WaterImage = 'images/scenery/water.png';
    
    that._GamePadThreshold = .2;
    
	return that;
})(TG.Engines.GlobalVars || {});