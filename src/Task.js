const { createHash } = require('crypto');
const { StringOperator } = require('./StringOperator');

class Task {
  constructor(
    db,
    config,
    imageDB,
    scoreInfoService) {
    this.config = config;
    this.db = db;
    this.imageDB = imageDB;
    this.scoreInfoService = scoreInfoService;
  }

  _hashFlag(flag) {
    return createHash('sha256').update(flag).digest('hex');
  }

  async list() {
    const tasks = await this.db.find('tasks', {}, { 'title': 1 });
    return tasks;
  }

  async exists(title) {
    const tasks = await this.db.find('tasks', { 'title': title }, { 'title': 1 });
    return tasks.length > 0;
  }

  async getTask(title) {
    const tasks = await this.db.find('tasks', { 'title': title });

    if (tasks.length === 0) {
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


  async getAllTasks() {
    return await this.db.find('tasks', {});
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
      const imgName = StringOperator.checksum(title);
      imageName = this.imageDB.saveImage(imgName, img.split(',')[1]);
    }

    const hashedFlag = this._hashFlag(flag);
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

    infos.score = this.scoreInfoService.getScore(task, countTeam);
    infos.solved = this.scoreInfoService.getOrderedSolvation(task);
    infos.state = this.scoreInfoService.getTaskSolvedState(task, teamName).state;
    infos.open = this.scoreInfoService.isOpen(task);

    if (description) {
      infos.description = task.description;
      infos.tags = task.tags;
    }

    return infos;
  }

  isFlag(task, flag) {
    var hashedFlag = this._hashFlag(flag);
    return task.flags.indexOf(hashedFlag) > -1;
  }

  async solveTask(title, flag, teamName) {
    const task = await this.getTask(title);

    if (this.scoreInfoService.isSolvableByTeam(task, teamName) === false) {
      throw new Error("You can't solve this task");
    }

    if (this.isFlag(task, flag) === false) {
      throw new Error('Bad flag');
    }

    task.solved.push({ "teamName": teamName, "timestamp": new Date().getTime() });
    return await this.db.update('tasks', { 'title': title }, { 'solved': solved });
  }

  async editTask(title, description, flag, type, difficulty, author, img, tags) {
    let imageName = 'default';
    if (img) {
      const imgName = StringOperator.checksum(title);
      imageName = this.imageDB.saveImage(imgName, img.split(',')[1]);
    }

    const hashedFlag = this._hashFlag(flag);
    let task = {
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


  async cleanSolved(teamName) {
    const tasks = await this.getAllTasks();

    const updates = [];

    for (const task of tasks) {
      if (!(task.solved)) {
        continue;
      }

      let newSolved = task.solved.filter(el => el.teamName !== teamName);

      if (newSolved.length !== task.solved.length) {
        updates.push(this.db.update('tasks', { 'title': task.title }, { 'solved': newSolved }));
      }
    }

    await Promise.all(updates);
  }
}

exports.Task = Task;
