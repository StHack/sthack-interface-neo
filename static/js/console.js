function htmlEncode(value){
  return $('<div/>').text(value).html();
}

var blink_val = 0;
var blink;

$(document).ready(function () {
  // $('#console').draggable({cursor: 'crosshair', drag: function(event, ui){
  //           if(ui.position.top < $('#navbar').height()){
  //               ui.position.top = $('#navbar').height();
  //           }
  //           if(ui.position.left < 0){
  //               ui.position.left = 0;
  //           }
  //       }
  //   });


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
        if(lock!==2){
          var text = $('.new_line').last().text();
          $('.new_line').last().text(writeDate(0)+text.substring(11,text.length-1));
          $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
        }
      }
    }, 500);
  });
  $('#console').trigger('blink');
});

var lock = 2;

function writeMessage(data){
  if(lock !== 0){
    setTimeout(function(){
      writeMessage(data);
    }, 1000);
  }
  else{
    lock = 1;
    if(data.submit === 2){
      $('.new_line').last().text(writeDate(0));
      $('.new_line').last().teletype({animDelay: 100, text: data.message}, function(){
        $('#blinkCursor').remove();
        $('#console').append($('<p class="new_line"></p>').text(writeDate(0)));
        $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
        $('#console').trigger('blink');
        var h = $("#console")[0].scrollHeight;
        $("#console").scrollTop(h);
        lock = 0;
      });
    }
    else{
      $('#blinkCursor').remove();
      $('.new_line').last().text(writeDate(0)+data.message);
      if(data.submit === 1){
        $('#console').append($('<p class="new_line"></p>').text(writeDate(0)));
      }
      $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
      $('#console').trigger('blink');
      var h = $("#console")[0].scrollHeight;
      $("#console").scrollTop(h);
      lock = 0;
    }
  }
}

sock.on('message', function(data){
  writeMessage(data);
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

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function writeDate(timestamp){
  var date;
  if(timestamp === 0){
    date = new Date();
  }
  else{
    date = new Date(timestamp);
  }
  var seconds = pad(date.getSeconds());
  var minutes = pad(date.getMinutes());
  var hours   = pad(date.getHours());
  return '<'+hours+':'+minutes+':'+seconds+'> ';
}

sock.on('giveMessages', function(messages){
  $('#blinkCursor').remove();
  messages.forEach(function(message){
    var date = new Date(message.timestamp);
    var seconds = pad(date.getSeconds());
    var minutes = pad(date.getMinutes());
    var hours   = pad(date.getHours());
    $('#console').append($('<p class="new_line"></p>').text(writeDate(message.timestamp)+message.content));
  });
  $('#console').append($('<p class="new_line"></p>').text(writeDate(0)));
  $('.new_line').last().append('<span id="blinkCursor">&nbsp;</span>');
  $('#console').trigger('blink');
  var h = $("#console")[0].scrollHeight;
  $("#console").scrollTop(h);
  lock = 0;
});

function setup(){
  if($('#team').text()===''){
    var text = $('.new_line').last().text();
    $('.new_line').last().text(text+'.');
    setTimeout(function(){
      setup();
    }, 1000);
  }
  else{
    sock.emit('getMessages');
  }
}

$(document).ready(function () {
  $('#console').append('<p class="new_line">$ </p>');
  setTimeout(function(){
    $('.new_line').last().teletype({animDelay: 50, text: 'nc insomni.hack 31337'}, function(){
      setTimeout(function(){
        $('#console').append('<p class="new_line">Welcome on Insomni\'hack communicator</p>');
        $('#console').append('<p class="new_line">Connecting to your device...</p>');
        setTimeout(function(){
          setup();
        }, 1000);
      }, 1000);
    });
  }, 1000);
});