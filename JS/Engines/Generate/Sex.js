TG.Engines.Generate = (function (generate, o) {
    var _Sex = {
        male: function () {
            var rtnMale = new o.Sex('male');

            rtnMale.state = {

            };

            return rtnMale;
        },
        female: function () {
            var rtnFemale = new o.Sex('female');

            rtnFemale.state = {
                pregnant: false
            };

            rtnFemale.giveBirth = function () {
                return TG.Engines.Generate.NPC('baby', TG.Engines.Generate.Sex.Female());
            }

            return rtnFemale;
        }
    };

    generate.Sex = {
        Male : function() {
            return _Sex.male();
        },
        Female : function() {
            return _Sex.female();
        }
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));