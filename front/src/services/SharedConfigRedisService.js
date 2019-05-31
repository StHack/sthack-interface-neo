var redis = require('redis');

class SharedConfigRedisService {
  constructor(
    config,
    imageService,
    broadcasterService
  ) {
    this.config = config;
    this.imageService = imageService;
    this.broadcasterService = broadcasterService;
  }

  Initialize() {
    var createClient = (isSubscriber) => redis.createClient(
      this.config.redisPort,
      this.config.redisHost,
      {
        auth_pass: this.config.redisAuth,
        detect_buffers: isSubscriber ? undefined : true,
        return_buffers: isSubscriber
      });

    this.redisClient = createClient(false);
    this.redisPub = createClient(false);
    this.redisSub = createClient(true);
    this.redisAdminPub = createClient(false);
    this.redisAdminSub = createClient(false);

    this._subscribeToAdminEvents();
  }

  getMainClient() {
    return this.redisClient;
  }

  getSocketConfiguration() {
    return {
      pubClient: this.redisPub,
      subClient: this.redisSub
    }
  }

  _subscribeToAdminEvents() {
    this.redisAdminSub.subscribe('adminAction');
    this.redisAdminSub.on('message', (channel, message) => {
      if (message === 'openCTF') {
        this.config.ctfOpen = true;
      }
      else if (message === 'closeCTF') {
        this.config.ctfOpen = false;
      }
      else if (message === 'closeRegistration') {
        this.config.registrationOpen = false;
      }
      else if (message === 'openRegistration') {
        this.config.registrationOpen = true;
      }
      else if (message.startsWith('notifyNewTask,')) {
        const task = JSON.parse(message.replace('notifyNewTask,', ''))
        this.imageService.initialize([task.img]);
      }
      else if (message.startsWith('broadcast,')) {
        const broadcastInfo = JSON.parse(message.replace('broadcast,', ''))
        this.broadcasterService.broadcastCallback(broadcastInfo.actionName, broadcastInfo.options);
      }
    });
  }

  openCTF() {
    this.redisAdminPub.publish('adminAction', 'openCTF');
  }

  closeCTF() {
    this.redisAdminPub.publish('adminAction', 'closeCTF');
  }

  closeRegistration() {
    this.redisAdminPub.publish('adminAction', 'closeRegistration');
  }

  openRegistration() {
    this.redisAdminPub.publish('adminAction', 'openRegistration');
  }

  notifyNewTask(task) {
    this.redisAdminPub.publish('adminAction', 'notifyNewTask,' + JSON.stringify(task));
  }

  serverBroadcast(actionName, options) {
    this.redisAdminPub.publish('adminAction', 'broadcast,' + JSON.stringify({ actionName: actionName, options: options }));
  }
}

exports.SharedConfigRedisService = SharedConfigRedisService;
