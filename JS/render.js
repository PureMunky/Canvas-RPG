$(function () {
    FillScreen()
    $(window).resize(function () {
        FillScreen()
    });
});

function FillScreen() {
    $('#playArea').width(1);
    $('#playArea').height(1);
    SetPlayAreaSize($(document).width(), $(document).height());
}

function SetPlayAreaSize(width, height) {
    $('#playArea').width(width);
    $('#playArea').height(height);
}

function WriteOutput(inOutput) {
    $('#output').text('Output: ' + inOutput);
}

function setPlayerImage(inSrcImage) {
    $('#player').css('background-image', 'url(' + inSrcImage + ')');
}

function Pan(vPixels, hPixels) {
    $('#playStage').css('left', $('#playStage').position().left + -hPixels);
    $('#playStage').css('top', $('#playStage').position().top + -vPixels);
}

function Move(vPixels, hPixels) {
    $('#player').css('left', $('#player').position().left + hPixels);
    $('#player').css('top', $('#player').position().top + vPixels);
}

function displayLogin() {
    $('#dvLogin').css('left', 400).css('top', 200).show();
}
function hideLogin() {
    $('#dvLogin').hide();
}