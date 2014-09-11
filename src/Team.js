var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function() {};

Team.prototype.isAuthenticated = function(session){
  return session.authenticated;
}

Team.prototype.areLoginsValid = function(teamName, password){
  return new Promise(function(fulfill, reject){
    hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    new DB().find({'teamName' : teamName, 'password' : hashedPassword}).then(function(result){
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