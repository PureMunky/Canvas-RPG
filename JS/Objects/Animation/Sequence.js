TG.Objects.Animation.Sequence = function (interrupt) {
    var that = this;

    that.frames = new Array();
    that.interrupt = interrupt || false;

    var currentFrame = 0,
          currentTime = 0;

    var incFrame = function () {
        var rtnBool = true;
        currentFrame++;
        if (currentFrame >= that.frames.length) {
            currentFrame = 0;
            rtnBool = !interrupt;
        }

        return rtnBool;
    }

    that.Tick = function () {
        var rtnBool = true;
        currentTime++;
        if (currentTime > that.frames[currentFrame].t) {
            currentTime = 0;
            rtnBool = incFrame();
        }

        return rtnBool;
    };

    that.addFrame = function (inFrame) {
        that.frames.push(inFrame);
    }

    that.CurrentFrame = function () {
        return that.frames[currentFrame];
    }
}