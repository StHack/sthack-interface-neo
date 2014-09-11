var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function(db) {
  this.db = db || new DB();
};

Team.prototype.isAuthenticated = function(session){
  return session.authenticated;
}

Team.prototype.areLoginsValid = function(teamName, password){
  db = this.db;
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.find({'teamName' : teamName, 'password' : hashedPassword}).then(function(result){
      if(result.length==0){
        fulfill(false);
      }
      else{
        fulfill(true);
      }
    }, function(result){
      fulfill(false);
    });
  });
}

Team.prototype.isAdmin = function(session){
  return (this.isAuthenticated(session) && session.authenticated.teamName == adminName);
}

exports.Team = Team;