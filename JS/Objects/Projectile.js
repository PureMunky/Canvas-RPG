// Something that is on the screen currently moving.
TG.Objects.Projectile = function (inTitle, inPosition, inMoving, inSpeed, inRange) {
    var that = this,
        _render = TG.Engines.Animation.Demo(),
        _startPos = new TG.Objects.Position(inPosition.x, inPosition.y),
        _position = inPosition,
        _moving = inMoving,
        _speed = inSpeed,
        _range = inRange,
        _delete = false;

    that.getRender = function () {
        var rtnRender = _render.CurrentFrame();
        rtnRender.x = _position.x;
        rtnRender.y = _position.y;
        rtnRender.DisplayTitle = true;

        return rtnRender;
    };

    that.getProperties = function () {
        return false;
    };

    that.getPosition = function () {
        return _position;
    };

    that.getDelete = function () {
        return _delete;
    };

    that.Tick = function () {
        // Delete if not moving.
        if (!_delete && _moving.horizontal == 0 && _moving.vertical == 0) {
            _delete = true;
        }

        // Delete if past the range.
        if (!_delete && TG.Engines.Game.Distance.BetweenPos(_startPos, _position) >= _range) {
            _delete = true;
        }

        if (!_delete) {
            _render.Tick();

            // Update the position of the render.
            _position.x = _position.x + (_moving.horizontal * TG.Engines.GlobalVars._STEPPIXELS * _speed);
            _position.y = _position.y + (_moving.vertical * TG.Engines.GlobalVars._STEPPIXELS * _speed);
        }
        return that;
    };

    return that;
};