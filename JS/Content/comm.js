'use strict';
TG.Content.Comm = {
	greetingpositive: {
		say: 'Hello!',
		requirement: function (target) {
			return target.friendly;
		}
	},
	greetingneutral: {
		say: '...'
	},
	greetinghostile: {
		say: 'Get away!',
		requirement: function (target) {
			return target.hostile;
		}
	},
	idlemph: {
		say: 'I\'m trying trying to get my {{owned.nearest.vehicle.name}} to 88 MPH. I think I need more watts.'
	},
	idlewant: {
		say: 'What do you want?',
		options: [
			'Wealth',
			'Fame',
			'A Sandwich',
			'Nothing'
		],
		out: function(target, self, answer) {
			self.want = answer.text;
			switch(answer) {
				case 0:
					self.Say('I like money too!');
					break;
				case 1:
					self.Say('Interested in becoming a {{culture.profession}} too?');
					break;
				case 2:
					self.Say('Yea, I\'m pretty hungry too.');
					break;
				default:
					self.Say('hmmm...');
			}
		}
	},
	drink: {
		say: 'Slurp'
	},
	eat: {
		say: 'Yum'
	}
};
