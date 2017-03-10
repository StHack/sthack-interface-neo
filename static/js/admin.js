$(document).ready(function () {
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

    $("#closeCTF").click(function(){
        sock.emit('adminCloseCTF');
    });

    $("#openCTF").click(function(){
        sock.emit('adminOpenCTF');
    });

    $("#refresh").click(function(){
        sock.emit('adminRefresh');
    });

    $("#closeRegistration").click(function(){
        sock.emit('adminCloseRegistration');
    });

    $("#openRegistration").click(function(){
        sock.emit('adminOpenRegistration');
    });

    $('#teams').change(function(){
        if($(this).val()===''){
            $('#addTeam').css('display', 'inline');
            $('#editTeam').css('display', 'none');
            $('#deleteTeam').css('display', 'none');
            $('#teamName').val('');
            $('#teamName').attr('disabled', false);
            $('#teamName').focus();
        }
        else{
            $('#addTeam').css('display', 'none');
            $('#editTeam').css('display', 'inline');
            $('#deleteTeam').css('display', 'inline');
            $('#teamName').val($(this).val());
            $('#teamName').attr('disabled', true);
            $('#teamPassword').focus();
        }
    });

    $('#tasks').change(function(){
        if($(this).val()===''){
            $('#addTask').css('display', 'inline');
            $('#editTask').css('display', 'none');
            $('#deleteTask').css('display', 'none');
            $('#taskTitle').val('');
            $('#taskTitle').attr('disabled', false);
            $('#taskTitle').focus();
            $('#taskFlag').val('');
            $('#taskType').val('');
            $('#taskAuthor').val('');
            $('#taskDifficulty').val('easy');
            $('#taskDescription').val('');
            $("#broken").prop('checked', false);
        }
        else{
            $('#addTask').css('display', 'none');
            $('#editTask').css('display', 'inline');
            $('#deleteTask').css('display', 'inline');
            $("#broken").attr('checked', false);
            sock.emit('getTask', $(this).val());
        }
    });

    var oldVal = '';
    $('#message').keyup(function(){
        if(oldVal !== $(this).val()){
            oldVal = $(this).val();
            sock.emit('adminMessage', {message:$("#message").val(), submit:0});
        }
    });

    $('#sendMessage').click(function(){
        sock.emit('adminMessage', {message:$("#message").val(), submit:1});
        $("#message").val('');
    });

    sock.on('giveTask', function(task){
        $('#taskTitle').val(task.title);
        $('#taskTitle').attr('disabled', true);
        $('#taskType').val(task.type);
        $('#taskAuthor').val(task.author);
        $('#taskDescription').val(task.description);
        $('#taskDescription').focus();
        $('#taskDifficulty').val(task.difficulty);
        if(typeof(task.broken) !== 'undefined'){
            $("#broken").prop('checked', task.broken);
        }
        else{
            $("#broken").prop('checked', false);
        }
    });

    sock.emit('adminListTasks');
    sock.on('updateTasks', function(tasks){
        $('#tasks').html('');
        $('#tasks').append($('<option></option>').val('').text('---- Tasks ----'));
        tasks.forEach(function(task){
            $('#tasks').append($('<option></option>').val(task.title).text(task.title));
        });
    });

    sock.emit('adminListTeams');
    sock.on('updateTeams', function(teams){
        $('#teams').html('');
        $('#teams').append($('<option></option>').val('').text('---- Teams ----'));
        teams.forEach(function(team){
            $('#teams').append($('<option></option>').val(team.name).text(team.name));
        });
    });

    sock.on('adminInfo', function(info){
        console.log(info);
    });

    $('#addTeam').click(function(){
        sock.emit('adminAddTeam', {
            name:     $('#teamName').val(),
            password: $('#teamPassword').val()
        });
        $('#teams').val('');
        $('#teams').change();
    });

    $('#editTeam').click(function(){
        sock.emit('adminEditTeam', {
            name:     $('#teamName').val(),
            password: $('#teamPassword').val()
        });
        $('#teams').val('');
        $('#teams').change();
    });

    $('#deleteTeam').click(function(){
        sock.emit('adminDeleteTeam', {
            name:     $('#teamName').val()
        });
        $('#teams').val('');
        $('#teams').change();
    });

    $('#addTask').click(function(){
        sock.emit('adminAddTask', {
            title:       $('#taskTitle').val(),
            flag:        $('#taskFlag').val(),
            type:        $('#taskType').val(),
            author:      $('#taskAuthor').val(),
            difficulty:  $('#taskDifficulty').val(),
            description: $('#taskDescription').val(),
        });
        $('#tasks').val('');
        $('#tasks').change();
    });

    $('#editTask').click(function(){
        sock.emit('adminEditTask', {
            title:       $('#taskTitle').val(),
            flag:        $('#taskFlag').val(),
            type:        $('#taskType').val(),
            author:      $('#taskAuthor').val(),
            difficulty:  $('#taskDifficulty').val(),
            description: $('#taskDescription').val(),
        });
        $('#tasks').val('');
        $('#tasks').change();
    });

    $('#deleteTask').click(function(){
        sock.emit('adminDeleteTask', {
            title:       $('#taskTitle').val(),
        });
        $('#tasks').val('');
        $('#tasks').change();
    });

    sock.emit('getScore');
    sock.on('giveScore', function(team){
        $('#team').text(team.name);
        $('#score').text(team.score);
        $('#breakthrough').html('');
        for(var i = 0; i < team.breakthrough.length; i++){
            $('#breakthrough').append('<img src="/img/coeur.png" title="'+team.breakthrough[i]+'"/>');
        }
    });

    $('#broken').click(function(){
        if($('#taskTitle').val() !== ''){
            sock.emit('adminBreak', {
                title: $('#taskTitle').val(),
                broken: $(this).is(':checked'),
            });
        }
    });

    $(document).keypress(function(e) {
        if(e.which == 13) {
            if($('#message').is(":focus")){
                $('#sendMessage').click();
            }
        }
    });

});