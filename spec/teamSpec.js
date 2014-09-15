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
      find: function(collection, request){
        return new Promise(function(fulfill, reject){
          fulfill(_.where([{'teamName' : 'exists',
                            'password' : crypto.createHash('sha256').update('exists').digest('hex')
                          }], request));
        });
      }
    }
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