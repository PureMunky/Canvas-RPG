function RenderCanvasV1() {
    $(function () {
        TG.Engines.Render.FillScreen();
        $(window).resize(function () {
            TG.Engines.Render.FillScreen();
        });

        TG.Engines.Render.ctx = document.getElementById('playArea').getContext('2d');
        TG.Engines.Render.drawCanvas();
    });

	
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
		drawings[0].setImage(inSrcImage);
    }

    this.Pan = function (vPixels, hPixels) {
        var p = true;
    };

    this.Move = function (vPixels, hPixels) {
        drawings[0].setPosition(drawings[0].x + hPixels, drawings[0].y + vPixels);
    };

    this.displayLogin = function () {
        //$('#dvLogin').css('left', 400).css('top', 200).show();
    };

    this.hideLogin = function () {
        //$('#dvLogin').hide();
    };

    var drawings = new Array();
	
    function drawing(inX, inY, inHeight, inWidth, inImageSrc) {
        var that = this;
        
        that.x = inX;
        that.y = inY;
        
        that.height = inHeight;
        that.width = inWidth;
        
        that.imgSrc = inImageSrc;
        
        that.image = new Image();
        that.image.src = inImageSrc;
        
        that.setImage = function (imgSrc) {
        	that.image.src = imgSrc;
        }
        
        that.setPosition = function (x, y) {
        	that.x = x;
        	that.y = y;
        }
    }

	drawings[0] = new drawing(0, 0, 16, 16, '');

    function clearCanvas() {
        ctx.clearRect(0, 0, $('#playArea').width(), $('#playArea').height());
    }

    this.drawCanvas = function () {
        requestAnimationFrame(drawCanvas);
        clearCanvas();


        for (var i = 0; i < drawings.length; i++) {
        	try {
	           	ctx.drawImage(drawings[i].image, 0, 0, drawings[i].width, drawings[i].height, drawings[i].x, drawings[i].y, drawings[i].width, drawings[i].height);	
        	}catch(e) {
				//TG.Engines.Debug.WriteOutput(e);        		
        	}
        }

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