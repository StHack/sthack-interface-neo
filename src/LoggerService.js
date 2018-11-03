class LoggerService {
  constructor() {
  }

  _getMessage(message) {
    if (!(message)) {
      return '';
    }

    if (Array.isArray(message)) {
      return message
        .map(value => `"${value.replace(/"/g, '\\"')}"`)
        .reduce((str, val) => `${str} ${val}`);
    }

    return `"${message.replace(/"/g, '\\"')}"`;
  }

  logError(error, message) {
    const d = new Date().toISOString();
    console.log(`"${d}" "An error occured"`);
    console.log(error.stack || error);
  }

  logInfo(message) {
    const d = new Date().toISOString();
    console.log(`"${d}" ${this._getMessage(message)}`);
  }

  logExpressRequest(req, message) {
    const d = new Date().toISOString();

    console.log(`"${d}" "${req.connection.remoteAddress}" "-" "${req.path}" ${this._getMessage(message)}`);
  }

  logExpressError(req, error, message) {
    const d = new Date().toISOString();

    console.log(`"${d}" "${req.connection.remoteAddress}" "-" "${req.path}" ${this._getMessage(message)} "ko"`);
    console.log(error.stack || error);
  }

  logSocketRequest(socket, message) {
    const d = new Date().toISOString();

    console.log(`"${d}" "${socket.handshake.address}" ${this._getMessage(message)}`);
  }

  logSocketError(socket, error, message) {
    const d = new Date().toISOString();

    console.log(`"${d}" "${socket.handshake.address}" ${this._getMessage(message)} "ko"`);
    console.log(error.stack || error);
  }

}

exports.LoggerService = LoggerService;
