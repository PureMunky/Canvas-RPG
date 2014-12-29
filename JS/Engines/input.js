'use strict';
TG.Engines.Input = (function (that) {
    $(function () {
        $(document).keydown(function (event) {
            if (!keyboardEntry) {
                event.preventDefault();
				//TODO: smooth out when pressing two opposing directions at the same time (e.x. Left and Right).
				//TODO: add ability to click/touch where to move to (for phone/tablet).
				TG.Engines.Game.Player().setAI();
                if (event.keyCode == _UPKEY.keyCode) {
                    //TG.Engines.Action.SetMoving({ vertical: -1 });
                    TG.Engines.Game.Player().setMoving({ vertical: -1 });
                } else if (event.keyCode == _RIGHTKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ horizontal: 1 });
                    //moving.horizontal = 1;
                } else if (event.keyCode == _DOWNKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ vertical: 1 });
                    //moving.vertical = 1;
                } else if (event.keyCode == _LEFTKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ horizontal: -1 });
                    //moving.horizontal = -1;
                } else if (event.keyCode == _RUNKEY.keyCode) {
                    TG.Engines.Game.Player().setRun(true);
                    //moving.running = true;
                } else if (event.keyCode == _ATTACKKEY.keyCode) {
					TG.Engines.Game.Player().Combat.Attack();
				} else if (event.keyCode == _INTERACTKEY.keyCode) {
                    TG.Engines.Game.Player().Interact.Perform();
                } else if (event.keyCode == _PAUSE.keyCode) {
                    TG.Engines.Game.Pause();
                } else if (event.keyCode == _REWIND.keyCode) {
                    TG.Engines.Game.Rewind();
                } else if (event.keyCode == _FORWARD.keyCode) {
                    TG.Engines.Game.Forward();
                } else if (event.keyCode == _PanDown.keyCode) {
                    TG.Engines.Render.MovePanLocation({x: 0, y: 1});
                } else if (event.keyCode == _PanRight.keyCode) {
                    TG.Engines.Render.MovePanLocation({x: 1, y: 0});
                } else if (event.keyCode == _PanLeft.keyCode) {
                    TG.Engines.Render.MovePanLocation({x: -1, y: 0});
                } else if (event.keyCode == _PanUp.keyCode) {
                    TG.Engines.Render.MovePanLocation({ x: 0, y: -1 });
                } else if (event.keyCode == _TestButton.keyCode) {
                    TG.Test.Perform();
                }
            }
            
            TG.Engines.Debug.Log(event.keyCode);
        });

        $(document).keyup(function (event) {
            if (!keyboardEntry) {
                event.preventDefault();
                if (event.keyCode == _UPKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ vertical: 0 });
                } else if (event.keyCode == _RIGHTKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ horizontal: 0 });
                } else if (event.keyCode == _DOWNKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ vertical: 0 });
                } else if (event.keyCode == _LEFTKEY.keyCode) {
                    TG.Engines.Game.Player().setMoving({ horizontal: 0 });
                } else if (event.keyCode == _RUNKEY.keyCode) {
                    TG.Engines.Game.Player().setRun(false);
                    //moving.running = false;
                }
            }
            //WriteOutput(event.keyCode);
        });
    });

    var _UPKEY = keyboardButton('69', function () { }, function () { });    //E
    var _RIGHTKEY = keyboardButton('70', function () { }, function () { }); //F
    var _LEFTKEY = keyboardButton('83', function () { }, function () { });  //S
    var _DOWNKEY = keyboardButton('68', function () { }, function () { });  //D
    var _RUNKEY = keyboardButton('65', function () { }, function () { });   //A
    var _MENUKEY = keyboardButton('27', function () { }, function () { });
    var _ATTACKKEY = keyboardButton('32', function () { }, function () { }); //[Space]
    var _INTERACTKEY = keyboardButton('84', function () { }, function () { }); //[Space]
    var _PAUSE = keyboardButton('67', function () { }, function () { }); //C
    var _REWIND = keyboardButton('88', function () { }, function () { }); //X
    var _FORWARD = keyboardButton('86', function () { }, function () { }); //V

    var _PanRight = keyboardButton('39'); // Right Arrow
    var _PanDown = keyboardButton('40'); // Right Arrow
    var _PanLeft = keyboardButton('37'); // Right Arrow
    var _PanUp = keyboardButton('38'); // Right Arrow
    
    var _TestButton = keyboardButton('71'); // G

    var keyboardEntry = false;

    function keyboardButton(inKeyCode, inDownAction, inUpAction) {
        return {
            keyCode: inKeyCode,
            currentlyPressed: false,
            downAction: function () {
                inDownAction();
            },
            upAction: function () {
                inUpAction();
            }
        };
    }

    function LogIn(username, password) {
        hideLogin();
        keyboardEntry = false;
    }
    
    $(function () {
    	//TODO: Set click event to be context sensitive (e.x. click on an enemy turns player hostile and attacks enemy).
    	document.getElementById('playArea').addEventListener('click', function(e) {
	        var clickPos = {x: e.offsetX, y: e.offsetY};
	        TG.Engines.Game.Player().setAI(TG.Engines.AI.toward(clickPos));
	    }, false);
	    
    });
    
    function gamepadTick() {
    	var pad = navigator.getGamepads()[0];
    	try {
    		if (pad) {
    			// Set Horizontal Motion
	    		if (Math.abs(pad.axes[0]) > TG.Engines.GlobalVars._GamePadThreshold) {
	    			TG.Engines.Game.Player().setMoving({ horizontal: pad.axes[0] });
	    		} else {
	    			TG.Engines.Game.Player().setMoving({ horizontal: 0 });
	    		}
	    		
	    		// Set Vertical Motion
	    		if (Math.abs(pad.axes[1]) > TG.Engines.GlobalVars._GamePadThreshold) {
	    			TG.Engines.Game.Player().setMoving({ vertical: pad.axes[1] });
	    		} else {
	    			TG.Engines.Game.Player().setMoving({ vertical: 0 });	    			
	    		}
	    		
	    		// Run
	    		TG.Engines.Game.Player().setRun(pad.buttons[2]);

				// Attack
				// TODO: Only fire attack once per button push.
				TG.Engines.Game.Player().Attack();
	    	} else {
	    		//TG.Engines.Debug.WriteOutput('no gamepad');
	    	}
    	} catch (e) {

    	}
    	
    	gamepadPoll();
    }
    
    function gamepadPoll() {
	    if (window.requestAnimationFrame) {
	      window.requestAnimationFrame(gamepadTick);
	    } else if (window.mozRequestAnimationFrame) {
	      window.mozRequestAnimationFrame(gamepadTick);
	    } else if (window.webkitRequestAnimationFrame) {
	      window.webkitRequestAnimationFrame(gamepadTick);
	    } 
    }
    
    // Start the gamepad Polling
    gamepadTick();
    
    return that	;
})(TG.Engines.Input || {});