TG.Test = (function () {
    var that = {},
        GameObjects;

    that.Setup = function (inGameObjects) {
        GameObjects = inGameObjects;
    };

    that.Starter = function (GameObjects) {
        GameObjects.push(TG.Engines.Generate.NPC('A', TG.Engines.Generate.Sex.Male(), { x: 100, y: 400 }));
        GameObjects.push(TG.Engines.Generate.NPC('B', TG.Engines.Generate.Sex.Male(), { x: 400, y: 100 }));
        GameObjects.push(TG.Engines.Generate.NPC('C', TG.Engines.Generate.Sex.Female(), { x: 720, y: 750 }));
        GameObjects.push(TG.Engines.Generate.NPC('D', TG.Engines.Generate.Sex.Female(), { x: 400, y: 600 }));

        //TG.Engines.Relationships.Mate(GameObjects[2], GameObjects[3]); //test mating

        for (var i = 0; i < GameObjects.length; i++) {
            GameObjects[i].Inventory.Equip(TG.Engines.Generate.Item());
        }

        GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 400, y: 300 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 400, y: 350 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 400, y: 400 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 400, y: 450 }));
        GameObjects.push(TG.Engines.Generate.Water({ x: 700, y: 300 }));
        //GameObjects.push(TG.Engines.Generate.Water({ x: 700, y: 350 }));
        //GameObjects.push(TG.Engines.Generate.Water({ x: 700, y: 400 }));
        //GameObjects.push(TG.Engines.Generate.Water({ x: 700, y: 450 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 1000, y: 300 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 1000, y: 350 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 1000, y: 400 }));
        //GameObjects.push(TG.Engines.Generate.Plant.Corn({ x: 1000, y: 450 }));
        GameObjects.push(TG.Engines.Generate.NPC('Pony', TG.Engines.Generate.Sex.Female(), { x: 800, y: 100 }));
    };

    that.PopNPC = function () {
        var pos = {
            x: Math.floor(Math.random() * 1000),
            y: Math.floor(Math.random() * 1000)
        }

        var sex;

        if (Math.floor(Math.random() * 100) % 2 == 0) {
            sex = TG.Engines.Generate.Sex.Male();
        } else {
            sex = TG.Engines.Generate.Sex.Female();
        }

        GameObjects[GameObjects.length] = TG.Engines.Generate.NPC(GameObjects.length, sex, pos);
    };

    that.Perform = function () {
        that.PopNPC();
    };

    return that;
}());