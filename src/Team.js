var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Team.prototype.list = function(){
  var db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('teams', {}, {'name' : 1, '_id' : 0}).then(function(result){
      fulfill(result);
    }, function(error){
      reject(error);
    });
  });
}

Team.prototype.areLoginsValid = function(name, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.find('teams', {'name' : name, 'password' : hashedPassword}, {}).then(function(result){
      if(result.length===0){
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

Team.prototype.addTeam = function(name, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.find('teams', {'name' : name}, {}).then(function(result){
      if(result.length===0){
        db.insert('teams', {'name' : name, 'password' : hashedPassword}).then(function(result){
          fulfill(true);
        }, function(error){
          reject(error);
        });
      }
      else{
        reject("Team already exists");
      }
    });
  });
}

Team.prototype.editTeam = function(name, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.update('teams', {'name' : name}, {'password': hashedPassword}).then(function(result){
      if(result === 1){
        fulfill(true);
      }
      else{
        reject("No team updated");
      }
    }, function(error){
      reject(error);
    });
  });
}

Team.prototype.deleteTeam = function(name){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.remove('teams', {'name' : name}).then(function(result){
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
}

exports.Team = Team;