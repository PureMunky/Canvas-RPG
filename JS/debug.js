TG.Engines.Debug = (function(that) {
    var _log = new Array();
    
    that.WriteOutput = function (inOutput) {
        TG.Engines.Render.WriteOutput(inOutput);
    };
    
    that.Log = function (inOutput) {
    	_log.push(inOutput);
    };
	
	that.getLog = function () {
		return _log;
	}
    return that;
})(TG.Engines.Debug || {});