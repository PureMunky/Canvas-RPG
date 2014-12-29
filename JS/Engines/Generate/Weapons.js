TG.Engines.Generate = (function (generate, o) {

    generate.Weapons = {
        Fist:  function () { return new o.Item('Fist', 5, 10, 10);},
        Sword: function () { return new o.Item('Sword', 30, 20, 10);},
        BigSword: function () { return new o.Item('Sword', 30, 50, 10);},
        Bow:   function () { return new o.Item('Bow', 20, 200, 50, 'ranged');}
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));