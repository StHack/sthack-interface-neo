String.prototype.checksum = function() {
    var hash = 0, i, chr, len;
    if (this.length === 0){
        return hash;
    }
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash.toString();
};

images = {};

function loadImages(callback) {
    var sources = {
        tv: 'tv.png',
        swordfish: 'swordfish.jpg',
    };
    var loadedImages = 0;
    var numImages = 0;
    var src;
    for(src in sources) {
        numImages++;
    }
    for(src in sources) {
        images[src] = new Image();
        images[src].onload = function() {
            if(++loadedImages >= numImages) {
                callback();
            }
        };
        images[src].src = '/img/'+sources[src];
    }
}

function loadTask(task){
    var idTask = task.title.checksum();
    var canvasTask = document.getElementById(idTask);
    var ctx = canvasTask.getContext('2d');
    ctx.save();
    if(task.state>1){
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,canvasTask.width,canvasTask.height);
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(canvasTask.width/2, canvasTask.height/2, 2, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.stroke();
    }
    else{
        ctx.drawImage(images.swordfish,0,0,canvasTask.width,canvasTask.height);
    }

    ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);

    ctx.textAlign = 'center';
    ctx.font = '2em Verdana';
    ctx.shadowColor = '#fff';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-30);

    ctx.font = '1.5em Verdana';
    ctx.fillText(task.type, canvasTask.width/2, canvasTask.height/2+40);

    ctx.font = '2em Verdana';
    ctx.fillText(task.score+' pts', canvasTask.width/2, canvasTask.height/2+5);
    ctx.restore();
}

function validateTask(title, callback){
    var idTask = title.checksum();
    var canvasTask = document.getElementById(idTask);
    var ctx = canvasTask.getContext('2d');
    var radius = 2;
    ctx.save();
    var shutdown = setInterval(function(){
        ctx.arc(canvasTask.width/2, canvasTask.height/2, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.drawImage(images.tv, 0, 0, canvasTask.width, canvasTask.height);
        radius += 70;
        if(radius>canvasTask.width/2+50){
            clearInterval(shutdown);
            var shutdown2 = setInterval(function(){
                ctx.fillStyle = '#000';
                ctx.fillRect(0,0,canvasTask.width,canvasTask.height);

                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.arc(canvasTask.width/2, canvasTask.height/2, radius, 0, 2 * Math.PI, false);
                ctx.fill();
                ctx.stroke();
                ctx.drawImage(images.tv, 0, 0, canvasTask.width, canvasTask.height);
                radius -= 70;
                if(radius < 0){
                    clearInterval(shutdown2);
                    callback();
                }
            }, 50);
        }
    }, 50);
    ctx.restore();
}

function clickTask(canvasTask, callback){
    callback();
}
