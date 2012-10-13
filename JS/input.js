function InputV1() {
    $(function () {
        $(document).keydown(function (event) {
            if (!keyboardEntry) {
                event.preventDefault();

                if (event.keyCode == _UPKEY.keyCode) {
                    //TG.Engines.Action.SetMoving({ vertical: -1 });
                    TG.Engines.Game.GameObjects[0].setMoving({ vertical: -1 });
                } else if (event.keyCode == _RIGHTKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ horizontal: 1 });
                    //moving.horizontal = 1;
                } else if (event.keyCode == _DOWNKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ vertical: 1 });
                    //moving.vertical = 1;
                } else if (event.keyCode == _LEFTKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ horizontal: -1 });
                    //moving.horizontal = -1;
                } else if (event.keyCode == _RUNKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving(true);
                    //moving.running = true;
                } else if (event.keyCode == _ATTACKKEY.keyCode) {

                }
            }
            TG.Engines.Debug.WriteOutput(event.keyCode);
        });

        $(document).keyup(function (event) {
            if (!keyboardEntry) {
                event.preventDefault();
                if (event.keyCode == _UPKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ vertical: 0 });
                } else if (event.keyCode == _RIGHTKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ horizontal: 0 });
                } else if (event.keyCode == _DOWNKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ vertical: 0 });
                } else if (event.keyCode == _LEFTKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving({ horizontal: 0 });
                } else if (event.keyCode == _RUNKEY.keyCode) {
                    TG.Engines.Game.GameObjects[0].setMoving(false);
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
    return this;
};