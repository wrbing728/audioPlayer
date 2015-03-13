$(function() {
    var ui = {
        $progress: null,
        $audio: $('#audio'),
        $handle: $('.play-handle'),
        $scrubber: $('.scrubber'),
        $playControl: $('.play-pause'),
        $play: $('.play'),
        $loaded: $('.loaded'),
        $pause: $('.pause')
    };
    var oPage = {
        progressW: 0,
        duration: 0,
        audio: null,
        percent: 0,
        offsetL: 0,
        marginL: 0,
        marginR: 0,
        init: function() {
            this.view();
            this.listen();
        },
        view: function() {
            var self = this;

            dt_audio = new DTPlayer(ui.$audio, {
                playControl: '.play-pause',
                handleControl: '.play-handle',
                loadedControl: '.loaded'                
            })

            ui.$progress = $('.audiojs .progress');
            self.audio = ui.$audio[0];
            self.progressW = ui.$scrubber.width();
            self.offsetL = ui.$scrubber.offset().left;
            self.marginL = self.offsetL;
            self.marginR = self.offsetL + self.progressW;
            var audioIsLoaded = function() {
                if (!isNaN(self.audio.duration)) {
                    self.duration = self.audio.duration;
                    timer = null;
                    return;
                }
                var timer = setTimeout(audioIsLoaded, 50);
            };
            audioIsLoaded();
        },
        listen: function() {
            var self = this;

            // 游标拖曳
            var deltaX, offsetX;
            ui.$handle.on('touchstart', function(e) {
                var ox = e.touches ? e.touches[0].pageX : e.pageX;
                deltaX = ox - $(e.target).offset().left;
                offsetX = $(this).parent().offset().left;
            }).on('touchmove', function(e) {
                var pageX = e.touches ? e.touches[0].pageX : e.pageX;
                self.togglePlayPause(false);
                var moveWidth = pageX-offsetX;
                if (moveWidth <= self.marginL) {
                    moveWidth = self.marginL;
                } else if (moveWidth >= self.marginR) {
                    moveWidth = self.marginR;
                }
                ui.$handle.css('left', moveWidth);
                var newTime = self.duration * (moveWidth-34) / self.progressW;
                self.audio.currentTime = newTime;
            }).on('touchend', function(e) {
                self.togglePlayPause(true);
            });

            // 播放监听
            ui.$audio.on('timeupdate', function() {
                var percent = self.audio.currentTime/self.duration,
                    moveWidth = percent * self.progressW + 34,
                    formatedTime = self.formatTime(percent);

                self.percent = percent;

                ui.$progress[0].style.width = 100 * percent + '%';
                ui.$handle.css('left', moveWidth);
            });

            // 开始暂停控制
            ui.$playControl.on('touchend', function() {
                self.audio.paused ? self.togglePlayPause(true) : self.togglePlayPause(false);
            });

            // 进度条点击
            var startX, startY;
            ui.$scrubber.on('touchstart', function(e) {
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
                    var percent = (pageX - self.offsetL) / self.progressW,
                        moveWidth = percent * self.progressW;

                    ui.$progress[0].style.width = 100 * percent + '%'; 
                    ui.$handle.css('left', moveWidth); 
                    self.audio.currentTime = percent * self.duration;
                }
            });
        },
        // 格式化时间
        formatTime: function(percent) {
            var self = this,
                t = self.duration * percent,
                h = Math.floor(t / 3600),
                m = Math.floor(t % 3600 / 60),
                s = Math.floor(t % 60);
            return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + ( s < 10 ? '0' + s : s);
        },
        // 字符串时间转换为数字
        strToTime: function(str) {
            var self = this,
                timeArr = str.split(':'),
                time = 0;
            time += timeArr[0] * 3600 + timeArr[1] * 60 + +timeArr[2];
            return time;
        },
        togglePlayPause: function(bPlay) {
            var self = this;
            if (bPlay) {
                ui.$play.hide();
                ui.$pause.show();
                self.audio.play();
            } else {
                ui.$pause.hide();
                ui.$play.show();
                self.audio.pause();
            }
        },
        mediaPlay: function() {
            var self = this;
            ui.$play.hide();
            ui.$pause.show();
            self.audio.play();
        },
        mediaPause: function() {
            var self = this;
            ui.$pause.hide();
            ui.$play.show();
            self.audio.pause();
        }
    };
    oPage.init(); 
});