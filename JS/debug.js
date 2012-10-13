function DebugFull() {
    var _log = new Array();
    
    this.WriteOutput = function (inOutput) {
        TG.Engines.Render.WriteOutput(inOutput);
    };
    
    this.Log = function (inOutput) {
    	_log.push(inOutput);
    };
	
	this.getLog = function () {
		return _log;
	}
    return this;
};