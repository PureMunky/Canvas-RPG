'use strict';
var TG = {};
TG.Engines = {};
TG.Content = {};
TG.Objects = {};
TG.Objects.Animation = {};

(function () {
    var i = 0,
        scripts = [];

    // Content
    scripts.push('JS/Content/comm.js');
    scripts.push('JS/Content/constants.js');

    // Objects
    scripts.push('JS/Objects/Animation/Frame.js');
    scripts.push('JS/Objects/Animation/Render.js');
    scripts.push('JS/Objects/Animation/Sequence.js');
    scripts.push('JS/Objects/Position.js');
    scripts.push('JS/Objects/Projectile.js');
    scripts.push('JS/Objects/Item.js');
    scripts.push('JS/Objects/NPC.js');
    scripts.push('JS/Objects/Plant.js');
    scripts.push('JS/Objects/Water.js');
    scripts.push('JS/Objects/Sex.js');

    // Test Scripts
    scripts.push('JS/Test/test.js');

    // Engines
    scripts.push('JS/Engines/save.js');
    scripts.push('JS/Engines/input.js');
    scripts.push('JS/Engines/movement.js');
    scripts.push('JS/Engines/renderCanvas.js');
    scripts.push('JS/Engines/AI.js');
    scripts.push('JS/Engines/Combat.js');
    scripts.push('JS/Engines/debug.js');
    scripts.push('JS/Engines/Generate/core.js');
    scripts.push('JS/Engines/Generate/Consumables.js');
    scripts.push('JS/Engines/Generate/Weapons.js');
    scripts.push('JS/Engines/Generate/Plants.js');
    scripts.push('JS/Engines/Generate/Player.js');
    scripts.push('JS/Engines/Generate/NPC.js');
    scripts.push('JS/Engines/Generate/Water.js');
    scripts.push('JS/Engines/Generate/Sex.js');
    scripts.push('JS/Engines/Relationships.js');
    scripts.push('JS/Engines/Chrono.js');
    scripts.push('JS/Engines/GameCore.js');

    // Write scripts to the page.
    for (i = 0; i < scripts.length; i++) {
        document.write('<script src="' + scripts[i] + '" type="text/javascript"></script>');
    }
}());

