var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function(db, config, session) {
  this.session = session;
  this.config = config;
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Team.prototype.list = function(){
  var db = this.db;
  return new Promise(function(fulfill, reject){
    db.find('teams', {}, {'teamName' : 1, '_id' : 0}).then(function(result){
      fulfill(result);
    }, function(error){
      reject(error);
    });
  });
}

Team.prototype.setSession = function(session){
  return this.session = session;
}

Team.prototype.isAuthenticated = function(){
  return this.session.authenticated;
}

Team.prototype.areLoginsValid = function(teamName, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    if(self.isAuthenticated()){
      reject("You are already authenticated");
    }
    else{
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      db.find('teams', {'teamName' : teamName, 'password' : hashedPassword}, {}).then(function(result){
        if(result.length===0){
          fulfill(false);
        }
        else{
          fulfill(true);
        }
      }, function(error){
        reject(error);
      });
    }
  });
}

Team.prototype.isAdmin = function(){
  return (this.isAuthenticated() && this.session.authenticated == this.config.adminName);
}

Team.prototype.addTeam = function(teamName, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    if(self.isAuthenticated() && !self.isAdmin()){
      reject("You are not the administrator");
    }
    else{
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      db.find('teams', {'teamName' : teamName}, {}).then(function(result){
        if(result.length===0){
          db.insert('teams', {'teamName' : teamName, 'password' : hashedPassword}).then(function(result){
            fulfill(true);
          }, function(error){
            reject(error);
          });
        }
        else{
          reject("Team already exists");
        }
      });
    }
  });
}

Team.prototype.editTeam = function(teamName, password){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    if(self.isAdmin()){
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      db.update('teams', {'teamName' : teamName}, {'password': hashedPassword}).then(function(result){
        if(result === 1){
          fulfill(true);
        }
        else{
          reject("No team updated");
        }
      }, function(error){
        reject(error);
      });
    }
    else{
      reject("You are not the adminitrator");
    }
  });
}

exports.Team = Team;