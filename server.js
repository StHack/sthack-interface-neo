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
var device = require('express-device');
var fs = require('fs');
var cookie = require('cookie');
var connect = require('express/node_modules/connect')
var parseSignedCookie = connect.utils.parseSignedCookie

// Sthack prototypes
var Team = require('./src/Team').Team;
var DB = require('./src/DB').DB;

var runningPortNumber = process.env.PORT;
var DBConnectionString = process.env.DB_CONNECTION_STRING;
var adminName = process.env.ADMIN_NAME;
var sessionSecret = process.env.SESSION_SECRET;
var sessionKey = process.env.SESSION_KEY;
var adminPath = process.env.ADMIN_PATH;

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

	app.use(express.cookieParser());
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(device.capture());

	//Prepare session
	app.sessionStore = new express.session.MemoryStore({reapInterval: 60000 * 10 });
	app.use(express.session({
	  'secret': sessionSecret,
	  'key'   : sessionKey,
  	'store' : app.sessionStore
		})
	);
});


var db = new DB(DBConnectionString);
var team = new Team(db);

// Test authentication
app.use(function(req, res, next){
	if (team.isAuthenticated(req.session) || (req.method == 'POST' && 
																						req.body.teamName && 
																						req.body.password)){
  	next();
	}
  else{
    team.list().then(function(result){
      res.render('not_logged', {
      	teams_list: result
  		});
    },function(error){
      console.log(error);
    });
  }
});

app.get("/", function(req, res){
	res.render('index',{});
});

app.get(adminPath, function(req, res){
  if(team.isAdmin(req.session, adminName)){
    res.render('admin',{});
  }
  else{
    res.render('index',{});
  }
});

app.post("/", function(req, res){
	team.areLoginsValid(req.body.teamName, req.body.password).then(function(result){
		if(result){
			req.session.authenticated = req.body.teamName;
		}
		res.redirect('/');
	}, function(error){
		console.log(error);
	});
});

appSSL = https.createServer(sslOptions, app).listen(runningPortNumber);

var socketIO = io.listen(appSSL, { log: true });

socketIO.set('authorization', function (handshakeData, callback) {
  var auth = false;
  if(handshakeData.headers.cookie){
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    handshakeData.sessionID = parseSignedCookie(handshakeData.cookie[sessionKey], sessionSecret);
    if (app.sessionStore.sessions[handshakeData.sessionID]){
      var session = JSON.parse(app.sessionStore.sessions[handshakeData.sessionID]);
      if(session.authenticated){
        handshakeData.teamName = session.authenticated;
        auth = true;
      }
    }
  }
  callback(null, auth);
});

socketIO.on('connection', function (socket) {

	socketIO.emit('blast', {msg:"<span style=\"color:red !important\">someone connected</span>"});

	socket.on('blast', function(data, fn){
		console.log(data);
		socketIO.emit('blast', {msg:data.msg});

		fn();//call the client back to clear out the field
	});

});

