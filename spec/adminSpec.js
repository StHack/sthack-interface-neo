var Team = require('../src/Team').Team;
var Task = require('../src/Task').Task;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');
var DBo = require('../src/DB').DB;

var DB = {
      find: function(collection, request, fields){
        return new Promise(function(fulfill, reject){
          var content = [{'teamName' : 'exists',
                          'password' : crypto.createHash('sha256').update('exists').digest('hex')
                          }];
          var results = [];
          if(_.size(request)){
            content = _.where(content, request);
          }
          if(_.size(fields)){
            _.filter(content, function(value){
              results.push({});
              _.forEach(Object.keys(fields), function(key){
                if(fields[key] == 1 && value[key]){
                  results.pop();
                  var result = {};
                  result[key] = value[key];
                  results.push(result);
                }
              });
            });
          }
          else{
            results = content;
          }
          fulfill(results);
        });
      },
      insert: function(collection, object){
        return new Promise(function(fulfill, reject){
          fulfill([object]);
        });
      },
      update: function(collection, object, update){
        return new Promise(function(fulfill, reject){
          if(object.teamName==='exists'){
            fulfill(1);
          }
          else{
            reject("No team updated");
          }
        });
      }
    }

//DB = new DBo('mongodb://login:password@127.0.0.1:27017/sthack');

describe("Admin", function() {
  var session;
  var adminName;
  var config;

  beforeEach(function(){
    config = {adminName: 'admin'};
    session = {
                cookie: {
                  path: '/',
                  _expires: null,
                  originalMaxAge: null,
                  httpOnly: true
                },
                authenticated: config.adminName,
                sid: '1C5IFGgm1XSGBgbhEryXlg8w'
              };
  });

  it("is authenticated", function(){
    expect(new Team(DB, config, session).isAuthenticated()).toBeDefined();
  });

  it("is admin", function(){
    expect(new Team(DB, config, session).isAdmin()).toBeTruthy();
  });

  it("could create new team that doesn't exist", function(done){
    var promise = new Team(DB, config, session).addTeam('doesntexist', 'doesntexist');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't create new team that already exists", function(done){
    var promise = new Team(DB, config, session).addTeam('exists', 'exists');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("Team already exists");
    }).finally(done);
  });

  it("could edit team password that exists", function(done){
    var promise = new Team(DB, config, session).editTeam('exists', 'password');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't edit team password that doesn't exist", function(done){
    var promise = new Team(DB, config, session).editTeam('doesntexists', 'password');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("No team updated");
    }).finally(done);
  });

});