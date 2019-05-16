class AppHttpHandler {
  constructor(
    config,
    logger,
    imageDB,
    teamDB,
    taskDB,
    scoreService,
    socketBroadcast
  ) {
    this.config = config;
    this.logger = logger;
    this.imageDB = imageDB;
    this.teamDB = teamDB;
    this.taskDB = taskDB;
    this.scoreService = scoreService;
    this.socketBroadcast = socketBroadcast;

    this.home = this.home.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.rules = this.rules.bind(this);
    this.scoreboard = this.scoreboard.bind(this);
    this.teamScoreboard = this.teamScoreboard.bind(this);
    this.submitFlag = this.submitFlag.bind(this);
    this.admin = this.admin.bind(this);
  }

  RegisterRoute(app) {
    app.get('/', this.home);
    app.post('/', this.login);
    app.all('/register', this.register);
    app.get('/rules', this.rules);
    app.get('/scoreboard', this.scoreboard);
    app.get('/simple', this.teamScoreboard);
    app.post('/submitFlag', this.submitFlag);
    app.get(this.config.adminPath, this.admin);
  }

  async home(req, res) {
    if (req.session.authenticated) {
      res.render('index', {
        title: this.config.siteTitle,
        current: 'index',
        auth: 1,
        socketIOUrl: 'http://' + req.headers.host,
        Images: JSON.stringify(this.imageDB.getList())
      });
    }
    else {
      var teams = [];

      try {
        teams = await this.teamDB.list();
      } catch (error) {
        this.logger.logError(error);
      }

      res.render('login', {
        title: this.config.siteTitle,
        current: 'index',
        teams_list: teams,
        registrationOpen: this.config.registrationOpen,
        Images: JSON.stringify(this.imageDB.getList())
      });
    }
  }

  async register(req, res) {
    if (this.config.registrationOpen === false) {
      res.redirect(302, '/');
      return;
    }

    if (req.method === 'POST' && typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined') {
      try {
        await this.teamDB.addTeam(req.body.name, req.body.password);

        this.logger.logExpressRequest(req, [req.body.name, 'ok']);
        this.socketBroadcast.emit('newTeam');
        res.redirect(302, '/');
      } catch (error) {
        this.logger.logExpressError(req, error);
        res.render('register', {
          current: 'register',
          title: this.config.siteTitle,
          error: error,
          registrationOpen: this.config.registrationOpen,
          Images: JSON.stringify(this.imageDB.getList())
        });
      }
    }
    else {
      res.render('register', {
        current: 'register',
        title: this.config.siteTitle,
        error: '',
        registrationOpen: this.config.registrationOpen,
        Images: JSON.stringify(this.imageDB.getList())
      });
    }
  }

  async login(req, res) {
    if (typeof req.body.name !== 'undefined' && typeof req.body.password !== 'undefined') {
      try {
        const isLoginValid = await this.teamDB.areLoginsValid(req.body.name, req.body.password);

        if (isLoginValid) {
          this.logger.logExpressRequest(req, [req.body.name, 'ok']);
          req.session.authenticated = req.body.name;
        } else {
          this.logger.logExpressRequest(req, [req.body.name, 'ko']);
        }

        res.redirect(302, '/');
      } catch (error) {
        this.logger.logExpressError(req, error, req.body.name);
      }
    } else {
      res.redirect(302, '/');
    }
  }

  rules(req, res) {
    if (req.session.authenticated) {
      var auth = 1;
    }

    res.render('rules', {
      current: 'rules',
      baseScore: this.config.baseScore,
      title: this.config.siteTitle,
      auth: auth,
      registrationOpen: this.config.registrationOpen,
      socketIOUrl: 'http://' + req.headers.host,
      Images: JSON.stringify(this.imageDB.getList())
    });
  }

  scoreboard(req, res) {
    res.render('scoreboard', {
      current: 'scoreboard',
      title: this.config.siteTitle,
      auth: 1,
      registrationOpen: this.config.registrationOpen,
      socketIOUrl: 'http://' + req.headers.host,
      Images: JSON.stringify(this.imageDB.getList())
    });
  }

  async teamScoreboard(req, res) {
    try {
      const tasks = await this.taskDB.getAllTasks();
      const teamScore = await this.scoreService.getScoreOfTeam(req.session.authenticated);

      res.render('simple', { tasks: tasks, title: this.config.siteTitle, score: teamScore.value });
    } catch (error) {
      res.render('simple', { tasks: [], title: this.config.siteTitle, score: 0 });
    }
  }

  async submitFlag(req, res) {
    if (this.config.ctfOpen) {
      this.logger.logExpressRequest(req, error, [req.session.authenticated, req.body.title, 'closed']);
      res.redirect(302, '/simple');
      return;
    }

    if (req.body.title
      && req.body.flag) {

      try {
        await this.taskDB.solveTask(req.body.title, req.body.flag, req.session.authenticated);

        this.logger.logExpressRequest(req, [req.session.authenticated, req.body.title, 'ok'])

        this.socketBroadcast.emit('validation', { title: req.body.title, team: req.session.authenticated });

        if (this.config.closedTaskDelay > 0) {
          setTimeout(function () {
            this.socketService.sendToAll('reopenTask', req.body.title);
          }, this.config.closedTaskDelay);
        }

      } catch (error) {
        this.logger.logExpressError(req, error, [req.session.authenticated, req.body.title]);
      }
    }

    res.redirect(302, '/simple');
  }

  admin(req, res) {
    if (req.session.authenticated && req.session.authenticated === this.config.adminName) {
      res.render('admin', {
        title: this.config.siteTitle,
        current: 'index',
        admin: 1,
        auth: 1,
        socketIOUrl: 'http://' + req.headers.host,
        Images: JSON.stringify(this.imageDB.getList())
      });
    }
    else {
      res.redirect(302, '/');
    }
  }

}

exports.AppHttpHandler = AppHttpHandler;
