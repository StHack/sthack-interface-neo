$(document).ready(function () {

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
        }
        else{
            $('#addTask').css('display', 'none');
            $('#editTask').css('display', 'inline');
            $('#deleteTask').css('display', 'inline');
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
        $('#taskFlag').focus();
        $('#taskType').val(task.type);
        $('#taskAuthor').val(task.author);
        $('#taskDescription').val(task.description);
        $('#taskDifficulty option[value="' + task.difficulty + '"]').attr('selected', 'selected');
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
        $('#teamName').val('');
        $('#teamPassword').val('');
    });

    $('#editTeam').click(function(){
        sock.emit('adminEditTeam', {
            name:     $('#teamName').val(),
            password: $('#teamPassword').val()
        });
        $('#teamName').val('');
        $('#teamPassword').val('');
    });

    $('#deleteTeam').click(function(){
        sock.emit('adminDeleteTeam', {
            name:     $('#teamName').val()
        });
        $('#teamName').val('');
        $('#teamPassword').val('');
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
        $('#taskTitle').val('');
        $('#taskFlag').val('');
        $('#taskType').val('');
        $('#taskAuthor').val('');
        $('#taskDescription').val('');
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
        $('#taskTitle').val('');
        $('#taskFlag').val('');
        $('#taskType').val('');
        $('#taskAuthor').val('');
        $('#taskDescription').val('');
    });

    $('#deleteTask').click(function(){
        sock.emit('adminDeleteTask', {
            title:       $('#taskTitle').val(),
        });
        $('#taskTitle').val('');
        $('#taskFlag').val('');
        $('#taskType').val('');
        $('#taskAuthor').val('');
        $('#taskDescription').val('');
    });

    $(document).keypress(function(e) {
        if(e.which == 13) {
            if($('#message').is(":focus")){
                $('#sendMessage').click();
            }
        }
    });

});