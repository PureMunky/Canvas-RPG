//GV1
function GV1() {
    this._STEPPIXELS = .5;
    this._STEPTIMER;
    this._PANBOUNDARYPIX = 100;
    this._RUNPERC = 1;
    this._BorderPadding = 100;
    
    this._PlayerImage = new Image();
    this._PlayerImage.src = 'images/player/player.png';
    
    this._PlantImage = new Image();
    this._PlantImage.src = 'images/scenery/plant.png';
    
    this._GamePadThreshold = .2;
	//TODO: Turn the images into sprites and load them all at the beginning to never load again (should fix the flashing objects).
    return this;
};