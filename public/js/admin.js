url_to_connect = 'https://127.0.0.1:4443';

$(document).ready(function () {
sock = io.connect(url_to_connect);
$("#message").keyup(function(){
sock.emit('admin_message',{message:$("#message").val(),submit:0});
});

$("#send").submit(function(){
sock.emit('admin_message',{message:$("#message").val(),submit:1});
$("#message").val('');
return false;
});

$("#btn_off").click(function(){
	sock.emit('admin_off');
});
$("#btn_on").click(function(){
	sock.emit('admin_on');
});

$("#btn_refresh").click(function(){
	sock.emit('admin_refresh');
});

});
