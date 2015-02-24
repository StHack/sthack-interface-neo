function htmlEncode(value){
  return $('<div/>').text(value).html();
}

var first_message = 1;
blink=setInterval(function(){
  if(blink_val === 0){
  $('#blink_cursor').css('background-color','#aaa');
  $('#blink_cursor').css('color','#000');
  blink_val=1;
  }
  else{
    $('#blink_cursor').css('background-color','#000');
    $('#blink_cursor').css('color','#aaa');
  blink_val=0;
  }
}, 500);

clearInterval(blink);

blink_val=0;
$('body').delegate('#blink_cursor', 'blinking_event', function(e){
blink=setInterval(function(){
  if(blink_val === 0){
  $('#blink_cursor').css('background-color','#aaa');
  $('#blink_cursor').css('color','#000');
  blink_val=1;
  }
  else{
    $('#blink_cursor').css('background-color','#000');
    $('#blink_cursor').css('color','#aaa');
  blink_val=0;
  }
}, 500);
});

$.fn.teletype = function(opts){
  if(first_message === 0){
    writing=1;
  }
  $('#blink_cursor').remove();
  clearInterval(blink);
    var $this = this,
        defaults = {
            animDelay: 50
        },
        settings = $.extend(defaults, opts);

    $.each(settings.text.split(''),function(i, letter){
        setTimeout(function(){
            $this.html($this.html() + letter);
            if(i === settings.text.length-1){
              if(first_message === 0){
                writing=0;
              }
            }
        }, settings.animDelay * i);
    });
    if(typeof settings.prepend_text != 'undefined'){
    setTimeout(function(){
          $('#console').prepend(settings.prepend_text);
          setTimeout(function(){
            $('.new_line').first().append('<span id="blink_cursor">&nbsp;</span>');
            $('#blink_cursor').trigger('blinking_event');
            if(first_message === 0){
              writing=0;
            }
          },100);
        },settings.animDelay*settings.text.length+50);
  }

};
setTimeout(function(){
$('#console').prepend('<p class="new_line">$ </p>');
$('.new_line').first().teletype({animDelay: 50, text: 'ssh '+$('#team').text()+'@inso2k15'});
setTimeout(function(){
  $('#console').prepend($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15\'s password:'));
  setTimeout(function(){
    $('.new_line').first().teletype({animDelay: 100, text: '**********'});
    setTimeout(function(){
      $('#console').prepend('<p class="new_line">Welcome on Insomni\'hack communicator</p>');
        setTimeout(function(){
          $('#console').prepend($('<p class="new_line"></p>').text($('#team').text()+'@inso2k15$ '));
          setTimeout(function(){
            $('.new_line').first().teletype({animDelay: 100, text: 'tail -f /var/log/messages'});
          setTimeout(function(){
                sock.emit('getMessages');
              },3000);
        },500);
        },500);
    },1500);
  },1000);
},1800);
},2000);