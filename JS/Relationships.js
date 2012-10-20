var Relationships = (function () {
	return {
		Mate: function(o1, o2) {
			var m = o1.sex.title == 'male' ? o1 : o2;
			var f = o1.sex.title == 'male' ? o2 : o1;
			
			if(m && f) {
				// TODO: Calculations to determine if female is pregnant
				f.sex.state.partnerDNA = m.DNA;
				f.sex.state.pregnant = true;
			} else {
				return false;
			}
		}
	}
})();
