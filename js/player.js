(function(global) {
    function Player(options) {
        var html = '<div class="player">\
                        <div class="media-player" id="media-player">\
                            <p class="media-time"><span class="current-time"  id="has-played">00:00:00</span> / <span class="total-time" id="total-time">55:09</span></p>\
                            <div class="play-bar" id="play-bar"></div>\
                            <div class="play-on" id="play-on"><div class="dot-box" id="dot-box"><a href="javascript:;" class="btn btn-play-dot" id="play-dot"></a></div></div>\
                        </div>\
                        <div class="player-controller" id="player-controller">\
                            <div class="toggle" id="toggle">\
                                <div class="play" id="play">&#xe60a;</div>\
                                <div class="pause hide" id="pause">&#xe60b;</div>\
                            </div>\
                        </div>\
                    </div>',
            defaults = {
                $audio: {},
                srcUrl: [],
                toggleBtn: true,
                bufferBar: true,
                showVoice: true
            };
        opt = $.extend({}, defaults, options);
        opt.$audio.after(html);

        var _controller = {
                $btnControl: $('#toggle'),
                $mediaPlayer: $('#media-player'),
                $playerController: $('#player-controller'),
                $play: $('#play'),
                $pause: $('#pause'),
                $playBar: $('#play-bar'),
                $dotBox: $('#dot-box'),
                $hasPlayed: $('#has-played'),
                $totalTime: $('#total-time'),
                $playOn: $('#play-on'),
                $mediaTitle: null,
                $prev: null,
                $next: null,
                $hasLoad: null,
                $vol: null
            },
            _config = {
                playBarWidth: _controller.$playBar.width(),
                duration: 0,
                process: 0,
                playBarOffset: _controller.$playBar.offset().left,
                curItem: null,
                IS_MOVING: false,
                CAN_PLAY: false,
                SRC_INDEX: 0
            };
        if (opt.bufferBar) {
            _controller.$playBar.after('<div class="has-loaded" id="has-loaded"></div>');
            _controller.$hasLoad = $('#has-loaded')
        }
        if (opt.toggleBtn) {
            _controller.$btnControl.before('<div class="prev" id="prev">&#xe60d;</div>');
            _controller.$btnControl.after('<div class="next" id="next">&#xe60c;</div>');
            _controller.$prev = $('#prev');
            _controller.$next = $('#next');
        }
        if (opt.showVoice) {
            _controller.$playerController.append('<div class="volume" id="volume">&#xe604;<div class="vol" id="vol"><div class="vol-bg" id="vol-bg"></div><div class="vol-val" id="vol-val"></div></div></div>');
            _controller.$vol = $('#vol');
        }
        fLoadSrc(opt.srcUrl[_config.SRC_INDEX].url, null);
        var playOnWidth = _controller.$playOn.width();
        _controller.$playOn.width(playOnWidth - 12);
        _controller.$playOn.css('left', -playOnWidth + 12);

        /* player */
            // safari不会触发loadeddata，canplay等事件
            opt.$audio.on('progress', function() {
                _config.CAN_PLAY = true;
                fLoadingBar(this);
            });
            opt.$audio.on('timeupdate', function() {
                if (!_config.IS_MOVING) {
                    fChangeProgress(opt.$audio[0].currentTime / _config.duration);
                }
            });
            // 开始暂停控制
            _controller.$btnControl.on('touchend', function() {
                opt.$audio[0].paused ? fMediaPlay() : fMediaPause();
            });
            // 进度条拖动控制
            var diffLen, startX, startY;
            _controller.$dotBox.on('touchstart', function(e) {
                var pageX = e.touches ? e.touches[0].pageX : e.pageX;
                diffLen = pageX - $(e.target).offset().left;
                return false;
            }).on('touchmove', function(e) {
                e.preventDefault();
                _config.IS_MOVING = true;
                var pageX = e.touches ? e.touches[0].pageX : e.pageX,
                    clickPoint = pageX - diffLen;
                _config.process = (clickPoint - _config.playBarOffset) / _config.playBarWidth;
                fChangeProgress(_config.process);
            }).on('touchend', function() {
                _config.IS_MOVING = false;
                opt.$audio[0].currentTime = _config.process * _config.duration;
            });
            // 进度条点击控制
            _controller.$mediaPlayer.on('touchstart', function(e) {
                e.preventDefault();
                var touches = e.touches ? e.touches[0] : e;
                startX = touches.clientX;
                startY = touches.clientY;
            }).on('touchend', function(e) {
                var touches = e.changedTouches ? e.changedTouches[0] : e,
                    endX = touches.clientX,
                    endY = touches.clientY,
                    pageX = touches.pageX;
                if( Math.abs(startX - endX) < 6 && Math.abs(startY - endY) < 6 ){
                    _config.process = pageX / _config.playBarWidth;
                    if (_config.CAN_PLAY) {
                        fChangeProgress(_config.process);
                        opt.$audio[0].currentTime = _config.process * _config.duration;
                    }
                }
            });
            // 切换歌曲
            _controller.$prev.on('touchend', function() {
                if (_config.SRC_INDEX > 0) {
                    fLoadSrc(opt.srcUrl[--_config.SRC_INDEX].url, fMediaPlay);
                }
            });
            _controller.$next.on('touchend', function() {
                if (_config.SRC_INDEX < opt.srcUrl.length - 1) {
                    fLoadSrc(opt.srcUrl[++_config.SRC_INDEX].url, fMediaPlay);
                }
            });
            // 监听媒体结束事件
            opt.$audio.on('ended', function() {
                var $this = this;
                if (_config.SRC_INDEX < opt.srcUrl.length - 1) {
                    fLoadSrc(opt.srcUrl[++_config.SRC_INDEX].url, fMediaPlay);
                } else {
                    $this.currentTime = 0;
                    _controller.$play.removeClass('hide');
                    _controller.$pause.addClass('hide');
                }
            });
            // 音量
            var offset;
            _controller.$vol.on('touchstart', function(e) {
                e.preventDefault();
                var touches = e.touches ? e.touches[0] : e;
                offset = $('#vol-bg').offset().left;
                startX = touches.clientX;
                startY = touches.clientY;
            }).on('touchend', function(e) {
                var touches = e.changedTouches ? e.changedTouches[0] : e,
                    endX = touches.clientX,
                    endY = touches.clientY,
                    pageX = touches.pageX;
                if( Math.abs(startX - endX) < 6 && Math.abs(startY - endY) < 6 ){
                    var volume = (pageX - offset) / $('#vol-bg').width();
                    $('#vol-val').width(volume * 100 + '%');
                    opt.$audio[0].volume = volume;
                    debug.log(volume);
                    debug.log(opt.$audio[0].volume);
                }
            });
        /* player end */
        function fChangeProgress(process) {
            _controller.$playOn[0].style.webkitTransform = 'translateX(' + (process * 100) + '%)';
            fTimeDispose(process * _config.duration);
        }
        function fMediaPlay() {
            if (!opt.$audio[0].error) {
                _controller.$play.addClass('hide');
                _controller.$pause.removeClass('hide');
                opt.$audio[0].play();
            } else {
                fErrorDispose('节目音频出错，请尝试其他节目！');
            }
        }
        function fMediaPause() {
            _controller.$play.removeClass('hide');
            _controller.$pause.addClass('hide');
            opt.$audio[0].pause();
        }
        // 时间进度处理
        function fTimeDispose(pastTime) {
            var str = '',
                hour = parseInt(pastTime / 3600),
                minute = parseInt((pastTime % 3600) / 60),
                second = parseInt((pastTime % 3600) % 60);

            hour = hour < 10 ? '0' + hour : hour;
            minute = minute < 10 ? '0' + minute : minute;
            second = second < 10 ? '0' + second : second;

            str = hour + ':' + minute + ':' + second;
            _controller.$hasPlayed.text(str); 
        }
        function fChangeToSecond(timeStr) {
            var timeArray = timeStr.split(':');
            _config.duration = timeArray[0] * 3600 + timeArray[1] * 60 + timeArray[2] * 1;
        }
        function fLoadSrc(src, callback) {
            _config.CAN_PLAY = false;
            opt.$audio[0].preload = 'metadata';
            opt.$audio[0].src = src;
            opt.$audio[0].load();

            // _controller.$mediaTitle.find('.primary').eq(0).text(curItem.find('.primary').text());
            _controller.$hasPlayed.text('00:00:00');
            _controller.$totalTime.text(opt.srcUrl[_config.SRC_INDEX].duration);

            fChangeToSecond(_controller.$totalTime.text());
            fChangeProgress(0);

            setTimeout(function() {
                callback ? callback() : callback;
            }, 500);
        }
        function fLoadingBar($audio) {
            var process = $audio.buffered.end(0) / _config.duration;
            _controller.$hasLoad[0].style.webkitTransform = 'translateX(' + (process * 100) + '%)';
        }
        // 异常处理
        function fErrorDispose(msg) {
            console.log('error');
        }
        return opt.$audio;
    }
    global.Player = Player;
})(window);