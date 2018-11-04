var { writeFileSync } = require('fs');

class Image {
  constructor() {
    this.resources = {
      backdoor: 'backdoor.png',
      crypto: 'crypto.png',
      forensic: 'forensics.png',
      hardware: 'hardware.png',
      network: 'network.png',
      pwn: 'pwn.png',
      reverse: 'reverse.png',
      shellcode: 'shellcode.png',
      web: 'web.png',
      misc: 'misc.png',
      recon: 'recon.png',
      game: 'game.png',
    };
  }

  getList() {
    return this.resources;
  }

  async initialize(imageNames) {
    for (const imageName of imageNames) {
      this._insertResources(imageName);
    }

    return this.resources;
  }

  saveImage(imageName, imageBase64Encoded) {
    if (!(imageBase64Encoded)) {
      return null;
    }

    var buf = Buffer.from(imageBase64Encoded, 'base64');
    if (buf.readUInt32BE(0) !== 2303741511) {
      throw new Error('Not a PNG file');
    }

    writeFileSync(__dirname + '/../../public/img/tasks/' + imageName + '.png', buf);

    this._insertResources(imageName);

    return imageName;
  }

  _insertResources(imageName) {
    this.resources[imageName] = 'tasks/' + imageName + '.png';
  }

}

exports.Image = Image;
