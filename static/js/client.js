loadImages(function(){
    $('#popup').draggable({cursor: 'crosshair', handle: '.popupTitleBar'});
    $('#pad').draggable({cursor: 'crosshair', handle: '.titleBar', drag: function(event, ui){
            if(ui.position.top < $('#navbar').height()){
                ui.position.top = $('#navbar').height();
            }
        }
    });
    $('#console').draggable({cursor: 'crosshair', drag: function(event, ui){
            if(ui.position.top < $('#navbar').height()){
                ui.position.top = $('#navbar').height();
            }
        }
    });

    sock.on('giveScore', function(team){
        $('#team').text(team.name);
        $('#score').text(team.score);
    });

    sock.emit('getTasks');
    sock.on('giveTasks', function(tasks){
        $('#challenges').html('');
        tasks.forEach(function(task){
            var canvas = $('<canvas></canvas>');
            canvas.text(task.title);
            canvas.attr('id', task.title.checksum());
            canvas.addClass('buttonTask');
            $('#challenges').append(canvas);
            loadTask(task);
        });
    });

    $('#challenges').on('click', 'canvas', function(e){
        clickTask(e.target, function(){
            var title = $(e.target).text();
            sock.emit('getTask', title);
        });
    });

    sock.on('giveTask', function(task){
        $('#flag').val('');
        $('#description').html(task.description);
        $('#titlePopup').text(task.title);
        $('#informations').text('Author : '+task.author+' - Difficulty : '+task.difficulty);
        if(task.state > 1){
            $('#flag').attr('disabled', true);
            $('#flag').attr('type', 'text');
            $('#flag').val('Solved');
            $('#submitFlag').css('display', 'none');
        }
        else{
            $('#flag').attr('disabled', false);
            $('#flag').attr('type', 'password');
            $('#flag').val('');
            $('#submitFlag').css('display', 'inline');
        }
        $('#popup').css('display', 'block');
        $('#flag').focus();
    });

    sock.on('updateTask', function(task){
        if($('#popup').css('display')==='block'){
            sock.emit('getTask', task.title);
        }
        loadTask(task);
    });

    sock.on('validation', function(infos){
        if($('#team').text()===infos.team){
            validateTask(infos.title, function(){
                sock.emit('updateTask', infos.title);
            });
        }
        else{
            sock.emit('updateTask', infos.title);
        }
        sock.emit('getScore');
    });

    sock.on('nope', function(error){
        $('#error').text(error);
        $('#error').css('display', 'block');
        setTimeout(function() { $('#error').css('display', 'none'); }, 1000);
    });

    $('#submitFlag').click(function(){
        if($('#error').css('display')==='none'){
            sock.emit('submitFlag', {title: $('#titlePopup').text(), flag: $('#flag').val()});
            $('#flag').val('');
        }
    });

    $('#cancel').click(function(){
        $('#flag').val('');
        $('#popup').css('display', 'none');
    });

    sock.on('refresh', function(){
        location.reload();
    });

    sock.on('error', function(error){
        alert(error+' please contact administrator');
    });

    sock.on('log', function(error){
        console.log(error);
    });
});

$(document).keypress(function(e) {
    if(e.which == 13) {
        if($('#flag').is(":focus")){
            $('#submitFlag').click();
        }
    }
});