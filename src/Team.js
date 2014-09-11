var crypto = require('crypto');
var mongodb = require('mongodb');
var _ = require('lodash');

var Team = function() {};

Team.prototype.isAuthenticated = function(session){
  return session.authenticated;
}

Team.prototype.areLoginsValid = function(teamName, password){
  hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  return _.some(collTeams, {'teamName' : teamName, 'password' : hashedPassword});
}

Team.prototype.isAdmin = function(session){
  return (this.isAuthenticated(session) && session.authenticated.teamName == adminName);
}

exports.Team = Team;