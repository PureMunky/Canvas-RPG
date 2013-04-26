'use strict';
TG.Engines.Relationships = (function (that) {
	that.Mate = function(o1, o2) {
			var m = o1.sex.title == 'male' ? o1 : o2;
			var f = o1.sex.title == 'male' ? o2 : o1;
			
			if(m && f) {
				// TODO: Calculations to determine if female gets pregnant
				f.sex.state.partnerDNA = m.DNA;
				f.sex.state.pregnant = true;
				
				var s = m.title > f.title ? TG.Engines.Generate.Sex.Male() : TG.Engines.Generate.Sex.Female();
				
			} else {
				return false;
			}
		};
		
	return that;
})(TG.Engines.Relationships || {});
