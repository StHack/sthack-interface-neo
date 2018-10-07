class Image {
  constructor(
    config,
    taskDB,
  ) {
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

    this.config = config;
    this.taskDB = taskDB;
  }

  getList() {
    return this.resources;
  }

  async refreshImages() {
    const tasks = await this.taskDB.list();

    for (const task of tasks) {
      this.resources[task.img] = 'tasks/' + task.img + '.png';
    }

    return this.resources;
  }

}

exports.Image = Image;
