TG.Engines.Combat = (function (combat) {
    var prop = function (actor) {
        var state = {
            attackCooldown: 0
        };

        this.Tick = function () {
            state.attackCooldown = state.attackCooldown || 0;
            if(state.attackCooldown > 0) state.attackCooldown--;

        };

        this.Attack = function () {
            if (state.attackCooldown <= 0) {
                var w = actor.Inventory.PrimaryWeapon();
                state.Core.attackCooldown = w.speed;
                _render.setAnimation('attackMelee');
                var hitObjects = TG.Engines.Game.Distance.Within(that, that.Combat.Range(), function (acted) {
                    acted.Combat.HitFor(that);
                    that.Inventory.PrimaryWeapon().XPUp();
                });
                TG.Engines.Debug.Log(that.title + ' attack with ' + w.title + ' - ' + that.Combat.Damage() + 'dmg');
            }
        };

        this.Damage = function () {
            var w = that.Inventory.PrimaryWeapon();
            return (stats.strength * w.getDamage());
        };

        this.Range = function () {
            var w = that.Inventory.PrimaryWeapon();
            return (w.range);
        };

        this.HitFor = function (attacker) {
            var dmg = (attacker.Combat.Damage() - that.Defence.DamageReduction());

            that.Combat.ReduceHP(dmg);

        };

        this.ReduceHP = function (amount, source) {
            if (state.Combat.HP == 0) {
                // legitimately blank to prevent HP reduction logic from firing if there is no HP for it to effect
            } else if (amount >= state.Combat.HP) {
                that.Interact.Say(source);
                state.Combat.HP = 0;
                that.setAI(TG.Engines.AI.still());
                _render.setAnimation('dead');
            } else {
                var enPerc = (state.Combat.Energy / state.Combat.MaxEnergy);
                state.Combat.Energy -= (amount * enPerc);
                state.Combat.HP -= (amount * (1 - enPerc));
            }
        };

        this.DamageReduction = function () {
            return 0;
        };
    }


    return {
        Assign: function (actor) {
            return new prop(actor);
        }
    }
}(TG.Engines.Combat || {}));