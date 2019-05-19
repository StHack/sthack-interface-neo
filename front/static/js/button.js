String.prototype.checksum = function () {
  var hash = 0, i, chr, len;
  if (this.length === 0) {
    return hash;
  }
  for (i = 0, len = this.length; i < len; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString();
};

images = {};

function loadImages(callback) {
  var loadedImages = 0;
  var numImages = 0;
  var src;
  for (src in Images) {
    numImages++;
  }
  for (src in Images) {
    images[src] = new Image();
    images[src].onload = function () {
      if (++loadedImages >= numImages) {
        callback();
      }
    };
    images[src].onerror = function (e) {
      delete images[src];
      if (++loadedImages >= numImages) {
        callback();
      }
    }
    images[src].src = '/img/' + Images[src];
  }
}

function closeDir(canvasDir, type, callback) {
  var ctx = canvasDir.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvasDir.width, canvasDir.height);
  ctx.drawImage(images.folder, 0, 0, canvasDir.width, canvasDir.height);

  ctx.textAlign = 'center';
  ctx.font = '2em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#c72127';
  ctx.fillText(type, canvasDir.width / 2, canvasDir.height / 2);

  ctx.restore();

  callback();
}

function openDir(canvasDir, type, callback) {
  var ctx = canvasDir.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvasDir.width, canvasDir.height);
  ctx.drawImage(images.folder_open, 0, 0, canvasDir.width, canvasDir.height);

  ctx.textAlign = 'center';
  ctx.font = '2em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#c72127';
  ctx.fillText(type, canvasDir.width / 2, canvasDir.height / 2);

  ctx.restore();

  callback();
}

function loadDir(type, plus) {
  var idDir = type.checksum();
  var canvasDir = document.getElementById(idDir);
  var status = JSON.parse($(canvasDir).text());
  var ctx = canvasDir.getContext('2d');
  ctx.save();
  ctx.clearRect(0, 0, canvasDir.width, canvasDir.height);
  if (typeof (images[type.toLowerCase()]) === 'undefined') {
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, canvasDir.width, canvasDir.height);
  }
  else {
    // ctx.drawImage(images[type.toLowerCase()], 0, 0, images[type.toLowerCase()].width, images[type.toLowerCase()].height, canvasDir.width*0.2/2, canvasDir.height*0.2/2, canvasDir.width*0.8, canvasDir.height*0.8);
    ctx.drawImage(images[type.toLowerCase()], 0, 0, images[type.toLowerCase()].width, images[type.toLowerCase()].height, 0, 0, canvasDir.width, canvasDir.height);
  }

  ctx.textAlign = 'center';
  ctx.font = '1.2em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  if (typeof plus !== 'undefined') {
    status.solved += 1;
    canvasDir.textContent = JSON.stringify(status);
  }
  if (status.count === status.solved) {
    ctx.fillStyle = 'green';
  } else {
    ctx.fillStyle = 'red';
  }
  ctx.fillText(status.solved + '/' + status.count, canvasDir.width * 0.90, canvasDir.height * 0.20);

  ctx.restore();
}

var anim;

function printText(ctx, canvasTask, task) {
  ctx.save();
  ctx.textAlign = 'center';
  var fontsize = 2;
  if (task.title.length > 10) {
    fontsize = 28 / task.title.length;
  }
  ctx.font = fontsize + 'em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#000';
  //ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

  ctx.font = '2em DejaVu Sans';
  ctx.fillText(task.score + ' pts', canvasTask.width / 2, canvasTask.height * 0.9);
  ctx.restore();
}

function printBroken(ctx, canvasTask) {
  ctx.save();
  ctx.textAlign = 'center';
  var fontsize = 2;

  ctx.font = fontsize + 'em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  ctx.fillStyle = 'red';
  //ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

  ctx.font = '2em DejaVu Sans';
  ctx.fillText('Down', canvasTask.width / 2, canvasTask.height / 2);
  ctx.restore();
}

function printClosed(ctx, canvasTask) {
  ctx.save();
  ctx.textAlign = 'center';
  var fontsize = 2;

  ctx.font = fontsize + 'em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;
  ctx.fillStyle = 'red';
  //ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

  ctx.font = '2em DejaVu Sans';
  ctx.fillText('Pwned', canvasTask.width / 2, canvasTask.height / 2);
  ctx.restore();
}

function loadTask(canvasTask) {
  var task = JSON.parse($(canvasTask).text());
  var ctx = canvasTask.getContext('2d');
  ctx.clearRect(0, 0, canvasTask.width, canvasTask.height);
  if (task.state > 1) {
    ctx.globalAlpha = 0.2;
  }

  if (typeof (images[task.img]) === 'undefined') {
    ctx.fillStyle = "blue";
    ctx.fillRect(canvasTask.width * 0.3 / 2, 0, canvasTask.width * 0.7, canvasTask.height * 0.7);
  }
  else {
    ctx.drawImage(images[task.img], 0, 0, images[task.img].width, images[task.img].height, canvasTask.width * 0.3 / 2, 0, canvasTask.width * 0.7, canvasTask.height * 0.7);
  }

  if (typeof (task.broken) !== 'undefined' && task.broken === true) {
    printBroken(ctx, canvasTask);
  } else if (typeof (task.open) !== 'undefined' && task.open === false) {
    printClosed(ctx, canvasTask);
  }

  printText(ctx, canvasTask, task);
  ctx.textAlign = 'center';
  ctx.font = '1.2em DejaVu Sans';
  ctx.shadowColor = '#000';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 5;

  ctx.fillStyle = 'blue';

  ctx.fillText('' + task.solved.length, canvasTask.width * 0.80, canvasTask.height * 0.10);
}

function validateTask(canvasTask, callback) {
  loadTask(canvasTask);
  callback();
}

function clickTask(canvasTask, callback) {
  clearInterval(anim);
  callback();
}

function reopenTask(canvasTask) {
  loadTask(canvasTask);
}

function closeTask(canvasTask) {
  loadTask(canvasTask);
}
