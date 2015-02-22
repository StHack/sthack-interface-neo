var Team = require('../src/Team').Team;
var Promise = require('bluebird');
var crypto = require('crypto');
var DBo = require('../src/DB').DB;
var _ = require('lodash');

var DB = {
      find: function(collection, request, fields){
        return new Promise(function(fulfill, reject){
          var content = [{'name' : 'exists',
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

  it("can create new team that doesn't exist", function(done){
    var promise = new Team(DB).addTeam('doesntexist', 'doesntexist');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't create new team that already exists", function(done){
    var promise = new Team(DB).addTeam('exists', 'exists');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("Team already exists");
    }).finally(done);
  });
});