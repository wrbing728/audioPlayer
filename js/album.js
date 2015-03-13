$(function() {
    var ui = {
        $audio: $('#audio'),
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
        init: function() {
            this.view();
            this.listen();
        },
        view: function() {
            var self = this;
            var player = new Player({
                $audio: ui.$audio,
                srcUrl: [
                    {
                        url: 'http://c202.duotin.com/M03/3F/13/wKgB3FRgwiqAO6FfAA5tlNzWmZ0589.mp3',
                        duration: '00:04:54'
                    },
                    {
                        url: '../ticktac.mp3',
                        duration: '00:00:3'
                    }
                ],
                toggleBtn: true,
                bufferBar: true,
                showVoice: true
            });
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
        },
        // 异常处理
        fErrorDispose: function(msg) {
            // ui.$popup.text(msg).show();
            // setTimeout(function() {
            //     ui.$popup.hide();
            //     self.LOAD_OVER = false;
            // },2000);
        }
    };
    oPage.init();
});