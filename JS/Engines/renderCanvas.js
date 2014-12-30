'use strict';
TG.Engines.Render = (function (that) {
    var PanLocation = {
        x: 0,
        y: 0
    }
	
	that.Context = {};
	
	that.MovePanLocation = function (inPosition) {
	    PanLocation.x = PanLocation.x + inPosition.x;
	    PanLocation.y = PanLocation.y + inPosition.y;
	};
	
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
        	           	
                        // Write title/name
        	           	if(TG.Engines.Game.CurrentHistory()[i].title && r.DisplayTitle) {
        	           		that.WriteOutput(TG.Engines.Game.CurrentHistory()[i].toString(),
        	           			r.x + r.width - PanLocation.x,
        	           			r.y + r.height - PanLocation.y
        	           		);
        	           	}
        	           	
                        // Write current spoken words.
        	           	if(TG.Engines.Game.CurrentHistory()[i].speak) {
        	           		that.WriteOutput(TG.Engines.Game.CurrentHistory()[i].speak,
        	           			r.x - PanLocation.x,
        	           			r.y - PanLocation.y
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

TG.Engines.Animation = (function (that, a) {
	
	var _Character = function (inImage, defaultAnimation) {
		var _render = new a.Render(inImage, 16, 16, 0, 0);
		var _Walk = new a.Sequence();
		_Walk.addFrame(new a.Frame(null, 0, 20));
		_Walk.addFrame(new a.Frame(null, 16, 20));
		_Walk.addFrame(new a.Frame(null, 32, 20));
		_Walk.addFrame(new a.Frame(null, 48, 20));
		_render.addAnimation(_Walk, 'walk');
		
		var _Idle = new a.Sequence();
		_Idle.addFrame(new a.Frame(64, 0, 100));
		_Idle.addFrame(new a.Frame(64, 16, 100));
		_Idle.addFrame(new a.Frame(64, 32, 100));
		_render.addAnimation(_Idle, 'idle');
		
		var _AttackMelee = new a.Sequence(true);
		_AttackMelee.addFrame(new a.Frame(null, 64, 10));
		_AttackMelee.addFrame(new a.Frame(null, 80, 10));
		_render.addAnimation(_AttackMelee, 'attackMelee');
		
		var _Dead = new a.Sequence();
		_Dead.addFrame(new a.Frame(64, 0, 1000));
		_render.addAnimation(_Dead, 'dead');
		
		return _render;
	}
	
	var _CharacterDemo = function (inImage, defaultAnimation) {
		var _render = new a.Render(inImage, 32, 32, 0, 0);
		var _Walk = new a.Sequence();
		_Walk.addFrame(new a.Frame(0, null, 20));
		_Walk.addFrame(new a.Frame(32, null, 20));
		_Walk.addFrame(new a.Frame(64, null, 20));
		_Walk.addFrame(new a.Frame(32, null, 20));
		_render.addAnimation(_Walk, 'walk');
		
		var _Idle = new a.Sequence();
		_Idle.addFrame(new a.Frame(32, 0, 100));
		_Idle.addFrame(new a.Frame(32, 0, 100));
		_render.addAnimation(_Idle, 'idle');
		
		var _AttackMelee = new a.Sequence(true);
		_AttackMelee.addFrame(new a.Frame(null, 64, 10));
		_AttackMelee.addFrame(new a.Frame(null, 80, 10));
		_render.addAnimation(_AttackMelee, 'attackMelee');
		
		var _Dead = new a.Sequence();
		_Dead.addFrame(new a.Frame(64, 0, 1000));
		_render.addAnimation(_Dead, 'dead');
		
		return _render;
	}
	
	var _Plant = function (inImage, defaultAnimation) {
	    var _render = new a.Render(inImage, 16, 16, 0, 0);
	    var _SlowBreeze = new a.Sequence();
	    _SlowBreeze.addFrame(new a.Frame(0, 0, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 16, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 32, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 48, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 64, 40));
	    _render.addAnimation(_SlowBreeze, 'slowBreeze');

	    var _FastBreeze = new a.Sequence();
	    _FastBreeze.addFrame(new a.Frame(16, 0, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 16, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 32, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 48, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 64, 10));
	    _render.addAnimation(_FastBreeze, 'fastBreeze');

	    return _render;
	}

	var _Water = function (inImage, defaultAnimation) {
	    var _render = new a.Render(inImage, 16, 16, 0, 0);
	    var _SlowBreeze = new a.Sequence();
	    _SlowBreeze.addFrame(new a.Frame(0, 0, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 16, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 32, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 48, 40));
	    _SlowBreeze.addFrame(new a.Frame(0, 64, 40));
	    _render.addAnimation(_SlowBreeze, 'slowBreeze');

	    var _FastBreeze = new a.Sequence();
	    _FastBreeze.addFrame(new a.Frame(16, 0, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 16, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 32, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 48, 10));
	    _FastBreeze.addFrame(new a.Frame(16, 64, 10));
	    _render.addAnimation(_FastBreeze, 'fastBreeze');

	    return _render;
	}
	
	that.Player = function (defaultAnimation) {
		return _Character(TG.Engines.GlobalVars._PlayerImage, defaultAnimation);
	};
	
	that.Demo = function (defaultAnimation) {
		return _CharacterDemo(TG.Engines.GlobalVars._PlayerImageDemo, defaultAnimation);
	}
	
	that.NPCMale = function (defaulAnimation) {
		return _CharacterDemo(TG.Engines.GlobalVars._NPCMale, defaulAnimation);
	}

	that.NPCFemale = function (defaulAnimation) {
		return _CharacterDemo(TG.Engines.GlobalVars._NPCFemale, defaulAnimation);
	}
	
	that.NPCPony = function (defaulAnimation) {
		return _CharacterDemo(TG.Engines.GlobalVars._NPCPony, defaulAnimation);
	}
	
	that.Plant = function (defaultAnimation) {
		return _Plant(TG.Engines.GlobalVars._PlantImage, defaultAnimation);
	};

	that.Water = function (defaultAnimation) {
	    return _Plant(TG.Engines.GlobalVars._WaterImage, defaultAnimation);
	};
	
	return that;
})(TG.Engines.Animation || {}, TG.Objects.Animation);

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