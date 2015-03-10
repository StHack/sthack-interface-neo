function htmlEncode(value){
  return $('<div/>').text(value).html();
}

var blink_val = 0;
var blink;

$(document).ready(function () {
  $('#console').draggable({cursor: 'crosshair', drag: function(event, ui){
            if(ui.position.top < $('#navbar').height()){
                ui.position.top = $('#navbar').height();
            }
            if(ui.position.left < 0){
                ui.position.left = 0;
            }
        }
    });


  $('#console').on('blink', function(){
    clearInterval(blink);
    blink=setInterval(function(){
      if(blink_val === 0){
        $('#blinkCursor').css('background-color','#aaa');
        $('#blinkCursor').css('color','#000');
        blink_val=1;
      }
      else{
        $('#blinkCursor').css('background-color','#000');
        $('#blinkCursor').css('color','#aaa');
        blink_val=0;
      }
    }, 500);
  });
  $('#console').trigger('blink');
});

sock.on('message', function(data){
  if(data.submit === 2){
    $('.new_line').last().teletype({animDelay: 100, text: data.message}, function(){
      $('#blinkCursor').remove();
      $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
      $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
      $('#console').trigger('blink');
      var h = $("#console")[0].scrollHeight;
      $("#console").scrollTop(h);
    });
  }
  else{
    $('#blinkCursor').remove();
    $('.new_line').last().text($('#team').text()+'@inso2k15$ '+data.message);
    if(data.submit === 1){
      $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
    }
    $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
    $('#console').trigger('blink');
    var h = $("#console")[0].scrollHeight;
    $("#console").scrollTop(h);
  }
});

$.fn.teletype = function(opts, callback){
  clearInterval(blink);
  $('#blinkCursor').remove();
    var $this = this;
    var defaults = {
      animDelay: 50
    };
    var settings = $.extend(defaults, opts);

    $.each(settings.text.split(''),function(i, letter){
      setTimeout(function(){
        $this.html($this.html() + letter);
      }, settings.animDelay * i);
    });

    setTimeout(function(){
      setTimeout(function(){
        $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
        $('#console').trigger('blink');
        callback();
      },100);
    }, settings.animDelay*settings.text.length);

};

sock.on('giveMessages', function(messages){
  $('#blinkCursor').remove();
  messages.forEach(function(message){
    var date = new Date(message.timestamp);
    var seconds = date.getSeconds();
    var minutes = date.getMinutes();
    var hours   = date.getHours();
    $('#console').append($('<p class="new_line"></p>').text('<'+hours+':'+minutes+':'+seconds+'> '+message.content));
  });
  $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
  $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
  $('#console').trigger('blink');
  var h = $("#console")[0].scrollHeight;
  $("#console").scrollTop(h);
});

$(document).ready(function () {
  $('#console').append('<p class="new_line">$ </p>');
  setTimeout(function(){
    $('.new_line').last().teletype({animDelay: 50, text: 'ssh '+$('#team').text()+'@inso2k15'}, function(){
      $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15\'s password:'));
      setTimeout(function(){
        $('.new_line').last().teletype({animDelay: 100, text: '**********'}, function(){
          $('#console').append('<p class="new_line">Welcome on Insomni\'hack communicator</p>');
          setTimeout(function(){
            $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
            $('.new_line').last().teletype({animDelay: 100, text: 'cat /var/log/messages'}, function(){
              sock.emit('getMessages');
            });
          }, 1000);
        });
      }, 1000);
    });
  }, 1000);
});