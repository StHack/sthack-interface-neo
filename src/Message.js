var { sortBy } = require('lodash');

class Message {
  constructor(db) {
    this.db = db;
  }

  async addMessage(message) {
    await this.db.insert('messages', { 'timestamp': new Date().getTime(), 'content': message });
  }

  async getMessages() {
    const messages = await this.db.find('messages', {});
    return sortBy(messages, ['timestamp']);
  }
}

exports.Message = Message;
