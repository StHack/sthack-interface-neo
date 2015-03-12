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
var cookieParser      = require('cookie-parser');
var connect           = require('express/node_modules/connect');
var _                 = require('lodash');
if(process.env.NODE_ENV==='production'){
  var cluster           = require('cluster');
  var numCPUs           = require('os').cpus().length;
  var redis             = require('redis');
  var RedisStore        = require('connect-redis')(session);
  var IoRedisStore      = require('socket.io/lib/stores/redis');

  var redisHost          = process.env.REDIS_HOST||'127.0.0.1';
  var redisPort          = process.env.REDIS_PORT||6379;
  var redisAuth          = process.env.REDIS_AUTH||null;
  if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  }
}


function list(object, callback, callbackError){
  object.list().then(function(objects){
    callback(objects);
  }, function(error){
    callbackError(error);
  });
}


if(typeof cluster === 'undefined' || cluster.isWorker){

var runningPortNumber  = process.env.PORT;
var DBConnectionString = process.env.DB_CONNECTION_STRING;
var adminName          = process.env.ADMIN_NAME;
var closedTaskDelay    = process.env.CLOSED_TASK_DELAY;
var sessionSecret      = process.env.SESSION_SECRET;
var sessionKey         = process.env.SESSION_KEY;
var adminPath          = process.env.ADMIN_PATH;

// Sthack prototypes
var Team    = require('./src/Team').Team;
var Task    = require('./src/Task').Task;
var Message = require('./src/Message').Message;
var DB      = require('./src/DB').DB;

if(process.env.NODE_ENV==='production'){
  var redisClient       = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth});
  var redisPub          = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth});
  var redisSub          = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth});

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
var server            = http.createServer(app);
var parseSignedCookie = connect.utils.parseSignedCookie;

if(app.get('env') === 'production'){
  app.sessionStore = new RedisStore({
    client: redisClient
  });
}

if(app.get('env') === 'development'){
  app.sessionStore = new express.session.MemoryStore({reapInterval: 60000 * 10 });
}


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

var db        = new DB(DBConnectionString);
var teamDB    = new Team(db);
var taskDB    = new Task(db, {delay: closedTaskDelay});
var messageDB = new Message(db);

var unAuthRoute = ['/register', '/', '', '/rules'];
var authRoute = ['/scoreboard', '/', '', '/rules', adminPath, '/simple', '/submitFlag'];

/* à revoir en mode authentificationMiddleware */
app.use(function(req, res, next){
  if((typeof req.session.authenticated !== 'undefined' && authRoute.indexOf(req.url)!==-1) || (typeof req.session.authenticated === 'undefined' && unAuthRoute.indexOf(req.url)!==-1 ) ){
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
  redisSub.subscribe('adminAction');
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
      res.render('login', {
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
  var d = new Date().toISOString();
  if(registrationOpen){
    if(req.method==='POST' && typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined'){
      teamDB.addTeam(req.body.name, req.body.password).then(function(){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "-" "register" "'+req.body.name.replace(/"/g,'\\"')+'" "ok"' );
        list(teamDB, function(teams){
          socketIO.sockets.emit('newTeam');
        });
        res.redirect(301, '/');
      }, function(error){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "-" "register" "'+req.body.name.replace(/"/g,'\\"')+'" "ko"' );
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
        error: '',
        registrationOpen: registrationOpen
      });
    }
  }
  else{
    res.redirect(301, '/');
  }
});

app.get('/rules', function(req, res){
  if(req.session.authenticated){
    var auth = 1;
  }
  res.render('rules',{
    current: 'rules',
    auth: auth,
    registrationOpen: registrationOpen,
    socketIOUrl: 'https://'+req.headers.host
  });
});

app.get('/scoreboard', function(req, res){
  res.render('scoreboard',{
    current: 'scoreboard',
    auth: 1,
    registrationOpen: registrationOpen,
    socketIOUrl: 'https://'+req.headers.host
  });
});

app.get('/simple', function(req, res){
  teamDB.list().then(function(teams){
      taskDB.getTasks(req.session.authenticated, teams.length).then(function(tasks){
        var score = 0;
        tasks.raw.forEach(function(task){
          var solved = taskDB.teamSolved(task, req.session.authenticated);
          if(solved.ok){
            score += task.score;
          }
        });
        res.render('simple',{tasks: tasks.raw, score: score});
      }, function(error){
        res.render('simple',{tasks: [], score: 0});
      });
    }, function(error){
      res.render('simple',{tasks: [], score: 0});
    });
});

app.post('/submitFlag', function(req, res){
  if(typeof req.body.title !== 'undefined' && typeof req.body.flag !== 'undefined'){
    var d = new Date().toISOString();
    if(ctfOpen){
      taskDB.solveTask(req.body.title, req.body.flag, req.session.authenticated).then(function(result){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "'+req.session.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+req.body.title.replace(/"/g,'\\"')+'" "ok"' );
        socketIO.sockets.emit('validation', {title: req.body.title, team: req.session.authenticated});
        var message = req.session.authenticated+' solved '+req.body.title;
        socketIO.sockets.emit('message', {submit: 2, message: message});
        messageDB.addMessage(message);
        if(closedTaskDelay > 0){
          setTimeout(function(){
            socketIO.sockets.emit('reopenTask', req.body.title);
          }, closedTaskDelay);
        }
        res.redirect(301, '/simple');
      }, function(error){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "'+req.session.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+req.body.title.replace(/"/g,'\\"')+'" "ko"' );
        res.redirect(301, '/simple');
      });
    }
    else{
      console.log('"'+d+'" "'+req.connection.remoteAddress+'" "'+req.session.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+req.body.title.replace(/"/g,'\\"')+'" "closed"' );
      res.redirect(301, '/simple');
    }
  }
  else{
    res.redirect(301, '/simple');
  }
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

if(app.get('env') === 'production'){
  app.use(function(err, req, res, next){
    res.status(500);
    res.render('error', {current: 'error', registrationOpen: registrationOpen});
  });
}

if(app.get('env') === 'development'){
  app.use(express.errorHandler());
}

socketIO.set('authorization', function (handshake, callback) {
  if(handshake.headers.cookie){
    var cookie = cookieParse.parse(handshake.headers.cookie);
    var sessionID = cookieParser.signedCookie(cookie[sessionKey], sessionSecret);
    if(process.env.NODE_ENV==='production'){
      redisClient.get(app.sessionStore.prefix+sessionID, function(err, content){
        var session = JSON.parse(content);
        if(session.authenticated){
          handshake.authenticated = session.authenticated;
          callback(null, true);
        }
        else{
          callback(null, false);
        }
      });
    }
    else{
      if(app.sessionStore.sessions[sessionID]){
        var session = JSON.parse(app.sessionStore.sessions[sessionID]);
        if(session.authenticated){
          handshake.authenticated = session.authenticated;
          callback(null, true);
        }
        else{
          callback(null, false);
        }
      }
    }
  }
  else{
    callback(null, false);
  }
});

function getScoreInfos(tasks, team){
  var score = 0;
  var bt = 0;
  var last = 0;
  var lastTask = '';
  tasks.forEach(function(task){
    var solved = taskDB.teamSolved(task, team);
    if(solved.ok){
      if(taskDB.teamSolvedFirst(task, team).ok){
        bt+=1;
      }
      score += task.score;
      if(last < solved.time){
        last = solved.time;
        lastTask = task.title;
      }
    }
  });

  return {value: score, breakthrough: bt, lastTask: lastTask, last:last};
}

socketIO.on('connection', function (socket) {

  socket.on('getTasks', function(){
    teamDB.list().then(function(teams){
      taskDB.getTasks(socket.handshake.authenticated, teams.length).then(function(tasks){
        socket.emit('giveTasks', tasks.infos);
        var score = getScoreInfos(tasks.raw, socket.handshake.authenticated);
        socket.emit('giveScore', {name: socket.handshake.authenticated, score: score.value, breakthrough: score.breakthrough});
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('updateTaskScores', function(){
    teamDB.list().then(function(teams){
      taskDB.getTasks(socket.handshake.authenticated, teams.length).then(function(tasks){
        socket.emit('updateTaskScores', tasks.infos);
        var score = getScoreInfos(tasks.raw, socket.handshake.authenticated);
        socket.emit('giveScore', {name: socket.handshake.authenticated, score: score.value, breakthrough: score.breakthrough});
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getTask', function(title){
    var d = new Date().toISOString();
    console.log('"'+d+'" "'+socket.handshake.address.address+'" "'+socket.handshake.authenticated.replace(/"/g,'\\"')+'" "getTask" "'+title+'" "-"' );
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
        console.log(task);
        socket.emit('updateTask', task);
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getScoreboard', function(){
    teamDB.list().then(function(teams){
      taskDB.getTasks(socket.handshake.authenticated, teams.length).then(function(tasks){
        var scoreboard = [];
        teams.forEach(function(team){
          var score = getScoreInfos(tasks.raw, team.name);
          scoreboard.push({team: team.name, score: score.value, lastTask: score.lastTask, time: -score.last, breakthrough: score.breakthrough});
        });
        var orderedScoreboard = _.sortBy(scoreboard, ['score', 'time']).reverse();
        socket.emit('giveScoreboard', orderedScoreboard);
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
        var score = getScoreInfos(tasks.raw, socket.handshake.authenticated);
        socket.emit('giveScore', {name: socket.handshake.authenticated, score: score.value, breakthrough: score.breakthrough});
      }, function(error){
        socket.emit('error', error);
      });
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('submitFlag', function(datas){
    var d = new Date().toISOString();
    if(ctfOpen){
      taskDB.solveTask(datas.title, datas.flag, socket.handshake.authenticated).then(function(result){
        console.log('"'+d+'" "'+socket.handshake.address.address+'" "'+socket.handshake.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "ok"' );
        socketIO.sockets.emit('validation', {title: datas.title, team: socket.handshake.authenticated});
        var message = socket.handshake.authenticated+' solved '+datas.title;
        socketIO.sockets.emit('message', {submit: 2, message: message});
        messageDB.addMessage(message);
        if(closedTaskDelay > 0){
          setTimeout(function(){
            socketIO.sockets.emit('reopenTask', datas.title);
          }, closedTaskDelay);
        }
      }, function(error){
        console.log('"'+d+'" "'+socket.handshake.address.address+'" "'+socket.handshake.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "ko"' );
        socket.emit('nope', error);
      });
    }
    else{
      console.log('"'+d+'" "'+socket.handshake.address.address+'" "'+socket.handshake.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "closed"' );
      socket.emit('nope', 'Ctf closed');
    }
  });

  socket.on('getMessages', function(){
    messageDB.getMessages().then(function(messages){
      socket.emit('giveMessages', messages);
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('adminCloseRegistration', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'closeRegistration');
    }
    registrationOpen = false;
    socket.emit('adminInfo', registrationOpen);
  });

  socket.on('adminOpenRegistration', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'openRegistration');
    }
    registrationOpen = true;
    socket.emit('adminInfo', registrationOpen);
  });

  socket.on('adminCloseCTF', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'closeCTF');
    }
    ctfOpen = false;
    socket.emit('adminInfo', ctfOpen);
  });

  socket.on('adminOpenCTF', function(data){
    if(process.env.NODE_ENV==='production'){
      redisPub.publish('adminAction', 'openCTF');
    }
    ctfOpen = true;
    socket.emit('adminInfo', ctfOpen);
  });

  socket.on('adminRefresh', function(data){
    socketIO.sockets.emit('refresh');
  });

  socket.on('adminAddTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.addTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author).then(function(){
        list(taskDB, function(tasks){
          //socketIO.sockets.emit('refresh');
          socket.emit('updateTasks', tasks);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminEditTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.editTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author).then(function(){
        list(taskDB, function(tasks){
          //socketIO.sockets.emit('refresh');
          socket.emit('updateTasks', tasks);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminDeleteTask', function(data){
    if(socket.handshake.authenticated === adminName) {
      taskDB.deleteTask(data.title).then(function(){
        list(taskDB, function(tasks){
          //socketIO.sockets.emit('refresh');
          socket.emit('updateTasks', tasks);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminAddTeam', function(data){
    if(socket.handshake.authenticated === adminName) {
      teamDB.addTeam(data.name, data.password).then(function(){
        list(teamDB, function(teams){
          socketIO.sockets.emit('newTeam');
          socket.emit('updateTeams', teams);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminEditTeam', function(data){
    if(socket.handshake.authenticated === adminName) {
      teamDB.editTeam(data.name, data.password).then(function(){
        list(teamDB, function(teams){
          socket.emit('updateTeams', teams);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminDeleteTeam', function(data){
    if(socket.handshake.authenticated === adminName && data.name !== adminName) {
      teamDB.deleteTeam(data.name).then(function(){
        list(teamDB, function(teams){
          taskDB.cleanSolved(data.name, teams.length);
          var handshakes = socketIO.sockets.manager.handshaken;
          for(var key in handshakes){
            if(handshakes[key].authenticated === data.name){
              socketIO.sockets.sockets[key].disconnect();
            }
          }

          if(process.env.NODE_ENV === 'production'){
            redisClient.keys(app.sessionStore.prefix+'*', function(err, sessions){
              sessions.forEach(function(session){
                redisClient.get(session, function(err, content){
                  var sessionContent = JSON.parse(content);
                  if(sessionContent.authenticated === data.name){
                    redisClient.del(session);
                  }
                });
              });
            });
          }
          else{
            var sessions = app.sessionStore.sessions;
            for(key in sessions){
              var session = JSON.parse(sessions[key]);
              if(session.authenticated === data.name){
                delete app.sessionStore.sessions[key];
              }
            }
          }
          socketIO.sockets.emit('newTeam');
          socket.emit('updateTeams', teams);
        }, function(error){
          socket.emit('adminInfo', error);
        });
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminListTasks', function(){
    if(socket.handshake.authenticated === adminName) {
      list(taskDB, function(tasks){
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminListTeams', function(){
    if(socket.handshake.authenticated === adminName) {
      list(teamDB, function(teams){
        socket.emit('updateTeams', teams);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminMessage', function(data){
    if(socket.handshake.authenticated === adminName) {
      if(data.submit === 1){
        messageDB.addMessage(data.message).then(function(){
          socket.emit('adminInfo', 'Message added');
        }, function(error){
          socket.emit('adminInfo', error);
        });
      }
      socketIO.sockets.emit('message', data);
    }
  });

});

}