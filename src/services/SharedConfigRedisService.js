var redis = require('redis');

class SharedConfigRedisService {
  constructor(
    config,
  ) {
    this.config = config;
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
}

exports.SharedConfigRedisService = SharedConfigRedisService;