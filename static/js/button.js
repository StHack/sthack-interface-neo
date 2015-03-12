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
        folder: 'folder.png',
        folder_open: 'folder_open.png',
        easy: 'easy.jpg',
        hard: 'hard.jpg',
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

function closeDir(canvasDir, type, callback){
    var ctx = canvasDir.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasDir.width,canvasDir.height);
    ctx.drawImage(images.folder, 0, 0, canvasDir.width,canvasDir.height);

    ctx.textAlign = 'center';
    ctx.font = '2em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#c72127';
    ctx.fillText(type, canvasDir.width/2, canvasDir.height/2);

    ctx.restore();

    callback();
}

function openDir(canvasDir, type, callback){
    var ctx = canvasDir.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasDir.width,canvasDir.height);
    ctx.drawImage(images.folder_open, 0, 0, canvasDir.width,canvasDir.height);

    ctx.textAlign = 'center';
    ctx.font = '2em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#c72127';
    ctx.fillText(type, canvasDir.width/2, canvasDir.height/2);

    ctx.restore();

    callback();
}

function loadDir(type){
    var idDir = type.checksum();
    var canvasDir = document.getElementById(idDir);
    var ctx = canvasDir.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasDir.width,canvasDir.height);
    ctx.drawImage(images.folder,0,0,canvasDir.width,canvasDir.height);

    ctx.textAlign = 'center';
    ctx.font = '2em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#c72127';
    ctx.fillText(type, canvasDir.width/2, canvasDir.height/2);

    ctx.restore();
}

var anim;

function enter(canvasTask){
    var task = JSON.parse($(canvasTask).text());
    if(task.state <= 1){
        var ctx = canvasTask.getContext('2d');
        var index = 0;
        anim = setInterval(function(){
            var max = printImage(ctx, canvasTask, task, index);
            index+=1;
            if(index >= max){
                index=0;
            }
            ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);
            printText(ctx, canvasTask, task);
        }, 100);
    }
}

function leave(canvasTask){
    var task = JSON.parse($(canvasTask).text());
    if(task.state <= 1){
        clearInterval(anim);
        var ctx = canvasTask.getContext('2d');
        printImage(ctx, canvasTask, task, 0);
        ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);
        printText(ctx, canvasTask, task);
    }
}

function printImage(ctx, canvasTask, task, index){
    if(task.difficulty==='easy'){
        var imgWidth = 480;
        var image = images.easy;
    }
    else{
        var imgWidth = 480;
        var image = images.hard;
    }

    var max = image.width/imgWidth;
    ctx.drawImage(image, index*imgWidth, 0, imgWidth, images.easy.height, 0, 0, canvasTask.width, canvasTask.height);
    return max;
}

function printText(ctx, canvasTask, task){
    ctx.save();
    ctx.textAlign = 'center';
    var fontsize = 2;
    if(task.title.length > 10){
        fontsize=28/task.title.length;
    }
    ctx.font = fontsize+'em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#c72127';
    ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

    ctx.font = '2em DejaVu Sans';
    ctx.fillText(task.score+' pts', canvasTask.width/2, canvasTask.height/2+20);
    ctx.restore();
}

function loadTask(canvasTask){
    var task = JSON.parse($(canvasTask).text());
    var ctx = canvasTask.getContext('2d');
    ctx.clearRect(0, 0, canvasTask.width,canvasTask.height);
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
        printImage(ctx, canvasTask, task, 0);
    }

    ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);

    printText(ctx, canvasTask, task);
}

function validateTask(canvasTask, callback){
    var task = JSON.parse($(canvasTask).text());
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

function reopenTask(canvasTask){

}

function closeTask(canvasTask){
}