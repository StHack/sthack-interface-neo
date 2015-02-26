function htmlEncode(value){
  return $('<div/>').text(value).html();
}

var blink_val = 0;
var blink;

$(document).ready(function () {

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
  clearInterval(blink);
  $('#blinkCursor').remove();
  if(data.submit === 1){
    $('.new_line').last().text($('#team').text()+'@inso2k15$ '+data.message);
    $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
    $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
    $('#console').trigger('blink');
  }
  else{
    $('.new_line').last().text($('#team').text()+'@inso2k15$ '+data.message);
    $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
    $('#console').trigger('blink');
  }
  var h = $("#console")[0].scrollHeight;
  $("#console").scrollTop(h);
});

$.fn.teletype = function(opts){
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
      },100);
    }, settings.animDelay*settings.text.length);

};

sock.on('giveMessages', function(messages){
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

setTimeout(function(){
$('#console').append('<p class="new_line">$ </p>');
$('.new_line').last().teletype({animDelay: 50, text: 'ssh '+$('#team').text()+'@inso2k15'});
setTimeout(function(){
  $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15\'s password:'));
  setTimeout(function(){
    $('.new_line').last().teletype({animDelay: 100, text: '**********'});
    setTimeout(function(){
      $('#console').append('<p class="new_line">Welcome on Insomni\'hack communicator</p>');
        setTimeout(function(){
          $('#console').append($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
          setTimeout(function(){
            $('.new_line').last().teletype({animDelay: 100, text: 'cat /var/log/messages'});
          setTimeout(function(){
                sock.emit('getMessages');
              },2000);
        },500);
        },500);
    },1500);
  },1000);
},1800);
},2000);