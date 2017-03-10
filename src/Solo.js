var Promise = require('bluebird');
var crypto = require('crypto');
var DB = require('./DB').DB;
var _ = require('lodash');

var Solo = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Solo.prototype.list = function(){
  var db = this.db;
  return db.find('solos', {}, {'name' : 1, '_id' : 0});
};

Solo.prototype.addSolo = function(name){
  var db = this.db;
  var self = this;
  return db.find('solos', {'name' : name}, {}).then(function(result){
    if(result.length===0){
      return db.insert('solos', {'name' : name});
    }
    else{
      return result;
    }
  }).then(function(result){
    return result;
  });
};

exports.Solo = Solo;