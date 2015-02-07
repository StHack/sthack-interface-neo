var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;

var DB = function(connectionString) {
  connect = function(requestFctn){
    MongoClient.connect(connectionString, function(err, db) {
      if(err) throw err;
      requestFctn(db,function(){
        db.close();
      });
    });
  };
};

DB.prototype.find = function(collection, request, fields){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.find(request, fields).toArray(function(err, results){
        callback();
        fulfill(results);
      });
    });
  });
};

DB.prototype.insert = function(collection, object){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.insert(object, function(err, results){
        callback();
        fulfill(results);
      });
    });
  });
};

DB.prototype.update = function(collection, object, update){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.update(object, {'$set': update}, function(err, results){
        callback();
        fulfill(results);
      });
    });
  });
};

exports.DB = DB;