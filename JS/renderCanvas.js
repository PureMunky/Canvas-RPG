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

  		//TG.Engines.Debug.WriteOutput(TG.Engines.Game.CurrentHistoryLocation);
  		if (TG.Engines.Game.CurrentHistory()) {
            for (var i = 0; i < TG.Engines.Game.CurrentHistory().length; i++) {
            	try {
            		var r = TG.Engines.Game.CurrentHistory()[i].getRender();
            		
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
    	           	
    	           	if(TG.Engines.Game.CurrentHistory()[i].title) {
    	           		WriteOutput(TG.Engines.Game.CurrentHistory()[i].toString(),
    	           			r.x + r.width,
    	           			r.y + r.height
    	           		);
    	           	}
            	}catch(e) {
    				TG.Engines.Debug.WriteOutput(e);        		
            	}
            }
        }

    };

    return this;
};

var Animation = (function () {
	function oRender(inImage, inWidth, inHeight, inImageX, inImageY) {
	    var that = this;
	    
		that.image = 	inImage || new Image();
		that.width = 	inWidth || 16;
		that.height = 	inHeight || 16;
		that.imageX = 	inImageX || 0;
		that.imageY = 	inImageY || 0;
		
		that.Animations = new Array();
		var PrimaryAnimation = 'walk';
		var InterruptAnimation = null;
		
		that.addAnimation = function(inAnimation, name) {
			that.Animations[name] = inAnimation;
		}
		
		that.setAnimation = function(name) {
			if(that.Animations[name].interrupt) {
				InterruptAnimation = name;
			} else {
				PrimaryAnimation = name;	
			}
		}
		
		that.Tick = function () {
			var bool = that.CurrentAnimation().Tick();
			
			if(!bool) InterruptAnimation = null;
		}
		
		that.CurrentAnimation = function() {
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
	
	function oFrame(inX, inY, inTime) {
		var that = this;
		
	    that.x = inX;
	    that.y = inY;
	    that.t = inTime;
	}
	
	function oAnimation(interrupt) {
		var that = this;
		
	    that.frames = new Array();
	    that.interrupt = interrupt || false;
	    
	    var   currentFrame = 0,
	          currentTime = 0;
	    
	    var incFrame = function () {
	    	var rtnBool = true;
	        currentFrame++;
	        if(currentFrame >= that.frames.length) {
	            currentFrame = 0;
	            rtnBool = !interrupt;
	        }
	        
	        return rtnBool;
	    }
	    
	    that.Tick = function () {
	    	var rtnBool = true;
            currentTime++;
            if(currentTime > that.frames[currentFrame].t) {
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
	
	var _Character = function (inImage, defaultAnimation) {
		var _render = new oRender(inImage, 16, 16, 0, 0);
		var _Walk = new oAnimation();
		_Walk.addFrame(new oFrame(null, 0, 20));
		_Walk.addFrame(new oFrame(null, 16, 20));
		_Walk.addFrame(new oFrame(null, 32, 20));
		_Walk.addFrame(new oFrame(null, 48, 20));
		_render.addAnimation(_Walk, 'walk');
		
		var _Idle = new oAnimation();
		_Idle.addFrame(new oFrame(64, 0, 100));
		_Idle.addFrame(new oFrame(64, 16, 100));
		_Idle.addFrame(new oFrame(64, 32, 100));
		_render.addAnimation(_Idle, 'idle');
		
		var _AttackMelee = new oAnimation(true);
		_AttackMelee.addFrame(new oFrame(null, 64, 10));
		_AttackMelee.addFrame(new oFrame(null, 80, 10));
		_render.addAnimation(_AttackMelee, 'attackMelee');
		
		var _Dead = new oAnimation();
		_Dead.addFrame(new oFrame(64, 0, 1000));
		_render.addAnimation(_Dead, 'dead');
		
		return _render;
	}
	
	var _Plant = function (inImage, defaultAnimation) {
		var _render = new oRender(inImage, 16, 16, 0, 0);
		var _SlowBreeze = new oAnimation();
		_SlowBreeze.addFrame(new oFrame(0, 0, 40));
		_SlowBreeze.addFrame(new oFrame(0, 16, 40));
		_SlowBreeze.addFrame(new oFrame(0, 32, 40));
		_SlowBreeze.addFrame(new oFrame(0, 48, 40));
		_SlowBreeze.addFrame(new oFrame(0, 64, 40));
		_render.addAnimation(_SlowBreeze, 'slowBreeze');
		
		var _FastBreeze = new oAnimation();
		_FastBreeze.addFrame(new oFrame(16, 0, 10));
		_FastBreeze.addFrame(new oFrame(16, 16, 10));
		_FastBreeze.addFrame(new oFrame(16, 32, 10));
		_FastBreeze.addFrame(new oFrame(16, 48, 10));
		_FastBreeze.addFrame(new oFrame(16, 64, 10));
		_render.addAnimation(_FastBreeze, 'fastBreeze');
		
		return _render;
	}
	 
	return {
		Player: function (defaultAnimation) {
			return _Character(TG.Engines.GlobalVars._PlayerImage, defaultAnimation);
		},
		Plant: function (defaultAnimation) {
			return _Plant(TG.Engines.GlobalVars._PlantImage, defaultAnimation);
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