/*************************************
//
// sthack-interface-neo app
//
**************************************/

var express           = require('express');
var session           = require('express-session');
var https             = require('https');
var http              = require('http');
var io                = require('socket.io');
var device            = require('express-device');
var fs                = require('fs');
var cookieParse       = require('cookie');
var connect           = require('express/node_modules/connect')
var morgan            = require('morgan');
if(process.env.NODE_ENV==='production'){
  var cluster           = require('cluster');
  var numCPUs           = require('os').cpus().length
  var redis             = require('redis');
  var RedisStore        = require('connect-redis')(session);
  var IoRedisStore      = require('socket.io/lib/stores/redis');
  var redisClient       = redis.createClient();
  var redisPub          = redis.createClient();
  var redisSub          = redis.createClient();
  if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  }
}

if(typeof cluster === 'undefined' || cluster.isWorker){
// Sthack prototypes
var Team = require('./src/Team').Team;
var Task = require('./src/Task').Task;
var DB   = require('./src/DB').DB;

var runningPortNumber  = process.env.PORT;
var DBConnectionString = process.env.DB_CONNECTION_STRING;
var adminName          = process.env.ADMIN_NAME;
var closedTaskDelay    = process.env.CLOSED_TASK_DELAY;
var sessionSecret      = process.env.SESSION_SECRET;
var sessionKey         = process.env.SESSION_KEY;
var adminPath          = process.env.ADMIN_PATH;
var logPath            = process.env.LOG_PATH;

if(process.env.NODE_ENV==='production'){
  var ctfOpen = true;
  var registrationOpen = true;
}
else{
  var ctfOpen = true;
  var registrationOpen = true;
}

var sslOptions = {
  key: fs.readFileSync(process.env.KEY_PATH),
  cert: fs.readFileSync(process.env.CERT_PATH)
};

var app               = express();
var server            = http.createServer(app)
var parseSignedCookie = connect.utils.parseSignedCookie;

app.configure('production', function(){
  var access = fs.createWriteStream(logPath + '/node.access.log', { flags: 'a' });
  app.use(morgan('combined', {stream: access}));
  app.sessionStore = new RedisStore({
    client: redisClient
  });
});

app.configure('development', function(){
  app.use(morgan('dev'));
  app.sessionStore = new express.session.MemoryStore({reapInterval: 60000 * 10 });
});

app.configure(function(){
  app.use(express.static(__dirname + '/public'));

  app.set('view engine', 'ejs');
  app.set('views', __dirname +'/views');

  app.use(express.cookieParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(device.capture());

  app.use(session({
    'secret': sessionSecret,
    'key'   : sessionKey,
    'store' : app.sessionStore,
    'saveUninitialized': true,
    'resave' : true
    })
  );
});

var db = new DB(DBConnectionString);
var teamDB = new Team(db);
var taskDB = new Task(db, {delay: closedTaskDelay});

var unAuthRoute = ['/scoreboard', '/register', '/', '']
var authRoute = ['/scoreboard', '/', '', adminPath]


function list(object, callback, callbackError){
  object.list().then(function(objects){
    callback(objects);
  }, function(error){
    callbackError(error);
  });
}


/* à revoir en mode authentificationMiddleware */
app.use(function(req, res, next){
  if((req.session.authenticated && authRoute.indexOf(req.url)!==-1) || unAuthRoute.indexOf(req.url)!==-1){
    next();
  }
  else{
    res.redirect(301, '/');
  }
});
/* -------- */

var appSSL = https.createServer(sslOptions, app).listen(runningPortNumber);
var socketIO;

if(process.env.NODE_ENV==='production'){
  socketIO = io.listen(appSSL, { log: false });
  socketIO.set('store',
    new IoRedisStore({
      redisPub: redisPub,
      redisSub: redisSub,
      redisClient: redisClient
    })
  );
  redisSub.subscribe('adminAction')
  redisSub.on('message', function(channel, message){
    if(message === 'openCTF'){
      ctfOpen = true;
    }
    else if(message === 'closeCTF'){
      ctfOpen = false;
    }
    else if(message === 'closeRegistration'){
      registrationOpen = false;
    }
    else if(message === 'openRegistration'){
      registrationOpen = true;
    }
  });
}
else{
  socketIO = io.listen(appSSL, { log: true });
}


app.get("/", function(req, res){
  if(req.session.authenticated){
    res.render('index', {
      current: 'index',
      auth: 1,
      socketIOUrl: 'https://'+req.headers.host,
    });
  }
  else{
    list(teamDB, function(teams){
      res.render('not_logged', {
        current: 'index',
        teams_list: teams,
        registrationOpen: registrationOpen
      });
    },function(error){
      console.log(error);
    });
  }
});

app.all("/register", function(req, res){
  if(registrationOpen){
    if(req.method==='POST' && typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined'){
      teamDB.addTeam(req.body.name, req.body.password).then(function(){
        list(teamDB, function(teams){
          socketIO.sockets.emit('updateTeams', teams);
        });
        res.redirect(301, '/');
      }, function(error){
        res.render('register', {
          current: 'register',
          error: error,
          registrationOpen: registrationOpen
        });
      });
    }
    else{
      res.render('register',{
        current: 'register',
        registrationOpen: registrationOpen
      });
    }
  }
  else{
    res.redirect(301, '/');
  }
});

app.get("/scoreboard", function(req, res){
  res.render('scoreboard',{
    current: 'scoreboard',
    registrationOpen: registrationOpen
  });
});

app.get(adminPath, function(req, res){
  if(req.session.authenticated && req.session.authenticated === adminName){
    res.render('admin', {
      current: 'index',
      admin: 1,
      auth: 1,
      socketIOUrl: 'https://'+req.headers.host
    });
  }
  else{
    res.redirect(301, '/');
  }
});

app.post("/", function(req, res){
  if(typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined'){
    teamDB.areLoginsValid(req.body.name, req.body.password).then(function(result){
      if(result){
        req.session.authenticated = req.body.name;
      }
      res.redirect(301, '/');
    }, function(error){
      console.log(error);
    });
  }
  else{
    res.redirect(301, '/');
  }
});

app.configure('production', function(){
  app.use(function(err, req, res, next){
    res.status(500);
    res.render('error', {current: 'error', registrationOpen: registrationOpen});
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function sessionAuthenticated(handshake, callback){
  if(handshake.headers.cookie){
    var cookie = cookieParse.parse(handshake.headers.cookie);
    var sessionID = parseSignedCookie(cookie[sessionKey], sessionSecret);
    if(process.env.NODE_ENV==='production'){
      redisClient.get(app.sessionStore.prefix+sessionID, function(err, content){
        var session = JSON.parse(content);
        if(session.authenticated){
          callback(session.authenticated);
        }
        else{
          callback(null);
        }
      });
    }
    else{
      if(app.sessionStore.sessions[sessionID]){
        var session = JSON.parse(app.sessionStore.sessions[sessionID]);
        if(session.authenticated){
          callback(session.authenticated);
        }
        else{
          callback(null);
        }
      }
    }
  }
  else{
    callback(null);
  }
}

socketIO.set('authorization', function (handshakeData, callback) {
  sessionAuthenticated(handshakeData, function(auth){
    if(auth){
      handshakeData.authenticated = auth;
      callback(null, true);
    }
    else{
      callback(null, false);
    }
  });
});


socketIO.on('connection', function (socket) {

  socket.on('getTasks', function(){
    teamDB.list().then(function(teams){
      taskDB.getTasks(socket.handshake.authenticated, teams.length).then(function(tasks){
        socket.emit('giveTasks', tasks.infos);
        var score = 0;
        tasks.raw.forEach(function(task){
          if(taskDB.teamSolved(task, socket.handshake.authenticated)){
            score += task.score;
          }
        });
        socket.emit('giveScore', {name: socket.handshake.authenticated, score: score});
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getTask', function(title){
    teamDB.list().then(function(teams){
      taskDB.getTaskInfos(title, socket.handshake.authenticated, teams.length, true).then(function(task){
        socket.emit('giveTask', task);
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('updateTask', function(title){
    teamDB.list().then(function(teams){
      taskDB.getTaskInfos(title, socket.handshake.authenticated, teams.length, false).then(function(task){
        socket.emit('updateTask', task);
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getScore', function(){
    teamDB.list().then(function(teams){
      taskDB.getTasks(socket.handshake.authenticated, teams.length).then(function(tasks){
        var score = 0;
        tasks.raw.forEach(function(task){
          if(taskDB.teamSolved(task, socket.handshake.authenticated)){
            score += task.score;
          }
        });
        socket.emit('giveScore', {name: socket.handshake.authenticated, score: score});
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('submitFlag', function(datas){
    if(ctfOpen){
      taskDB.solveTask(datas.title, datas.flag, socket.handshake.authenticated).then(function(result){
        socketIO.sockets.emit('validation', {title: datas.title, team: socket.handshake.authenticated});
      }, function(error){
        socket.emit('nope', error);
      });
    }
    else{
      socket.emit('nope', 'Ctf closed');
    }
  });

  socket.on('adminCloseRegistration', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'closeRegistration');
    }
    registrationOpen = false;
  });

  socket.on('adminOpenRegistration', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'openRegistration');
    }
    registrationOpen = true;
  });

  socket.on('adminCloseCTF', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'closeCTF');
    }
    ctfOpen = false;
  });

  socket.on('adminOpenCTF', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'openCTF');
    }
    ctfOpen = true;
  });

  socket.on('adminAddTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.addTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author).then(function(){
        list(taskDB, function(tasks){
          socketIO.sockets.emit('updateTasks', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminEditTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.editTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author).then(function(){
        list(taskDB, function(tasks){
          socketIO.sockets.emit('updateTasks', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminDeleteTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.deleteTask(data.title).then(function(){
        list(taskDB, function(tasks){
          socketIO.sockets.emit('updateTasks', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminAddTeam', function(data){
    if(socket.handshake.authenticated === adminName) {
      teamDB.addTeam(data.name, data.password).then(function(){
        list(teamDB, function(teams){
          socketIO.sockets.emit('updateTeams', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminEditTeam', function(data){
    if(socket.handshake.authenticated === adminName) {
      teamDB.editTeam(data.name, data.password).then(function(){
        list(teamDB, function(teams){
          socketIO.sockets.emit('updateTeams', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminDeleteTeam', function(data){
    if(socket.handshake.authenticated === adminName && data.name !== adminName) {
      teamDB.deleteTeam(data.name).then(function(){
        list(teamDB, function(teams){
          socketIO.sockets.emit('updateTeams', teams);
        });
      }, function(error){
        socket.emit('log', error);
      });
    }
  });

  socket.on('adminListTasks', function(){
    if(socket.handshake.authenticated === adminName) {
      list(taskDB, function(tasks){
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('error', error);
      });
    }
  });

  socket.on('adminListTeams', function(){
    if(socket.handshake.authenticated === adminName) {
      list(teamDB, function(teams){
        socket.emit('updateTeams', teams);
      }, function(error){
        socket.emit('error', error);
      });
    }
  });

});

}