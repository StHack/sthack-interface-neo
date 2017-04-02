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
    var loadedImages = 0;
    var numImages = 0;
    var src;
    for(src in Images) {
        numImages++;
    }
    for(src in Images) {
        images[src] = new Image();
        images[src].onload = function() {
            if(++loadedImages >= numImages) {
                callback();
            }
        };
        images[src].onerror = function(e) {
            delete images[src];
            if(++loadedImages >= numImages) {
                callback();
            }
        }
        images[src].src = '/img/'+Images[src];
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

function loadDir(type, plus){
    var idDir = type.checksum();
    var canvasDir = document.getElementById(idDir);
    var status = JSON.parse($(canvasDir).text());
    var ctx = canvasDir.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvasDir.width, canvasDir.height);
    if(typeof(images[type.toLowerCase()]) === 'undefined'){
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, canvasDir.width, canvasDir.height);
    }
    else{
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
    if (status.count === status.solved){
        ctx.fillStyle = 'green';
    } else {
        ctx.fillStyle = 'red';
    }
    ctx.fillText(status.solved+'/'+status.count, canvasDir.width*0.90, canvasDir.height*0.20);

    ctx.restore();
}

var anim;

function enter(canvasTask){
    var task = JSON.parse($(canvasTask).text());
    console.log(task.title, task.solved);
    // if(task.state <= 1){
    //     var ctx = canvasTask.getContext('2d');
    //     var index = 0;
    //     anim = setInterval(function(){
    //         var max = printImage(ctx, canvasTask, task, index);
    //         index+=1;
    //         if(index >= max){
    //             index=0;
    //         }
    //         ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);
    //         printText(ctx, canvasTask, task);
    //     }, 133);
    // }
    // else{
    //     clearInterval(anim);
    //     loadTask(canvasTask);
    // }
}

function leave(canvasTask){
    // var task = JSON.parse($(canvasTask).text());
    // if(task.state <= 1){
    //     clearInterval(anim);
    //     var ctx = canvasTask.getContext('2d');
    //     printImage(ctx, canvasTask, task, 0);
    //     ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);
    //     printText(ctx, canvasTask, task);
    // }
    // else{
    //     clearInterval(anim);
    //     loadTask(canvasTask);
    // }
}

function printImage(ctx, canvasTask, task, index){
    if(task.difficulty==='easy'){
        var imgWidth = 480;
        var image = images.easy;
    }
    else if(task.difficulty==='medium'){
        var imgWidth = 480;
        var image = images.medium;
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
    ctx.fillStyle = '#000';
    //ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

    ctx.font = '2em DejaVu Sans';
    ctx.fillText(task.score+' pts', canvasTask.width/2, canvasTask.height*0.9);
    ctx.restore();
}

function printBroken(ctx, canvasTask){
    ctx.save();
    ctx.textAlign = 'center';
    var fontsize = 2;

    ctx.font = fontsize+'em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;
    ctx.fillStyle = 'red';
    //ctx.fillText(task.title, canvasTask.width/2, canvasTask.height/2-20);

    ctx.font = '2em DejaVu Sans';
    ctx.fillText('Down', canvasTask.width/2, canvasTask.height/2);
    ctx.restore();
}

function loadTask(canvasTask){
    var task = JSON.parse($(canvasTask).text());
    var ctx = canvasTask.getContext('2d');
    ctx.clearRect(0, 0, canvasTask.width,canvasTask.height);
    if(task.state>1){
        // ctx.fillStyle = '#000';
        // ctx.fillRect(0,0,canvasTask.width,canvasTask.height);
        // ctx.beginPath();
        // ctx.fillStyle = '#fff';
        // ctx.arc(canvasTask.width/2, canvasTask.height/2, 2, 0, 2 * Math.PI, false);
        // ctx.fill();
        // ctx.stroke();
        ctx.globalAlpha=0.2;
    }

    if(typeof(images[task.img]) === 'undefined'){
        ctx.fillStyle = "blue";
        ctx.fillRect(canvasTask.width*0.3/2, 0, canvasTask.width*0.7, canvasTask.height*0.7);
    }
    else{
        //printImage(ctx, canvasTask, task, 0);
        ctx.drawImage(images[task.img], 0, 0, images[task.img].width, images[task.img].height, canvasTask.width*0.3/2, 0, canvasTask.width*0.7, canvasTask.height*0.7);
    }

    if(typeof(task.broken) !== 'undefined' && task.broken === true){
        printBroken(ctx, canvasTask);
    }

    //ctx.drawImage(images.tv,0,0,canvasTask.width,canvasTask.height);

    printText(ctx, canvasTask, task);
    ctx.textAlign = 'center';
    ctx.font = '1.2em DejaVu Sans';
    ctx.shadowColor = '#000';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 5;

    ctx.fillStyle = 'blue';

    ctx.fillText(''+task.solved.length, canvasTask.width*0.80, canvasTask.height*0.10);
}

function validateTask(canvasTask, callback){
    loadTask(canvasTask);
    callback();
    // var task = JSON.parse($(canvasTask).text());
    // var ctx = canvasTask.getContext('2d');
    // var radius = 2;
    // ctx.save();
    // var shutdown = setInterval(function(){
    //     ctx.arc(canvasTask.width/2, canvasTask.height/2, radius, 0, 2 * Math.PI, false);
    //     ctx.fillStyle = '#fff';
    //     ctx.fill();
    //     ctx.drawImage(images.tv, 0, 0, canvasTask.width, canvasTask.height);
    //     radius += 70;
    //     if(radius>canvasTask.width/2+50){
    //         clearInterval(shutdown);
    //         var shutdown2 = setInterval(function(){
    //             ctx.fillStyle = '#000';
    //             ctx.fillRect(0,0,canvasTask.width,canvasTask.height);

    //             ctx.beginPath();
    //             ctx.fillStyle = '#fff';
    //             ctx.arc(canvasTask.width/2, canvasTask.height/2, radius, 0, 2 * Math.PI, false);
    //             ctx.fill();
    //             ctx.stroke();
    //             ctx.drawImage(images.tv, 0, 0, canvasTask.width, canvasTask.height);
    //             radius -= 70;
    //             if(radius < 0){
    //                 clearInterval(shutdown2);
    //                 callback();
    //             }
    //         }, 50);
    //     }
    // }, 50);
    // ctx.restore();
}

function clickTask(canvasTask, callback){
    clearInterval(anim);
    callback();
}

function reopenTask(canvasTask){

}

function closeTask(canvasTask){
}