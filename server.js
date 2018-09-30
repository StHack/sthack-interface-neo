/*************************************
//
// sthack-interface-neo app
//
**************************************/

var express           = require('express');
var session           = require('express-session');
var http             = require('http');
var net               = require('net');
var io                = require('socket.io');
var device            = require('express-device');
var fs                = require('fs');
var cookieParse       = require('cookie');
var cookieParser      = require('cookie-parser');
var bodyParser        = require('body-parser');
var _                 = require('lodash');
if(process.env.NODE_ENV==='production'){
  var cluster           = require('cluster');
  var numCPUs           = require('os').cpus().length;
  var redis             = require('redis');
  var RedisStore        = require('connect-redis')(session);
  var IoRedisStore      = require('socket.io-redis')

  var redisHost          = process.env.REDIS_HOST||'127.0.0.1';
  var redisPort          = process.env.REDIS_PORT||6379;
  var redisAuth          = process.env.REDIS_AUTH||null;
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


function list(object){
  return object.list().then(function(objects){
    return objects;
  }, function(error){
    throw error;
  });
}


if(typeof cluster === 'undefined' || cluster.isWorker){
  if(process.env.NODE_ENV==='production'){
    var runningPortNumber = 0;
  }
  else{
    var runningPortNumber = process.env.PORT;
  }
var DBConnectionString = process.env.DB_CONNECTION_STRING;
var adminName          = process.env.ADMIN_NAME;
var closedTaskDelay    = process.env.CLOSED_TASK_DELAY;
var sessionSecret      = process.env.SESSION_SECRET;
var sessionKey         = process.env.SESSION_KEY;
var adminPath          = process.env.ADMIN_PATH;
var siteTitle          = process.env.TITLE;
var baseScore          = process.env.BASE_SCORE;

// Sthack prototypes
var Team    = require('./src/Team').Team;
var Task    = require('./src/Task').Task;
var Message = require('./src/Message').Message;
var DB      = require('./src/DB').DB;

if(process.env.NODE_ENV === 'production'){
  var redisClient       = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth, detect_buffers: true, return_buffers: false});
  var redisPub          = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth, detect_buffers: true, return_buffers: false});
  var redisSub          = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth, return_buffers: true});
  var redisAdminPub     = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth, detect_buffers: true, return_buffers: false});
  var redisAdminSub     = redis.createClient(redisPort, redisHost, {auth_pass: redisAuth, detect_buffers: true, return_buffers: false});

  var ctfOpen = true;
  var registrationOpen = true;
}
else{
  var ctfOpen = true;
  var registrationOpen = true;
}

var app = express();

if(app.get('env') === 'production'){
  app.sessionStore = new RedisStore({
    client: redisClient
  });
}

if(app.get('env') === 'development'){
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

var db        = new DB(DBConnectionString);
var teamDB    = new Team(db);
var taskDB    = new Task(db, {delay: closedTaskDelay, baseScore: baseScore});
var messageDB = new Message(db);

var unAuthRoute = ['/register', '/', '', '/rules'];
var authRoute = ['/scoreboard', '/', '', '/rules', adminPath, '/simple', '/submitFlag'];

/* à revoir en mode authentificationMiddleware */
app.use(function(req, res, next){
  if((typeof req.session.authenticated !== 'undefined' && authRoute.indexOf(req.url)!==-1) || (typeof req.session.authenticated === 'undefined' && unAuthRoute.indexOf(req.url)!==-1 ) ){
    next();
  }
  else{
    res.redirect(302, '/');
  }
});
/* -------- */

var appSSL = http.createServer({}, app).listen(runningPortNumber);
var socketIO;

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
  socketIO = io.listen(appSSL, { log: true });
  socketIO.adapter(IoRedisStore({
      host: redisHost,
      port: redisPort,
      pubClient: redisPub,
      subClient: redisSub
    })
  );
  redisAdminSub.subscribe('adminAction');
  redisAdminSub.on('message', function(channel, message){
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

function getImgs(tasks){
  var retSources = {
    backdoor: 'backdoor.png',
    crypto: 'crypto.png',
    forensic: 'forensics.png',
    hardware: 'hardware.png',
    network: 'network.png',
    pwn: 'pwn.png',
    reverse: 'reverse.png',
    shellcode: 'shellcode.png',
    web: 'web.png',
    misc: 'misc.png',
    recon: 'recon.png',
    game: 'game.png',
  };

  return taskDB.getTasks(adminName, 1).then(function(tasks) {
    tasks.raw.forEach(function(task) {
      retSources[task.img] = 'tasks/'+task.img+'.png';
    });
    return retSources;
  });
}

var sources;

getImgs().then(function(retSources) {
  sources = retSources;
});

app.get("/", function(req, res){
  if(req.session.authenticated){
    res.render('index', {
      title: siteTitle,
      current: 'index',
      auth: 1,
      socketIOUrl: 'https://'+req.headers.host,
      Images: JSON.stringify(sources)
    });
  }
  else{
    list(teamDB).then(function(teams){
      res.render('login', {
        title: siteTitle,
        current: 'index',
        teams_list: teams,
        registrationOpen: registrationOpen,
        Images: JSON.stringify(sources)
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
        return list(teamDB);
      }).then(function(teams){
        socketIO.sockets.emit('newTeam');
        res.redirect(302, '/');
      }, function(error){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "-" "register" "'+req.body.name.replace(/"/g,'\\"')+'" "ko"' );
        res.render('register', {
          current: 'register',
          title: siteTitle,
          error: error,
          registrationOpen: registrationOpen,
          Images: JSON.stringify(sources)
        });
      });
    }
    else{
      res.render('register',{
        current: 'register',
        title: siteTitle,
        error: '',
        registrationOpen: registrationOpen,
        Images: JSON.stringify(sources)
      });
    }
  }
  else{
    res.redirect(302, '/');
  }
});

app.get('/rules', function(req, res){
  if(req.session.authenticated){
    var auth = 1;
  }
  res.render('rules',{
    current: 'rules',
    baseScore: baseScore,
    title: siteTitle,
    auth: auth,
    registrationOpen: registrationOpen,
    socketIOUrl: 'https://'+req.headers.host,
    Images: JSON.stringify(sources)
  });
});

app.get('/scoreboard', function(req, res){
  res.render('scoreboard',{
    current: 'scoreboard',
    title: siteTitle,
    auth: 1,
    registrationOpen: registrationOpen,
    socketIOUrl: 'https://'+req.headers.host,
    Images: JSON.stringify(sources)
  });
});

app.get('/simple', function(req, res){
  teamDB.list().then(function(teams){
    return taskDB.getTasks(req.session.authenticated, teams.length);
  }).then(function(tasks){
    var score = 0;
    tasks.raw.forEach(function(task){
      var solved = taskDB.teamSolved(task, req.session.authenticated);
      if(solved.ok){
        score += task.score;
      }
    });
    res.render('simple',{tasks: tasks.raw, title: siteTitle, score: score});
  }, function(error){
    res.render('simple',{tasks: [], title: siteTitle, score: 0});
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
        //socketIO.sockets.emit('message', {submit: 2, message: message});
        //messageDB.addMessage(message);
        if(closedTaskDelay > 0){
          setTimeout(function(){
            socketIO.sockets.emit('reopenTask', req.body.title);
          }, closedTaskDelay);
        }
        res.redirect(302, '/simple');
      }, function(error){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "'+req.session.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+req.body.title.replace(/"/g,'\\"')+'" "ko"' );
        res.redirect(302, '/simple');
      });
    }
    else{
      console.log('"'+d+'" "'+req.connection.remoteAddress+'" "'+req.session.authenticated.replace(/"/g,'\\"')+'" "submitFlag" "'+req.body.title.replace(/"/g,'\\"')+'" "closed"' );
      res.redirect(302, '/simple');
    }
  }
  else{
    res.redirect(302, '/simple');
  }
});

app.get(adminPath, function(req, res){
  if(req.session.authenticated && req.session.authenticated === adminName){
    res.render('admin', {
      title: siteTitle,
      current: 'index',
      admin: 1,
      auth: 1,
      socketIOUrl: 'https://'+req.headers.host,
      Images: JSON.stringify(sources)
    });
  }
  else{
    res.redirect(302, '/');
  }
});

app.post("/", function(req, res){
  var d = new Date().toISOString();
  if(typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined'){
    teamDB.areLoginsValid(req.body.name, req.body.password).then(function(result){
      if(result){
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "-" "login" "'+req.body.name+'" "ok"' );
        req.session.authenticated = req.body.name;
      }
      else{
        console.log('"'+d+'" "'+req.connection.remoteAddress+'" "-" "login" "'+req.body.name+'" "ko"' );
      }
      res.redirect(302, '/');
    }, function(error){
      console.log(error);
    });
  }
  else{
    res.redirect(302, '/');
  }
});

if(app.get('env') === 'production'){
  app.use(function(err, req, res, next){
    res.status(500);
    res.render('error', {current: 'error', title: siteTitle, registrationOpen: registrationOpen});
  });
}

// if(app.get('env') === 'development'){
//   app.use(express.errorHandler());
// }

socketIO.use(function(socket, next) {
  var handshake = socket.request;
  if(handshake.headers.cookie){
    var cookie = cookieParse.parse(handshake.headers.cookie);
    var sessionID = cookieParser.signedCookie(cookie[sessionKey], sessionSecret);
    if(process.env.NODE_ENV==='production'){
      redisClient.get(app.sessionStore.prefix+sessionID, function(err, content){
        var session = JSON.parse(content);
        if(session.authenticated){
          handshake.authenticated = session.authenticated;
          next();
        }
        else{
          next(new Error('not authorized'));
        }
      });
    }
    else{
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
  }
  else{
    next(new Error('not authorized'));
  }
});

function getScoreInfos(tasks, team){
  var score = 0;
  var bt = [];
  var last = 0;
  var lastTask = '';
  var taskSolved = {};
  tasks.forEach(function(task){
    var solved = taskDB.teamSolved(task, team);
    if(solved.ok){
      if(taskDB.teamSolvedFirst(task, team).ok){
        bt.push(task.title);
      }
      score += task.score;
      if(last < solved.time){
        last = solved.time;
        lastTask = task.title;
      }
      taskSolved[task.title] = solved.time;
    }
  });

  return {value: score, breakthrough: bt, lastTask: lastTask, last:last, solved: taskSolved};
}

socketIO.on('connection', function (socket) {
  socket.on('getTasks', function(){
    var auth = socket.client.request.authenticated;
    teamDB.list().then(function(teams){
      return taskDB.getTasks(auth, teams.length);
    }).then(function(tasks){
      socket.emit('giveTasks', tasks.infos);
      var score = getScoreInfos(tasks.raw, auth);
      socket.emit('giveScore', {name: auth, score: score.value, breakthrough: score.breakthrough});
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('updateTaskScores', function(){
    var auth = socket.client.request.authenticated;
    teamDB.list().then(function(teams){
      return taskDB.getTasks(auth, teams.length);
    }).then(function(tasks){
      socket.emit('updateTaskScores', tasks.infos);
      var score = getScoreInfos(tasks.raw, auth);
      socket.emit('giveScore', {name: auth, score: score.value, breakthrough: score.breakthrough});
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getTask', function(title){
    var d = new Date().toISOString();
    var auth = socket.client.request.authenticated
    console.log('"'+d+'" "'+socket.handshake.address+'" "'+auth.replace(/"/g,'\\"')+'" "getTask" "'+title+'" "-"' );
    teamDB.list().then(function(teams){
      return taskDB.getTaskInfos(title, auth, teams.length, true);
    }).then(function(task){
      socket.emit('giveTask', task);
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('updateTask', function(title){
    teamDB.list().then(function(teams){
      var auth = socket.client.request.authenticated
      return taskDB.getTaskInfos(title, auth, teams.length, false);
    }).then(function(task){
      socket.emit('updateTask', task);
    }, function(error){
        socket.emit('error', error);
    });
  });

  socket.on('getScoreboard', function(){
    var teams;
    var auth = socket.client.request.authenticated;
    teamDB.list().then(function(retTeams){
      teams = retTeams;
      return taskDB.getTasks(auth, teams.length);
    }).then(function(tasks){
      var scoreboard = [];
      teams.forEach(function(team){
        var score = getScoreInfos(tasks.raw, team.name);
        scoreboard.push({team: team.name, score: score.value, lastTask: score.lastTask, time: -score.last, breakthrough: score.breakthrough, solved: score.solved});
      });
      var orderedScoreboard = _.sortBy(scoreboard, ['score', 'time']).reverse();
      socket.emit('giveScoreboard', orderedScoreboard);
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('getScore', function(){
    var auth = socket.client.request.authenticated;
    teamDB.list().then(function(teams){
      return taskDB.getTasks(auth, teams.length);
    }).then(function(tasks){
      var score = getScoreInfos(tasks.raw, auth);
      socket.emit('giveScore', {name: auth, score: score.value, breakthrough: score.breakthrough});
    }, function(error){
      socket.emit('error', error);
    });
  });

  socket.on('submitFlag', function(datas){
    var d = new Date().toISOString();
    var auth = socket.client.request.authenticated;
    if(ctfOpen){
      taskDB.solveTask(datas.title, datas.flag, auth).then(function(result){
        console.log('"'+d+'" "'+socket.handshake.address+'" "'+auth.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "ok"' );
        socketIO.sockets.emit('validation', {title: datas.title, team: auth});
        var message = auth+' solved '+datas.title;
        //socketIO.sockets.emit('message', {submit: 2, message: message});
        //messageDB.addMessage(message);
        if(closedTaskDelay > 0){
          setTimeout(function(){
            socketIO.sockets.emit('reopenTask', datas.title);
          }, closedTaskDelay);
        }
      }, function(error){
        console.log('"'+d+'" "'+socket.handshake.address+'" "'+auth.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "ko"' );
        socket.emit('nope', error.toString());
      });
    }
    else{
      console.log('"'+d+'" "'+socket.handshake.address+'" "'+auth.replace(/"/g,'\\"')+'" "submitFlag" "'+datas.title+'" "closed"' );
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

  socket.on('adminBreak', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      taskDB.breakTask(data.title, data.broken);
      socketIO.sockets.emit('breakTask', data);
    }
  });

  socket.on('adminCloseRegistration', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      if(process.env.NODE_ENV==='production'){
        redisAdminPub.publish('adminAction', 'closeRegistration');
      }
      registrationOpen = false;
      socket.emit('adminInfo', registrationOpen);
    }
  });

  socket.on('adminOpenRegistration', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      if(process.env.NODE_ENV==='production'){
        redisAdminPub.publish('adminAction', 'openRegistration');
      }
      registrationOpen = true;
      socket.emit('adminInfo', registrationOpen);
    }
  });

  socket.on('adminCloseCTF', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      if(process.env.NODE_ENV==='production'){
        redisAdminPub.publish('adminAction', 'closeCTF');
      }
      ctfOpen = false;
      socket.emit('adminInfo', ctfOpen);
    }
  });

  socket.on('adminOpenCTF', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      if(process.env.NODE_ENV==='production'){
        redisAdminPub.publish('adminAction', 'openCTF');
      }
      ctfOpen = true;
      socket.emit('adminInfo', ctfOpen);
    }
  });

  socket.on('adminRefresh', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      socketIO.sockets.emit('refresh');
    }
  });

  socket.on('adminAddTask', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      taskDB.addTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author, data.img, data.tags).then(function(){
        return list(taskDB);
      }).then(function(tasks){
        getImgs().then(function(retSources) {
          sources = retSources;
        });
        //socketIO.sockets.emit('refresh');
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminEditTask', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      taskDB.editTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author, data.img, data.tags).then(function(){
        return list(taskDB);
      }).then(function(tasks){
        getImgs().then(function(retSources) {
          sources = retSources;
        });
        //socketIO.sockets.emit('refresh');
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminDeleteTask', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      taskDB.deleteTask(data.title).then(function(){
        return list(taskDB);
      }).then(function(tasks){
        //socketIO.sockets.emit('refresh');
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminAddTeam', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      teamDB.addTeam(data.name, data.password).then(function(){
        return list(teamDB);
      }).then(function(teams){
        socketIO.sockets.emit('newTeam');
        socket.emit('updateTeams', teams);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminEditTeam', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      teamDB.editTeam(data.name, data.password).then(function(){
        return list(teamDB);
      }).then(function(teams){
          socket.emit('updateTeams', teams);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminDeleteTeam', function(data){
    var auth = socket.client.request.authenticated;
    var teams = [];
    if(auth === adminName && data.name !== adminName) {
      teamDB.deleteTeam(data.name).then(function(result){
        return list(teamDB);
      }).then(function(retTeams){
        teams = retTeams;
        return taskDB.cleanSolved(data.name, teams.length);
      }, function(error){
        socket.emit('adminInfo', error);
      });

      var handshakes = socketIO.sockets.connected;
      for(var key in handshakes){
        if(handshakes[key].conn.request.authenticated === data.name){
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
    }
  });

  socket.on('adminListTasks', function(){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      list(taskDB).then(function(tasks){
        socket.emit('updateTasks', tasks);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminListTeams', function(){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
      list(teamDB).then(function(teams){
        socket.emit('updateTeams', teams);
      }, function(error){
        socket.emit('adminInfo', error);
      });
    }
  });

  socket.on('adminMessage', function(data){
    var auth = socket.client.request.authenticated;
    if(auth === adminName) {
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
