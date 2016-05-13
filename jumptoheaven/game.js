//canvas width
var width=320;
//canvas height
var height=500;
var canvas;
var canvasContext;
var cicleNum=10;
var maxRadius=100;

//array to store circles 
//each cicle element store the center's x and y position,radius and transparency
var circles=[];
var gameLoopTimeOut;
var player;
var platformList;
var points=0;
var gameState=true;
var PLAYER_WIDTH = 65;
var PLAYER_HEIGHT = 95;
var MOVE_LFET = 5;
var MOVE_RIGHT = 5;
//normal max jump speed
var MAX_JUMP_SPEED = 20;
//trampoline max jump speed
var MAX_HIGH_JUMP_SPEED = 50;
var NORMAL_PLATFORM_START_COLOR = '#FF8C00';
var NORMAL_PLATFORM_END_COLOR = '#EEEE00';
var JUMP_PLATFORM_START_COLOR = '#AADD00';
var JUMP_PLATFORM_END_COLOR = '#698B22';
var PLATFORM_NUM = 7;
var PLATFORM_WIDTH  = 70;
var PLATFORM_HEIHGT = 20;
//the ratio of normal platform and high jump
var NORMAL_PLATFORM_RATE = 5;
var PLATFORM_START_Y = 10;
function initCanvasBg(){
	canvasContext.fillStyle = '#d0e7f9';
	canvasContext.beginPath();
	canvasContext.fillRect(0, 0, width, height);
	canvasContext.closePath();
	canvasContext.fill();
}
function initcircles(){
	for(var i=0;i<cicleNum;i++){
		circles.push(initCircle());
	}
}
function initCircle(){
	return [Math.random()*width,Math.random()*height,Math.random()*maxRadius,Math.random()/2];
}
function drawCircles(){
	for(var i=0;i<cicleNum;i++){
		canvasContext.fillStyle='rgba(255,255,255,'+circles[i][3]+')';
		canvasContext.beginPath();
		canvasContext.arc(circles[i][0],circles[i][1],circles[i][2],0,Math.PI*2,true);
		canvasContext.closePath();
		canvasContext.fill();
	}
		
}
///move the cicles upper
function moveCircles(deltaY){
	for(var i=0;i<cicleNum;i++){
		if((circles[i][1]-circles[i][2])>height)
		{
			circles[i][0]=Math.random()*width;
			circles[i][2]=Math.random()*maxRadius;
			circles[i][1]=0-circles[i][2];
			circles[i][3]=Math.random()/2;
				
		}
		else circles[i][1]+=deltaY;
	}
}


function Player(){
	this.image = new Image();

	this.image.src = "angel.png"
	this.width = PLAYER_WIDTH;
	this.height = PLAYER_HEIGHT;
	this.frames = 1;
	this.actualFrame = 0;
	this.X = 0;
	this.Y = 0;	
	this.isJumping = false;
	this.isFalling = false;
	this.jumpSpeed = 0;
	this.fallSpeed = 0;
	this.setPosition = function(x, y){
		this.X = x;
		this.Y = y;
	}
	
	this.interval = 0;
	this.draw = function (){
		try {
			canvasContext.drawImage(this.image, 0, this.height * this.actualFrame, this.width, this.height, this.X, this.Y, this.width, this.height);
		} 
		catch (e) {
		};
		if(this.interval==4) {
			this.interval=0;
			if(this.actualFrame==this.frames) this.actualFrame=0;
			else 	this.actualFrame++;
		}
		this.interval++;
	}
	this.moveLeft = function (){
		if(this.X>0)
		this.setPosition(this.X-MOVE_LFET,this.Y);
	}
	this.moveRight = function (){
		if(this.X+this.width<width)
		this.setPosition(this.X+MOVE_RIGHT,this.Y);

	}
	this.startJump = function () {
		if(!this.isJumping&&!this.isFalling) {
			this.isJumping = true;
	// 		this.fallSpeed=0;
			this.jumpSpeed = MAX_JUMP_SPEED;
		}
	}
	this.startFall = function(){
			if(!this.isJumping&&!this.isFalling) {
			this.isFalling = true;
     		this.fallSpeed=1;
			// this.jumpSpeed = 0;
		}
	}
	this.jump = function(){
		if(!this.isJumping) return;
		if(this.Y>height*0.5)
			this.setPosition(this.X,this.Y-this.jumpSpeed);
		else{
			moveCircles(this.jumpSpeed*0.5);
			 movePlatforms(this.jumpSpeed);
		} 
		this.jumpSpeed--;
		if(this.jumpSpeed==0){ 
			this.isJumping=false;
			this.startFall();
		}
	}
	this.fall = function(){
		if(!this.isFalling) return;
		if((this.Y+this.height)<height){
			this.setPosition(this.X,this.Y+this.fallSpeed);
			this.fallSpeed++;

		}
		else{
			if(points==0)
			 this.stopFall();
			else gameOver();
		}
	}
	this.stopFall = function (){
		this.fallSpeed=0;
		this.isFalling=false;
		this.startJump();
	} 

}
function Platform(x,y,type){
	this.X = x;
	this.Y=  y;
	this.type = type;
	this.isMoving = ~~(Math.random()*2);
	this.direction = ~~(Math.random()*2)?-1:1;
	//jump platform
	if(this.type===0) {
		this.startColor = JUMP_PLATFORM_START_COLOR;
		this.endColor = JUMP_PLATFORM_END_COLOR;
		this.onTouch = function(){
			player.stopFall();
			player.jumpSpeed=MAX_HIGH_JUMP_SPEED;
	}
	}
	else {
		this.startColor = NORMAL_PLATFORM_START_COLOR;
		this.endColor = NORMAL_PLATFORM_END_COLOR;
		this.onTouch = function(){
			player.stopFall();
		}
	}
	this.draw = function() {
		var gradient = canvasContext.createRadialGradient(this.X+PLATFORM_WIDTH/2,this.Y+PLATFORM_HEIHGT/2,5,this.X+PLAYER_WIDTH/2,this.Y+PLATFORM_HEIHGT/2,45);
		gradient.addColorStop(0,this.startColor);
		gradient.addColorStop(1,this.endColor);
		canvasContext.fillStyle = 'rgba(255,255,255,1)';
		 canvasContext.fillStyle = gradient;
		canvasContext.fillRect(this.X,this.Y,PLATFORM_WIDTH,PLATFORM_HEIHGT);
	}
}
function initPlayer(){
	player = new Player();
	player.setPosition(~~((width-player.width)/2),~~(height-player.height));
	player.startJump();
}
function initPlatForms(){
	platformList = [];
	//the patforms are vetically attributed averagely;
	var startY=PLATFORM_START_Y;
	var deltaY = ~~(height/PLATFORM_NUM);
	for(var i=0;i<PLATFORM_NUM;i++){
		platformList[i] = new Platform(~~(Math.random()*(width-PLATFORM_WIDTH)),startY,~~(Math.random()*NORMAL_PLATFORM_RATE));
		startY+=deltaY;

	}
}
function movePlatforms(deltaY){
	for(var i=0;i<platformList.length;i++){
		var platform = platformList[i];
		platform.Y+=deltaY;
		if(platform.Y+PLATFORM_HEIHGT>height) {
			points++;
			platform = new Platform(~~(Math.random()*(width-PLATFORM_WIDTH)),platform.Y-=height,~~(Math.random()*NORMAL_PLATFORM_RATE));
		}
	}
}
function drawPlatforms(){
	for(var i=0;i<platformList.length;i++){
		var platform = platformList[i];
		if(platform.isMoving) {
			if(platform.X<0) platform.direction=1;
			else if(platform.X>width) platform.direction=-1;
			platform.X+=platform.direction*(i/2)*~~(points/100);
		}
		platform.draw();
	}
}


function checkTouch(){
	for(var i=0;i<platformList.length;i++){
		var	e = platformList[i];
		if(player.isFalling&&player.X>e.X&&player.X<e.X+PLATFORM_WIDTH&&player.Y+PLAYER_HEIGHT>e.Y&&player.Y+PLAYER_HEIGHT<e.Y+PLATFORM_HEIHGT){
			e.onTouch();
		}	
	}
}
function drawPoint(){
	canvasContext.fillStyle="Black";
	canvasContext.fillText("Point:"+points,10,height-10);
}
function gameLoop(){
	initCanvasBg();
	drawPoint();
	drawCircles();
	drawPlatforms();
	checkTouch();
	if(player.isFalling) player.fall();
	if(player.isJumping) player.jump();
	player.draw();
	if(gameState) gameLoopTimeOut = setTimeout(gameLoop, 1000 / 50);
}
function gameOver(){
	gameState=false;
	clearTimeout(gameLoopTimeOut);
	setTimeout(drwaGGPage,20);
}
function drwaGGPage(){
	initCanvasBg();
	canvasContext.fillStyle="Black";
	canvasContext.fillText("Game Over",width/2-30,height/2-20);
	canvasContext.fillText("Final Point:"+points,width/2-40,height/2-20+15);

}
window.onload = function(){
	canvas = document.getElementById("canvas");
	canvasContext = canvas.getContext("2d");
	canvas.width = width;
	canvas.height = height;
	initPlayer();
	initcircles();
	initPlatForms();
	gameLoop();
	document.onmousemove = function(e){
	if (player.X + canvas.offsetLeft > e.pageX) {
		player.moveLeft();
	} else if (player.X + canvas.offsetLeft < e.pageX) {
		player.moveRight();
	}
	};
	
}

