loadImages(function(){
    $('#popup').draggable({cursor: 'crosshair', handle: '.popupTitleBar'});
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

    sock.on('giveScore', function(team){
        $('#team').text(team.name);
        $('#score').text(team.score);
    });

    sock.emit('getTasks');
    sock.on('giveTasks', function(tasks){
        $('#challenges').html('');
        var canvases = [];
        var types = [];
        tasks.forEach(function(task){
            var canvas = $('<canvas></canvas>');
            canvas.text(task.title);
            canvas.attr('id', 'task-'+task.title.checksum());
            canvas.addClass('buttonTask');
            canvases.push({canvas: canvas, task: task});
            if(types.indexOf(task.type) === -1){
                types.push(task.type);
            }
        });
        types.forEach(function(type){
            var canvasDir = $('<canvas></canvas>');
            canvasDir.text(type);
            canvasDir.attr('id', type.checksum());
            canvasDir.addClass('buttonDir');
            $('#challenges').append(canvasDir);
            loadDir(type);
            var directory = $('<div></div>');
            directory.addClass('directory');
            directory.addClass('window');
            directory.attr('id', 'div-'+type.checksum());
            var dirTitle = $('<div></div>');
            dirTitle.addClass('titleBar');
            dirTitle.attr('id', 'title-'+type.checksum());
            dirTitle.text(type);
            var imgClose = $('<img/>');
            imgClose.addClass('imgClose');
            imgClose.attr('src','/img/close-window.png');
            dirTitle.append(imgClose);
            var dirContent = $('<div></div>');
            dirContent.addClass('content');
            dirContent.attr('id', 'content-'+type.checksum());
            directory.append(dirTitle);
            directory.append(dirContent);
            $('body').append(directory);

            $('#div-'+type.checksum()).draggable({cursor: 'crosshair', handle: '#title-'+type.checksum(), drag: function(event, ui){
                    if(ui.position.top < $('#navbar').height()){
                        ui.position.top = $('#navbar').height();
                    }
                    if(ui.position.left < 0){
                        ui.position.left = 0;
                    }
                }
            });
            $('#div-'+type.checksum()).resizable();
            $('#div-'+type.checksum()).css('position','absolute');
            $('#div-'+type.checksum()).css('display','none');
        });
        canvases.forEach(function(canvas){
            $('#content-'+canvas.task.type.checksum()).append(canvas.canvas);
            loadTask(canvas.task);
        });
    });

    $('body').on('click', '.directory', function(e){
        $('.directory').css('z-index', '1');
        $(this).css('z-index', '2');
    });

    $('body').on('click', '.imgClose', function(e){
        var directory = $(this).parent().parent();
        var id = directory.attr('id').substring(4);
        directory.css('display', 'none');
        closeDir(document.getElementById(id), $(this).parent().text());
    });

    $('body').on('click', 'canvas', function(e){
        if($(e.target).attr('class') === 'buttonDir'){
            openDir(e.target, $(e.target).text(),  function(){
                var id = $(e.target).attr('id');
                $('#div-'+id).css('display', 'block');
                $('.directory').css('z-index', '1');
                $('#div-'+id).css('z-index', '2');
            });
        }
        else{
            clickTask(e.target, function(){
                var title = $(e.target).text();
                sock.emit('getTask', title);
            });
        }
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