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
    db.find('tasks', {}, {'title' : 1, '_id' : 0}).then(function(result){
      fulfill(result);
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.exists = function(title){
  var db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {'title' : title}, {}).then(function(result){
      fulfill(result.length != 0);
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.getSolvedState = function(title, teamName){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.getSolved(title).then(function(result){
      //nobody solved
      var solvedState = 0;
      if(result.length>0){
        //someone solved
        solvedState++;
        if(_.some(result, {'teamName': teamName})){
          //your team solved
          solvedState++;
          if(result[0].teamName == teamName){
            //your team solved first
            solvedState++;
          }
        }
      }
      fulfill(solvedState);
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.expectedState = function(title, teamName, state){
  var self = this;
  return new Promise(function(fulfill, reject){
    self.getSolvedState(title, teamName).then(function(result){
      if(state === 0){
        fulfill(state===result);
      }
      else{
        fulfill(result>=state);
      }
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.nobodySolved = function(title){
  return this.expectedState(title, '', 0);
}

Task.prototype.someoneSolved = function(title){
  return this.expectedState(title, '', 1);
}

Task.prototype.teamSolved = function(title, teamName){
  return this.expectedState(title, teamName, 2);
}

Task.prototype.teamSolvedFirst = function(title, teamName){
  return this.expectedState(title, teamName, 3);
}

Task.prototype.isSolvableByTeam = function(title, teamName){
  var self = this;
  return new Promise(function(fulfill, reject){
    self.teamSolved(title, teamName).then(function(result){
      if(result){
        fulfill(false);
      }
      else{
        self.isOpen(title).then(function(result){
          if(result){
            fulfill(true);
          }
          else{
            fulfill(false);
          }
        }, function(error){
          reject(error);
        });
      }
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.isOpen = function(title){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.getSolved(title).then(function(result){
      if(result.length>0 && result[result.length-1].timestamp + self.config.delay > (new Date()).getTime()){
        fulfill(false);
      }
      else{
        fulfill(true);
      }
    }, function(error){
          reject(error);
    });
  });
}

Task.prototype.getSolved = function(title){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.exists(title).then(function(result){
      if(result){
        db.find('tasks', {'title': title}, {'solved' : 1, '_id' : 0}).then(function(result){
          fulfill(_.sortBy(result[0].solved,['timestamp']));
        }, function(error){
          reject(error);
        });
      }
      else{
        reject("Task doesn't exist");
      }
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.isFlag = function(title, flag){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {'title': title}, {'flag' : 1, '_id' : 0}).then(function(result){
      var hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
      if(result.length===1 && result[0].flag === hashedFlag){
        fulfill(true);
      }
      else{
        fulfill(false);
      }
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.solveTask = function(title, flag, teamName){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    self.isSolvableByTeam(title, teamName).then(function(result){
      if(result){
        self.isFlag(title, flag).then(function(result){
          if(result){
            self.getSolved(title).then(function(result){
              var solved = result.slice(0);;
              solved.push({"teamName": teamName, "timestamp": new Date().getTime()});
              db.update('tasks', {'title': title}, {'solved': solved}).then(function(result){
                fulfill(true);
              }, function(error){
                reject(error);
              });
            }, function(error){
              reject(error);
            });
          }
          else{
            reject("Bad flag");
          }
        }, function(error){
          reject(error);
        });
      }
      else{
        reject("You can't solve this task");
      }
    }, function(error){
      reject(error);
    });
  });
}

Task.prototype.addTask = function(title, description, flag, type, coeff, author){
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
          'coeff': coeff,
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
}

Task.prototype.editTask = function(title, description, flag, type, coeff, author){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    hashedFlag = crypto.createHash('sha256').update(flag).digest('hex');
    var task = {
      'description': description,
      'flag': hashedFlag,
      'type': type,
      'coeff': coeff,
      'author': author
    };
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
}

exports.Task = Task;