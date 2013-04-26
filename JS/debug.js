'use strict';
TG.Engines.Debug = (function (that) {
    var _log = new Array();
    
    that.debugString = '';
    that.WriteOutput = function (inOutput) {
    	if(inOutput) {
	    	that.debugString = inOutput;
	    }
	    
        TG.Engines.Render.WriteOutput(that.debugString);
    };
    
    that.Log = function (inOutput) {
    	_log.push(inOutput);
    };
	
	that.getLog = function () {
		return _log;
	}
    return that;
})(TG.Engines.Debug || {});