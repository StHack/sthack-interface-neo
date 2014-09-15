var Team = require('../src/Team').Team;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');

adminName = process.env.ADMIN_NAME;

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
                authenticated: { 
                  _id: '54116cb46bf7c8561a40af57',
                  teamName: 'exists',
                  password: 'ad5aabc97d88f6e56deaffc34c7a6e292e9e12db04a56799d773cfb64ca9898d'
                },
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
  session = { 
              cookie: { 
                path: '/',
                _expires: null,
                originalMaxAge: null,
                httpOnly: true 
              },
              logged: { 
                _id: '54116cb46bf7c8561a40af57',
                teamName: adminName,
                password: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b' 
              },
              sid: '1C5IFGgm1XSGBgbhEryXlg8w'
            }

  it("is authenticated", function(){
    expect(new Team().isAuthenticated(session)).toBeFalsy();
  });

  it("is admin", function(){
    expect(new Team().isAdmin(session)).toBeFalsy();
  });
});