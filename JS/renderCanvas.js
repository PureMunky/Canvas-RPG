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

    this.WriteOutput = function (inOutput, x, y) {
    	x = x || 50;
    	y = y || 30;
        ctx.font = "15px Times New Roman";
        ctx.fillStyle = "Black";
        ctx.fillText(inOutput, x, y);
    };

    this.Pan = function (vPixels, hPixels) {
    	// TODO: Setup panning
        var p = true;
    };

    function clearCanvas() {
        document.getElementById('playArea').width = document.getElementById('playArea').width;
    }

    this.drawCanvas = function () {
        requestAnimationFrame(drawCanvas);
        clearCanvas();

  		//TG.Engines.Debug.WriteOutput('x: ' + TG.Engines.Game.GameObjects[0].x + ', y: ' + TG.Engines.Game.GameObjects[0].y);
        for (var i = 0; i < TG.Engines.Game.GameObjects.length; i++) {
        	try {
        		var r = TG.Engines.Game.GameObjects[i].getRender();
        		
	           	ctx.drawImage(r.image,
	           		r.imageX,
	           		r.imageY,
	           		r.width,
	           		r.height,
	           		r.x,
	           		r.y,
	           		r.width,
	           		r.height
	           	);
	           	
	           	if(TG.Engines.Game.GameObjects[i].title) {
	           		WriteOutput(TG.Engines.Game.GameObjects[i].toString(),
	           			r.x + r.width,
	           			r.y + r.height
	           		);
	           	}
        	}catch(e) {
				TG.Engines.Debug.WriteOutput(e);        		
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