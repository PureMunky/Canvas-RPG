'use strict';
TG.Engines.Action = (function (that) {
    var moving = {
        vertical: 0,
        horizontal: 0,
        left: false,
        right: false,
        up: false,
        down: false,
        running: false
    }

    function getStepPixels() {
        var rtnInt = TG.Engines.GlobalVars._STEPPIXELS;

        if (moving.running) {
            rtnInt *= (1 + TG.Engines.GlobalVars._RUNPERC);
        }

        return rtnInt;
    }

    that.SetMoving = function (move) {
        if (move.vertical === 0) moving.vertical = 0;
        if (move.horizontal === 0) moving.horizontal = 0;

        moving.vertical = move.vertical ? move.vertical : moving.vertical;
        moving.horizontal = move.horizontal ? move.horizontal : moving.horizontal;
    };

    that.SetRun = function (run) {
        moving.running = run;
    };

    that.Tick = function () {
        var vPan, hPan, vMove, hMove;

        hPan = 0;
        vPan = 0;
        hMove = moving.horizontal;
        vMove = moving.vertical;

        if (hMove > 0) {
            TG.Engines.Render.setPlayerImage(TG.Engines.GlobalVars._PlayerImageRIGHT);
        } else if (hMove < 0) {
            TG.Engines.Render.setPlayerImage(TG.Engines.GlobalVars._PlayerImageLEFT);
        } else if (vMove > 0) {
            TG.Engines.Render.setPlayerImage(TG.Engines.GlobalVars._PlayerImageDOWN);
        } else if (vMove < 0) {
            TG.Engines.Render.setPlayerImage(TG.Engines.GlobalVars._PlayerImageUP);
        }
        /*
        //Horizontal Bounds
        if (hMove < 0 && $('#playStage').position().left == '0') {
        hPan = 0
        }

        if (hMove > 0 && (-$('#playStage').position().left) + $('#playArea').width() <= $('#playStage').width()) {
        hPan = 0
        }

        if (hMove < 0 && $('#player').position().left == '0') {
        hMove = 0;
        }

        if (hMove > 0 && $('#player').position().left + $('#player').width() >= $('#playStage').width()) {
        hMove = 0;
        }

        //Vertical Bounds
        if (vMove < 0 && $('#playStage').position().top == '0') {
        vPan = 0
        }

        if (vMove > 0 && (-$('#playStage').position().top) + $('#playArea').height() <= $('#playStage').height()) {
        vPan = 0
        }

        if (vMove < 0 && $('#player').position().top == '0') {
        vMove = 0;
        }

        if (vMove > 0 && $('#player').position().top + $('#player').height() >= $('#playStage').height()) {
        vMove = 0;
        }
        */

        //WriteOutput();
        /*f
        if (($('#playStage').position().left == '0' && hMove < 0) || ($('#playStage').position().left + $('#playArea').width() == $('#playStage').width() && hMove > 0)) {
        hPan = 0;
        }

        if ($('#playStage').position().top == '0' || $('#playStage').position().top + $('#playArea').height() == $('#playStage').height()) {
        vPan = 0;
        }
        */

        TG.Engines.Render.Pan(vPan * getStepPixels(), hPan * getStepPixels());
        TG.Engines.Render.Move(vMove * getStepPixels(), hMove * getStepPixels());
    };

    return that;
})(TG.Engines.Action || {});