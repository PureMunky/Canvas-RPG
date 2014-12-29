TG.Engines.Generate = (function (generate, o) {

    generate.Consumables = {
        Corn: function (amount) { return new TG.Objects.Item('Corn', amount, 0, 0, 'food'); },
        Water: function (amount) { return new TG.Objects.Item('Water', amount, 0, 0, 'water'); }
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));