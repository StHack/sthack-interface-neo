/*************************************
//
// sthack-interface-neo app
//
**************************************/

// express magic
var express = require('express');
var app = express();
var https = require('https');
var server = require('http').createServer(app)
var io = require('socket.io');
var device  = require('express-device');
var fs = require('fs');

var runningPortNumber = process.env.PORT;
var adminName = process.env.ADMIN_NAME;

var sslOptions = {
  key: fs.readFileSync(process.env.KEY_PATH),
  cert: fs.readFileSync(process.env.CERT_PATH)
};

app.configure(function(){
	// I need to access everything in '/public' directly
	app.use(express.static(__dirname + '/public'));

	//set the view engine
	app.set('view engine', 'ejs');
	app.set('views', __dirname +'/views');

	app.use(device.capture());
});


// logs every request
app.use(function(req, res, next){
	// output every request in the array
	console.log({method:req.method, url: req.url, device: req.device});

	// goes onto the next function in line
	next();
});

app.get("/", function(req, res){
	res.render('index', {});
});

appSSL = https.createServer(sslOptions, app).listen(runningPortNumber);

var socketIO = io.listen(appSSL, { log: false });

socketIO.on('connection', function (socket) {

	socketIO.emit('blast', {msg:"<span style=\"color:red !important\">someone connected</span>"});

	socket.on('blast', function(data, fn){
		console.log(data);
		socketIO.emit('blast', {msg:data.msg});

		fn();//call the client back to clear out the field
	});

});

