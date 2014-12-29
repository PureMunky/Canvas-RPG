TG.Objects.Item = function (inTitle, inDamage, inRange, inSpeed, inType, inProperties, inUse) {
    var that = this;

    that.title = inTitle || 'Fist';
    that.damage = inDamage || 5;
    that.range = inRange || 10;
    that.speed = inSpeed || 10;
    that.type = inType || 'melee';

    var level = 1;
    var XP = 0;

    var properties = {
        item: true
    };
    properties[inType] = true;

    that.getProperties = function (getName) {
        if (getName) {
            return properties[getName];
        } else {
            return properties;
        }
    };

    that.getDamage = function () {
        return that.damage * level;
    }

    that.Use = function (target) {
        switch (that.type) {
            case 'food':
                target.Eat(that.damage);
                break;
            case 'water':
                target.Drink(that.damage);
                break;
        }
    }

    that.XPUp = function () {
        XP++;
    }
};