class AppSocketHandler {
  constructor(
    socket,
    socketBroadcast,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB) {
    this.socket = socket;
    this.socketBroadcast = socketBroadcast;
    this.logger = logger;
    this.messageDB = messageDB;
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.config = config;
  }

  RegisterEvents() {
    for (const method of [
      this.getMessages,
      this.getScore,
      this.getScoreboard,
      this.getTask,
      this.getTasks,
      this.submitFlag,
      this.updateTask,
      this.updateTaskScores
    ]) {
      this.socket.on(method.name, this._getHandler(method));
    }
  }

  _getHandler(method) {
    const self = this;

    return function () {
      try {
        self.logger.logInfo(`socket -> ${method.name}`);
        method.bind(self)(...arguments);
      } catch (error) {
        self.logger.logError(error);
        self.socket.emit('error', error);
      }
    }
  }

  _getScoreInfos(tasks, team) {
    var score = 0;
    var bt = [];
    var last = 0;
    var lastTask = '';
    var taskSolved = {};

    for (const task of tasks) {
      var solved = this.taskDB.teamSolved(task, team);
      if (solved.ok) {
        if (taskDB.teamSolvedFirst(task, team).ok) {
          bt.push(task.title);
        }
        score += task.score;
        if (last < solved.time) {
          last = solved.time;
          lastTask = task.title;
        }
        taskSolved[task.title] = solved.time;
      }
    }

    return {
      value: score,
      breakthrough: bt,
      lastTask: lastTask,
      last: last,
      solved: taskSolved
    };
  }

  async getMessages() {
    const messages = await this.messageDB.getMessages();
    this.socket.emit('giveMessages', messages);
  }

  async getScore() {
    var auth = this.socket.client.request.authenticated;

    const teams = await this.teamDB.list();
    const tasks = await this.taskDB.getTasks(auth, teams.length);
    const score = this._getScoreInfos(tasks.raw, auth);
    this.socket.emit('giveScore', { name: auth, score: score.value, breakthrough: score.breakthrough });
  }

  async getScoreboard() {
    var auth = this.socket.client.request.authenticated;

    const teams = await this.teamDB.list();
    const tasks = await this.taskDB.getTasks(auth, teams.length);

    var scoreboard = [];

    for (const team of teams) {
      var score = this._getScoreInfos(tasks.raw, team.name);
      scoreboard.push({
        team: team.name,
        score: score.value,
        lastTask: score.lastTask,
        time: -score.last,
        breakthrough: score.breakthrough,
        solved: score.solved
      });
    }

    var orderedScoreboard = _.sortBy(scoreboard, ['score', 'time']).reverse();
    this.socket.emit('giveScoreboard', orderedScoreboard);
  }

  async getTasks() {
    var auth = this.socket.client.request.authenticated;

    const teams = await this.teamDB.list();
    const tasks = await this.taskDB.getTasks(auth, teams.length);

    this.socket.emit('giveTasks', tasks.infos);
    var score = this._getScoreInfos(tasks.raw, auth);
    this.socket.emit('giveScore', { name: auth, score: score.value, breakthrough: score.breakthrough });
  }

  async getTask(title) {
    var d = new Date().toISOString();
    var auth = this.socket.client.request.authenticated

    console.log(`"${d}" "${this.socket.handshake.address}" "${auth.replace(/"/g, '\\"')}" "getTask" "${title}" "-"`);

    const teams = this.teamDB.list();
    const task = this.taskDB.getTaskInfos(title, auth, teams.length, true);
    this.socket.emit('giveTask', task);
  }

  async submitFlag(datas) {
    var d = new Date().toISOString();
    var auth = this.socket.client.request.authenticated;
    if (ctfOpen) {
      try {
        const result = await this.taskDB.solveTask(datas.title, datas.flag, auth);

        console.log(`"${d}" "${this.socket.handshake.address}" "${auth.replace(/"/g, '\\"')}" "submitFlag" "${datas.title}" "ok"`);

        this.socketBroadcast.emit('validation', { title: datas.title, team: auth });
        var message = auth + ' solved ' + datas.title;
        //this.socketBroadcast.emit('message', {submit: 2, message: message});
        //this.messageDB.addMessage(message);
        if (this.config.closedTaskDelay > 0) {
          setTimeout(function () {
            this.socketBroadcast.emit('reopenTask', datas.title);
          }, this.config.closedTaskDelay);
        }

      } catch (error) {
        console.log('"' + d + '" "' + this.socket.handshake.address + '" "' + auth.replace(/"/g, '\\"') + '" "submitFlag" "' + datas.title + '" "ko"');
        this.socket.emit('nope', error.toString());
      }
    }
    else {
      console.log('"' + d + '" "' + this.socket.handshake.address + '" "' + auth.replace(/"/g, '\\"') + '" "submitFlag" "' + datas.title + '" "closed"');
      this.socket.emit('nope', 'Ctf closed');
    }
  }

  async updateTask(title) {
    const teams = await this.teamDB.list();

    var auth = this.socket.client.request.authenticated;
    const tasks = await this.taskDB.getTaskInfos(title, auth, teams.length, false);

    this.socket.emit('updateTask', task);
  }

  async updateTaskScores() {
    var auth = this.socket.client.request.authenticated;

    const teams = await this.teamDB.list();
    const tasks = await this.taskDB.getTasks(auth, teams.length);
    this.socket.emit('updateTaskScores', tasks.infos);
    var score = getScoreInfos(tasks.raw, auth);
    this.socket.emit('giveScore', { name: auth, score: score.value, breakthrough: score.breakthrough });
  }
}

exports.AppSocketHandler = AppSocketHandler;
