var MongoClient = require('mongodb').MongoClient;

class DB {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.execute = this.execute.bind(this);
  }

  async execute(requestFctn) {
    const client = await MongoClient.connect(this.connectionString, { useNewUrlParser: true });

    try {
      return await requestFctn(client.db());
    } finally {
      client.close();
    }
  };

  async find(collection, request, fields) {
    return await this.execute(async db => {
      var coll = db.collection(collection);
      return await coll.find(request, fields).toArray();
    });
  }

  async insert(collection, object) {
    return await this.execute(async db => {
      var coll = db.collection(collection);
      return await coll.insert(object);
    });
  }

  async update(collection, object, update) {
    return await this.execute(async db => {
      var coll = db.collection(collection);
      return await coll.update(object, { '$set': update });
    });
  }

  async remove(collection, object) {
    return await this.execute(async db => {
      var coll = db.collection(collection);
      await coll.remove(object);
    });
  }
}

exports.DB = DB;
