class AdminSocketHandler {
  constructor(
    socket,
    socketIO,
    broadcasterService,
    config,
    logger,
    messageDB,
    teamDB,
    taskDB,
    imageDB,
    sharedConfigService,
    sessionStore) {
    this.socket = socket;
    this.socketIO = socketIO;
    this.broadcasterService = broadcasterService;
    this.config = config;
    this.logger = logger;

    this.messageDB = messageDB;
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.imageDB = imageDB;

    this.sharedConfigService = sharedConfigService;
    this.sessionStore = sessionStore;
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
      if (self.isNotAdmin()) {
        self.logger.logSocketError(self.socket, `A non-admin user attempt to access '${method.name}'`)
        return;
      }

      try {
        self.logger.logSocketRequest(self.socket, `socket -> ${method.name}`);
        method.bind(self)(...arguments);
      } catch (error) {
        self.logger.logSocketError(self.socket, error);
        self.socket.emit('error', error);
      }
    }
  }

  isNotAdmin() {
    return this.socket.client.request.authenticated !== this.config.adminName;
  }



  async Break(data) {
    await this.taskDB.breakTask(data.title, data.broken);
    this.broadcasterService.emitBreakTask(data);
  }

  CloseRegistration(data) {
    this.sharedConfigService.closeRegistration();
    this.socket.emit('adminInfo', this.config.registrationOpen);
  }

  OpenRegistration(data) {
    this.sharedConfigService.openRegistration();
    this.socket.emit('adminInfo', this.config.registrationOpen);
  }

  CloseCTF(data) {
    this.sharedConfigService.closeCTF();
    this.socket.emit('adminInfo', this.config.ctfOpen);
  }

  OpenCTF(data) {
    this.sharedConfigService.openCTF();
    this.socket.emit('adminInfo', this.config.ctfOpen);
  }

  Refresh(data) {
    this.broadcasterService.emitRefresh();
  }

  async AddTask(data) {
    const task = await this.taskDB.addTask(data.title, data.description, data.flag, data.type, data.difficulty, data.author, data.img, data.tags);
    this.sharedConfigService.notifyNewTask(task);
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

    this.broadcasterService.emitNewTeam();
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
      await this.taskDB.cleanSolved(teamNameToDelete);
    } catch (error) {
      this.socket.emit('adminInfo', error);
    }

    this._disconnectTeam(teamNameToDelete);

    this.broadcasterService.emitNewTeam();
    this.socket.emit('updateTeams', teams);
  }

  _disconnectTeam(teamNameToDisconnect) {
    var handshakes = this.socketIO.sockets.connected;
    for (var key in handshakes) {
      let authenticatedTeamName = handshakes[key].conn.request.authenticated;
      let authenticatedSessionID = handshakes[key].conn.request.sessionID;

      if (authenticatedTeamName === teamNameToDisconnect) {

        delete handshakes[key].conn.request.authenticated;
        delete handshakes[key].conn.request.sessionID;

        handshakes[key].conn.request.destroy();
        handshakes[key].disconnect();

        this.sessionStore.destroy(authenticatedSessionID, (err) => {
          if (err) {
            this.logger.logSocketError(this.socket, err, 'Team sessions not clear properly');
          } else {
            this.logger.logSocketRequest(this.socket, 'Team sessions clear properly');
          }
        });
      }
    }
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

    this.broadcasterService.emitMessage(data);
  }

  async _refreshTasks() {
    const tasks = await this.taskDB.list();

    this.Refresh();
    this.socket.emit('updateTasks', tasks);
  }
}

exports.AdminSocketHandler = AdminSocketHandler;
