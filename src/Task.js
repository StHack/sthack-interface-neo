var Promise = require('bluebird');
var DB = require('./DB').DB;
var crypto = require('crypto');
var _ = require('lodash');

var Task = function(db, config) {
  this.config = config;
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Task.prototype.list = function(){
  var db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {}, {'title': 1, '_id': 0}).then(function(result){
      fulfill(result);
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.getTasks = function(teamName, countTeam){
  var db = this.db;
  var self = this;
  var infosTasks = [];

  return new Promise(function(fulfill, reject){
    db.find('tasks', {}, {'_id': 0}).then(function(result){
      result.forEach(function(task){
        var infos = self.getInfos(task, teamName, countTeam);
        task.score = infos.score;
        task.state = infos.state;
        task.open  = infos.open;
        infosTasks.push(infos);
      });
      fulfill({infos: _.sortBy(infosTasks, ['title']), raw: _.sortBy(result, ['title'])});
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.getInfos = function(task, teamName, countTeam, description){
  var self = this;
  var infos = {};
  infos.title = task.title;
  infos.type = task.type;
  infos.difficulty = task.difficulty;
  infos.score = self.getScore(task, countTeam);
  infos.state = self.getSolvedState(task, teamName).state;
  infos.open =  self.isOpen(task);
  infos.author = task.author;
  if(description){
    infos.description = task.description;
  }
  return infos;
};

Task.prototype.getTaskInfos = function(title, teamName, countTeam, description){
  var db = this.db;
  var self = this;

  return new Promise(function(fulfill, reject){
    db.find('tasks', {'title' : title}, {'_id': 0}).then(function(result){
      if(result.length !== 0){
        fulfill(self.getInfos(result[0], teamName, countTeam, description));
      }
      else{
        reject("Task doesn't exsit");
      }
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.exists = function(title){
  var db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {'title' : title}, {'title': 1, '_id': 0}).then(function(result){
      fulfill(result.length !== 0);
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.getScore = function(task, countTeam){
  var self = this;
  var solved = self.getSolved(task);
  var base = 50;
  if(task.difficulty === 'easy'){
    return base*(countTeam-solved.length);
  }
  else if(task.difficulty === 'medium'){
    return base*2*(countTeam-solved.length);
  }
  else{
    return base*3*(countTeam-solved.length);
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
  return (task.flag === hashedFlag);
};

Task.prototype.solveTask = function(title, flag, teamName){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.getTask(title).then(function(task){
      if(self.isSolvableByTeam(task, teamName)){
        if(self.isFlag(task, flag)){
          var solved = self.getSolved(task);
          solved.push({"teamName": teamName, "timestamp": new Date().getTime()});
          db.update('tasks', {'title': title}, {'solved': solved}).then(function(result){
            fulfill(true);
          }, function(error){
            reject(error);
          });
        }
        else{
          reject("Bad flag");
        }
      }
      else{
        reject("You can't solve this task");
      }
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.getTask = function(title){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {'title' : title}, {'_id': 0}).then(function(result){
      if(result.length !== 0){
        fulfill(result[0]);
      }
      else{
        reject("Task doesn't exsit");
      }
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.addTask = function(title, description, flag, type, difficulty, author){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.exists(title).then(function(result){
      if(result){
        reject("Task already exists");
      }
      else{
        hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
        var task = {
          'title': title,
          'description': description,
          'flag': hashedFlag,
          'type': type,
          'difficulty': difficulty,
          'author': author
        };
        db.insert('tasks', task).then(function(result){
          fulfill(true);
        }, function(error){
          reject(error);
        });
      }
    });
  });
};

Task.prototype.editTask = function(title, description, flag, type, difficulty, author){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
    var task = {
      'description': description,
      'flag': hashedFlag,
      'type': type,
      'difficulty': difficulty,
      'author': author
    };
    if(flag===''){
      delete task.flag;
    }
    db.update('tasks', {'title': title}, task).then(function(result){
      if(result === 1){
        fulfill(true);
      }
      else{
        reject("No task updated");
      }
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.deleteTask = function(title){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.remove('tasks', {'title' : title}).then(function(result){
      if(result === 1){
        fulfill(true);
      }
      else{
        reject("No team removed");
      }
    }, function(error){
      reject(error);
    });
  });
};

Task.prototype.cleanSolved = function(teamName, countTeam){
  var db = this.db;
  var self = this;
  self.getTasks(teamName, countTeam).then(function(tasks){
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
  });
};

exports.Task = Task;
