TG.Objects.Animation.Render = function (inImage, inWidth, inHeight, inImageX, inImageY) {
    var that = this;

    if (typeof inImage == 'string') {
        that.image = new Image();
        that.image.src = inImage;
    } else {
        that.image = inImage || new Image();
    }

    that.width = inWidth || 16;
    that.height = inHeight || 16;
    that.imageX = inImageX || 0;
    that.imageY = inImageY || 0;
    that.DisplayTitle = false;

    that.Animations = new Array();
    var PrimaryAnimation = 'walk';
    var InterruptAnimation = null;

    that.addAnimation = function (inAnimation, name) {
        that.Animations[name] = inAnimation;
    }

    that.setAnimation = function (name) {
        if (that.Animations[name].interrupt) {
            InterruptAnimation = name;
        } else {
            PrimaryAnimation = name;
        }
    }

    that.Tick = function () {
        var bool = that.CurrentAnimation().Tick();

        if (!bool) InterruptAnimation = null;
    }

    that.CurrentAnimation = function () {
        var animation = InterruptAnimation || PrimaryAnimation;

        return that.Animations[animation];
    }

    that.CurrentFrame = function () {
        return {
            image: that.image,
            imageX: that.CurrentAnimation().CurrentFrame().x || that.imageX,
            imageY: that.CurrentAnimation().CurrentFrame().y || that.imageY,
            width: that.width,
            height: that.height
        }
    }
}