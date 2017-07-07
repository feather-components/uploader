//自动获取swf的地址
(function(){
var doc = document, currentScript;

//获取upoader.js的url
if(doc.currentScript){
    currentScript = doc.currentScript.src;
}else{
    var stack;

    try{
        currentScript();
    }catch(e){
        stack = e.stack;

        if(!stack && window.opera){
            stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
        }
    }

    if(stack){
        stack = stack.split( /[@ ]/g).pop();
        stack = stack[0] == "(" ? stack.slice(1,-1) : stack;
        currentScript = stack.replace(/(:\d+)?:\d+$/i, "");
    }else{
        var scripts = doc.getElementsByTagName("script");

        for(var i = scripts.length - 1; i >= 0; i--){
            var script = scripts[i];

            if(script.readyState === "interactive"){
                currentScript = script.src;
                break;
            }
        }
    }
}

//如果未使用编译工具，则直接返回
function __uri(url){
    return url;
}

var prefix = '';
var swfUrl = __uri('./uploader.swf');

if(swfUrl == './uploader.swf'){
    prefix = currentScript.replace(/[^\/]+$/, '');
}else if(!/^(?:(?:https?:)?\/\/)?[^\/]+/.test(swfUrl)){
    prefix = (currentScript.match(/^(?:(?:https?:)?\/\/)?[^\/]+/) || [''])[0];
}

window.__featherUiUploaderSwfUrl__ = prefix + swfUrl;
})();

;(function(factory){
if(typeof module === 'object' && typeof module.exports == 'object'){
    module.exports = factory(
        require('jquery'),
        require('../class/class'),
        require('../cookie/cookie'),
        require('./lib/uploadify')
    );
}else{
    factory(window.jQuery, window.jQuery.klass, window.jQuery.cookie, window.jQuery.fn.uplodify);
}
})(function($, Class, Cookie){
var DATANAME = Class.NAMESPACE + '.uploader';

var prototype = {
    initialize: function(opt){
        var self = this;

        self.dom = $(opt.dom);
        self.options = $.extend({
            swf: window.__featherUiUploaderSwfUrl__,
            debug: false,
            width: self.dom.width(),
            height: self.dom.height(),
            buttonText: '上传',
            fixedCookie: false
        }, opt || {});

        self.init();
    },

    init: function(){
        var self = this, options = self.options;

        if(options.fixedCookie){
            options.formData = $.extend(options.formData || {}, Cookie.get() || {});
        }

        if(!options.queueID){
            options.overrideEvents = ['onUploadProgress', 'onUploadComplete', 'onUploadSuccess', 'onUploadStart', 'onUploadError', 'onSelect'];
        }

        $.each('cancel clearQueue destroy dialogOpen dialogClose select selectError queueComplete uploadComplete uploadError uploadProgress uploadStart uploadSuccess'.split(' '), function(key, event){
            var fullName = 'on' + event.replace(/^\w/, function(first){
                return first.toUpperCase();
            });
            
            options[fullName] && self.on(event, options[fullName]);

            options[fullName] = function(){
                self.trigger(event, arguments);
            };
        });

        if(!self.dom.attr('id')){
            self.dom.attr('id', 'ui2-uploader-' + $.now());
        }

        self.dom.uploadify(options);
        //hack uploadify plugin
        //uploadify会重新创建一个同名的dom，所以再次通过jquery获取upload对象时，会为空，所以，直接将值同样赋值给新创建的元素的data中
        var id = options.id ? options.id : self.dom.attr('id');
        self.uploader = $('#' + id).data(DATANAME, self);
    }
};

$.each('cancel destroy disable settings stop upload'.split(' '), function(key, method){
    prototype[method] = function(){
        var self = this, args = Array.prototype.slice.call(arguments);
        args.unshift(method);

        self.dom.uploadify.apply(self.dom, args);

        if(method == 'destroy'){
            self.dom.removeData(DATANAME);
            /ui2-uploader-\d+/.test(self.dom.attr('id')) && self.dom.removeAttr('id');
            self.dom = null;
            self.uploader.removeData(DATANAME);
            self.uploader = null;
        }
    };
});

return Class.$factory('uploader', prototype);
});
