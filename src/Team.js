var createHash = require('crypto').createHash;
var sortBy = require('lodash').sortBy;

class Team {
  constructor(db) {
    this.db = db;
  }

  _hashPassword(password) {
    return createHash('sha256').update(password).digest('hex');
  }

  async list() {
    const teams = await this.db.find('teams', {}, { 'name': 1, '_id': 0 });
    return sortBy(teams, ['name']);
  }

  async areLoginsValid(name, password) {
    var hashedPassword = this._hashPassword(password);
    const teams = await this.db.find('teams', { 'name': name, 'password': hashedPassword }, {});

    return teams.length > 0;
  }

  async addTeam(name, password) {
    var hashedPassword = this._hashPassword(password);
    const teams = await this.db.find('teams', { 'name': name }, {});

    if (teams.length > 0) {
      throw new Error("Team already exists");
    }

    const insertResult = this.db.insert('teams', { 'name': name, 'password': hashedPassword });

    return true;
  }

  async editTeam(name, password) {
    var hashedPassword = this._hashPassword(password);
    const updateResult = await this.db.update('teams', { 'name': name }, { 'password': hashedPassword });

    if (updateResult === 1) {
      return true;
    }

    throw Error('No team updated');
  }

  async deleteTeam(name) {
    const deleteResut = await this.db.remove('teams', { 'name': name });

    if (deleteResut === 1) {
      return true;
    }

    throw Error('No team removed');
  }
}

exports.Team = Team;
