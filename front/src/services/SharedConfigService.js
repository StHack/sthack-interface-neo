class SharedConfigService {
  constructor(config) {
    this.config = config;
  }

  Initialize() {
  }

  openCTF() {
    this.config.ctfOpen = true;
  }

  closeCTF() {
    this.config.ctfOpen = false;
  }

  closeRegistration() {
    this.config.registrationOpen = false;
  }

  openRegistration() {
    this.config.registrationOpen = true;
  }

  notifyNewTask(task) {
  }
}

exports.SharedConfigService = SharedConfigService;
