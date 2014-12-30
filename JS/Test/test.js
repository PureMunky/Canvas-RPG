// Test object used only to test things.
TG.Test = (function () {
    'use strict';

    var that = {},
        GameObjects;

    // Returns a random position.
    function _getRndPos() {
        return new TG.Objects.Position(Math.floor(Math.random() * 1000), Math.floor(Math.random() * 1000));
    };

    function _getRndNum(max) {
        return Math.floor(Math.random() * max);
    };

    // generate objects based on the passed count
    function _PopulateObjects(NPCCount, FoodCount, WaterCount) {
        var i = 0;

        // Generate Test NPCs
        for (i = 0; i < NPCCount; i++) {
            that.PopNPC();
        }

        // Give everyone a sword?
        for (i = 0; i < GameObjects.length; i++) {
            GameObjects[i].Inventory.Equip(TG.Engines.Generate.Weapons.Sword());
        }

        // Generate Test Food
        for (i = 0; i < FoodCount; i++) {
            that.PopFood();
        }

        // Generate Test Water
        for (i = 0; i < WaterCount; i++) {
            that.PopWater();
        }
    }

    // Initiates the test object.
    that.Setup = function (inGameObjects) {
        GameObjects = inGameObjects;
        _Start();
    };

    // Sample setup for random generation.
    function _Start() {
        _PopulateObjects(10, 10, 10);

        // Create a pony for Ashley. :)
        GameObjects.push(TG.Engines.Generate.NPC('Pony', TG.Engines.Generate.Sex.Female(), { x: 800, y: 100 }));
    };

    // Sample setup for hostile generation.
    function _StartHostile() {
        var i = 0; 
        _PopulateObjects(20, 0, 0);

        for (i = 0; i < GameObjects.length; i++) {
            GameObjects[i].setAI(TG.Engines.AI.hostile(GameObjects[0]))
        }
    };

    // Generates a random NPC.
    that.PopNPC = function () {
        var sex;

        if (Math.floor(Math.random() * 100) % 2 == 0) {
            sex = TG.Engines.Generate.Sex.Male();
        } else {
            sex = TG.Engines.Generate.Sex.Female();
        }

        GameObjects.push(TG.Engines.Generate.NPC(GameObjects.length, sex, _getRndPos()));
    };

    // Gennerates a random food.
    that.PopFood = function () {
        GameObjects.push(TG.Engines.Generate.Plants.Corn(_getRndPos()));
    };

    // Gennerates a random water. 
    that.PopWater = function () {
        GameObjects.push(TG.Engines.Generate.Water(_getRndPos()));
    };

    // Test projectile creation.
    that.PopProj = function () {
        var pos = TG.Engines.Game.Player().getPosition();
        var moving = TG.Engines.Game.Player().getMoving();

        pos = new TG.Objects.Position(pos.x, pos.y);
        //moving = new TG.Objects.Moving(moving.horizontal, moving.vertical);

        GameObjects.push(new TG.Objects.Projectile('Arrow', pos, { horizontal: moving.horizontal, vertical: moving.vertical }, _getRndNum(20), _getRndNum(1000)));
    };

    // Test action that is mapped to a key press "G"
    that.Perform = function () {
        //that.PopNPC();
        that.PopProj();
    };

    return that;
}());