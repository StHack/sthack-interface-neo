var DB = require('./DB').DB;
var sortBy = require('lodash').sortBy;

class Message {
  constructor(db) {
    this.db = db || new DB('mongodb://login:password@127.0.0.1:27017/sthack');
  }

  async addMessage(message) {
    await this.db.insert('messages', { 'timestamp': new Date().getTime(), 'content': message });
  }

  async getMessages() {
    const messages = await this.db.find('messages', {}, { '_id': 0 });
    return sortBy(messages, ['timestamp']);
  }
}

exports.Message = Message;
