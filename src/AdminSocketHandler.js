class AdminSocketHandler {
  constructor(
    socket,
    socketBroadcast,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB,
    imageDB,
    redisService) {
    this.socket = socket;
    this.socketBroadcast = socketBroadcast;
    this.config = config;
    this.logger = logger;

    this.messageDB = messageDB;
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.imageDB = imageDB;

    this.redisService = redisService;
  }

  RegisterEvents() {
    for (const method of [
      this.AddTask,
      this.AddTeam,
      this.Break,
      this.CloseCTF,
      this.CloseRegistration,
      this.DeleteTask,
      this.DeleteTeam,
      this.EditTask,
      this.EditTeam,
      this.ListTasks,
      this.ListTeams,
      this.Message,
      this.OpenCTF,
      this.OpenRegistration,
      this.Refresh,
      this.RegisterEvents
    ]) {
      this.socket.on(`admin${method.name}`, this._getHandler(method));
    }
  }

  _getHandler(method) {
    const self = this;

    return function () {
      if (self.isNotAdmin()) return;

      try {
        self.logger.logInfo(`socket -> ${method.name}`);
        method.bind(self)(...arguments);
      } catch (error) {
        self.logger.logError(error);
        self.socket.emit('error', error);
      }
    }
  }

  isNotAdmin() {
    return this.socket.client.request.authenticated !== this.config.adminName;
  }





  async Break(data) {
    await this.taskDB.breakTask(data.title, data.broken);
    this.socketBroadcast.emit('breakTask', data);
  }

  CloseRegistration(data) {
    if (this.config.environment === 'production') {
      this.redisService.closeRegistration();
    }

    this.config.registrationOpen = false;
    this.socket.emit('adminInfo', this.config.registrationOpen);
  }


  OpenRegistration(data) {
    if (this.config.environment === 'production') {
      this.redisService.openRegistration();
    }

    this.config.registrationOpen = true;
    this.socket.emit('adminInfo', this.config.registrationOpen);
  }

  CloseCTF(data) {
    if (this.config.environment === 'production') {
      this.redisService.closeCTF();
    }

    this.config.ctfOpen = false;
    this.socket.emit('adminInfo', this.config.ctfOpen);
  }

  OpenCTF(data) {
    if (this.config.environment === 'production') {
      this.redisService.openCTF();
    }

    this.config.ctfOpen = true;
    this.socket.emit('adminInfo', this.config.ctfOpen);
  }

  Refresh(data) {
    this.socketBroadcast.emit('refresh');
  }

  async AddTask(data) {
    await this.taskDB.addTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author, data.img, data.tags);
    await this._refreshTasks();
  }

  async EditTask(data) {
    await this.taskDB.editTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author, data.img, data.tags);
    await this._refreshTasks();
  }

  async DeleteTask(data) {
    await this.taskDB.deleteTask(data.title);
    await this._refreshTasks();
  }

  async AddTeam(data) {
    await this.teamDB.addTeam(data.name, data.password);

    const teams = await this.teamDB.list();

    this.socketBroadcast.emit('newTeam');
    this.socket.emit('updateTeams', teams);
  }

  async EditTeam(data) {
    await this.teamDB.editTeam(data.name, data.password);

    const teams = await this.teamDB.list();
    await this.socket.emit('updateTeams', teams);
  }

  async DeleteTeam(data) {
    const teamNameToDelete = data.name;

    if (teamNameToDelete === this.config.adminName) {
      this.socket.emit('adminInfo', 'Alert : Attempt to delete admin account');
    }

    var teams = [];

    try {

      await this.teamDB.deleteTeam(teamNameToDelete);

      teams = await this.teamDB.list();
      const cleanSolvedResult = await this.taskDB.cleanSolved(teamNameToDelete, teams.length);
    } catch (error) {
      this.socket.emit('adminInfo', error);
    }

    var handshakes = this.socketBroadcast.connected;
    for (var key in handshakes) {
      if (handshakes[key].conn.request.authenticated === teamNameToDelete) {
        this.socketBroadcast.sockets[key].disconnect();
      }
    }

    this.redisService.removeTeam(teamNameToDelete);
    this.socketBroadcast.emit('newTeam');
    this.socket.emit('updateTeams', teams);
  }

  async ListTasks() {
    return await this._refreshTasks();
  }

  async ListTeams() {
    const teams = await this.teamDB.list();
    this.socket.emit('updateTeams', teams);
  }

  async Message(data) {
    if (data.submit === 1) {
      await this.messageDB.addMessage(data.message);
      this.socket.emit('adminInfo', 'Message added');
    }

    this.socketBroadcast.emit('message', data);
  }

  async _refreshTasks() {
    const tasks = await this.taskDB.list();

    //this.socketBroadcast.emit('refresh');
    this.socket.emit('updateTasks', tasks);
  }
}

exports.AdminSocketHandler = AdminSocketHandler;
