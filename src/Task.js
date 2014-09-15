var Promise = require('bluebird');
var DB = require('./DB').DB;
var _ = require('lodash');

var Task = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Task.prototype.list = function(){
  db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {}, {'taskTitle' : 1, '_id' : 0}).then(function(result){
      fulfill(result);
    }, function(error){
      reject(false);
    });
  });
}

Task.prototype.exists = function(taskTitle){
  db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('tasks', {'taskTitle' : taskTitle}, {}).then(function(result){
      fulfill(result.length != 0);
    }, function(error){
      reject(false);
    });
  });
}

Task.prototype.getSolvedState = function(taskTitle, teamName){
  db = this.db;
  self = this;
  return new Promise(function(fulfill, reject){
    self.exists(taskTitle).then(function(result){
      if(result){
        db.find('tasks', {'taskTitle' : taskTitle}, {'solved' : 1, '_id' : 0}).then(function(result){
          var solved = _.sortBy(result[0].solved,['timestamp']);          
          //nobody solved
          solvedState = 0;
          if(solved.length){
            //someone solved
            solvedState++;
            if(_.some(solved,{'teamName': teamName})){
              //your team solved
              solvedState++;
              if(solved[0].teamName == teamName){
                //your team solved first
                solvedState++;
              }
            }
          }
          fulfill(solvedState);
        }, function(error){
          reject(false);
        });
      }
      else{
        reject('Task doesn\'t exist.');
      }
    }, function(error){
      reject(false);
    });
  });
}

Task.prototype.isOpen = function(taskTitle){
  db = this.db;
  self = this;
  return new Promise(function(fulfill, reject){
    self.exists(taskTitle).then(function(result){
      if(result){
        db.find('tasks', {'taskTitle' : taskTitle}, {'solved' : 1, '_id' : 0}).then(function(result){
          var solved = _.sortBy(result[0].solved,['timestamp']);
          isOpen = true;
          if(solved && solved[solved.length-1].timestamp + 1000 * 60 * 10 > (new Date()).getTime()){
            isOpen = false;
          }
          fulfill(isOpen);
        }, function(error){
          reject(false);
        });
      }
      else{
        reject('Task doesn\'t exist.');
      }
    }, function(error){
      reject(false);
    });
  });
}

exports.Task = Task;