// TODO this is horrible...
$(function(){
    $(".submit").click(function(event) {
        if(!inputValid()) event.preventDefault();
    });

    var required = [ "title", "body" ];
    var inputValid = function() {
        for(var i = 0, count = required.length; i < count; i++) {
            var $input = $(".input[name=" + required[i] + "]");
            if($input.val() === "") {
                $input.addClass("warning");
            }
        }
        return false;
    };

    // submit form
    $('form').submit(function(){
        $.post($(this).attr('action'), $(this).serialize(), function(data, status){
            $('.input').val("");
            alert(data, status);
        });
        return false;
    });

    var storeTags = function() {
        var toStore = [];
        var tags = $('.tags').children();
        for(var i = 0, count = tags.length; i < count; i++) {
            toStore.push($(tags[i]).attr('data-value'));
        }
        $('input[name=tags]').val(toStore);
    };

    $('.input').keypress(function(event){
        $(event.currentTarget).removeClass("warning");
    });

    // tag styling
    $('.input-tag').keypress(function(event){
        switch(event.keyCode) {
            case 44: // comma
            case 13: // return
                event.preventDefault();
                $('.tags').append("<a href='#' class='tag' data-value='" + $('.input-tag').val() + "'>" + $('.input-tag').val() + "</a>");
                $('.tags').removeClass('hidden');
                $('.tag[data-value="' + $('.input-tag').val() + '"]').click(tagClick);
                $('.input-tag').val("");
                break;
            default:
                // do nothing...
        }
    });
    var tagClick = function(event) {
        event.preventDefault();
        $(event.currentTarget).remove();
        if($('.tags').children().length === 0) $('.tags').addClass('hidden');
    };

    // initialise autocomplete

    // auto complete data
    var emojis = [
        "pencil", "home3", "pen", "blog", "file-text2", "file-picture", "folder",
        "price-tags", "display", "mobile", "tablet", "quotes-left", "quotes-right",
        "cog", "gift", "glass2", "rocket", "fire", "airplane", "truck", "sphere",
        "attachment", "star-full", "heart", "man", "woman", "man-woman", "happy",
        "smile", "tongue", "sad", "wink", "grin", "cool", "angry", "evil",
        "shocked", "baffled", "confused", "neutral", "hipster", "wondering",
        "sleepy", "frustrated", "crying", "warning", "blocked", "checkmark",
        "command", "shift", "ctrl", "opt", "embed2", "terminal", "share2",
        "facebook2", "instagram", "twitter", "github", "github3", "github5",
        "apple", "finder", "android", "windows8", "linkedin", "linkedin2",
        "lastfm", "lastfm2"
    ];
    var html = [ "youtube", "img:local", "img:url" ];

    var delay = 250;
    var emojis = $.map(emojis, function(value, i) {return {key: value, name:value}});
    var emoji_config = {
      at: ":",
      data: emojis,
      displayTpl: "<li>${name} <span class='icon-${key}'></span></li>",
      insertTpl: '<span class="icon-${key}"></span>',
      delay: delay
    };

    var html = $.map(html, function(value, i) {
        data = { name: value };
        switch(value) {
            case 'youtube':
                data.html = '<youtube video-id="" />';
                break;
            case 'img:local':
                data.html = '![](file://)';
                break;
            case 'img:url':
                data.html = '![]()';
                break;
            default:
                // console.log(value);
        }
        return data;
    });
    var html_config = {
      at: "<",
      data: html,
      displayTpl: "<li>${name}</li>",
      insertTpl: '${html}',
      delay: delay
    };

    $body = $('#main .body').atwho(emoji_config).atwho(html_config);
});
