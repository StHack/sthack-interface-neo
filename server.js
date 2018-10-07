/// Multi-core environment only in production
if(process.env.NODE_ENV === 'production'){
  const net               = require('net');
  const numCPUs           = require('os').cpus().length;
  var cluster             = require('cluster');

  if (cluster.isMaster) {
    var workers = [];

    // Helper function for spawning worker at index 'i'.
    var spawn = function(i) {
        workers[i] = cluster.fork();

        // Optional: Restart worker on exit
        workers[i].on('exit', function(worker, code, signal) {
            console.log('respawning worker', i);
            spawn(i);
        });
    };

    for (var i = 0; i < numCPUs; i++) {
      spawn(i);
    }

    var worker_index = function(ip, len) {
        var s = '';
        for (var i = 0, _len = ip.length; i < _len; i++) {
            if (ip[i] !== '.') {
                s += ip[i];
            }
        }

        return Number(s) % len;
    };

    // Create the outside facing server listening on our port.
    var server = net.createServer({ pauseOnConnect: true }, function(connection) {
        // We received a connection and need to pass it to the appropriate
        // worker. Get the worker for this connection's source IP and pass
        // it the connection.
        var worker = workers[worker_index(connection.remoteAddress, numCPUs)];
        worker.send('sticky-session:connection', connection);
    }).listen(process.env.PORT, '0.0.0.0');
  }
}

if (cluster && cluster.isWorker === false) {
  return;
}

/*************************************
//
// sthack-interface-neo app
//
**************************************/

const express           = require('express');
const session           = require('express-session');
const http              = require('http');
const io                = require('socket.io');
const device            = require('express-device');
const fs                = require('fs');
const cookieParse       = require('cookie');
const cookieParser      = require('cookie-parser');
const bodyParser        = require('body-parser');
const _                 = require('lodash');
const RedisStore        = require('connect-redis')(session);
const IoRedisStore      = require('socket.io-redis');

// Sthack prototypes
const Team    = require('./src/Team').Team;
const Task    = require('./src/Task').Task;
const Message = require('./src/Message').Message;
const Image   = require('./src/Image').Image;
const DB      = require('./src/DB').DB;
const LoggerService  = require('./src/LoggerService').LoggerService;
const AppController = require('./src/AppController').AppController;
const RedisService = require('./src/RedisService').RedisService;
const AppSocketHandler = require('./src/AppSocketHandler').AppSocketHandler;
const AdminSocketHandler = require('./src/AdminSocketHandler').AdminSocketHandler;

var runningPortNumber  = process.env.NODE_ENV === 'production' ? 0 : process.env.PORT;
var DBConnectionString = process.env.DB_CONNECTION_STRING;
var adminName          = process.env.ADMIN_NAME;
var closedTaskDelay    = process.env.CLOSED_TASK_DELAY;
var sessionSecret      = process.env.SESSION_SECRET;
var sessionKey         = process.env.SESSION_KEY;
var adminPath          = process.env.ADMIN_PATH;
var siteTitle          = process.env.TITLE;
var baseScore          = process.env.BASE_SCORE;
var redisHost          = process.env.REDIS_HOST||'127.0.0.1';
var redisPort          = process.env.REDIS_PORT||6379;
var redisAuth          = process.env.REDIS_AUTH||null;

var config = {
  environment: process.env.NODE_ENV,

  redisHost: redisHost,
  redisPort: redisPort,
  redisAuth: redisAuth,

  adminName: adminName,
  adminPath: adminPath,
  siteTitle: siteTitle,

  closedTaskDelay: closedTaskDelay,
  baseScore: baseScore,

  ctfOpen: true,
  registrationOpen: true,
};

const logger    = new LoggerService();
const db        = new DB(DBConnectionString);
const teamDB    = new Team(db);
const taskDB    = new Task(db, config);
const messageDB = new Message(db);
const imageDB   = new Image(config, taskDB);
const redisService = new RedisService(config);

var app = express();

if (process.env.NODE_ENV === 'production') {

  redisService.Initialize();

  app.sessionStore = new RedisStore({
    client: redisService.getMainClient()
  });

} else {
  app.sessionStore = new session.MemoryStore();
}

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');
app.set('views', __dirname +'/views');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(device.capture());

app.use(session({
  'secret': sessionSecret,
  'key'   : sessionKey,
  'store' : app.sessionStore,
  'saveUninitialized': true,
  'resave' : true
  })
);

const unAuthRoute = ['/register', '/', '', '/rules'];
const authRoute = ['/scoreboard', '/', '', '/rules', adminPath, '/simple', '/submitFlag'];

/* à revoir en mode authentificationMiddleware */
app.use(function(req, res, next){
  if((typeof req.session.authenticated !== 'undefined' && authRoute.indexOf(req.url)!==-1)
  || (typeof req.session.authenticated === 'undefined' && unAuthRoute.indexOf(req.url)!==-1 ) ){
    next();
  }
  else{
    res.redirect(302, '/');
  }
});
/* -------- */

var appSSL = http.createServer({}, app).listen(runningPortNumber);
var socketIO = io(appSSL);//.listen(appSSL, { log: true });

// console.log(process.env);
console.log("Application started");

process.on('message', function(message, connection) {
  if (message !== 'sticky-session:connection') {
    return;
  }

  // Emulate a connection event on the server by emitting the
  // event with the connection the master sent us.
  appSSL.emit('connection', connection);

  connection.resume();
});


if(process.env.NODE_ENV==='production'){
  socketIO.adapter(IoRedisStore(redisService.getSocketConfiguration()));
}

imageDB.refreshImages();

const appController = new AppController(config, logger, imageDB, teamDB, taskDB, socketIO);
appController.RegisterRoute(app);

if(app.get('env') === 'production'){
  app.use(function(err, req, res, next){
    res.status(500);
    res.render('error', {current: 'error', title: siteTitle, registrationOpen: config.registrationOpen});
  });
}

// if(app.get('env') === 'development'){
//   app.use(express.errorHandler());
// }

socketIO.use(function(socket, next) {
  console.log('socket attempted');
  var handshake = socket.request;
  if (!(handshake.headers.cookie)) {
    next(new Error('not authorized'));
  }

  var cookie = cookieParse.parse(handshake.headers.cookie);
  var sessionID = cookieParser.signedCookie(cookie[sessionKey], sessionSecret);
  if (process.env.NODE_ENV==='production') {
    redisService.getSession(app.sessionStore.prefix+sessionID)
      .then((session) => {
        if (session.authenticated) {
          handshake.authenticated = session.authenticated;
          next();
        } else {
          next(new Error('not authorized'));
        }
      }, (err) => next(err));
  } else {
    if(app.sessionStore.sessions[sessionID]){
      var session = JSON.parse(app.sessionStore.sessions[sessionID]);
      if(session.authenticated){
        handshake.authenticated = session.authenticated;
        next();
      }
      else{
        next(new Error('not authorized'));
      }
    }
  }
});

socketIO.on('connection', function (socket) {

  const appSocket = new AppSocketHandler(
    socket,
    socketIO,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB
  );

  appSocket.RegisterEvents();

  const adminSocket = new AdminSocketHandler(
    socket,
    socketIO,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB,
    imageDB,
    redisService
  );

  adminSocket.RegisterEvents();
});
