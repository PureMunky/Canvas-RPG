//GV1
function GV1() {
    this._STEPPIXELS = .5;
    this._STEPTIMER;
    this._PANBOUNDARYPIX = 100;
    this._RUNPERC = 1;

    this._PlayerImageRIGHT = 'images/player/right.png';
    this._PlayerImageDOWN = 'images/player/down.png';
    this._PlayerImageLEFT = 'images/player/left.png';
    this._PlayerImageUP = 'images/player/up.png';
    
    this._GamePadThreshold = .2;
	//TODO: Turn the images into sprites and load them all at the beginning to never load again (should fix the flashing objects).
    return this;
};