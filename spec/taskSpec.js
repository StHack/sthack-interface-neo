var Task = require('../src/Task').Task;
var Promise = require('bluebird');
var crypto = require('crypto');
var _ = require('lodash');
var where = require('lodash.where');

var DB = {
  find: function (collection, request, fields) {
    return new Promise(function (fulfill, reject) {
      var content = [
        {
          'title': 'First task',
          'description': 'Description with <b>html</b> support.',
          'flags': ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
          'type': 'Stegano',
          'difficulty': 'easy',
          'author': 'agix'
        },
        {
          'title': 'Second task',
          'description': 'Description with <b>html</b> support.',
          'flags': ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
          'type': 'Stegano',
          'difficulty': 'medium',
          'solved': [{ 'teamName': 'otherTeam', 'timestamp': 1410792226000 }],
          'author': 'agix'
        },
        {
          'title': 'Third task',
          'description': 'Description with <b>html</b> support.',
          'flags': ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
          'type': 'Stegano',
          'difficulty': 'hard',
          'solved': [{ 'teamName': 'otherTeam', 'timestamp': 1410792225833 },
          { 'teamName': 'myTeam', 'timestamp': 1410792226000 }],
          'author': 'agix'
        },
        {
          'title': 'Fourth task',
          'description': 'Description with <b>html</b> support.',
          'flags': ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
          'type': 'Stegano',
          'difficulty': 'medium',
          'solved': [{ 'teamName': 'otherTeam', 'timestamp': 1410792225833 },
          { 'teamName': 'myTeam', 'timestamp': 1410792224000 }],
          'author': 'agix'
        },
        {
          'title': 'Fifth task',
          'description': 'Description with <b>html</b> support.',
          'flags': ['807d0fbcae7c4b20518d4d85664f6820aafdf936104122c5073e7744c46c4b87'],
          'type': 'Stegano',
          'difficulty': 'medium',
          'solved': [{ 'teamName': 'otherTeam', 'timestamp': (new Date()).getTime() + 1000 * 60 * 5 },
          { 'teamName': 'myTeam', 'timestamp': 1410792224000 }],
          'author': 'agix'
        },
      ];
      var results = [];
      if (_.size(request)) {
        content = where(content, request);
      }
      delete fields._id;
      if (_.size(fields)) {
        _.filter(content, function (value) {
          results.push({});
          _.forEach(Object.keys(fields), function (key) {
            if (fields[key] === 1 && value[key]) {
              results.pop();
              var result = {};
              result[key] = value[key];
              results.push(result);
            }
          });
        });
      }
      else {
        results = content;
      }
      fulfill(results);
    });
  },
  insert: function (collection, object) {
    return new Promise(function (fulfill, reject) {
      fulfill([object]);
    });
  },
  update: function (collection, object, update) {
    return new Promise(function (fulfill, reject) {
      if (_.indexOf(['First task', 'Second task', 'Third task', 'Fourth task', 'Fifth task'], object.title) !== -1) {
        fulfill(true);
      }
      else {
        reject("Error: No task updated");
      }
    });
  }
}

describe("Tasks", function () {
  var config;

  beforeEach(function () {
    config = {
      closedTaskDelay: 1000 * 60 * 10,
      baseScore: 50
    };
  });

  it("can be listed", async function () {
    const result = await new Task(DB, config).list();
    expect(result).toEqual([
      { 'title': 'First task' },
      { 'title': 'Second task' },
      { 'title': 'Third task' },
      { 'title': 'Fourth task' },
      { 'title': 'Fifth task' }
    ]);
  });

  it("can be get", async function () {
    const tasks = await new Task(DB, config).getTasks('myTeam', 3);
    tasks.infos.forEach(function (task) {
      delete task.solved;
    });
    expect(tasks.infos).toEqual([
      {
        "author": "agix",
        "difficulty": "medium",
        "open": false,
        "score": 100,
        "state": 3,
        "title": "Fifth task",
        "type": "Stegano"
      },
      {
        "author": "agix",
        "difficulty": "easy",
        "open": true,
        "score": 150,
        "state": 0,
        "title": "First task",
        "type": "Stegano"
      },
      {
        "author": "agix",
        "difficulty": "medium",
        "open": true,
        "score": 100,
        "state": 3,
        "title": "Fourth task",
        "type": "Stegano"
      },
      {
        "author": "agix",
        "difficulty": "medium",
        "open": true,
        "score": 200,
        "state": 1,
        "title": "Second task",
        "type": "Stegano"
      },
      {
        "author": "agix",
        "difficulty": "hard",
        "open": true,
        "score": 150,
        "state": 2,
        "title": "Third task",
        "type": "Stegano"
      }
    ]);
  });

  it("can be created if doesn't exist", async function () {
    var taskDB = new Task(DB, config);
    const result = await taskDB.addTask('Title', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    expect(result).toBeTruthy();
  });

  it("can't be created if already exists", function (done) {
    var promise = new Task(DB, config).addTask('First task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: Task already exists");
    }).finally(done);
  });

  it("can be edited if it exists", async function () {
    const result = await new Task(DB, config).editTask('First task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    expect(result).toBeTruthy();
  });

  it("can't be edited if it doesn't exist", function (done) {
    var promise = new Task(DB, config).editTask('No such task', '<u>Description</u>', 'flag', 'stegano', 1, 'agix');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: No task updated");
    }).finally(done);
  });
});

describe("Tasks never solved", function () {
  var config;

  beforeEach(function () {
    config = { closedTaskDelay: 1000 * 60 * 10 };
  });

  it("is 'never solved by anybody'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('First task');
    promise.then(function (task) {
      expect(taskDB.nobodySolved(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by someone'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('First task');
    promise.then(function (task) {
      expect(taskDB.someoneSolved(task)).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('First task');
    promise.then(function (task) {
      expect(taskDB.teamSolved(task, 'myTeam').ok).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('First task');
    promise.then(function (task) {
      expect(taskDB.teamSolvedFirst(task, 'myTeam').ok).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('First task');
    promise.then(function (task) {
      expect(taskDB.isOpen(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can be solved with good flag", function (done) {
    var promise = new Task(DB, config).solveTask('First task', 'flag', 'myTeam');
    promise.then(function (result) {
      expect(result).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with bad flag", function (done) {
    var promise = new Task(DB, config).solveTask('First task', 'bad flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: Bad flag");
    }).finally(done);
  });

});

describe("Tasks solved by other team", function () {
  var config;

  beforeEach(function () {
    config = { closedTaskDelay: 1000 * 60 * 10 };
  });

  it("is not 'never solved by anybody'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Second task');
    promise.then(function (task) {
      expect(taskDB.nobodySolved(task)).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Second task');
    promise.then(function (task) {
      expect(taskDB.someoneSolved(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Second task');
    promise.then(function (task) {
      expect(taskDB.teamSolved(task, 'myTeam').ok).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Second task');
    promise.then(function (task) {
      expect(taskDB.teamSolvedFirst(task, 'myTeam').ok).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Second task');
    promise.then(function (task) {
      expect(taskDB.isOpen(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can be solved with good flag", function (done) {
    var promise = new Task(DB, config).solveTask('Second task', 'flag', 'myTeam');
    promise.then(function (result) {
      expect(result).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with bad flag", function (done) {
    var promise = new Task(DB, config).solveTask('Second task', 'bad flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: Bad flag");
    }).finally(done);
  });

});


describe("Tasks solved by my team", function () {
  var config;

  beforeEach(function () {
    config = { closedTaskDelay: 1000 * 60 * 10 };
  });

  it("is not 'never solved by anybody'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Third task');
    promise.then(function (task) {
      expect(taskDB.nobodySolved(task)).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Third task');
    promise.then(function (task) {
      expect(taskDB.someoneSolved(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by your team'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Third task');
    promise.then(function (task) {
      expect(taskDB.teamSolved(task, 'myTeam').ok).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is not 'solved by your team in first'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Third task');
    promise.then(function (task) {
      expect(taskDB.teamSolvedFirst(task, 'myTeam').ok).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Third task');
    promise.then(function (task) {
      expect(taskDB.isOpen(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with good flag", function (done) {
    var promise = new Task(DB, config).solveTask('Third task', 'flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function (done) {
    var promise = new Task(DB, config).solveTask('Third task', 'bad flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

});

describe("Tasks solved by my team first", function () {
  var config;

  beforeEach(function () {
    config = { closedTaskDelay: 1000 * 60 * 10 };
  });

  it("is not 'never solved by anybody'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Fourth task');
    promise.then(function (task) {
      expect(taskDB.nobodySolved(task)).toBe(false);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by someone'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Fourth task');
    promise.then(function (task) {
      expect(taskDB.someoneSolved(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by your team'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Fourth task');
    promise.then(function (task) {
      expect(taskDB.teamSolved(task, 'myTeam').ok).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'solved by your team in first'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Fourth task');
    promise.then(function (task) {
      expect(taskDB.teamSolvedFirst(task, 'myTeam').ok).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("is 'opened'", function (done) {
    var taskDB = new Task(DB, config);
    var promise = taskDB.getTask('Fourth task');
    promise.then(function (task) {
      expect(taskDB.isOpen(task)).toBe(true);
    }, function (error) {
      expect(true).toBe(false);
    }).finally(done);
  });

  it("can't be solved with good flag", function (done) {
    var promise = new Task(DB, config).solveTask('Fourth task', 'flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function (done) {
    var promise = new Task(DB, config).solveTask('Fourth task', 'bad flag', 'myTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

});

describe("Tasks closed", function () {
  var config;

  beforeEach(function () {
    config = { closedTaskDelay: 1000 * 60 * 10 };
  });

  it("is not 'opened'", async function () {
    var taskDB = new Task(DB, config);
    const task = await taskDB.getTask('Fifth task');
    expect(taskDB.isOpen(task)).toBe(false);
  });

  it("can't be solved with good flag", function (done) {
    var promise = new Task(DB, config).solveTask('Fifth task', 'flag', 'newTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

  it("can't be solved with bad flag", function (done) {
    var promise = new Task(DB, config).solveTask('Fifth task', 'bad flag', 'newTeam');
    promise.then(function (result) {
      expect(true).toBe(false);
    }, function (error) {
      expect(error.toString()).toEqual("Error: You can't solve this task");
    }).finally(done);
  });

});
