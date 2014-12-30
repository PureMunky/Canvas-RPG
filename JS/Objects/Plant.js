// Generic plant object
TG.Objects.Plant = function (inTitle, inPosition) {
    var that = {},
        _delete = false;

    // plant title/name
    that.title = inTitle;

    // string representation of object
    that.toString = function () {
        return that.title + ' ' + Math.round(amount);
    };

    // value for current state
    var amount = 3000;

    // number of ticks
    var tickCount = 0;

    // current direction of reproduction
    var reproduceDirection = 1;

    // current properties
    var properties = {
        food: true
    };

    // Check if the object should be removed.
    that.getDelete = function () {
        return _delete;
    };

    // tests and return property
    that.getProperties = function (getName) {
        if (getName) {
            return properties[getName];
        } else {
            return properties;
        }
    };

    // current render of the plant.
    var _render = TG.Engines.Animation.Plant();
    _render.setAnimation('slowBreeze');
    that.getRender = function () {
        var rtnRender = _render.CurrentFrame();
        rtnRender.x = _position.x;
        rtnRender.y = _position.y;

        return rtnRender;
    }

    // occurs at every tick of the game
    that.Tick = function () {
        if (amount <= 0) _delete = true;

        if (!_delete) {
            tickCount++;

            _render.Tick();

            amount += .001;

            if (tickCount >= 20000 && reproduceDirection < 9) {
                tickCount = 0;

                _reproduce();
                reproduceDirection++;
            }

            if (amount > 1) properties['food'] = true; // TODO: determine a good threshold for when a food source regains it's "food" status.
        }
    }

    // reproduction function
    function _reproduce() {
        var pos = { x: _position.x + 40, y: _position.y + 40 };
        var d = 20; // distance

        if (reproduceDirection == 1) { pos.y -= d; }
        if (reproduceDirection == 2) { pos.x += d; pos.y -= d; }
        if (reproduceDirection == 3) { pos.x += d; }
        if (reproduceDirection == 4) { pos.x += d; pos.y += d; }
        if (reproduceDirection == 5) { pos.y += d; }
        if (reproduceDirection == 6) { pos.x -= d; pos.y += d; }
        if (reproduceDirection == 7) { pos.x -= d; }
        if (reproduceDirection == 8) { pos.x -= d; pos.y -= d; }

        TG.Engines.Game.AddObject(new TG.Objects.Plant(that.title, pos));
    }

    // current position of the plant
    var _position = new TG.Objects.Position(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
    that.getPosition = function () {
        return _position;
    }

    // Combat properties for the plant.
    that.Combat = {
        HitFor: function (attacker) {
            if (TG.Engines.Game.Distance.Between(attacker, that) < 30) {
                amount -= 800;
                if (amount <= 0) {
                    amount = 0;
                    properties.food = false;
                }
                attacker.Eat(800);
            }
        }
    }

    // Interaction actions
    that.Interact = {
        Receive: function (performer) {
            if (TG.Engines.Game.Distance.Between(performer, that) < 30) {
                performer.Interact.Say(TG.Content.Comm.eat);
                amount -= 800;
                if (amount <= 0) {
                    amount = 0;
                    properties.food = false;
                } else {
                    performer.Inventory.Give(TG.Engines.Generate.Consumables.Corn(800))
                }


            }
        }
    }
    return that;
}