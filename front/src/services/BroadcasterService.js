class BroadcasterService {
  constructor(logger) {
    this.socket = null;
    this.broadcastEnabled = false;
    this.sharedConfigRedis = null;
    this.imageService = null;
    this.logger = logger;
  }

  initialize(options) {
    if (!options) {
      return;
    }

    if (options.socket) {
      this.socket = options.socket;
    }

    if (options.sharedConfigRedis) {
      this.sharedConfigRedis = options.sharedConfigRedis;
      this.broadcastEnabled = true;
    }

    if (options.imageService) {
      this.imageService = options.imageService;
    }
  }

  emitBreakTask(data) {
    this.socket.emit('breakTask', data);
    this._emitCallback('emitBreakTask', data);
  }

  emitRefresh() {
    this.socket.emit('refresh');
    this._emitCallback('emitRefresh');
  }

  emitNewTeam() {
    this.socket.emit('newTeam');
    this._emitCallback('emitNewTeam');
  }

  emitSolvationTask(solvation) {
    this.socket.emit('validation', solvation);
    this._emitCallback('emitSolvationTask', solvation);
  }

  emitReopenTask(taskName) {
    this.socket.emit('reopenTask', taskName);
    this._emitCallback('emitReopenTask', taskName);
  }

  emitMessage(message) {
    this.socket.emit('message', message);
    this._emitCallback('emitMessage', message);
  }

  emitNewImage(imgName) {
    this.imageService.initialize([imgName]);
    this._emitCallback('emitNewImage', imgName);
  }

  broadcastCallback(actionName, options) {
    if (!this.broadcastEnabled) {
      return;
    }

    this.broadcastEnabled = false;
    this.logger.logInfo(`receiving broadcast ${actionName}`);
    try {
      this[actionName](options);
    } finally {
      this.broadcastEnabled = true;
    }
  }

  _emitCallback(actionName, options) {
    if (!this.broadcastEnabled
      || !this.sharedConfigRedis) {
      return;
    }

    this.logger.logInfo(`sending broadcast ${actionName}`);
    this.sharedConfigRedis.serverBroadcast(actionName, options);
  }
}

exports.BroadcasterService = BroadcasterService;
