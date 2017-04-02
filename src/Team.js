var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Team = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Team.prototype.list = function(){
  var db = this.db;
  return db.find('teams', {}, {'name' : 1, '_id' : 0}).then(function(result) {
    return _.sortBy(result, ['name']);
  })
};

Team.prototype.areLoginsValid = function(name, password){
  var db = this.db;
  var self = this;
  var hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  return db.find('teams', {'name' : name, 'password' : hashedPassword}, {}).then(function(result){
    if(result.length===0){
      return false;
    }
    else{
      return true;
    }
  });
};

Team.prototype.addTeam = function(name, password){
  var db = this.db;
  var self = this;
  var hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  return db.find('teams', {'name' : name}, {}).then(function(result){
    if(result.length===0){
      return db.insert('teams', {'name' : name, 'password' : hashedPassword});
    }
    else{
      throw new Error("Team already exists");
    }
  }).then(function(result){
    return true;
  });
};

Team.prototype.editTeam = function(name, password){
  var db = this.db;
  var self = this;
  var hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  return db.update('teams', {'name' : name}, {'password': hashedPassword}).then(function(result){
    if(result === 1){
      return true;
    }
    else{
      throw Error('No team updated');
    }
  });
};

Team.prototype.deleteTeam = function(name){
  var db = this.db;
  var self = this;
  return db.remove('teams', {'name' : name}).then(function(result){
    if(result === 1){
      return true;
    }
    else{
      throw Error('No team removed');
    }
  });
};

exports.Team = Team;