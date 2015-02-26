var Promise = require('bluebird');
var DB = require('./DB').DB;
var _ = require('lodash');

var Message = function(db) {
  this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
};

Message.prototype.addMessage = function(message){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.insert('messages', {'timestamp' : new Date().getTime(), 'content' : message}).then(function(result){
      fulfill(true);
    }, function(error){
      reject(error);
    });
  });
};

Message.prototype.getMessages = function(){
  var db = this.db;
  var self = this;
  return new Promise(function(fulfill, reject){
    db.find('messages', {}, {'_id': 0}).then(function(messages){
      fulfill(_.sortBy(messages, ['timestamp']));
    }, function(error){
      reject(error);
    });
  });
};

exports.Message = Message;