class LoggerService {
  constructor() {
  }

  _getMessage(message) {
    if (!(message)) {
      return '';
    } else if (Array.isArray(message)) {
      return message.map(value => `"${value.replace(/"/g, '\\"')}"`).reduce((str, val) => `${str} ${val}`);
    } else {
      return `"${message.replace(/"/g, '\\"')}"`;
    }
  }

  logError(error, message) {
    const d = new Date().toISOString();
    console.log(`"${d}" "${error.stack || error}"`);
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

  logInfo(message) {
    const d = new Date().toISOString();
    console.log(`"${d}" "${this._getMessage(message)}"`);
  }

}

exports.LoggerService = LoggerService;
