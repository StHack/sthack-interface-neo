var Team = require('../src/Team').Team;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');

describe("Not authenticated team", function() {
  var session;
  var DB;

  beforeEach(function(){
    session = { 
                cookie: { 
                 path: '/',
                  _expires: null,
                  originalMaxAge: null,
                  httpOnly: true 
                } 
              }
    DB = {
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
      }
    }
  });

  it("could list other teams", function(done){
    var promise = new Team(DB).list();
    promise.then(function(result){
      expect(result).toEqual([{'teamName' : 'exists'}]);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not authenticated", function(){
    expect(new Team(DB).isAuthenticated(session)).toBeUndefined();
  });

  it("can't authenticate with invalid logins", function(done){
    var promise = new Team(DB).areLoginsValid('doesntexist', 'doesntexist');
    promise.then(function(result){
      expect(result).toBeFalsy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can authenticate with valid logins", function(done){
    var promise = new Team(DB).areLoginsValid('exists', 'exists');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });
});

describe("Authenticated team", function() {
  var session;
  beforeEach(function(){
    session = { 
                cookie: { 
                  path: '/',
                  _expires: null,
                  originalMaxAge: null,
                  httpOnly: true 
                },
                authenticated: 'exists',
                sid: '1C5IFGgm1XSGBgbhEryXlg8w' 
              }
  });

  it("is authenticated", function(){
    expect(new Team().isAuthenticated(session)).toBeDefined();
  });

  it("is not admin", function(){
    expect(new Team().isAdmin(session)).toBeFalsy();
  });
});

describe("Admin", function() {
  var session;
  var adminName;
  beforeEach(function(){
    adminName = 'admin';
    session = {
                cookie: {
                  path: '/',
                  _expires: null,
                  originalMaxAge: null,
                  httpOnly: true
                },
                authenticated: adminName,
                sid: '1C5IFGgm1XSGBgbhEryXlg8w'
              }
  });

  it("is authenticated", function(){
    expect(new Team().isAuthenticated(session)).toBeDefined();
  });

  it("is admin", function(){
    expect(new Team().isAdmin(session, adminName)).toBeTruthy();
  });
});