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

var Animation = (function () {
	function oRender(inImage, inWidth, inHeight, inImageX, inImageY) {
	    // TODO: Move this to the render class.
		this.image = 	inImage || new Image();
		this.width = 	inWidth || 16;
		this.height = 	inHeight || 16;
		this.imageX = 	inImageX || 0;
		this.imageY = 	inImageY || 0;
		
		this.Animations = new Array();
		this.CurrentAnimation = 0;
		
		this.addAnimation = function(inAnimation) {
			this.Animations.push(inAnimation);
		}
		
		this.setAnimation = function(name) {
			//this.CurrentAnimation = name;
		}
		
		this.Tick = function () {
			this.Animations[0].Tick();
		}
		
		this.CurrentFrame = function () {
			return {
				image: this.image,
				imageX: this.Animations[0].CurrentFrame().x,
				imageY: this.Animations[0].CurrentFrame().y,
				width: this.width,
				height: this.height
			}
		}
	}
	
	function oFrame(inX, inY, inTime) {
	    this.x = inX;
	    this.y = inY;
	    this.t = inTime;
	}
	
	function oAnimation() {
	    this.frames = new Array();
	    
	    var   currentFrame = 0,
	          currentTime = 0;
	    
	    var incFrame = function () {
	        currentFrame++;
	        if(currentFrame > this.frames.length) {
	            currentFrame = 0;
	        }
	    }
	    
	    this.Tick = function () {
	    	/*
            currentTime++;
            if(currentTime > frames[currentFrame].t) {
                currentTime = 0;
                incFrame();
            }
            */
           incFrame();
	    };
	    
	    this.addFrame = function (inFrame) {
	        this.frames.push(inFrame);
	    }
	    
	    this.CurrentFrame = function () {
	    	return this.frames[0];
	    }
	}
	
	var _Character = function (inImage, defaultAnimation) {
		var _render = new oRender(inImage, 16, 16, 0, 0);
		var _Walk = new oAnimation();
		_Walk.addFrame(new oFrame(null, 0, 100));
		_Walk.addFrame(new oFrame(null, 16, 100));
		_Walk.addFrame(new oFrame(null, 32, 100));
		_Walk.addFrame(new oFrame(null, 48, 100));
		_render.addAnimation(_Walk);

		return _render;
	}
	
	 
	return {
		Player: function (defaultAnimation) {
			return _Character(TG.Engines.GlobalVars._PlayerImage, defaultAnimation);
		}
	};
})();

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