TG.Engines.Data = (function () {
    'use strict';
    var that = {};

    that.Write = function (name, value) {
        localStorage.setItem(name, value);
    }

    that.Read = function (name) {
        return localStorage.getItem(name);
    }

    return that;
}());