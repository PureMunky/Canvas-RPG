function RenderCanvasV1() {
    $(function () {
        TG.Engines.Render.FillScreen();
        $(window).resize(function () {
            TG.Engines.Render.FillScreen();
        });

        TG.Engines.Render.ctx = document.getElementById('playArea').getContext('2d');
        TG.Engines.Render.drawCanvas();
    });

    var playerImage = TG.Engines.GlobalVars._PlayerImageRIGHT;

    this.FillScreen = function () {
        $('#playArea').width(1);
        $('#playArea').height(1);
        SetPlayAreaSize($(document).width(), $(document).height());
    };

    this.SetPlayAreaSize = function (width, height) {
        $('#playArea').width(width);
        $('#playArea').height(height);
        document.getElementById('playArea').setAttribute('width', width + 'px');
        document.getElementById('playArea').setAttribute('height', height + 'px');
    };

    this.WriteOutput = function (inOutput) {
        ctx.font = "20px Times New Roman";
        ctx.fillStyle = "Black";
        ctx.fillText(inOutput, 5, 30);
    };

    this.setPlayerImage = function (inSrcImage) {
        playerImage = inSrcImage;
    }

    this.Pan = function (vPixels, hPixels) {
        var p = true;
    };

    this.Move = function (vPixels, hPixels) {
        if (drawings[0]) {
            drawings[0] = drawing(drawings[0].x + hPixels, drawings[0].y + vPixels, 16, 16, playerImage);
        } else {
            drawings[0] = drawing(hPixels, vPixels, 16, 16, playerImage);
        }
    };

    this.displayLogin = function () {
        //$('#dvLogin').css('left', 400).css('top', 200).show();
    };

    this.hideLogin = function () {
        //$('#dvLogin').hide();
    };

    var drawings = new Array();

    function drawing(inX, inY, inHeight, inWidth, inImageSrc) {
        return {
            x: inX,
            y: inY,
            height: inHeight,
            width: inWidth,
            imgSrc: inImageSrc,
            image: function () {
                var img = new Image();
                img.src = imgSrc;
                return img;
            }
        };
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, $('#playArea').width(), $('#playArea').height());
    }

    this.drawCanvas = function () {
        requestAnimationFrame(drawCanvas);
        clearCanvas();

        for (var i = 0; i < drawings.length; i++) {
            var i = 0;
            var img = new Image();
            img.src = drawings[i].imgSrc;
            ctx.save();
            ctx.drawImage(img, drawings[i].x, drawings[i].y);
            ctx.restore();
        }

        var time = new Date().getTime() * 0.002;
        var x = Math.sin(time * 2) * 96 + 128;
        var y = Math.cos(time * 0.9) * 96 + 128;

        ctx.fillStyle = 'rgb(255,0,0)';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    };

    return this;
};

window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */callback, /* DOMElement */element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();