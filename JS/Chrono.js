'use strict';
TG.Engines.Chronos = (function (that) {
	
	var _focusTarget = {};
	that.Focos = function (npc) {
		_focusTarget = npc;
	}
	
	return that;
})(TG.Engines.Chronos || {});
