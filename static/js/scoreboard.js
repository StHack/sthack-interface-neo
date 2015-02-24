$(document).ready(function () {
sock = io.connect('https://127.0.0.1:4443');

sock.emit('give_me_scoreboard');

function resetScoreboard(){
	$("#scoreboard").html("");
	var my_head="<th>#</th><th></th><th>&Eacute;quipe</th><th>Score</th><th>BreakThrough</th>";
	$("#scoreboard").append("<tbody>");
    $("#scoreboard").append("<tr>");
    $("#scoreboard tr").append(my_head);
}

resetScoreboard();

sock.on('scoreboard',function(data){
	resetScoreboard();
for(var i=0;i<data.length;i++){
	var breakthrough=""
	for(var j=0;j<data[i].bt;j++)
		breakthrough=breakthrough+'<img src="/static/img/coeur.png" />';
$("#scoreboard tbody").append('<tr id="'+data[i].name+'"><td>'+(i+1)+'</td><td><img src="/static/img/team_logos/'+data[i].name+'.png"</td><td>'+data[i].name+'</td><td>'+data[i].score+'</td><td>'+breakthrough+'</td></tr>');
}
});

});
