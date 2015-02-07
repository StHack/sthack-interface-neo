var Team = require('../src/Team').Team;
var Promise = require('bluebird');
var crypto = require('crypto');
var DBo = require('../src/DB').DB;
var _ = require('lodash');

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
      }
    }

describe("Not authenticated team", function() {
  var session;
  var config;

  beforeEach(function(){
    session = {
                cookie: {
                 path: '/',
                  _expires: null,
                  originalMaxAge: null,
                  httpOnly: true
                }
              }
    config = {adminName: 'admin'}
  });

  it("could list other teams", function(done){
    var promise = new Team(DB, config, session).list();
    promise.then(function(result){
      expect(result).toEqual([{'teamName' : 'exists'}]);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not authenticated", function(){
    expect(new Team(DB, config, session).isAuthenticated()).toBeUndefined();
  });

  it("can't authenticate with invalid logins", function(done){
    var promise = new Team(DB, config, session).areLoginsValid('doesntexist', 'doesntexist');
    promise.then(function(result){
      expect(result).toBeFalsy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could authenticate with valid logins", function(done){
    var promise = new Team(DB, config, session).areLoginsValid('exists', 'exists');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
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
});

describe("Authenticated team", function() {
  var session;
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
                authenticated: 'exists',
                sid: '1C5IFGgm1XSGBgbhEryXlg8w'
              };

  });

  it("is authenticated", function(){
    expect(new Team(DB, config, session).isAuthenticated()).toBeDefined();
  });

  it("can't authenticate if already autenticated", function(done){
    var promise = new Team(DB, config, session).areLoginsValid('exists', 'exists');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You are already authenticated");
    }).finally(done);
  });

  it("is not admin", function(){
    expect(new Team(DB, config, session).isAdmin()).toBeFalsy();
  });

  it("can't create new team", function(done){
    var promise = new Team(DB, config, session).addTeam('doesntexist', 'doesntexist');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You are not the administrator");
    }).finally(done);
  });
});