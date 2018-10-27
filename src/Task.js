var createHash = require('crypto').createHash;
var _ = require('lodash');

var StringOperator = require('./StringOperator').StringOperator;

class Task {
  constructor(db, config, imageDB) {
    this.config = config;
    this.db = db;
    this.imageDB = imageDB;
  }

  async list() {
    const tasks = await this.db.find('tasks', {}, { 'title': 1, '_id': 0 });
    return tasks//_.sortBy(tasks, ['title']);
  }

  async exists(title) {
    const tasks = await this.db.find('tasks', { 'title': title }, { 'title': 1, '_id': 0 });
    return tasks.length > 0;
  }

  async getTask(title) {
    const tasks = await this.db.find('tasks', { 'title': title }, { '_id': 0 });

    if (tasks.length < 1) {
      throw new Error('Task doesn\'t exsit');
    }

    return tasks[0];
  }

  async breakTask(title, broken) {
    await this.db.update('tasks', { 'title': title }, { 'broken': broken });
  }

  async deleteTask(title) {
    const tasks = await this.db.remove('tasks', { 'title': title });
    if (tasks !== 1) {
      return new Error('No team removed');
    }

    return true;
  }



  async getTasks(teamName, countTeam) {
    var infosTasks = [];
    const tasks = await this.db.find('tasks', {}, { '_id': 0 });

    for (const task of tasks) {
      var infos = this.getInfos(task, teamName, countTeam);
      task.score = infos.score;
      task.state = infos.state;
      task.open = infos.open;
      task.broken = infos.broken;
      infosTasks.push(infos);
    }

    return {
      infos: _.sortBy(infosTasks, ['title']),
      raw: _.sortBy(tasks, ['title'])
    };
  }

  async getTaskInfos(title, teamName, countTeam, description) {
    const task = await this.getTask(title);
    return this.getInfos(task, teamName, countTeam, description);
  }

  async addTask(title, description, flag, type, difficulty, author, img, tags) {
    const exist = await this.exists(title);

    if (exist) {
      throw new Error('Task already exists');
    }

    let imageName = 'default';
    if (img) {
      const imageName = StringOperator.checksum(title);
      imageName = this.imageDB.saveImage(img.split(',')[1]);
    }

    const hashedFlag = createHash('sha256').update(flag).digest('hex');
    const task = {
      title: title,
      img: imageName,
      description: description,
      flags: [hashedFlag],
      type: type.toLowerCase(),
      tags: tags,
      difficulty: difficulty,
      author: author
    };

    return this.db.insert('tasks', task);
  }

  getInfos(task, teamName, countTeam, description) {
    var infos = {
      title: task.title,
      type: task.type,
      difficulty: task.difficulty,
      author: task.author,
      broken: task.broken,
      img: task.img,
    };

    infos.score = this.getScore(task, countTeam);
    infos.solved = this.getSolved(task);
    infos.state = this.getSolvedState(task, teamName).state;
    infos.open = this.isOpen(task);

    if (description) {
      infos.description = task.description;
      infos.tags = task.tags;
    }

    return infos;
  }

  getScore(task, countTeam) {
    var solved = this.getSolved(task);

    switch (task.difficulty) {
      case 'easy':
        return this.config.baseScore * (countTeam - solved.length);
      case 'medium':
        return this.config.baseScore * 2 * (countTeam - solved.length);
      default:
        return this.config.baseScore * 3 * (countTeam - solved.length);
    }
  }

  getSolvedState(task, teamName) {
    var solved = this.getSolved(task);
    //nobody solved
    var solvedState = 0;
    var solvedTime = 0;
    if (solved.length > 0) {
      //someone solved
      solvedState++;
      solvedTime = _.result(_.find(solved, { 'teamName': teamName }), 'timestamp');
      if (solvedTime) {
        //your team solved
        solvedState++;
        if (solved[0].teamName === teamName) {
          //your team solved first
          solvedState++;
        }
      }
    }
    return { state: solvedState, time: solvedTime };
  }

  expectedState(task, teamName, state) {
    var solved = this.getSolvedState(task, teamName);
    if (state === 0) {
      return (solved.state === state);
    } else {
      return { ok: (solved.state >= state), time: solved.time };
    }
  }

  nobodySolved(task) {
    return this.expectedState(task, '', 0);
  }

  someoneSolved(task) {
    return this.expectedState(task, '', 1).ok;
  }

  teamSolved(task, teamName) {
    return this.expectedState(task, teamName, 2);
  }
  teamSolvedFirst(task, teamName) {
    return this.expectedState(task, teamName, 3);
  }

  isSolvableByTeam(task, teamName) {
    if (this.teamSolved(task, teamName).ok) {
      return false;
    } else if (this.isOpen(task)) {
      return true;
    } else {
      return false;
    }
  }

  isOpen(task) {
    var solved = this.getSolved(task);
    if (solved.length > 0 && parseInt(solved[solved.length - 1].timestamp) + parseInt(this.config.closedTaskDelay) > (new Date()).getTime()) {
      return false;
    } else {
      return true;
    }
  }

  getSolved(task) {
    return _.sortBy(task.solved, ['timestamp']);
  }

  isFlag(task, flag) {
    var hashedFlag = createHash('sha256').update(flag).digest('hex');
    return (task.flags.indexOf(hashedFlag) > -1);
  }

  async solveTask(title, flag, teamName) {
    const task = await this.getTask(title);

    if (this.isSolvableByTeam(task, teamName)) {
      if (this.isFlag(task, flag)) {
        var solved = this.getSolved(task);
        solved.push({ "teamName": teamName, "timestamp": new Date().getTime() });
        return await this.db.update('tasks', { 'title': title }, { 'solved': solved });
      } else {
        throw new Error('Bad flag');
      }
    } else {
      throw new Error("You can't solve this task");
    }

    return true;
  }

  async editTask(title, description, flag, type, difficulty, author, img, tags) {
    const hashedFlag = createHash('sha256').update(flag).digest('hex');
    let imageName = 'default';
    if (img) {
      const imageName = StringOperator.checksum(title);
      imageName = this.imageDB.saveImage(img.split(',')[1]);
    }

    var task = {
      description: description,
      flags: [hashedFlag],
      img: imageName,
      type: type.toLowerCase(),
      tags: tags,
      difficulty: difficulty,
      author: author
    };
    if (flag === '') {
      delete task.flags;
    }
    if (img === '') {
      delete task.img;
    }

    return await this.db.update('tasks', { 'title': title }, task);
  }


  async cleanSolved(teamName, countTeam) {
    const tasks = await this.getTasks(teamName, countTeam);

    for (const task of tasks.raw) {

      if (task.solved) {
        var newSolved = _.filter(task.solved, (elem) => teamName !== elem.teamName);

        if (newSolved.length !== task.solved.length) {
          await this.db.update('tasks', { 'title': task.title }, { 'solved': newSolved });
        }
      }
    }

    return null;
  }
}

exports.Task = Task;
