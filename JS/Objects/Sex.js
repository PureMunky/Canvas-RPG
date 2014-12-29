TG.Objects.Sex = function (title) {
    var that = this;
    that.title = title;

    that.toString = function () {
        return that.title + (that.state.pregnant || '');
    }
};