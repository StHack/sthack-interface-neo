var Promise = require('bluebird');
var DB = require('./DB').DB;
var crypto = require('crypto');
var _ = require('lodash');
var fs = require('fs');

String.prototype.checksum = function() {
    var hash = 0, i, chr, len;
    if (this.length === 0){
        return hash;
    }
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash.toString();
};


var Task = function(db, config) {
  this.config = config;
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Task.prototype.list = function(){
  var db = this.db;
  return db.find('tasks', {}, {'title': 1, '_id': 0}).then(function(result){
    return _.sortBy(result, ['title']);
  });
};

Task.prototype.getTasks = function(teamName, countTeam){
  var db = this.db;
  var self = this;
  var infosTasks = [];

  return db.find('tasks', {}, {'_id': 0}).then(function(result){
    result.forEach(function(task){
      var infos = self.getInfos(task, teamName, countTeam);
      task.score = infos.score;
      task.state = infos.state;
      task.open  = infos.open;
      task.broken = infos.broken;
      infosTasks.push(infos);
    });
    return {infos: _.sortBy(infosTasks, ['title']), raw: _.sortBy(result, ['title'])};
  });
};

Task.prototype.getInfos = function(task, teamName, countTeam, description){
  var self = this;
  var infos = {};
  infos.title = task.title;
  infos.type = task.type;
  infos.difficulty = task.difficulty;
  infos.score = self.getScore(task, countTeam);
  infos.solved = self.getSolved(task);
  infos.state = self.getSolvedState(task, teamName).state;
  infos.open =  self.isOpen(task);
  infos.author = task.author;
  infos.broken = task.broken;
  infos.img = task.img;
  if(description){
    infos.description = task.description;
    infos.tags = task.tags;
  }
  return infos;
};

Task.prototype.getTaskInfos = function(title, teamName, countTeam, description){
  var db = this.db;
  var self = this;
  return db.find('tasks', {'title' : title}, {'_id': 0}).then(function(result){
    if(result.length !== 0){
      return self.getInfos(result[0], teamName, countTeam, description);
    }
    else{
      throw new Error('Task doesn\'t exsit');
    }
  });
};

Task.prototype.exists = function(title){
  var db = this.db
  return db.find('tasks', {'title' : title}, {'title': 1, '_id': 0}).then(function(result){
    return result.length !== 0;
  });
};

Task.prototype.getScore = function(task, countTeam){
  var self = this;
  var solved = self.getSolved(task);
  if(task.difficulty === 'easy'){
    return self.config.baseScore*(countTeam-solved.length);
  }
  else if(task.difficulty === 'medium'){
    return self.config.baseScore*2*(countTeam-solved.length);
  }
  else{
    return self.config.baseScore*3*(countTeam-solved.length);
  }
};

Task.prototype.getSolvedState = function(task, teamName){
  var self = this;
  var solved = self.getSolved(task);
  //nobody solved
  var solvedState = 0;
  var solvedTime = 0;
  if(solved.length > 0){
    //someone solved
    solvedState++;
    solvedTime = _.result(_.find(solved, {'teamName': teamName}), 'timestamp');
    if(typeof solvedTime !== 'undefined'){
      //your team solved
      solvedState++;
      if(solved[0].teamName === teamName){
        //your team solved first
        solvedState++;
      }
    }
  }
  return {state: solvedState, time: solvedTime};
};

Task.prototype.expectedState = function(task, teamName, state){
  var self = this;
  var solved = self.getSolvedState(task, teamName);
  if(state === 0){
    return (solved.state === state);
  }
  else{
    return {ok: (solved.state >=  state), time: solved.time};
  }
};

Task.prototype.nobodySolved = function(task){
  return this.expectedState(task, '', 0);
};

Task.prototype.someoneSolved = function(task){
  return this.expectedState(task, '', 1).ok;
};

Task.prototype.teamSolved = function(task, teamName){
  return this.expectedState(task, teamName, 2);
};

Task.prototype.teamSolvedFirst = function(task, teamName){
  return this.expectedState(task, teamName, 3);
};

Task.prototype.isSolvableByTeam = function(task, teamName){
  var self = this;
  if(self.teamSolved(task, teamName).ok){
    return false;
  }
  else{
    if(self.isOpen(task)){
      return true;
    }
    else{
      return false;
    }
  }
};

Task.prototype.isOpen = function(task){
  var self = this;
  var solved = self.getSolved(task);
  if(solved.length > 0 && parseInt(solved[solved.length-1].timestamp) + parseInt(self.config.delay) > (new Date()).getTime()){
    return false;
  }
  else{
    return  true;
  }
};

Task.prototype.getSolved = function(task){
  return _.sortBy(task.solved,['timestamp']);
};

Task.prototype.isFlag = function(task, flag){
  var self = this;
  var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
  return (task.flags.indexOf(hashedFlag) > -1);
};

Task.prototype.solveTask = function(title, flag, teamName){
  var db = this.db;
  var self = this;
  return self.getTask(title).then(function(task){
    if(self.isSolvableByTeam(task, teamName)){
      if(self.isFlag(task, flag)){
        var solved = self.getSolved(task);
        solved.push({"teamName": teamName, "timestamp": new Date().getTime()});
        return db.update('tasks', {'title': title}, {'solved': solved});
      }
      else{
        throw new Error('Bad flag');
      }
    }
    else{
      throw new Error("You can't solve this task");
    }
  }).then(function(result){
    return true;
  });
};

Task.prototype.getTask = function(title){
  var db = this.db;
  var self = this;
  return db.find('tasks', {'title' : title}, {'_id': 0}).then(function(result){
    if(result.length !== 0){
      return result[0];
    }
    else{
      throw new Error('Task doesn\'t exsit');
    }
  });
};

Task.prototype.addTask = function(title, description, flag, type, difficulty, author, img, tags){
  var db = this.db;
  var self = this;
  return self.exists(title).then(function(result){
      if(result){
        throw new Error('Task already exists');
      }
      else{
        var path = 'default';
        if (img !== '') {
          var buf = Buffer.from(img.split(',')[1], 'base64');
          if(buf.readUInt32BE(0) !== 2303741511){
            throw 'Suce toi !';
          }
          path = title.checksum();
          fs.writeFileSync(__dirname+'/../public/img/tasks/'+path+'.png', buf);
        }
        var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
        var task = {
          'title': title,
          'img': path,
          'description': description,
          'flags': [hashedFlag],
          'type': type.toLowerCase(),
          'tags': tags,
          'difficulty': difficulty,
          'author': author
        };
        return db.insert('tasks', task);
      }
  }).then(function(result){
    return true;
  });
};

Task.prototype.editTask = function(title, description, flag, type, difficulty, author, img, tags){
  var db = this.db;
  var self = this;
  var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
  var path = 'default';
  if (img !== '') {
    var buf = Buffer.from(img.split(',')[1], 'base64');
    if(buf.readUInt32BE(0) !== 2303741511){
      return Promise.reject('Suce toi !');
    }
    path = title.checksum();
    fs.writeFileSync(__dirname+'/../public/img/tasks/'+path+'.png', buf);
  }
  var task = {
    'description': description,
    'flags': [hashedFlag],
    'img': path,
    'type': type.toLowerCase(),
    'tags': tags,
    'difficulty': difficulty,
    'author': author
  };
  if(flag===''){
    delete task.flags;
  }
  if(img===''){
    delete task.img;
  }
  return db.update('tasks', {'title': title}, task).then(function(result){
    return true;
  });
};

Task.prototype.breakTask = function(title, broken){
  var db = this.db;
  var self = this;
  db.update('tasks', {'title': title}, {'broken': broken});
};

Task.prototype.deleteTask = function(title){
  var db = this.db;
  var self = this;
  return db.remove('tasks', {'title' : title}).then(function(result){
    if(result === 1){
      return true;
    }
    else{
      return new Error('No team removed');
    }
  });
};

Task.prototype.cleanSolved = function(teamName, countTeam){
  var db = this.db;
  var self = this;
  return self.getTasks(teamName, countTeam).then(function(tasks){
    tasks.raw.forEach(function(task){
      if(typeof task.solved !== 'undefined'){
        var countSolved = task.solved.length;
        var newSolved = _.filter(task.solved, function(elem){
          return teamName !== elem.teamName;
        });
        if(newSolved.length !== countSolved){
          db.update('tasks', {'title': task.title}, {'solved': newSolved});
        }
      }
    });
    return null;
  });
};

exports.Task = Task;
