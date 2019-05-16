loadImages(function () {
  var prev = 'start';

  //$('#pad').resizable();

  sock.on('giveScore', function (team) {
    $('#team').text(team.name);
    $('#score').text(team.score);
    for (var i = 0; i < team.breakthrough.length; i++) {
      $('#breakthrough').append('<img src="/img/coeur.png" />');
    }

  });

  sock.emit('getTasks');
  sock.on('giveTasks', function (tasks) {
    //$('#challenges').html('');
    var canvases = [];
    var types = {};
    tasks.forEach(function (task) {
      var canvas = $('<canvas></canvas>');
      canvas.text(JSON.stringify(task));
      canvas.attr('id', 'task-' + task.title.checksum());
      canvas.attr('title', task.title);
      canvas.addClass('buttonTask');
      canvas.addClass('');
      canvases.push({ canvas: canvas, task: task });

      if (typeof types[task.type] === 'undefined') {
        types[task.type] = { count: 0, solved: 0 };
      }
      types[task.type].count += 1;
      if (task.state > 1) {
        types[task.type].solved += 1;
      }
    });
    var firstContent = $('<div></div>');
    firstContent.addClass('content');
    firstContent.attr('id', 'content-start');
    $('#challenges').append(firstContent);
    var parentWidth = $("#challenges").width();
    var parentHeight = $("#challenges").height();
    Object.keys(types).forEach(function (type) {
      var canvasDir = $('<canvas></canvas>');
      canvasDir.text(JSON.stringify(types[type]));
      canvasDir.attr('id', type.checksum());
      canvasDir.attr('title', type);
      canvasDir.addClass('buttonDir');
      firstContent.append(canvasDir);
      loadDir(type);
      var dirContent = $('<div></div>');
      dirContent.addClass('content');
      dirContent.attr('id', 'content-' + type.checksum());

      $('#challenges').append(dirContent);
      $('#content-' + type.checksum()).css('display', 'none');
    });
    canvases.forEach(function (canvas) {
      $('#content-' + canvas.task.type.checksum()).append(canvas.canvas);
      loadTask(canvas.canvas[0]);
    });

    $(window).resize();
  });

  $('body').on('click', '.directory', function (e) {
    $('.directory').css('z-index', '1');
    $(this).css('z-index', '2');
  });

  $('body').on('click', '.imgClosePopup', function (e) {
    $('#cancel').click();
  });

  $('body').on('click', '.imgClose', function (e) {
    var directory = $(this).parent().parent();
    var id = directory.attr('id').substring(4);
    closeDir(document.getElementById(id), $(this).parent().text(), function () {
      directory.css('display', 'none');
    });
  });

  function hideAll() {
    $(".content").each(function () {
      $(this).css('display', 'none');
    })
  }

  $('#home').click(function () {
    hideAll();
    $("#content-start").css('display', 'block');
  });

  $('#prev').click(function () {
    hideAll();
    $("#content-" + prev).css('display', 'block');
    prev = 'start';
  });

  $('body').on('mouseenter', '.buttonTask', function (e) {
    enter(e.target, function () {

    });
  });

  $('body').on('mouseleave', '.buttonTask', function (e) {
    leave(e.target, function () {

    });
  });

  $('body').on('click', 'canvas', function (e) {
    if ($(e.target).attr('class') === 'buttonDir') {
      var id = $(e.target).attr('id');
      // if($('#div-'+id).css('display')==='block'){
      //     closeDir(e.target, $(e.target).text(), function(){
      //         $('#div-'+id).css('display', 'none');
      //     });
      // }
      // else{
      //     openDir(e.target, $(e.target).text(),  function(){
      //         $('#div-'+id).css('display', 'block');
      //         $('.directory').css('z-index', '1');
      //         $('#div-'+id).css('z-index', '2');
      //     });
      // }
      prev = 'start';
      $('#content-' + id).css('display', 'block');
      $('#content-start').css('display', 'none');
    }
    else {
      var infos = JSON.parse($(e.target).text());
      if (typeof (infos.broken) === 'undefined' || infos.broken === false) {
        prev = infos.type.checksum();
        clickTask(e.target, function () {
          var title = infos.title;
          sock.emit('getTask', title);
        });
      }
      else {
        alert('We have trouble with this task ! We are working on it...');
      }
    }
  });

  sock.on('breakTask', function (task) {
    if ($('#popup').css('display') === 'block' && $('#titlePopup').text() === task.title) {
      alert('We have trouble with this task ! We are working on it...');
    }
    var canvasTask = document.getElementById('task-' + task.title.checksum());
    var taskInfo = JSON.parse($(canvasTask).text());
    taskInfo.broken = task.broken;
    canvasTask.textContent = JSON.stringify(taskInfo);
    loadTask(canvasTask);
  });

  sock.on('giveTask', function (task) {
    $('#flag').val('');
    $('#description').html(task.description);
    $('#titlePopup').text(task.title);
    // var imgClose = $('<img/>');
    // imgClose.addClass('imgClosePopup');
    // imgClose.attr('src','/img/close-window.png');
    // $('#titlePopup').append(imgClose);
    $('#informations').children('span:eq(1)').text(task.author + ' - ');
    $('#informations').children('span:eq(3)').text(task.difficulty);
    var tags = '#' + task.type + ', ';
    task.tags.forEach(function (tag) {
      tags += '#' + tag + ', ';
    });
    $('#tags').children('span:eq(1)').text(tags.substring(0, tags.length - 2));
    if (task.state > 1) {
      $('#flag').attr('disabled', true);
      $('#flag').attr('type', 'text');
      $('#flag').val('Solved');
      $('#submitFlag').css('display', 'none');
    }
    else {
      $('#flag').attr('disabled', false);
      $('#flag').attr('type', 'password');
      $('#flag').val('');
      $('#submitFlag').css('display', 'inline');
    }
    hideAll();
    $('#popup').css('display', 'block');
    $('#flag').focus();
  });

  sock.on('updateTask', function (task) {
    if ($('#popup').css('display') === 'block' && $('#titlePopup').text() === task.title) {
      sock.emit('getTask', task.title);
    }
    var canvasTask = document.getElementById('task-' + task.title.checksum());
    canvasTask.textContent = JSON.stringify(task);
    closeTask(canvasTask);
    loadTask(canvasTask);
  });

  sock.on('validation', function (infos) {
    if ($('#team').text() === infos.team) {
      var canvasTask = document.getElementById('task-' + infos.title.checksum());
      validateTask(canvasTask, function () {
        var task = JSON.parse(canvasTask.textContent);
        loadDir(task.type, true);
        sock.emit('updateTask', infos.title);
      });
    }
    else {
      sock.emit('updateTask', infos.title);
    }
    sock.emit('getScore');
  });

  sock.on('reopenTask', function (title) {
    var canvasTask = document.getElementById('task-' + title.checksum());
    var task = JSON.parse(canvasTask.textContent);
    task.open = true;
    canvasTask.textContent = JSON.stringify(task);
    reopenTask(canvasTask);
  });

  sock.on('nope', function (error) {
    $('#error').text(error);
    $('#error').css('display', 'block');
    setTimeout(function () { $('#error').css('display', 'none'); }, 1000);
  });

  // $('#submitFlag').click(function(){
  //     if($('#error').css('display')==='none'){
  //         sock.emit('submitFlag', {title: $('#titlePopup').text(), flag: $('#flag').val()});
  //         $('#flag').val('');
  //     }
  // });

  $('#cancel').click(function () {
    $('#flag').val('');
    $('#prev').click();
  });

  sock.on('updateTaskScores', function (tasks) {
    tasks.forEach(function (task) {
      if ($('#popup').css('display') === 'block' && $('#titlePopup').text() === task.title) {
        sock.emit('getTask', task.title);
      }
      var canvasTask = document.getElementById('task-' + task.title.checksum());
      canvasTask.textContent = JSON.stringify(task);
      loadTask(canvasTask);
    });
  });

  sock.on('newTeam', function () {
    sock.emit('updateTaskScores');
  });

  sock.on('refresh', function () {
    location.reload();
  });

  sock.on('error', function (error) {
    alert(error + ' please contact administrator');
  });

  sock.on('log', function (error) {
    console.log(error);
  });
});

$(document).keypress(function (e) {
  if (e.which == 13) {
    if ($('#flag').is(":focus")) {
      if ($('#error').css('display') === 'none') {
        sock.emit('submitFlag', { title: $('#titlePopup').text(), flag: $('#flag').val() });
        $('#flag').val('');
      }
    }
  }
});

$(window).resize(function () {
  var parentWidth = $("#challenges").width();
  var parentHeight = $("#challenges").height();
  $(".content").each(function () {
    $(this).width(parentWidth);
    $(this).height(parentHeight);
  });

  $(".buttonTask").each(function () {
    $(this).width(parentWidth / 5);
    $(this).height(parentWidth / 5);
  });

  $(".buttonDir").each(function () {
    $(this).width(parentWidth / 5);
    $(this).height(parentWidth / 5);
  });
});
