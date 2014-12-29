TG.Engines.Generate = (function (generate, o) {
    var _Corn = function (inPosition) {
        var newPlant = new o.Plant('Corn', inPosition);

        return newPlant;
    }

    generate.Plants = {
        Corn: function (inPosition) {
            return _Corn(inPosition);
        }
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));