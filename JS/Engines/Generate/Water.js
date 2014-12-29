TG.Engines.Generate = (function (generate, o) {
    
    var _Water = function (inPosition) {
        var newWater = new o.Water('Water', inPosition);
		
        return newWater;
    };

    generate.Water = function (inPosition) {
        return _Water(inPosition);
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));