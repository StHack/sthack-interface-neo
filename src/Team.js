var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Team.prototype.isAuthenticated = function(session){
  return session.authenticated;
}

Team.prototype.areLoginsValid = function(teamName, password){
  db = this.db;
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    db.find('teams', {'teamName' : teamName, 'password' : hashedPassword}, {}).then(function(result){
      if(result.length==0){
        fulfill(false);
      }
      else{
        fulfill(true);
      }
    }, function(result){
      reject(false);
    });
  });
}

Team.prototype.isAdmin = function(session, adminName){
  return (this.isAuthenticated(session) && session.authenticated == adminName);
}

exports.Team = Team;