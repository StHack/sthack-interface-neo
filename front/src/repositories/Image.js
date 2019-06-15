var { writeFileSync } = require('fs');

class Image {
  constructor(broadcasterService) {
    this.broadcasterService = broadcasterService;
    this.resources = {
      backdoor: 'categorie/backdoor.png',
      crypto: 'categorie/crypto.png',
      forensic: 'categorie/forensics.png',
      hardware: 'categorie/hardware.png',
      network: 'categorie/network.png',
      pwn: 'categorie/pwn.png',
      reverse: 'categorie/reverse.png',
      shellcode: 'categorie/shellcode.png',
      web: 'categorie/web.png',
      misc: 'categorie/misc.png',
      recon: 'categorie/recon.png',
      game: 'categorie/game.png',
      default: 'categorie/default.png',
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
    this.broadcasterService.emitNewImage(imageName);

    return imageName;
  }

  _insertResources(imageName) {
    this.resources[imageName] = 'tasks/' + imageName + '.png';
  }

}

exports.Image = Image;
