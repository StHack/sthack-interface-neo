$(document).ready(function () {

/* CANVAS STUFF */

$("body").delegate("#challenges", "loaded_btn", function(e, mes_challs){
var data=mes_challs.tasks;
mes_canvas = document.getElementsByTagName("canvas");
challs = new Array();
my_param = new Array();
images = {};
function loadImages(sources, callback) {
  var loadedImages = 0;
  var numImages = 0;
        // get num of sources
  for(var src in sources) {
    numImages++;
  }
  for(var src in sources) {
    images[src] = new Image();
    images[src].onload = function() {
      if(++loadedImages >= numImages) {
        callback();
      }
    };
  images[src].src = '/static/img/pictos/'+sources[src];
  }
}
var sources = {
  reverse: 'reverse.png',
  exploit: 'nuclear.png',
  crypto: 'crypto.png',
  forensic: 'forensic.png',
  web: 'web.png',
  smoke: 'grille.png'
};

width=mes_canvas[0].width;
height=mes_canvas[0].height;
nucImgX=-50;
nucImgY=5;
nucImgW=160;
nucImgH=160;
fontSize=1;

maxr=20;
maxg=20;
maxb=20;

personne={'r':181,'g':53,'b':52};
youfirst={'r':52,'g':149,'b':184};
youvalide={'r':56,'g':132,'b':57};
quelquun={'r':142,'g':101,'b':60};

animNuclearTime=25;
animTextTime=50;
animTextOpac=0.05;
animFondTime=50;
animFondHoverTime=20;

rand_time=Math.floor((Math.random()*6)+1);
for(var i=0;i<data.length;i++){
  challs.push({'id':i,'name':data[i].name,'type':data[i].type,'solved':data[i].solved, 'score':data[i].score, 'closed':data[i].closed});
}

loadImages(sources, function() {
  for(var i=0;i<mes_canvas.length;i++){
    if(challs[i].closed==1)
      my_param.push(draw(mes_canvas[i],challs[i],{'nuc':{'x':nucImgX,'y':nucImgY,'w':nucImgW,'h':nucImgH,'r':0,'be_r':0,'be_g':0},'text':{'x':width/2,'y':height/2,'size':fontSize,'opacity':0,'be_o':0},'point':{'x':width/2,'y':height/2+15,'size':fontSize-0.3,'opacity':0,'be_o':0},'fond':{'be_c':0,'r':0,'g':0,'b':0},'grille':{'x':width,'be_c':1,'be_o':0}}));
    else
      my_param.push(draw(mes_canvas[i],challs[i],{'nuc':{'x':nucImgX,'y':nucImgY,'w':nucImgW,'h':nucImgH,'r':0,'be_r':0,'be_g':0},'text':{'x':width/2,'y':height/2,'size':fontSize,'opacity':1,'be_o':0},'point':{'x':width/2,'y':height/2+15,'size':fontSize-0.3,'opacity':1,'be_o':0},'fond':{'be_c':0,'r':0,'g':0,'b':0},'grille':{'x':0,'be_c':0,'be_o':1}}));
}

function rand_rotation(){
setTimeout(function() {
canvas_id=Math.floor((Math.random()*mes_canvas.length));
if(my_param[canvas_id].nuc.be_r==0 && $("#challenges").is(":hover")){
    rotateNuclear(canvas_id,Math.floor((Math.random()*3)+1))
    animNuclear(canvas_id);
}
rand_time=Math.floor((Math.random()*6)+1);
rand_rotation();
},rand_time*1000);
}
rand_rotation();

});

});


function openGrille(id,callback){
  my_param[id].grille.be_o=1;
  var myinterval = setInterval(function(){
    my_param[id].grille.x-=5;
    if(my_param[id].grille.x<=0){
      clearInterval(myinterval);
      my_param[id].grille.be_c=0;
      callback();
    }
    draw(mes_canvas[id],challs[id],my_param[id]);
  },30);
}

function closeGrille(id, callback){
  my_param[id].grille.be_c=1;
  var myinterval = setInterval(function(){
    my_param[id].grille.x+=5;
    if(my_param[id].grille.x>=width){
      clearInterval(myinterval);
      my_param[id].grille.be_o=0;
      callback();
    }
    draw(mes_canvas[id],challs[id],my_param[id]);
  },30);
}

function animTextOut(id,callback){
  my_param[id].text.be_o=1;
  var myinterval = setInterval(function(){
    my_param[id].text.opacity-=animTextOpac;
  if(my_param[id].text.opacity<=0){
    my_param[id].text.opacity=0;
    clearInterval(myinterval);
    my_param[id].text.be_o=0;
    callback();
  }

  draw(mes_canvas[id],challs[id],my_param[id]);
  },animTextTime);
}

function animTextIn(id,callback){
  my_param[id].text.be_o=1;
  var myinterval = setInterval(function(){
    my_param[id].text.opacity+=animTextOpac;
  if(my_param[id].text.opacity>=1){
    my_param[id].text.opacity=1;
    clearInterval(myinterval);
    my_param[id].text.be_o=0;
    callback();
  }

  draw(mes_canvas[id],challs[id],my_param[id]);
  },animTextTime);
}

function animFond(id){
  my_param[id].fond.be_c=1;
  var sensr=0;
  var sensg=0;
  var sensb=0;
  var myinterval = setInterval(function(){
    var choice=Math.floor((Math.random()*4)+1);
    if(choice==1)
      if (sensr==0)
        my_param[id].fond.r+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.r-=Math.floor((Math.random()*5)+1);
    else if(choice==2)
      if(sensg==0)
        my_param[id].fond.g+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.g-=Math.floor((Math.random()*5)+1);
    else
      if(sensb==0)
        my_param[id].fond.b+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.b-=Math.floor((Math.random()*5)+1);

    if(my_param[id].fond.r>=maxr)
      sensr=1;
    if(my_param[id].fond.g>=maxg)
      sensg=1;
    if(my_param[id].fond.b>=maxb)
      sensb=1;

    if(my_param[id].fond.r<=0)
      sensr=0;
    if(my_param[id].fond.g<=0)
      sensg=0;
    if(my_param[id].fond.b<=0)
      sensb=0;

    if(my_param[id].fond.be_c==0)
      clearInterval(myinterval);
    draw(mes_canvas[id],challs[id],my_param[id]);
  },animFondTime);
}

function animFondHover(id){
  my_param[id].fond.be_c=1;
  var sensr=0;
  var sensg=0;
  var sensb=0;
  var myinterval = setInterval(function(){
    var choice=Math.floor((Math.random()*4)+1);
    if(choice==1)
      if (sensr==0)
        my_param[id].fond.r+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.r-=Math.floor((Math.random()*5)+1);
    else if(choice==2)
      if(sensg==0)
        my_param[id].fond.g+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.g-=Math.floor((Math.random()*5)+1);
    else
      if(sensb==0)
        my_param[id].fond.b+=Math.floor((Math.random()*5)+1);
      else
        my_param[id].fond.b-=Math.floor((Math.random()*5)+1);

    if(my_param[id].fond.r>=maxr)
      sensr=1;
    if(my_param[id].fond.g>=maxg)
      sensg=1;
    if(my_param[id].fond.b>=maxb)
      sensb=1;

    if(my_param[id].fond.r<=-maxr)
      sensr=0;
    if(my_param[id].fond.g<=-maxg)
      sensg=0;
    if(my_param[id].fond.b<=-maxb)
      sensb=0;

    if(my_param[id].fond.be_c==0)
      clearInterval(myinterval);
    draw(mes_canvas[id],challs[id],my_param[id]);
  },animFondHoverTime);
}


function animNuclear(id){
  var myinterval = setInterval(function(){
    if(my_param[id].nuc.be_r==0 && my_param[id].nuc.be_g==0)
      clearInterval(myinterval);
    draw(mes_canvas[id],challs[id],my_param[id]);
  },animNuclearTime);
}

function greatNuclear(id,tour,callback){
  var sens=0;
  var big=2;
  var max=nucImgW+20
  my_param[id].nuc.be_g=1;
  var myinterval = setInterval(function(){
    if(sens==0){
      my_param[id].nuc.w+=big;
      my_param[id].nuc.x-=big/2;
      my_param[id].nuc.h+=big;
      my_param[id].nuc.y-=big/2;
    }
    else{
      my_param[id].nuc.w-=big;
      my_param[id].nuc.x+=big/2;
      my_param[id].nuc.h-=big;
      my_param[id].nuc.y+=big/2;
    }
    if(my_param[id].nuc.w>=max)
      sens=1;
    if(my_param[id].nuc.w<=nucImgW){
      sens=0;
      tour-=1;
      if(tour==0){
        clearInterval(myinterval);
        my_param[id].nuc.be_g=0;
        callback();
      }
      my_param[id].nuc.w=nucImgW;
      my_param[id].nuc.h=nucImgH;
    }
  },animNuclearTime);
}

function rotateNuclear(id,tour){
  my_param[id].nuc.be_r=1;
  var myinterval = setInterval(function(){
    my_param[id].nuc.r+=0.2;
    if(my_param[id].nuc.r>=(2*Math.PI)*tour){
      clearInterval(myinterval);
      my_param[id].nuc.be_r=0;
      my_param[id].nuc.r=0;
    }
  },animNuclearTime);
}



function draw(canvas,chall,param){
  var ctx = canvas.getContext("2d");

  if(chall.solved==0)
    ctx.fillStyle = "rgb("+(personne.r+param.fond.r)+", "+(personne.g+param.fond.g)+", "+(personne.b+param.fond.b)+")";
  else if(chall.solved==1)
    ctx.fillStyle = "rgb("+(quelquun.r+param.fond.r)+", "+(quelquun.g+param.fond.g)+", "+(quelquun.b+param.fond.b)+")";
  else if(chall.solved==2)
    ctx.fillStyle = "rgb("+(youvalide.r+param.fond.r)+", "+(youvalide.g+param.fond.g)+", "+(youvalide.b+param.fond.b)+")";
  else if(chall.solved==3)
    ctx.fillStyle = "rgb("+(youfirst.r+param.fond.r)+", "+(youfirst.g+param.fond.g)+", "+(youfirst.b+param.fond.b)+")";
  ctx.fillRect(0,0,width,height);

  ctx.textAlign = 'center';
  ctx.font = param.text.size+'em Verdana';
  ctx.fillStyle = 'rgba(255, 255, 255, '+param.text.opacity+')';
  ctx.fillText(chall.name, param.text.x, param.text.y);

  ctx.font = param.point.size+'em Verdana';
  ctx.fillStyle = 'rgba(255, 255, 255, '+param.text.opacity+')';
  ctx.fillText(chall.score+' pts', param.point.x, param.point.y);

  ctx.save();
  ctx.translate((param.nuc.w/2)+param.nuc.x,(param.nuc.h/2)+param.nuc.y);
  ctx.rotate(param.nuc.r);
  if(chall.type=="Exploit")
    ctx.drawImage(images.exploit,-(param.nuc.w/2),-(param.nuc.h/2),param.nuc.w,param.nuc.h);
  else if(chall.type=="Reverse" || chall.type=="Programmation")
    ctx.drawImage(images.reverse,-(param.nuc.w/2),-(param.nuc.h/2),param.nuc.w,param.nuc.h);
  else if(chall.type=="Crypto" || chall.type=="Stegano")
    ctx.drawImage(images.crypto,-(param.nuc.w/2),-(param.nuc.h/2),param.nuc.w,param.nuc.h);
  else if(chall.type=="Web")
    ctx.drawImage(images.web,-(param.nuc.w/2),-(param.nuc.h/2),param.nuc.w,param.nuc.h);
  else if(chall.type=="Forensic")
    ctx.drawImage(images.forensic,-(param.nuc.w/2),-(param.nuc.h/2),param.nuc.w,param.nuc.h);
  ctx.restore();


  if(chall.closed==1)
    ctx.drawImage(images.smoke,width-param.grille.x,0);

  return param;
}
first_message=1;
writing=1;

/*CONSOLE STUFF*/
blink=setInterval(function(){
  if(blink_val==0){
  $("#blink_cursor").css("background-color","#aaa");
  $("#blink_cursor").css("color","#000");
  blink_val=1;
  }
  else{
    $("#blink_cursor").css("background-color","#000");
    $("#blink_cursor").css("color","#aaa");
  blink_val=0
  }
}, 500);

clearInterval(blink);

blink_val=0;
$("body").delegate("#blink_cursor", "blinking_event", function(e){
blink=setInterval(function(){
  if(blink_val==0){
  $("#blink_cursor").css("background-color","#aaa");
  $("#blink_cursor").css("color","#000");
  blink_val=1;
  }
  else{
    $("#blink_cursor").css("background-color","#000");
    $("#blink_cursor").css("color","#aaa");
  blink_val=0
  }
}, 500);
});

$.fn.teletype = function(opts){
  if(first_message==0)
    writing=1;
  $("#blink_cursor").remove();
  clearInterval(blink);
    var $this = this,
        defaults = {
            animDelay: 50
        },
        settings = $.extend(defaults, opts);

    $.each(settings.text.split(''),function(i, letter){
        setTimeout(function(){
            $this.html($this.html() + letter);
            if(i==settings.text.length-1){
              if(first_message==0)
              writing=0;
            }
        }, settings.animDelay * i);
    });
    if(typeof settings.prepend_text != "undefined"){
    setTimeout(function(){
          $("#console").prepend(settings.prepend_text);
          setTimeout(function(){
            $('.new_line').first().append('<span id="blink_cursor">&nbsp;</span>');
            $("#blink_cursor").trigger("blinking_event");
            if(first_message==0)
            writing=0;
          },100);
        },settings.animDelay*settings.text.length+50);
  }

};
setTimeout(function(){
$("#console").prepend('<p class="new_line">$ </p>');
$('.new_line').first().teletype({animDelay: 50, text: 'spc PouneyTeam@st\'hack'});
setTimeout(function(){
  $("#console").prepend('<p class="new_line">PouneyTeam@st\'hack\'s password:</p>');
  setTimeout(function(){
    $('.new_line').first().teletype({animDelay: 100, text: '**********'});
    setTimeout(function(){
      $("#console").prepend('<p class="new_line">Welcome on Sup3r Pouney Communicator</p>');
        setTimeout(function(){
          $("#console").prepend('<p class="new_line">PouneyTeam@st\'hack$ </p>');
          setTimeout(function(){
                $('.new_line').first().append('<span id="blink_cursor">&nbsp;</span>');
                $("#blink_cursor").trigger("blinking_event");
                writing=0;
                first_message=0;
              },100);
        },500);
    },1500);
  },1000);
},1800);
},2000);




/*SOCKET IO STUFF*/

var sock = io.connect(socketIOUrl);
sock.on('userchange', function (data) {
      	if(data.nbConnecte>1)
        	$("#nbConnecte").html(data.nbConnecte+" connectés");
    	else
    		$("#nbConnecte").html(data.nbConnecte+" connecté");
      });

      $("#bouton_cancel_flag").click(function(){
        $('#popup').css({'display':'none'});
        if(my_param[$("#input_save_id").val()].nuc.be_g==0){
        greatNuclear($("#input_save_id").val(),2,function(){});
        animNuclear($("#input_save_id").val());
        $("#input_save_id").val('');
        }

      });


      sock.on('ask_me_score', function(data){
        sock.emit('what_is_my_score');
      });

      sock.on('bad_flag', function(){
        $("#bad_flag").css({'display':'inline'});
        setTimeout(function() {
          $("#bad_flag").css({'display':'none'});
        },3000);
      });

      sock.on('your_score', function(data){
        $("#logo_team").html('<img src="/static/img/team_logos/'+data.name+'.png" />');
        $("#nom_team").html(data.name);
        $("#score_team").html(data.score+(data.breakthrough*50));
        var breakthrough_num=""
        for(var i=0;i<data.breakthrough;i++)
          breakthrough_num+='<img src="/static/img/coeur.png" />';
        $("#bt_team").html(breakthrough_num);
      });

      sock.on('here_is_tasks', function(data){
        $("#challenges").html("");
      	for(i=0;i<data.tasks.length;i++){
      		$("#challenges").append('<canvas id="'+i+'" class="btn enfonce '+data.tasks[i].type+' valide_'+data.tasks[i].solved+'" width="150" height="98">'+data.tasks[i].name+'</canvas>');
      	}
        $("#challenges").append('<div id="final_bouton"></div>');
        $("#challenges").trigger("loaded_btn",data);

      });


$("#challenges").delegate('.btn','mouseenter',function(){
    if(my_param[$(this).attr('id')].fond.be_c==0){
    animFondHover($(this).attr('id'));
    }
});

$("#challenges").delegate('.btn','mouseleave',function(){
    my_param[$(this).attr('id')].fond.be_c=0;
});


      $("#challenges").delegate('.btn','click',function(){
        var chall_name=$(this).html();
	$("#input_conteneur_epreuve").val('');
        if(my_param[$(this).attr('id')].nuc.be_g==0){
        greatNuclear($(this).attr('id'),2,function(){
          sock.emit('give_me_task',{'name': chall_name,change:0});
        });
        animNuclear($(this).attr('id'));
        $("#input_save_id").val($(this).attr('id'));
        }
      });

      $("#popup").delegate('#bouton_submit_flag','click',function(){
        if($('#bouton_submit_flag').html()=="PWN!")
        sock.emit('here_is_my_flag',{'task':$("#title_bandeau_epreuve").html(), 'flag':$("#input_conteneur_epreuve").val()});
      });

      sock.on('here_is_task', function(data){
        if(data.solved==3 || data.solved==2){
          $("#title_popup").css({'display':'none'});
          $("#input_conteneur_epreuve").css({'display':'none'});
          $("#bouton_submit_flag").css({'background-color':'green','height':'129px'});
          $("#bouton_submit_flag").html('PWNED!');
        }
        else{
          $("#title_popup").css({'display':'inline'});
          $("#input_conteneur_epreuve").css({'display':'inline-block'});
          $("#bouton_submit_flag").css({'background-color':'#FC2828','height':'69px'});
          $("#bouton_submit_flag").html('PWN!');
        }

        $('#popup').css({'display':'block'});

        var popMargTop = ($('#popup').height() + 80) / 2;
        var popMargLeft = ($('#popup').width() + 80) / 2;
        $('#popup').css({
          'margin-top' : -popMargTop,
          'margin-left' : -popMargLeft
        });
        $("#title_bandeau_epreuve").html(data.name);
        $("#type_bandeau_epreuve").html(data.type);
        $("#pts_bandeau_epreuve").html(data.score);
        $("#texte_conteneur_epreuve").html(data.description);
      });

      sock.on('admin_end', function(){
        $("#div_bouton").remove();
      });

      sock.on('refresh', function(){
        document.location.reload();
      });

      sock.on('admin_message', function(data){
        if(writing==0){
        if(data.submit==1){
          clearInterval(blink);
          $('.new_line').first().html('PouneyTeam@st\'hack$ '+data.message);
          $('.new_line').first().before('<p class="new_line">PouneyTeam@st\'hack$ </p>');
          $('.new_line').first().append('<span id="blink_cursor">&nbsp;</span>');
          $("#blink_cursor").trigger("blinking_event");
        }
        else{
          clearInterval(blink);
          $('.new_line').first().html('PouneyTeam@st\'hack$ '+data.message);
          $('.new_line').first().append('<span id="blink_cursor">&nbsp;</span>');
          $("#blink_cursor").trigger("blinking_event");
        }
      }
      });

      sock.on('task_pwned', function(data){
        $('.new_line').first().teletype({text: 'THX '+data.team+' who just pwned '+data.task,prepend_text:'<p class="new_line">PouneyTeam@st\'hack$ </p>'});
        if($("#title_bandeau_epreuve").html()==data.task){
          $('#popup').css({'display':'none'});
        }
        sock.emit('give_me_task',{'name': data.task, 'change': 1});
      });

      sock.on('change_this_task', function(data){
        for(var i=0;i<challs.length;i++){
          if(challs[i].name==data.name){
            animTextOut(i,function(){
              challs[i].score=data.score;
              if(data.closed==1){
              challs[i].closed=1;
              closeGrille(i,function(){
                challs[i].solved=data.solved;
              });
            }
            else{
              openGrille(i,function(){
                challs[i].closed=0;
                animTextIn(i,function(){});
              });
            }
            });
            break;
          }
        }
      })

      sock.on('task_reopen', function(data){
        $('.new_line').first().teletype({text: data+' is back !',prepend_text:'<p class="new_line">PouneyTeam@st\'hack$ </p>'});
        sock.emit('give_me_task',{'name': data, 'change': 1});
      })

    });
