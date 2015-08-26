$(function(){
    $('form').submit(function(){
        $.post($(this).attr('action'), $(this).serialize(), function(response){
            $('.input').val("");
            console.log("post created");
            // do something here on success
        },'json');
        return false;
    });

    var delay = 250;

    var emojis = [
        "pencil", "home3", "pen", "blog", "file-text2", "file-picture", "folder",
        "price-tags", "display", "mobile", "tablet", "quotes-left", "quotes-right",
        "cog", "gift", "glass2", "rocket", "fire", "airplane", "truck", "sphere",
        "attachment", "star-full", "heart", "man", "woman", "man-woman", "happy",
        "smile", "tongue", "sad", "wink", "grin", "cool", "angry", "evil", "shocked",
        "baffled", "confused", "neutral", "hipster", "wondering", "sleepy",
        "frustrated", "crying", "warning", "blocked", "checkmark", "command",
        "shift", "ctrl", "opt", "embed2", "terminal", "share2", "facebook2",
        "instagram", "twitter", "github", "github3", "github5", "apple", "finder",
        "android", "windows8", "linkedin", "linkedin2", "lastfm", "lastfm2"
    ];
    var emojis = $.map(emojis, function(value, i) {return {key: value, name:value}});
    var emoji_config = {
      at: ":",
      data: emojis,
      displayTpl: "<li>${name} <span class='icon-${key}'></span></li>",
      insertTpl: '<span class="icon-${key}"></span>',
      delay: delay
    };

    var html = [
        "youtube", "img"
    ];
    var html = $.map(html, function(value, i) {
        data = {
            name: value
        };
        switch(value) {
            case 'youtube':
                data.html = '<youtube video-id="" />';
                break;
            case 'img':
                data.html = '![](file://)';
                break;
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
