TG.Engines.Render = (function(that) {
    var PanLocation = {
        x: 0,
        y: 0
    }
	
	that.Context = {};
	
	that.MovePanLocation = function (inPosition) {
	    PanLocation.x = PanLocation.x + inPosition.x;
	    PanLocation.y = PanLocation.y + inPosition.y;
	}
	
    that.FillScreen = function () {
        $('#playArea').width(1);
        $('#playArea').height(1);
        that.SetPlayAreaSize($(document).width(), $(document).height());
    };

    that.SetPlayAreaSize = function (width, height) {
        $('#playArea').width(width);
        $('#playArea').height(height);
        document.getElementById('playArea').setAttribute('width', width + 'px');
        document.getElementById('playArea').setAttribute('height', height + 'px');
    };

    that.WriteOutput = function (inOutput, x, y) {
    	x = x || 50;
    	y = y || 30;
        that.Context.font = "15px Times New Roman";
        that.Context.fillStyle = "Black";
        that.Context.fillText(inOutput, x, y);
    };

    that.Pan = function (vPixels, hPixels) {
    	// TODO: Setup panning
        var p = true;
    };

    function clearCanvas() {
        document.getElementById('playArea').width = document.getElementById('playArea').width;
    }

    that.drawCanvas = function () {
        requestAnimationFrame(that.drawCanvas);
        clearCanvas();
        
        var p = TG.Engines.Game.Player().getPosition();
        
        if (p.x < PanLocation.x + TG.Engines.GlobalVars._BorderPadding) {
            PanLocation.x--;
        } else if (p.x > PanLocation.x + $('#playArea').width() - TG.Engines.GlobalVars._BorderPadding) {
            PanLocation.x++;
        }
        
        if (p.y < PanLocation.y + TG.Engines.GlobalVars._BorderPadding) {
            PanLocation.y--;
        } else if (p.y > PanLocation.y + $('#playArea').height() - TG.Engines.GlobalVars._BorderPadding) {
            PanLocation.y++;
        }
        
  		//TG.Engines.Debug.WriteOutput(TG.Engines.Game.CurrentHistoryLocation);
  		if (TG.Engines.Game.CurrentHistory()) {
  		    var viewAbleItemsCount = 0;
            for (var i = 0; i < TG.Engines.Game.CurrentHistory().length; i++) {
            	try {
            	    var r = TG.Engines.Game.CurrentHistory()[i].getRender();
            		
            		if (r.x - PanLocation.x > 0
                		    && r.x - PanLocation.x < $('#playArea').width()
                		    && r.y - PanLocation.y > 0
                		    && r.y - PanLocation.y < $('#playArea').height()
            		    ) {
            		    
            		    viewAbleItemsCount++;
        	           	that.Context.drawImage(r.image,
        	           		r.imageX,
        	           		r.imageY,
        	           		r.width,
        	           		r.height,
        	           		r.x - PanLocation.x,
        	           		r.y - PanLocation.y,
        	           		r.width,
        	           		r.height
        	           	);
        	           	
        	           	if(TG.Engines.Game.CurrentHistory()[i].title) {
        	           		that.WriteOutput(TG.Engines.Game.CurrentHistory()[i].toString(),
        	           			r.x + r.width - PanLocation.x,
        	           			r.y + r.height - PanLocation.y
        	           		);
        	           	}
        	        }
            	}catch(e) {
    				TG.Engines.Debug.WriteOutput(e);        		
            	}
            }
            
            TG.Engines.Debug.WriteOutput();
        }

    };

    return that;
})(TG.Engines.Render || {});

TG.Engines.Animation = (function (that) {
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
	
	that.Player = function (defaultAnimation) {
		return _Character(TG.Engines.GlobalVars._PlayerImage, defaultAnimation);
	};
	
	that.Plant = function (defaultAnimation) {
		return _Plant(TG.Engines.GlobalVars._PlantImage, defaultAnimation);
	};
	
	return that;
})(TG.Engines.Animation || {});

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

$(function () {
    TG.Engines.Render.FillScreen();
    $(window).resize(function () {
        TG.Engines.Render.FillScreen();
    });

    TG.Engines.Render.Context = document.getElementById('playArea').getContext('2d');
    TG.Engines.Render.drawCanvas();
});