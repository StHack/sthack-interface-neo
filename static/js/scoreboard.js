$(document).ready(function () {
  $('#pad').draggable({cursor: 'crosshair', handle: '.titleBar', drag: function(event, ui){
            if(ui.position.top < $('#navbar').height()){
                ui.position.top = $('#navbar').height();
            }
            if(ui.position.left < 0){
                ui.position.left = 0;
            }
        }
    });

  $('#pad').resizable();

  sock.on('validation', function(){
    sock.emit('getScoreboard');
  });

  sock.on('updateTeams', function(){
    sock.emit('getScoreboard');
  });


  sock.emit('getScoreboard');
  sock.on('giveScoreboard', function(scoreboard){
    $('#scoreboard').html('<div class="line head"><div class="column pos">Pos</div><div class="column team">Team</div><div class="column score">Score</div><div class="column last">Last Solved</div></div>');
    var lineDiv;
    var posDiv;
    var teamDiv;
    var scoreDiv;
    var lastDiv;
    var timeSpan;
    var pos = 1;
    var time;
    scoreboard.forEach(function(line){
      lineDiv = $('<div></div>');
      lineDiv.addClass('line');
      posDiv = $('<div></div>');
      posDiv.addClass('column');
      posDiv.addClass('pos');
      posDiv.text(pos);
      pos += 1;
      teamDiv = $('<div></div>');
      teamDiv.addClass('column');
      teamDiv.addClass('team');
      teamDiv.text(line.team);
      scoreDiv = $('<div></div>');
      scoreDiv.addClass('column');
      scoreDiv.addClass('score');
      scoreDiv.text(line.score);
      lastDiv = $('<div></div>');
      lastDiv.addClass('column');
      lastDiv.addClass('last');
      time = new Date(-line.time);
      timeSpan = $('<span></span>');
      timeSpan.addClass('lastTime');
      timeSpan.text(time);
      lastDiv.text(line.lastTask+' '+time.getHours()+':'+time.getMinutes()+':'+time.getSeconds());
      lastDiv.append(timeSpan);
      lineDiv.append(posDiv);
      lineDiv.append(teamDiv);
      lineDiv.append(scoreDiv);
      lineDiv.append(lastDiv);
      $('#scoreboard').append(lineDiv);
    });

  });

  setInterval(function(){
    var diffMax = 1000 * 60 * 5;
    var time;
    var diffTime;
    $('.line').each(function(index, line){
      time = new Date($(line).children('.last').children('.lastTime').text());
      diffTime = new Date()-time;
      if(diffTime <= diffMax){
        $(line).css('background-color', 'rgba(204,41,47,'+(1-diffTime/diffMax)+')');
      }
      else{
        if($(line).css('background-color')!=='rgba(204,41,47, 0)'){
          $(line).css('background-color', 'rgba(204,41,47, 0)');
        }
      }
    });
  }, 1000);

});
