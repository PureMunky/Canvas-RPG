TG.Engines.Generate = (function (generate, o) {
    function _NPC(inTitle, inSex, inPosition) {
        var newNPC = new o.NPC(inTitle, inSex, inPosition);

        newNPC.setAI(TG.Engines.AI.normal());
        newNPC.Inventory.Equip(generate.Weapons.Fist());

        return newNPC;
    }

    generate.NPC = function (inTitle, inSex, inPosition) {
        return _NPC(inTitle, inSex, inPosition);
    };

    return generate;
}(TG.Engines.Generate || {}, TG.Objects));