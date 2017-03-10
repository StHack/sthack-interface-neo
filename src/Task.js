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
  return db.find('tasks', {}, {'title': 1, '_id': 0}).then(function(result){
    return result;
  });
};

Task.prototype.getTasks = function(team, countTeam){
  var db = this.db;
  var self = this;
  var infosTasks = [];

  return db.find('tasks', {}, {'_id': 0}).then(function(result){
    result.forEach(function(task){
      var infos = self.getInfos(task, team, countTeam);
      task.score = infos.score;
      task.state = infos.state;
      task.open  = infos.open;
      task.broken = infos.broken;
      infosTasks.push(infos);
    });
    return {infos: _.sortBy(infosTasks, ['title']), raw: _.sortBy(result, ['title'])};
  });
};

Task.prototype.getInfos = function(task, team, countTeam, description){
  var self = this;
  var infos = {};
  infos.title = task.title;
  infos.type = task.type;
  infos.difficulty = task.difficulty;
  infos.score = self.getScore(task, countTeam, team.solo);
  infos.state = self.getSolvedState(task, team).state;
  infos.open =  self.isOpen(task, team.solo);
  infos.author = task.author;
  infos.broken = task.broken;
  if(description){
    infos.description = task.description;
  }
  return infos;
};

Task.prototype.getTaskInfos = function(title, team, countTeam, description){
  var db = this.db;
  var self = this;
  return db.find('tasks', {'title' : title}, {'_id': 0}).then(function(result){
    if(result.length !== 0){
      return self.getInfos(result[0], team, countTeam, description);
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

Task.prototype.getScore = function(task, countTeam, solo){
  var self = this;
  var solved = self.getSolved(task, solo);
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

Task.prototype.getSolvedState = function(task, team){
  var self = this;
  var solved = self.getSolved(task, team.solo);
  //nobody solved
  var solvedState = 0;
  var solvedTime = 0;
  if(solved.length > 0){
    //someone solved
    solvedState++;
    solvedTime = _.result(_.find(solved, {'teamName': team.name}), 'timestamp');
    if(typeof solvedTime !== 'undefined'){
      //your team solved
      solvedState++;
      if(solved[0].teamName === team.name){
        //your team solved first
        solvedState++;
      }
    }
  }
  return {state: solvedState, time: solvedTime};
};

Task.prototype.expectedState = function(task, team, state){
  var self = this;
  var solved = self.getSolvedState(task, team);
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

Task.prototype.teamSolved = function(task, team){
  return this.expectedState(task, team, 2);
};

Task.prototype.teamSolvedFirst = function(task, team){
  return this.expectedState(task, team, 3);
};

Task.prototype.isSolvableByTeam = function(task, team){
  var self = this;
  if(self.teamSolved(task, team).ok){
    return false;
  }
  else{
    if(self.isOpen(task, team.solo)){
      return true;
    }
    else{
      return false;
    }
  }
};

Task.prototype.isOpen = function(task, solo){
  var self = this;
  var solved = self.getSolved(task, solo);
  if(solved.length > 0 && parseInt(solved[solved.length-1].timestamp) + parseInt(self.config.delay) > (new Date()).getTime()){
    return false;
  }
  else{
    return  true;
  }
};

Task.prototype.getSolved = function(task, solo){
  if(solo === true){
    return _.sortBy(task.solvedSolo,['timestamp']);
  }
  else{
    return _.sortBy(task.solved,['timestamp']);
  }
};

Task.prototype.isFlag = function(task, flag){
  var self = this;
  var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
  return (task.flag === hashedFlag);
};

Task.prototype.solveTask = function(title, flag, team){
  var db = this.db;
  var self = this;
  return self.getTask(title).then(function(task){
    if(self.isSolvableByTeam(task, team)){
      if(self.isFlag(task, flag)){
        var solved = self.getSolved(task, team.solo);
        solved.push({"teamName": team.name, "timestamp": new Date().getTime()});
        if(team.solo === true){
          return db.update('tasks', {'title': title}, {'solvedSolo': solved});
        }
        else{
          return db.update('tasks', {'title': title}, {'solved': solved});
        }
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

Task.prototype.addTask = function(title, description, flag, type, difficulty, author){
  var db = this.db;
  var self = this;
  return self.exists(title).then(function(result){
      if(result){
        throw new Error('Task already exists');
      }
      else{
        var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
        var task = {
          'title': title,
          'description': description,
          'flag': hashedFlag,
          'type': type,
          'difficulty': difficulty,
          'author': author
        };
        return db.insert('tasks', task);
      }
  }).then(function(result){
    return true;
  });
};

Task.prototype.editTask = function(title, description, flag, type, difficulty, author){
  var db = this.db;
  var self = this;
  var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
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
  return db.update('tasks', {'title': title}, task).then(function(result){
    if(result === 1){
      return true;
    }
    else{
      return new Throw('No task updated');
    }
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

Task.prototype.cleanSolved = function(team, countTeam){
  var db = this.db;
  var self = this;
  if(team.solo === true){
    var solvedKey = 'solvedSolo';
  }
  else{
    var solvedKey = 'solved';
  }
  return self.getTasks(team, countTeam).then(function(tasks){
    tasks.raw.forEach(function(task){
      if(typeof task[solvedKey] !== 'undefined'){
        var countSolved = task[solvedKey].length;
        var newSolved = _.filter(task[solvedKey], function(elem){
          return team.name !== elem.teamName;
        });

        if(newSolved.length !== countSolved){
          var solvedSubmit = {}
          solvedSubmit[solvedKey] = newSolved;
          db.update('tasks', {'title': task.title}, solvedSubmit);
        }
      }
    });
    return null;
  });
};

exports.Task = Task;
