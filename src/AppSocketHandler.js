class AppSocketHandler {
  constructor(
    socket,
    socketBroadcast,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB,
    scoreService) {
    this.socket = socket;
    this.socketBroadcast = socketBroadcast;
    this.logger = logger;
    this.messageDB = messageDB;
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.config = config;
    this.scoreService = scoreService;
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

  async getMessages() {
    const messages = await this.messageDB.getMessages();
    this.socket.emit('giveMessages', messages);
  }

  async getScore() {
    const authenticatedTeamName = this.socket.client.request.authenticated;
    const score = await this.scoreService.getScoreOfTeam(authenticatedTeamName);

    this.socket.emit('giveScore', {
      name: authenticatedTeamName,
      score: score.value,
      breakthrough: score.breakthrough
    });
  }

  async getScoreboard() {
    const scoreboard = await this.scoreService.getScoreBoard();
    this.socket.emit('giveScoreboard', scoreboard);
  }

  async getTasks() {
    const tasks = await this.taskDB.getAllTasks();
    //TODO :ça ne marche pas .infos n'existe pas
    // this.socket.emit('giveTasks', tasks.infos);

    await this.getScore();
  }

  async getTask(title) {
    var auth = this.socket.client.request.authenticated;

    this.logger.logSocketRequest(this.socket, [auth, 'getTask', title]);

    const teams = await this.teamDB.list();
    const task = await this.taskDB.getTaskInfos(title, auth, teams.length, true);
    this.socket.emit('giveTask', task);
  }

  async submitFlag(datas) {
    var auth = this.socket.client.request.authenticated;
    if (this.config.ctfOpen === false) {
      this.logger.logSocketRequest(this.socket, [auth, 'submitFlag', datas.title, 'closed']);
      this.socket.emit('nope', 'Ctf closed');
      return;
    }

    try {
      await this.taskDB.solveTask(datas.title, datas.flag, auth);

      this.logger.logSocketRequest(this.socket, [auth, 'submitFlag', datas.title, 'ok']);

      this.notifyEveryoneOfTaskClosing(datas.title, auth);
    } catch (error) {
      this.logger.logSocketError(this.socket, error, [auth, 'submitFlag', datas.title]);
      this.socket.emit('nope', error.toString());
    }
  }


  async updateTask(title) {
    const teams = await this.teamDB.list();

    var auth = this.socket.client.request.authenticated;
    const task = await this.taskDB.getTaskInfos(title, auth, teams.length, false);

    this.socket.emit('updateTask', task);
  }

  async updateTaskScores() {
    var auth = this.socket.client.request.authenticated;

    const lala = this.scoreService.getScoreBoard();
    //TODO
    // const teams = await this.teamDB.list();
    // const tasks = await this.taskDB.getTasks(auth, teams.length);
    // this.socket.emit('updateTaskScores', tasks.infos);

    await this.getScore();
  }

  notifyEveryoneOfTaskClosing(taskName, teamName) {
    this.socketBroadcast.emit('validation', { title: taskName, team: teamName });

    if (this.config.closedTaskDelay > 0) {
      setTimeout(function () {
        this.socketBroadcast.emit('reopenTask', taskName);
      }, this.config.closedTaskDelay);
    }
  }

}

exports.AppSocketHandler = AppSocketHandler;
