$(function() {
    var ui = {
        $audio: $('#audio'),
        $btnControl: $('#btn-control'),
        $mediaPlayer: $('#media-player'),
        $playBar: $('#play-bar'),
        $playOn: $('#play-on'),
        $dotBox: $('#dot-box'),
        $playDot: $('#play-dot'),
        $hasPlayed: $('#has-played'),
        $totalTime: $('#total-time'),
        $albumList: $('#album-list'),
        $albumCaption: $('#album-caption'),
        $imgSrc: $('#img-src'),
        $listItem: $('.list-item'),
        $popup: $('#popup'),
        $loading: $('#loading'),
        $btnOpening: $('#btn-opening'),
        canvas: document.getElementById('canvas')
    };
    var oConfig = window.oPageConfig;
    var oPage = {
        playBarWidth: ui.$playBar.width(),
        duration: 0,
        process: 0,
        playBarOffset: ui.$playBar.offset().left,
        curItem: null,
        IS_MOVING: false,
        LOAD_OVER: false,
        CAN_PLAY: false,
        init: function() {
            this.view();
            this.listen();
        },
        view: function() {
            var self = this,
                playOnWidth = ui.$playOn.width();
                // ctx =  ui.canvas.getContext('2d')

            self.curItem = ui.$listItem.eq(0);
            self.fLoadSrc(self.curItem, null);

           ui.$playOn.width(playOnWidth - 12);
           ui.$playOn.css('left', -playOnWidth + 12);

        // cd-cover处理 canvas
            // ui.canvas.width = 200;
            // ui.canvas.height = 200;
            // var img = new Image();
            // img.src = ui.$imgSrc.val();

            // img.onload = function() {
            //     var souceX, souceY, minLen;

            //     if (img.width > img.height) {
            //         minLen = img.height;
            //         souceX = (img.width - img.height) / 2;
            //         souceY = 0;
            //     } else {
            //         minLen = img.width;
            //         souceX = 0;
            //         souceY = (img.height - img.width) / 2;
            //     }

            //     ctx.clearRect(0, 0, canvas.width, canvas.height);
            //     ctx.beginPath();
            //     ctx.arc(100, 100, 100, 0, 2 * Math.PI); // 创建圆形剪裁路径
            //     ctx.clip();
            //     ctx.drawImage(img, souceX, souceY, minLen, minLen, 0, 0, 200, 200);
            //     ctx.globalCompositeOperation = 'source-atop';
            // };
        },
        listen: function() {
            var self = this;
        /* pagination */
            $(window).on('scroll', function() {
                if (!self.LOAD_OVER) {
                    var viewH = $(this).height(),
                    contentH = $(document).height(),
                    scrollTop = $('body')[0].scrollTop + 5;
                    if (scrollTop >= (contentH - viewH) && !oConfig.oData.scrollLock) {
                        if (!oConfig.oData.hasNext) {
                            self.LOAD_OVER = true;
                            self.fErrorDispose('已经加载完了哟！');
                            return false;
                        }
                        oConfig.oData.scrollLock = true;
                        ui.$loading.show();
                        $.ajax({
                            url: oConfig.oUrl.contentList,
                            type: 'get',
                            dataType: 'json',
                            data: {
                                album_id: oConfig.oData.albumId,
                                page: oConfig.oData.page,
                                page_size: oConfig.oData.pageSize
                            },
                            success: function(result) {
                                if (undefined == result.error) {
                                    var html = '',
                                    data = result.data;
                                    oConfig.oData.hasNext = result.page.has_next;

                                    for (var i = 0; i < data.length; i++) {
                                        html += '<div class="list-item" data-media-src="' + data[i].filename_32 + '">\
                                        <p class="list-title"><span></span>'+ data[i].title +'</p>\
                                        <p class="caption-small">播放次数 <span>'+ data[i].play_times +'</span></p>\
                                        <p class="caption-small">时长 <span>'+ data[i].runtime +'</span></p>\
                                        </div>';
                                    }
                                    ui.$albumList.append(html);
                                    // 向下翻页
                                    if (oConfig.oData.hasNext) {
                                        oConfig.oData.page++;
                                    }
                                } else {
                                    self.fErrorDispose('您的操作太频繁啦！请稍后操作');
                                }
                            },
                            complete: function() {
                                setTimeout(function() {ui.$loading.hide()}, 1000);
                                oConfig.oData.scrollLock = false;
                            }
                        });
                    }
                }
            });
        /* pagination end */

        // 点击列表项切换音频
            var startX, startY;
            ui.$albumList.on('touchstart', '.list-item', function(e) {
                var touches = e.touches[0];
                startX = touches.clientX;
                startY = touches.clientY;
            }).on('touchend', '.list-item', function(e) {
                var touches = e.changedTouches[0],
                    endX = touches.clientX,
                    endY = touches.clientY;
                if( Math.abs(startX - endX) < 6 && Math.abs(startY - endY) < 6 ){
                    self.curItem = $(this);
                    self.fLoadSrc(self.curItem, self.fMediaPlay);
                }
            });
        // 打开专辑
            ui.$btnOpening.on('touchstart', function() {
                $(this).addClass('btn-active');
            }).on('touchend', function() {
                $(this).removeClass('btn-active');
            });

        /* player */
            // safari不会触发loadeddata，canplay等事件
            ui.$audio.on('progress', function() {
                self.CAN_PLAY = true;
            });
            ui.$audio.on('timeupdate', function() {
                var $this = this;
                if (!self.IS_MOVING) {
                    self.fChangeProgress(ui.$audio[0].currentTime / self.duration);
                }
            });
            // 开始暂停控制
            ui.$btnControl.on('touchend', function() {
                ui.$audio[0].paused ? self.fMediaPlay() : self.fMediaPause();
            });
            // 进度条拖动控制
            var diffLen;
            ui.$dotBox.on('touchstart', function(e) {
                var pageX = e.targetTouches[0].pageX || e.pageX;
                diffLen = pageX - $(e.target).offset().left;
                return false;
            }).on('touchmove', function(e) {
                e.preventDefault();
                self.IS_MOVING = true;
                var pageX = e.targetTouches[0].pageX || e.pageX,
                    clickPoint = pageX - diffLen;
                self.process = (clickPoint - self.playBarOffset) / self.playBarWidth;
                self.fChangeProgress(self.process);
            }).on('touchend', function() {
                self.IS_MOVING = false;
                ui.$audio[0].currentTime = self.process * self.duration;
            });
            // 进度条点击控制
            ui.$mediaPlayer.on('touchstart', function(e) {
                e.preventDefault();
                var touches = e.touches[0];
                startX = touches.clientX;
                startY = touches.clientY;
            }).on('touchend', function(e) {
                var touches = e.changedTouches[0],
                    endX = touches.clientX,
                    endY = touches.clientY,
                    pageX = touches.pageX || e.pageX;
                if( Math.abs(startX - endX) < 6 && Math.abs(startY - endY) < 6 ){
                    self.process = pageX / self.playBarWidth;
                    if (self.CAN_PLAY) {
                        self.fChangeProgress(self.process);
                        ui.$audio[0].currentTime = self.process * self.duration;
                    }
                }
            });
            // 监听媒体结束事件
            ui.$audio.on('ended', function() {
                var $this = this;
                if (self.curItem.next().length) {
                    self.curItem = self.curItem.next();
                    self.fLoadSrc(self.curItem, self.fMediaPlay);
                } else {
                    $this.currentTime = 0;
                    ui.$btnControl.removeClass('btn-pause').addClass('btn-play');
                }
            });
        /* player end */
        },
        fChangeProgress: function(process) {
            var self = this;
            ui.$playOn[0].style.webkitTransform = 'translateX(' + (process * 100) + '%)';
            self.fTimeDispose(process * self.duration);
        },
        fMediaPlay: function() {
            var self = this;
            if (!ui.$audio[0].error) {
                ui.$btnControl.removeClass('btn-play').addClass('btn-pause');
                ui.$audio[0].play();
            } else {
                self.fErrorDispose('节目音频出错，请尝试其他节目！');
            }
        },
        fMediaPause: function() {
            var self = this;
            ui.$btnControl.removeClass('btn-pause').addClass('btn-play');
            ui.$audio[0].pause();
        },
        // 时间进度处理
        fTimeDispose: function(pastTime) {
            var self = this,
                str = '',
                hour = parseInt(pastTime / 3600),
                minute = parseInt((pastTime % 3600) / 60),
                second = parseInt((pastTime % 3600) % 60);

            hour = hour < 10 ? '0' + hour : hour;
            minute = minute < 10 ? '0' + minute : minute;
            second = second < 10 ? '0' + second : second;

            str = hour + ':' + minute + ':' + second;
            ui.$hasPlayed.text(str); 
        },
        fChangeToSecond: function(timeStr) {
            var self = this,
                timeArray = timeStr.split(':');
            self.duration = timeArray[0] * 3600 + timeArray[1] * 60 + timeArray[2] * 1;
        },
        fLoadSrc: function(curItem, callback) {
            var self = this;
            self.CAN_PLAY = false;
            ui.$audio[0].preload = 'metadata';
            ui.$audio[0].src = curItem.data('media-src');
            ui.$audio[0].load();

            $('.list-title').removeClass('primary').find('span').removeClass('playing');
            curItem.find('p').eq(0).addClass('primary').find('span').addClass('playing');
            ui.$albumCaption.find('.primary').eq(0).text(curItem.find('.primary').text());
            ui.$hasPlayed.text('00:00:00');
            ui.$totalTime.text(curItem.find('p').eq(2).find('span').text());

            self.fChangeToSecond(ui.$totalTime.text());
            self.fChangeProgress(0);

            setTimeout(function() {
                callback ? callback() : callback;
            }, 500);
        },
        // 异常处理
        fErrorDispose: function(msg) {
            var self = this;
            ui.$popup.text(msg).show();
            setTimeout(function() {
                ui.$popup.hide();
                self.LOAD_OVER = false;
            },2000);
        }
    };
    oPage.init();
});