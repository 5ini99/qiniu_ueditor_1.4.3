/**
 * 上传音频对话框逻辑代码,包括tab: 远程音乐/上传音频/在线列表
 */

(function () {

    var remoteAudio,
        uploadAudio,
        onlineAudio,
        // 添加上传判断参数
        uploadType,
        uploadUrl,
        isDirect,
        // end
        searchAudio;

    window.onload = function () {
        initTabs();
        initAlign();
        initButtons();
        // 初始化配置
        initUploadType();
    };

    /*初始化上传参数 */
    function initUploadType() {
        uploadType = editor.getOpt('uploadType');
        isDirect = editor.getOpt('qiniuUploadType');
        if (uploadType == 'local' || isDirect == 'php') {
            var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                actionUrl = editor.getActionUrl(editor.getOpt('audioActionName')),
                url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?' : '&') + 'encode=utf-8&' + params);
            uploadUrl = url;
        } else {
            uploadUrl = editor.getOpt('uploadQiniuUrl');
        }

    }

    /* 初始化tab标签 */
    function initTabs() {
        var tabs = $G('tabhead').children;
        for (var i = 0; i < tabs.length; i++) {
            domUtils.on(tabs[i], "click", function (e) {
                var target = e.target || e.srcElement;
                setTabFocus(target.getAttribute('data-content-id'));
            });
        }

        var img = editor.selection.getRange().getClosedNode();
        if (img && img.tagName && img.tagName.toLowerCase() == 'img') {
            setTabFocus('remote');
        } else {
            setTabFocus('upload');
        }
    }

    /* 格式化日期方法 */
    Date.prototype.Format = function (fmt) {
        var o = {
            "m+": this.getMonth() + 1,
            "d+": this.getDate(),
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    /* end */

    /* 初始化tabbody */
    function setTabFocus(id) {
        if (!id) return;
        var i, bodyId, tabs = $G('tabhead').children;
        for (i = 0; i < tabs.length; i++) {
            bodyId = tabs[i].getAttribute('data-content-id');
            if (bodyId == id) {
                domUtils.addClass(tabs[i], 'focus');
                domUtils.addClass($G(bodyId), 'focus');
            } else {
                domUtils.removeClasses(tabs[i], 'focus');
                domUtils.removeClasses($G(bodyId), 'focus');
            }
        }
        switch (id) {
            case 'remote':
                remoteAudio = remoteAudio || new RemoteAudio();
                break;
            case 'upload':
                setAlign(editor.getOpt('audioInsertAlign'));
                uploadAudio = uploadAudio || new UploadAudio('queueList');
                break;
            case 'online':
                setAlign(editor.getOpt('audioManagerInsertAlign'));
                onlineAudio = onlineAudio || new OnlineAudio('audioList');
                onlineAudio.reset();
                break;
            case 'search':
                setAlign(editor.getOpt('audioManagerInsertAlign'));
                searchAudio = searchAudio || new SearchAudio();
                break;
        }
    }

    /* 初始化onok事件 */
    function initButtons() {

        dialog.onok = function () {
            var remote = false, list = [], id, tabs = $G('tabhead').children;
            for (var i = 0; i < tabs.length; i++) {
                if (domUtils.hasClass(tabs[i], 'focus')) {
                    id = tabs[i].getAttribute('data-content-id');
                    break;
                }
            }

            switch (id) {
                case 'remote':
                    list = remoteAudio.getInsertList();
                    break;
                case 'upload':
                    list = uploadAudio.getInsertList();
                    var count = uploadAudio.getQueueCount();
                    if (count) {
                        $('.info', '#queueList').html('<span style="color:red;">' + '还有2个未上传文件'.replace(/[\d]/, count) + '</span>');
                        return false;
                    }
                    break;
                case 'online':
                    list = onlineAudio.getInsertList();
                    break;
                case 'search':
                    list = searchAudio.getInsertList();
                    remote = true;
                    break;
            }
            if (list) {
                editor.execCommand('insertaudio', list);
                remote && editor.fireEvent("catchRemoteAudio");
            }
        };
    }


    /* 初始化对其方式的点击事件 */
    function initAlign() {
        /* 点击align图标 */
        domUtils.on($G("alignIcon"), 'click', function (e) {
            var target = e.target || e.srcElement;
            if (target.className && target.className.indexOf('-align') != -1) {
                setAlign(target.getAttribute('data-align'));
            }
        });
    }

    /* 设置对齐方式 */
    function setAlign(align) {
        align = align || 'none';
        var aligns = $G("alignIcon").children;
        for (i = 0; i < aligns.length; i++) {
            if (aligns[i].getAttribute('data-align') == align) {
                domUtils.addClass(aligns[i], 'focus');
                $G("align").value = aligns[i].getAttribute('data-align');
            } else {
                domUtils.removeClasses(aligns[i], 'focus');
            }
        }
    }

    /* 获取对齐方式 */
    function getAlign() {
        var align = $G("align").value || 'none';
        return align == 'none' ? '' : align;
    }


    /* 在线音频 */
    function RemoteAudio(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }

    RemoteAudio.prototype = {
        init: function () {
            this.initContainer();
            this.initEvents();
        },
        initContainer: function () {
            this.dom = {
                'url': $G('url'),
                'title': $G('title'),
                'width': $G('width'),
                'height': $G('height'),
                'border': $G('border'),
                'vhSpace': $G('vhSpace'),
                'align': $G('align')
            };
            var img = editor.selection.getRange().getClosedNode();
            if (img) {
                this.setAudio(img);
            }
        },
        initEvents: function () {
            var _this = this;

            /* 改变url */
            domUtils.on($G("url"), 'keyup', updatePreview);
            domUtils.on($G("border"), 'keyup', updatePreview);
            domUtils.on($G("title"), 'keyup', updatePreview);
            domUtils.on($G("width"), 'keyup', updatePreview);
            domUtils.on($G("height"), 'keyup', updatePreview);

            function updatePreview() {
                _this.setPreview();
            }
        },
        setAudio: function (img) {
            /* 不是正常的音频 */
            if (!img.tagName || img.tagName.toLowerCase() != 'img' && !img.getAttribute("src") || !img.src) return;

            var wordImgFlag = img.getAttribute("word_img"),
                src = wordImgFlag ? wordImgFlag.replace("&amp;", "&") : (img.getAttribute('_src') || img.getAttribute("src", 2).replace("&amp;", "&")),
                align = editor.queryCommandValue("audioFloat");

            /* 防止onchange事件循环调用 */
            if (src !== $G("url").value) $G("url").value = src;
            if (src) {
                /* 设置表单内容 */
                $G("width").value = img.width || '';
                $G("height").value = img.height || '';
                $G("border").value = img.getAttribute("border") || '0';
                $G("vhSpace").value = img.getAttribute("vspace") || '0';
                $G("title").value = img.title || img.alt || '';
                setAlign(align);
                this.setPreview();
            }
        },
        getData: function () {
            var data = {};
            for (var k in this.dom) {
                data[k] = this.dom[k].value;
            }
            return data;
        },
        setPreview: function () {
            var url = $G('url').value,
                ow = parseInt($G('width').value, 10) || 0,
                oh = parseInt($G('height').value, 10) || 0,
                border = parseInt($G('border').value, 10) || 0,
                title = $G('title').value,
                preview = $G('preview'),
                width,
                height;

            url = utils.unhtmlForUrl(url);
            title = utils.unhtml(title);

            width = ((!ow || !oh) ? preview.offsetWidth : Math.min(ow, preview.offsetWidth));
            width = width + (border * 2) > preview.offsetWidth ? width : (preview.offsetWidth - (border * 2));
            height = (!ow || !oh) ? '' : width * oh / ow;

            if (url) {
                preview.innerHTML = '<audio class="edui-faked-audio" controls="controls" src="' + url + '" width="' + width + '" height="' + height + '" title="' + title + '">' + title +  '</audio>';
            }
        },
        getInsertList: function () {
            var data = this.getData();
            if (data['url']) {
                return [{
                    src: data['url'],
                    title: data['title'],
                    _src: data['url'],
                    width: data['width'] || '',
                    height: data['height'] || '',
                    border: data['border'] || '',
                    floatStyle: data['align'] || '',
                    vspace: data['vhSpace'] || '',
                    alt: data['title'] || '',
                    style: "width:" + data['width'] + "px;height:" + data['height'] + "px;"
                }];
            } else {
                return [];
            }
        }
    };

    /* 上传音频 */
    function UploadAudio(target) {
        this.$wrap = target.constructor == String ? $('#' + target) : $(target);
        this.init();
    }

    UploadAudio.prototype = {
        init: function () {
            this.audioList = [];
            this.initContainer();
            this.initUploader();
        },
        initContainer: function () {
            this.$queue = this.$wrap.find('.filelist');
        },
        /* 初始化容器 */
        initUploader: function () {
            var _this = this,
                $ = jQuery,    // just in case. Make sure it's not an other libaray.
                $wrap = _this.$wrap,
                // 音频容器
                $queue = $wrap.find('.filelist'),
                // 状态栏，包括进度和控制按钮
                $statusBar = $wrap.find('.statusBar'),
                // 文件总体选择信息。
                $info = $statusBar.find('.info'),
                // 上传按钮
                $upload = $wrap.find('.uploadBtn'),
                // 上传按钮
                $filePickerBtn = $wrap.find('.filePickerBtn'),
                // 上传按钮
                $filePickerBlock = $wrap.find('.filePickerBlock'),
                // 没选择文件之前的内容。
                $placeHolder = $wrap.find('.placeholder'),
                // 总体进度条
                $progress = $statusBar.find('.progress').hide(),
                // 添加的文件数量
                fileCount = 0,
                // 添加的文件总大小
                fileSize = 0,
                // 优化retina, 在retina下这个值是2
                ratio = window.devicePixelRatio || 1,
                // 缩略图大小
                thumbnailWidth = 113 * ratio,
                thumbnailHeight = 113 * ratio,
                // 可能有pedding, ready, uploading, confirm, done.
                state = '',
                // 所有文件的进度信息，key为file id
                percentages = {},
                supportTransition = (function () {
                    var s = document.createElement('p').style,
                        r = 'transition' in s ||
                            'WebkitTransition' in s ||
                            'MozTransition' in s ||
                            'msTransition' in s ||
                            'OTransition' in s;
                    s = null;
                    return r;
                })(),
                // WebUploader实例
                uploader,
                actionUrl = editor.getActionUrl(editor.getOpt('audioActionName')),
                acceptExtensions = (editor.getOpt('audioAllowFiles') || []).join('').replace(/\./g, ',').replace(/^[,]/, ''),
                audioMaxSize = editor.getOpt('audioMaxSize'),
                audioCompressBorder = editor.getOpt('audioCompressBorder');

            if (!WebUploader.Uploader.support()) {
                $('#filePickerReady').after($('<div>').html(lang.errorNotSupport)).hide();
                return;
            } else if (!editor.getOpt('audioActionName')) {
                $('#filePickerReady').after($('<div>').html(lang.errorLoadConfig)).hide();
                return;
            }

            uploader = _this.uploader = WebUploader.create({
                pick: {
                    id: '#filePickerReady',
                    label: lang.uploadSelectFile
                },
                accept: {
                    title: 'Audios',
                    extensions: acceptExtensions,
                    mimeTypes: 'audio/*'
                },
                swf: '../../third-party/webuploader/Uploader.swf',
                server: actionUrl,
                fileVal: editor.getOpt('audioFieldName'),
                duplicate: true,
                fileSingleSizeLimit: audioMaxSize,    // 默认 2 M
                compress: editor.getOpt('audioCompressEnable') ? {
                    width: audioCompressBorder,
                    height: audioCompressBorder,
                    // 音频质量，只有type为`audio/jpeg`的时候才有效。
                    quality: 90,
                    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                    allowMagnify: false,
                    // 是否允许裁剪。
                    crop: false,
                    // 是否保留头部meta信息。
                    preserveHeaders: true
                } : false
            });
            uploader.addButton({
                id: '#filePickerBlock'
            });
            uploader.addButton({
                id: '#filePickerBtn',
                label: lang.uploadAddFile
            });

            setState('pedding');

            // 当有文件添加进来时执行，负责view的创建
            function addFile(file) {
                var $li = $('<li id="' + file.id + '">' +
                    '<p class="imgWrap"></p>' +
                    '<p class="progress"><span></span></p>' +
                    '</li>'),

                    $btns = $('<div class="file-panel">' +
                        '<span class="cancel">' + lang.uploadDelete + '</span>' +
                        '<span class="rotateRight">' + lang.uploadTurnRight + '</span>' +
                        '<span class="rotateLeft">' + lang.uploadTurnLeft + '</span></div>').appendTo($li),
                    $prgress = $li.find('p.progress span'),
                    $wrap = $li.find('p.imgWrap'),
                    $info = $('<p class="error"></p>').hide().appendTo($li),

                    showError = function (code) {
                        switch (code) {
                            case 'exceed_size':
                                text = lang.errorExceedSize;
                                break;
                            case 'interrupt':
                                text = lang.errorInterrupt;
                                break;
                            case 'http':
                                text = lang.errorHttp;
                                break;
                            case 'not_allow_type':
                                text = lang.errorFileType;
                                break;
                            default:
                                text = lang.errorUploadRetry;
                                break;
                        }
                        $info.text(text).show();
                    };

                if (file.getStatus() === 'invalid') {
                    showError(file.statusText);
                } else {
                    $wrap.text(lang.uploadPreview);
                    if ('|png|jpg|jpeg|bmp|gif|'.indexOf('|' + file.ext.toLowerCase() + '|') == -1) {
                        $wrap.empty().addClass('notimage').append('<i class="file-preview file-type-' + file.ext.toLowerCase() + '"></i>' +
                            '<span class="file-title">' + file.name + '</span>');
                    } else {
                        if (browser.ie && browser.version <= 7) {
                            $wrap.text(lang.uploadNoPreview);
                        } else {
                            uploader.makeThumb(file, function (error, src) {
                                if (error || !src || (/^data:/.test(src) && browser.ie && browser.version <= 7)) {
                                    $wrap.text(lang.uploadNoPreview);
                                } else {
                                    var $img = $('<img src="' + src + '">');
                                    $wrap.empty().append($img);
                                    $img.on('error', function () {
                                        $wrap.text(lang.uploadNoPreview);
                                    });
                                }
                            }, thumbnailWidth, thumbnailHeight);
                        }
                    }
                    percentages[file.id] = [file.size, 0];
                    file.rotation = 0;

                    /* 检查文件格式 */
                    if (!file.ext || acceptExtensions.indexOf(file.ext.toLowerCase()) == -1) {
                        showError('not_allow_type');
                        uploader.removeFile(file);
                    }
                }

                file.on('statuschange', function (cur, prev) {
                    if (prev === 'progress') {
                        $prgress.hide().width(0);
                    } else if (prev === 'queued') {
                        $li.off('mouseenter mouseleave');
                        $btns.remove();
                    }
                    // 成功
                    if (cur === 'error' || cur === 'invalid') {
                        showError(file.statusText);
                        percentages[file.id][1] = 1;
                    } else if (cur === 'interrupt') {
                        showError('interrupt');
                    } else if (cur === 'queued') {
                        percentages[file.id][1] = 0;
                    } else if (cur === 'progress') {
                        $info.hide();
                        $prgress.css('display', 'block');
                    } else if (cur === 'complete') {
                    }

                    $li.removeClass('state-' + prev).addClass('state-' + cur);
                });

                $li.on('mouseenter', function () {
                    $btns.stop().animate({height: 30});
                });
                $li.on('mouseleave', function () {
                    $btns.stop().animate({height: 0});
                });

                $btns.on('click', 'span', function () {
                    var index = $(this).index(),
                        deg;

                    switch (index) {
                        case 0:
                            uploader.removeFile(file);
                            return;
                        case 1:
                            file.rotation += 90;
                            break;
                        case 2:
                            file.rotation -= 90;
                            break;
                    }

                    if (supportTransition) {
                        deg = 'rotate(' + file.rotation + 'deg)';
                        $wrap.css({
                            '-webkit-transform': deg,
                            '-mos-transform': deg,
                            '-o-transform': deg,
                            'transform': deg
                        });
                    } else {
                        $wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
                    }

                });

                $li.insertBefore($filePickerBlock);
            }

            // 负责view的销毁
            function removeFile(file) {
                var $li = $('#' + file.id);
                delete percentages[file.id];
                updateTotalProgress();
                $li.off().find('.file-panel').off().end().remove();
            }

            function updateTotalProgress() {
                var loaded = 0,
                    total = 0,
                    spans = $progress.children(),
                    percent;

                $.each(percentages, function (k, v) {
                    total += v[0];
                    loaded += v[0] * v[1];
                });

                percent = total ? loaded / total : 0;

                spans.eq(0).text(Math.round(percent * 100) + '%');
                spans.eq(1).css('width', Math.round(percent * 100) + '%');
                updateStatus();
            }

            function setState(val, files) {

                if (val != state) {

                    var stats = uploader.getStats();

                    $upload.removeClass('state-' + state);
                    $upload.addClass('state-' + val);

                    switch (val) {

                        /* 未选择文件 */
                        case 'pedding':
                            $queue.addClass('element-invisible');
                            $statusBar.addClass('element-invisible');
                            $placeHolder.removeClass('element-invisible');
                            $progress.hide();
                            $info.hide();
                            uploader.refresh();
                            break;

                        /* 可以开始上传 */
                        case 'ready':
                            $placeHolder.addClass('element-invisible');
                            $queue.removeClass('element-invisible');
                            $statusBar.removeClass('element-invisible');
                            $progress.hide();
                            $info.show();
                            $upload.text(lang.uploadStart);
                            uploader.refresh();
                            break;

                        /* 上传中 */
                        case 'uploading':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadPause);
                            break;

                        /* 暂停上传 */
                        case 'paused':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadContinue);
                            break;

                        case 'confirm':
                            $progress.show();
                            $info.hide();
                            $upload.text(lang.uploadStart);

                            stats = uploader.getStats();
                            if (stats.successNum && !stats.uploadFailNum) {
                                setState('finish');
                                return;
                            }
                            break;

                        case 'finish':
                            $progress.hide();
                            $info.show();
                            if (stats.uploadFailNum) {
                                $upload.text(lang.uploadRetry);
                            } else {
                                $upload.text(lang.uploadStart);
                            }
                            break;
                    }

                    state = val;
                    updateStatus();

                }

                if (!_this.getQueueCount()) {
                    $upload.addClass('disabled')
                } else {
                    $upload.removeClass('disabled')
                }

            }

            function updateStatus() {
                var text = '', stats;

                if (state === 'ready') {
                    text = lang.updateStatusReady.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize));
                } else if (state === 'confirm') {
                    stats = uploader.getStats();
                    if (stats.uploadFailNum) {
                        text = lang.updateStatusConfirm.replace('_', stats.successNum).replace('_', stats.successNum);
                    }
                } else {
                    stats = uploader.getStats();
                    text = lang.updateStatusFinish.replace('_', fileCount).replace('_KB', WebUploader.formatSize(fileSize)).replace('_', stats.successNum);

                    if (stats.uploadFailNum) {
                        text += lang.updateStatusError.replace('_', stats.uploadFailNum);
                    }
                }

                $info.html(text);
            }

            uploader.on('fileQueued', function (file) {
                fileCount++;
                fileSize += file.size;

                if (fileCount === 1) {
                    $placeHolder.addClass('element-invisible');
                    $statusBar.show();
                }

                addFile(file);
            });

            uploader.on('fileDequeued', function (file) {
                fileCount--;
                fileSize -= file.size;

                removeFile(file);
                updateTotalProgress();
            });

            uploader.on('filesQueued', function (file) {
                if (!uploader.isInProgress() && (state == 'pedding' || state == 'finish' || state == 'confirm' || state == 'ready')) {
                    setState('ready');
                }
                updateTotalProgress();
            });

            uploader.on('all', function (type, files) {
                switch (type) {
                    case 'uploadFinished':
                        setState('confirm', files);
                        break;
                    case 'startUpload':
                        /* 添加额外的GET参数 */
                        if (uploadType == 'local' || isDirect == 'php') {
                            var params = utils.serializeParam(editor.queryCommandValue('serverparam')) || '',
                                url = utils.formatUrl(actionUrl + (actionUrl.indexOf('?') == -1 ? '?' : '&') + 'encode=utf-8&' + params);
                            uploader.option('server', url);
                        } else {
                            uploader.option('server', uploadUrl);
                        }
                        setState('uploading', files);
                        break;
                    case 'stopUpload':
                        setState('paused', files);
                        break;
                }
            });

            uploader.on('uploadBeforeSend', function (file, data, header) {
                //这里可以通过data对象添加POST参数
                header['X-Requested-With'] = 'XMLHttpRequest';
                // 如果是qiniu上传并且不通过php上传就通过ajax来获取token
                if (uploadType == 'qiniu' && isDirect != 'php') {
                    var $file = $('#' + file.id),
                        type = editor.getOpt('uploadSaveType'),
                        path = editor.getOpt('audioPathFormat');

                    //生成一个随机数目，防止批量上传的时候文件名同名出错
                    var randNumber = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                    var now = new Date();
                    // 替换path
                    path = path.replace(/\{yyyy\}/, now.getFullYear());
                    path = path.replace(/\{mm\}/, (Array(2).join(0) + (now.getMonth() + 1)).slice(-2));
                    path = path.replace(/\{dd\}/, (Array(2).join(0) + now.getDate()).slice(-2));
                    path = path.replace(/\{hh\}/, (Array(2).join(0) + now.getHours()).slice(-2));
                    path = path.replace(/\{ii\}/, (Array(2).join(0) + now.getMinutes()).slice(-2));
                    path = path.replace(/\{ss\}/, (Array(2).join(0) + now.getSeconds()).slice(-2));
                    path = path.replace(/\{time\}/, Date.parse(now));
                    // 匹配随机数
                    var reg = path.match(/\{rand\:([\d]*)\}/i);
                    if (reg) {
                        var code = '';
                        for (var i = 1; i <= reg[1]; i++) {
                            const num = Math.floor(Math.random() * 10);
                            code += num;
                        }
                        path = path.replace(reg[0], code);
                    }

                    var filename = '';
                    if (type == 'date') {
                        filename = Date.parse(now) + randNumber + "." + file.file.ext;
                    } else {
                        filename = file.file.name;
                    }
                    filename = path + '/' + filename;
                    data['key'] = filename;

                    var token = "";
                    var url = editor.getActionUrl(editor.getOpt('getTokenActionName')),
                        isJsonp = utils.isCrossDomainUrl(url);
                    $.ajax({
                        dataType: isJsonp ? 'jsonp' : 'json',
                        async: false,
                        method: 'post',
                        data: {"key": filename},
                        url: url,
                        success: function (data) {
                            if (data.state == 'SUCCESS') {
                                token = data.token;
                            } else {
                                $file.find('.error').text(data.error).show();
                            }
                        }
                    });
                    data['token'] = token;
                }
                // end
            });

            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress span');

                $percent.css('width', percentage * 100 + '%');
                percentages[file.id][1] = percentage;
                updateTotalProgress();
            });

            uploader.on('uploadSuccess', function (file, ret) {
                var $file = $('#' + file.id);
                try {
                    var responseText = (ret._raw || ret),
                        json = utils.str2json(responseText);
                    var url = editor.getActionUrl(editor.getOpt('recordActionName')),
                        isJsonp = utils.isCrossDomainUrl(url);
                    $.ajax({
                        dataType: isJsonp ? 'jsonp' : 'json',
                        async: false,
                        method: 'post',
                        data: {
                            key: json.key,
                            type: file.type,
                            size: file.size,
                            name: file.name,
                            ext: file.ext,
                            hash: json.hash
                        },
                        url: url,
                        success: function (data) {
                            json = data;
                        }
                    });

                    if (json.state == 'SUCCESS') {
                        _this.audioList.push(json);
                        $file.append('<span class="success"></span>');
                    } else {
                        $file.find('.error').text(json.state).show();
                    }
                } catch (e) {
                    $file.find('.error').text(lang.errorServerUpload).show();
                }
            });

            uploader.on('uploadError', function (file, code) {
            });
            uploader.on('error', function (code, file) {
                if (code == 'Q_TYPE_DENIED' || code == 'F_EXCEED_SIZE') {
                    addFile(file);
                }
            });
            uploader.on('uploadComplete', function (file, ret) {
            });

            $upload.on('click', function () {
                if ($(this).hasClass('disabled')) {
                    return false;
                }

                if (state === 'ready') {
                    uploader.upload();
                } else if (state === 'paused') {
                    uploader.upload();
                } else if (state === 'uploading') {
                    uploader.stop();
                }
            });

            $upload.addClass('state-' + state);
            updateTotalProgress();
        },
        getQueueCount: function () {
            var file, i, status, readyFile = 0, files = this.uploader.getFiles();
            for (i = 0; file = files[i++];) {
                status = file.getStatus();
                if (status == 'queued' || status == 'uploading' || status == 'progress') readyFile++;
            }
            return readyFile;
        },
        destroy: function () {
            this.$wrap.remove();
        },
        getInsertList: function () {
            var i, data, list = [],
                align = getAlign(),
                prefix = editor.getOpt('audioUrlPrefix');
            for (i = 0; i < this.audioList.length; i++) {
                data = this.audioList[i];
                list.push({
                    src: prefix + data.url,
                    _src: prefix + data.url,
                    title: data.title,
                    alt: data.original,
                    floatStyle: align
                });
            }
            return list;
        }
    };


    /* 在线音频 */
    function OnlineAudio(target) {
        this.container = utils.isString(target) ? document.getElementById(target) : target;
        this.init();
    }

    OnlineAudio.prototype = {
        init: function () {
            this.reset();
            this.initEvents();
        },
        /* 初始化容器 */
        initContainer: function () {
            this.container.innerHTML = '';
            this.list = document.createElement('ul');
            this.clearFloat = document.createElement('li');

            domUtils.addClass(this.list, 'list');
            domUtils.addClass(this.clearFloat, 'clearFloat');

            this.list.appendChild(this.clearFloat);
            this.container.appendChild(this.list);
        },
        /* 初始化滚动事件,滚动到地步自动拉取数据 */
        initEvents: function () {
            var _this = this;

            /* 滚动拉取音频 */
            domUtils.on($G('audioList'), 'scroll', function (e) {
                var panel = this;
                if (panel.scrollHeight - (panel.offsetHeight + panel.scrollTop) < 10) {
                    _this.getAudioData();
                }
            });
            /* 选中音频 */
            domUtils.on(this.container, 'click', function (e) {
                var target = e.target || e.srcElement,
                    li = target.parentNode;

                if (li.tagName.toLowerCase() == 'li') {
                    if (domUtils.hasClass(li, 'selected')) {
                        domUtils.removeClasses(li, 'selected');
                    } else {
                        domUtils.addClass(li, 'selected');
                    }
                }
            });
        },
        /* 初始化第一次的数据 */
        initData: function () {

            /* 拉取数据需要使用的值 */
            this.state = 0;
            this.listSize = editor.getOpt('audioManagerListSize');
            this.listIndex = 0;
            this.listEnd = false;
            // 添加market
            this.marker = '';

            /* 第一次拉取数据 */
            this.getAudioData();
        },
        /* 重置界面 */
        reset: function () {
            this.initContainer();
            this.initData();
        },
        /* 向后台拉取音频列表数据 */
        getAudioData: function () {
            var _this = this;

            if (!_this.listEnd && !this.isLoadingData) {
                this.isLoadingData = true;
                var url = editor.getActionUrl(editor.getOpt('audioManagerActionName')),
                    isJsonp = utils.isCrossDomainUrl(url);
                ajax.request(url, {
                    'timeout': 100000,
                    'dataType': isJsonp ? 'jsonp' : '',
                    'data': utils.extend({
                        start: this.listIndex,
                        size: this.listSize,
                        marker: this.marker,
                    }, editor.queryCommandValue('serverparam')),
                    'method': 'get',
                    'onsuccess': function (r) {
                        try {
                            var json = isJsonp ? r : eval('(' + r.responseText + ')');
                            if (json.state == 'SUCCESS') {
                                _this.pushData(json.list);
                                /* */
                                _this.marker = json.marker;
                                /* end */
                                _this.listIndex = parseInt(json.start) + parseInt(json.list.length);
                                if (_this.listIndex >= json.total) {
                                    _this.listEnd = true;
                                }
                                _this.isLoadingData = false;
                            }
                        } catch (e) {
                            if (r.responseText.indexOf('ue_separate_ue') != -1) {
                                var list = r.responseText.split(r.responseText);
                                _this.pushData(list);
                                _this.listIndex = parseInt(list.length);
                                _this.listEnd = true;
                                _this.isLoadingData = false;
                            }
                        }
                    },
                    'onerror': function () {
                        _this.isLoadingData = false;
                    }
                });
            }
        },
        /* 添加音频到列表界面上 */
        pushData: function (list) {
            var i, item, img, icon, _this = this,
                urlPrefix = editor.getOpt('audioManagerUrlPrefix');
            for (i = 0; i < list.length; i++) {
                if(list[i] && list[i].url) {
                    item = document.createElement('li');
                    icon = document.createElement('span');
                    filetype = list[i].url.substr(list[i].url.lastIndexOf('.') + 1);

                    if ( "png|jpg|jpeg|gif|bmp".indexOf(filetype) != -1 ) {
                        preview = document.createElement('img');
                        domUtils.on(preview, 'load', (function(image){
                            return function(){
                                _this.scale(image, image.parentNode.offsetWidth, image.parentNode.offsetHeight);
                            };
                        })(preview));
                        preview.width = 113;
                        preview.setAttribute('src', urlPrefix + list[i].url + (list[i].url.indexOf('?') == -1 ? '?noCache=':'&noCache=') + (+new Date()).toString(36) );
                    } else {
                        var ic = document.createElement('i'),
                            textSpan = document.createElement('span');
                        textSpan.innerHTML = list[i].name ? list[i].name : list[i].url.substr(list[i].url.lastIndexOf('/') + 1);
                        textSpan.title = textSpan.innerHTML;
                        preview = document.createElement('div');
                        preview.appendChild(ic);
                        preview.appendChild(textSpan);
                        domUtils.addClass(preview, 'file-wrapper');
                        domUtils.addClass(textSpan, 'file-title');
                        domUtils.addClass(ic, 'file-type-' + filetype);
                        domUtils.addClass(ic, 'file-preview');
                    }
                    domUtils.addClass(icon, 'icon');
                    //
                    div = document.createElement('div');
                    domUtils.addClass(div,'file-panel');
                    cancel_span = document.createElement('span');
                    domUtils.addClass(cancel_span,'cancel');
                    if( list[i].id ){
                        cancel_span.setAttribute("data-id",list[i].id);
                    }
                    if( !list[i].key ){
                        cancel_span.setAttribute("data-key",list[i].url);
                    }else{
                        cancel_span.setAttribute("data-key",list[i].key);
                    }
                    div.appendChild(cancel_span);

                    domUtils.on(cancel_span, 'click',function(){
                        var key = this.getAttribute('data-key');
                        return _this.removeAudio(key,this);
                    });
                    // end

                    item.setAttribute('data-url', urlPrefix + list[i].url);
                    item.setAttribute('data-title', list[i].name);
                    if (list[i].original) {
                        item.setAttribute('data-title', list[i].original);
                    }
                    //
                    item.appendChild(div);
                    // end
                    item.appendChild(preview);
                    item.appendChild(icon);
                    this.list.insertBefore(item, this.clearFloat);
                }
            }
        },
        /* 改变音频大小 */
        scale: function (audio, w, h, type) {
            var ow = audio.width,
                oh = audio.height;

            if (type == 'justify') {
                if (ow >= oh) {
                    audio.width = w;
                    audio.height = h * oh / ow;
                    audio.style.marginLeft = '-' + parseInt((audio.width - w) / 2) + 'px';
                } else {
                    audio.width = w * ow / oh;
                    audio.height = h;
                    audio.style.marginTop = '-' + parseInt((audio.height - h) / 2) + 'px';
                }
            } else {
                if (ow >= oh) {
                    audio.width = w * ow / oh;
                    audio.height = h;
                    audio.style.marginLeft = '-' + parseInt((audio.width - w) / 2) + 'px';
                } else {
                    audio.width = w;
                    audio.height = h * oh / ow;
                    audio.style.marginTop = '-' + parseInt((audio.height - h) / 2) + 'px';
                }
            }
        },
        getInsertList: function () {
            var i, lis = this.list.children, list = [], align = getAlign();
            for (i = 0; i < lis.length; i++) {
                if (domUtils.hasClass(lis[i], 'selected')) {
                    var audio = lis[i],
                        title = audio.getAttribute('data-title'),
                        src = audio.getAttribute('data-url');
                    list.push({
                        src: src,
                        _src: src,
                        title: title,
                        alt: title,
                        floatStyle: align
                    });
                }

            }
            return list;
        },
        // 删除音频的方法
        removeAudio: function (key, obj) {
            var url = editor.getActionUrl(editor.getOpt('removeAudioActionName')),
                id = obj.getAttribute('data-id');
                isJsonp = utils.isCrossDomainUrl(url);
            ajax.request(url, {
                'timeout': 100000,
                'dataType': isJsonp ? 'jsonp' : '',
                'data': utils.extend({
                    id: id,
                    key: key,
                }, editor.queryCommandValue('serverparam')),
                'method': 'post',
                'onsuccess': function (r) {
                    try {
                        var json = isJsonp ? r : eval('(' + r.responseText + ')');
                        if (json.state == 'SUCCESS') {
                            $(obj).parent().parent().remove();
                        } else {
                            $(obj).parent().addClass("custom_error").html(json.state);
                        }
                    } catch (e) {
                        console.log(e)
                    }
                },
                'onerror': function (e) {
                    console.log(e)
                }
            });
        }
    };

})();
