var Task = require('../src/Task').Task;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');

describe("Tasks", function() {
  var DB;

  beforeEach(function(){
    DB = {
      find: function(collection, request, fields){
        return new Promise(function(fulfill, reject){
          var content = [
            {'taskTitle': 'First task', 
             'description': 'Description with <b>html</b> support.', 
             'flag': '4d54517a024d0cefa786029a81203fab4f94a86054417fd1b10e77f0be3cf2ca', 
             'type': 'Stegano'},
            {'taskTitle': 'Second task', 
             'description': 'Description with <b>html</b> support.', 
             'flag': '4d54517a024d0cefa786029a81203fab4f94a86054417fd1b10e77f0be3cf2ca', 
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792226000}]},
            {'taskTitle': 'Third task', 
             'description': 'Description with <b>html</b> support.', 
             'flag': '4d54517a024d0cefa786029a81203fab4f94a86054417fd1b10e77f0be3cf2ca', 
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792225833},
                        {'teamName' : 'exists', 'timestamp' : 1410792226000}]},
            {'taskTitle': 'Fourth task', 
             'description': 'Description with <b>html</b> support.', 
             'flag': '4d54517a024d0cefa786029a81203fab4f94a86054417fd1b10e77f0be3cf2ca', 
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792225833},
                        {'teamName' : 'exists', 'timestamp' : 1410792224000}]},
            {'taskTitle': 'Fifth task', 
             'description': 'Description with <b>html</b> support.', 
             'flag': '4d54517a024d0cefa786029a81203fab4f94a86054417fd1b10e77f0be3cf2ca', 
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : (new Date()).getTime() + 1000 * 60 * 5},
                        {'teamName' : 'exists', 'timestamp' : 1410792224000}]},
          ]
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

  it("could be listed", function(done){
    var promise = new Task(DB).list();
    promise.then(function(result){
      expect(result).toEqual([{'taskTitle': 'First task'},
                              {'taskTitle': 'Second task'}, 
                              {'taskTitle': 'Third task'}, 
                              {'taskTitle': 'Fourth task'}, 
                              {'taskTitle': 'Fifth task'}
                             ]);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could exists", function(done){
    var promise = new Task(DB).exists('First task');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could not exist", function(done){
    var promise = new Task(DB).exists('No task');
    promise.then(function(result){
      expect(result).toBeFalsy(0);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be never solved by anybody", function(done){
    var promise = new Task(DB).getSolvedState('First task', 'exists');
    promise.then(function(result){
      expect(result).toEqual(0);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be not solved by your team but another one", function(done){
    var promise = new Task(DB).getSolvedState('Second task', 'exists');
    promise.then(function(result){
      expect(result).toEqual(1);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be solved by your team", function(done){
    var promise = new Task(DB).getSolvedState('Third task', 'exists');
    promise.then(function(result){
      expect(result).toEqual(2);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be solved by your team in first", function(done){
    var promise = new Task(DB).getSolvedState('Fourth task', 'exists');
    promise.then(function(result){
      expect(result).toEqual(3);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be opened", function(done){
    var promise = new Task(DB).isOpen('Fourth task');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      console.log(error);
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be closed", function(done){
    var promise = new Task(DB).isOpen('Fifth task');
    promise.then(function(result){
      expect(result).toBeFalsy();
    },function(error){
      console.log(error);
      expect(true).toBe(false);
    }).finally(done);
  });
});