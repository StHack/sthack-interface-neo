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

DB.prototype.find = function(collection, request){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var teams = db.collection(collection);
      teams.find(request).toArray(function(err, results){
        callback();
        fulfill(results);
      });
    });
  });
};

exports.DB = DB;