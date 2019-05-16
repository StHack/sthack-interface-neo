var { Task } = require('../src/repositories/Task');
var { size, filter, forEach, indexOf } = require('lodash');
var where = require('lodash.where');

var DB = {
  find: function (collection, request, fields) {
    fields = Object.assign({ _id: 0 }, fields);
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
      if (size(request)) {
        content = where(content, request);
      }
      delete fields._id;
      if (size(fields)) {
        filter(content, function (value) {
          results.push({});
          forEach(Object.keys(fields), function (key) {
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
      if (indexOf(['First task', 'Second task', 'Third task', 'Fourth task', 'Fifth task'], object.title) !== -1) {
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

  // it("can be listed", async function () {
  //   const result = await new Task(DB, config).list();
  //   expect(result).toEqual([
  //     { 'title': 'First task' },
  //     { 'title': 'Second task' },
  //     { 'title': 'Third task' },
  //     { 'title': 'Fourth task' },
  //     { 'title': 'Fifth task' }
  //   ]);
  // });

  // it("can be get", async function () {
  //   const tasks = await new Task(DB, config).getTasks('myTeam', 3);
  //   tasks.infos.forEach(function (task) {
  //     delete task.solved;
  //   });
  //   expect(tasks.infos).toEqual([
  //     {
  //       "author": "agix",
  //       "difficulty": "medium",
  //       "open": false,
  //       "score": 100,
  //       "state": 3,
  //       "title": "Fifth task",
  //       "type": "Stegano"
  //     },
  //     {
  //       "author": "agix",
  //       "difficulty": "easy",
  //       "open": true,
  //       "score": 150,
  //       "state": 0,
  //       "title": "First task",
  //       "type": "Stegano"
  //     },
  //     {
  //       "author": "agix",
  //       "difficulty": "medium",
  //       "open": true,
  //       "score": 100,
  //       "state": 3,
  //       "title": "Fourth task",
  //       "type": "Stegano"
  //     },
  //     {
  //       "author": "agix",
  //       "difficulty": "medium",
  //       "open": true,
  //       "score": 200,
  //       "state": 1,
  //       "title": "Second task",
  //       "type": "Stegano"
  //     },
  //     {
  //       "author": "agix",
  //       "difficulty": "hard",
  //       "open": true,
  //       "score": 150,
  //       "state": 2,
  //       "title": "Third task",
  //       "type": "Stegano"
  //     }
  //   ]);
  // });

  it("can be created if doesn't exist", async () => {
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

  it("can be edited if it exists",  async () => {
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
