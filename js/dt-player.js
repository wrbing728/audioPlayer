(function(global) {
    var DTPlayer = function($el, options) {

        var defaults = {
            playPauseClass: 'play-pause',
            scrubberClass: 'scrubber',
            progressClass: 'progress',
            loaderClass: 'loaded',
            timeClass: 'time',
            durationClass: 'duration',
            playedClass: 'played',
            errorMessageClass: 'error-message',
            playingClass: 'playing',
            loadingClass: 'loading',
            errorClass: 'error'
        };

        options = $.extend({}, defaults, options);

        audiojs.create($el, options);
    }
    global.DTPlayer = DTPlayer;
})(window);