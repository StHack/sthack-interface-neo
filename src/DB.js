var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;

var DB = function() {
  connect = function(requestFctn){
    MongoClient.connect('mongodb://login:password@127.0.0.1:27017/sthack', function(err, db) {
      if(err) throw err;
      requestFctn(db,function(){
        db.close();
      });
    });
  };
};

DB.prototype.find = function(request){
  return new Promise(function(fulfill, reject){
    connect(function(db, callback){
      var teams = db.collection('teams');
      teams.find(request).toArray(function(err, results){
        callback();
        fulfill(results);
      });
    });
  });
};

exports.DB = DB;