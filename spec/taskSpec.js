var Task = require('../src/Task').Task;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');


var DB = {
      find: function(collection, request, fields){
        return new Promise(function(fulfill, reject){
          var content = [
            {'title': 'First task',
             'description': 'Description with <b>html</b> support.',
             'flag': '807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87',
             'type': 'Stegano'},
            {'title': 'Second task',
             'description': 'Description with <b>html</b> support.',
             'flag': '807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87',
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792226000}]},
            {'title': 'Third task',
             'description': 'Description with <b>html</b> support.',
             'flag': '807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87',
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792225833},
                        {'teamName' : 'myTeam', 'timestamp' : 1410792226000}]},
            {'title': 'Fourth task',
             'description': 'Description with <b>html</b> support.',
             'flag': '807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87',
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : 1410792225833},
                        {'teamName' : 'myTeam', 'timestamp' : 1410792224000}]},
            {'title': 'Fifth task',
             'description': 'Description with <b>html</b> support.',
             'flag': '807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87',
             'type': 'Stegano',
             'solved': [{'teamName' : 'otherTeam', 'timestamp' : (new Date()).getTime() + 1000 * 60 * 5},
                        {'teamName' : 'myTeam', 'timestamp' : 1410792224000}]},
          ];
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
          if(_.indexOf(['First task', 'Second task', 'Third task', 'Fourth task', 'Fifth task'], object.title)!==-1){
            fulfill(1);
          }
          else{
            reject("No task updated");
          }
        });
      }
    }

describe("Tasks", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("could be listed", function(done){
    var promise = new Task(DB, config).list();
    promise.then(function(result){
      expect(result).toEqual([{'title': 'First task'},
                              {'title': 'Second task'},
                              {'title': 'Third task'},
                              {'title': 'Fourth task'},
                              {'title': 'Fifth task'}
                             ]);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("could be created if doesn't exist", function(done){
    var promise = new Task(DB, config).addTask('Title', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be created if already exists", function(done){
    var promise = new Task(DB, config).addTask('First task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("Task already exists");
    }).finally(done);
  });

  it("could be edited if it exists", function(done){
    var promise = new Task(DB, config).editTask('First task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function(result){
      expect(result).toBeTruthy();
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be edited if it doesn't exist", function(done){
    var promise = new Task(DB, config).editTask('No such task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("No task updated");
    }).finally(done);
  });
});

describe("Tasks never solved", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("is 'never solved by anybody'", function(done){
    var promise = new Task(DB, config).nobodySolved('First task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by someone'", function(done){
    var promise = new Task(DB, config).someoneSolved('First task');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function(done){
    var promise = new Task(DB, config).teamSolved('First task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function(done){
    var promise = new Task(DB, config).teamSolvedFirst('First task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function(done){
    var promise = new Task(DB, config).isOpen('First task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can be solved with good flag", function(done){
    var promise = new Task(DB, config).solveTask('First task', 'flag', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with bad flag", function(done){
    var promise = new Task(DB, config).solveTask('First task', 'bad flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("Bad flag");
    }).finally(done);
  });

});

describe("Tasks solved by other team", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("is not 'never solved by anybody'", function(done){
    var promise = new Task(DB, config).nobodySolved('Second task');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function(done){
    var promise = new Task(DB, config).someoneSolved('Second task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function(done){
    var promise = new Task(DB, config).teamSolved('Second task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function(done){
    var promise = new Task(DB, config).teamSolvedFirst('Second task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function(done){
    var promise = new Task(DB, config).isOpen('Second task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can be solved with good flag", function(done){
    var promise = new Task(DB, config).solveTask('Second task', 'flag', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with bad flag", function(done){
    var promise = new Task(DB, config).solveTask('Second task', 'bad flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("Bad flag");
    }).finally(done);
  });

});


describe("Tasks solved by my team", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("is not 'never solved by anybody'", function(done){
    var promise = new Task(DB, config).nobodySolved('Third task');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function(done){
    var promise = new Task(DB, config).someoneSolved('Third task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function(done){
    var promise = new Task(DB, config).teamSolved('Third task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function(done){
    var promise = new Task(DB, config).teamSolvedFirst('Third task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function(done){
    var promise = new Task(DB, config).isOpen('Third task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with good flag", function(done){
    var promise = new Task(DB, config).solveTask('Third task', 'flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function(done){
    var promise = new Task(DB, config).solveTask('Third task', 'bad flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

});

describe("Tasks solved by my team first", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("is not 'never solved by anybody'", function(done){
    var promise = new Task(DB, config).nobodySolved('Fourth task');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function(done){
    var promise = new Task(DB, config).someoneSolved('Fourth task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function(done){
    var promise = new Task(DB, config).teamSolved('Fourth task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function(done){
    var promise = new Task(DB, config).teamSolvedFirst('Fourth task', 'myTeam');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function(done){
    var promise = new Task(DB, config).isOpen('Fourth task');
    promise.then(function(result){
      expect(result).toBe(true);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with good flag", function(done){
    var promise = new Task(DB, config).solveTask('Fourth task', 'flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function(done){
    var promise = new Task(DB, config).solveTask('Fourth task', 'bad flag', 'myTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

});

describe("Tasks closed", function() {
  var config;

  beforeEach(function(){
    config = {delay: 1000 * 60 * 10};
  });

  it("is not 'opened'", function(done){
    var promise = new Task(DB, config).isOpen('Fifth task');
    promise.then(function(result){
      expect(result).toBe(false);
    },function(error){
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with good flag", function(done){
    var promise = new Task(DB, config).solveTask('Fifth task', 'flag', 'newTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function(done){
    var promise = new Task(DB, config).solveTask('Fifth task', 'bad flag', 'newTeam');
    promise.then(function(result){
      expect(true).toBe(false);
    },function(error){
      expect(error).toEqual("You can't solve this task");
    }).finally(done);
  });

});