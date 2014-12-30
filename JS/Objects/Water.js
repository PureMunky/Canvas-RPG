TG.Objects.Water = function (inTitle, inPosition) {
    var that = {},
        _delete = false;

    that.title = inTitle;
    that.toString = function () {
        return that.title + ' ' + Math.round(amount);
    };

    var amount = 5000;

    var properties = {
        water: true
    };

    that.getDelete = function () {
        return _delete;
    };

    that.getProperties = function (getName) {
        if (getName) {
            return properties[getName];
        } else {
            return properties;
        }
    };

    var _render = TG.Engines.Animation.Water();
    _render.setAnimation('slowBreeze');
    that.getRender = function () {
        var rtnRender = _render.CurrentFrame();
        rtnRender.x = _position.x;
        rtnRender.y = _position.y;

        return rtnRender;
    }

    that.Tick = function () {
        if (amount <= 0) _delete = true;

        _render.Tick();
        amount += .001;

        properties['water'] = true;
    }

    var _position = new TG.Objects.Position(inPosition ? inPosition.x : 0, inPosition ? inPosition.y : 0);
    that.getPosition = function () {
        return _position;
    }

    that.Combat = {
        HitFor: function (attacker) {
            if (TG.Engines.Game.Distance.Between(attacker, that) < 30) {
                amount -= 700;
                if (amount <= 0) {
                    amount = 0;
                    properties.water = false;
                }
                attacker.Drink(700);
            }
        }
    }

    that.Interact = {
        Receive: function (performer) {
            if (TG.Engines.Game.Distance.Between(performer, that) < 30) {
                performer.Interact.Say(TG.Content.Comm.drink);
                amount -= 700;
                if (amount <= 0) {
                    amount = 0;
                    properties.food = false;    
                } else {
                    performer.Inventory.Give(TG.Engines.Generate.Consumables.Water(700))
                }


            }
        }
    }
    return that;
};