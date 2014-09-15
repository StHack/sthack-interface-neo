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

exports.DB = DB;