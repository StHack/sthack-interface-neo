var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;

var DB = function(connectionString) {
  connect = function(requestFctn){
    MongoClient.connect(connectionString, function(err, db) {
      if(err) {
        throw err;
      }
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
        fulfill(results);
        callback();
      });
    });
  });
};

DB.prototype.insert = function(collection, object){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.insert(object, function(err, results){
        fulfill(results);
        callback();
      });
    });
  });
};

DB.prototype.update = function(collection, object, update){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.update(object, {'$set': update}, function(err, results){
        fulfill(results);
        callback();
      });
    });
  });
};

DB.prototype.remove = function(collection, object){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var coll = db.collection(collection);
      coll.remove(object, {}, function(err, results){
        fulfill(results.result.n);
        callback();
      });
    });
  });
};

exports.DB = DB;