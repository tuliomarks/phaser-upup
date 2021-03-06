var game;
var debug = false;
var debugResult = 'Drag a sprite';

function Grid(){};
Grid.prototype = {
	array: [],
	size: 10,
	pixelSize: 48,
	toArrayIndex: function(x, y)	{	
		var xGrid = this.toColumn(x);
		var yGrid = this.toColumn(y);		
		
		if (xGrid > 9 || xGrid < 0) return -1; 
		if (yGrid > 9 || yGrid < 0) return -1;
		
		// * 10 pois cada linha tem 10 
		//debugResult = ((xWorld - 144)/48) +" - "+(yWorld/48) + "=" + (((xWorld - 144)/48) + ((yWorld/48)*10));
		return (xGrid) + (yGrid* this.size);
	},
	toColumn: function(pixelPos){
		return (pixelPos)/ this.pixelSize;
	},
	add: function(x, y, obj){
		this.array[this.toArrayIndex(x,y)] = obj;
	},
	remove: function(x,y){
		this.array[this.toArrayIndex(x,y)] = "undefined";
	},
	valid: function(x,y){		
		return this.toArrayIndex(x,y) > -1;
	},
	exists: function(x,y){
		if (typeof y == "undefined"){
			var id = x;
		}else{
			var id = this.toArrayIndex(x,y);
		}		
		return this.array[id] != "undefined" && this.array[id] != null;
	},
	checkBlockPossible: function(x, y, blockTemp){
		var blockSize = Math.sqrt(blockTemp.length);
		for (var i = 0; i < blockTemp.length; i ++){
			var auxX = (Math.floor(i / blockSize)*48) + (x*48);
			var auxY = (i % blockSize *48) + (y*48);				
			if (blockTemp[i] == 1 && this.exists(auxX, auxY)){		
				return 0;
			}else if (blockTemp[i] == 1 && !this.valid(auxX, auxY)){
				return -1;
			}
		}
		return 1;
	}
};
var grid = new Grid();

function BlockFactory(){};
BlockFactory.prototype = {
	templates: ["1","111111111", "1111", "1100", "1010", "1101", "1011", "0111", "1110","111000000","100100100", "111001001", "100100111", "111100100","001001111", "1000010000100001000010000", "1111100000000000000000000", "1111000000000000", "1000100010001000"],
	sprites: ["block_grass", "block_fire", "block_water", "block_wind", "block_eletric"],
	createBlock: function(layer, x, y, onDragStart, onDragStop){
	
		// spriteMode 	0 para block de tipo unico
		//				1 para block de tipo misto
		var spriteMode = game.rnd.integerInRange(0, 1);		
		
		var blockTemplate = this.templates[game.rnd.integerInRange(0, this.templates.length -1)];		
		var blockTemplateSprite = this.getTemplate();
		var blockTemplateSize = Math.sqrt(blockTemplate.length);		
		
		for (var i = 0; i < blockTemplate.length; i++)
		{							
			if (spriteMode == 1)
				blockTemplateSprite = this.getTemplate();
		
			if (typeof block == "undefined")
			{
				if (blockTemplate[i] === "0"){		
					var block = layer.create(x, y);
					block.isEmpty = true;
				}
				else{							
					var block = layer.create(x, y, blockTemplateSprite);
				}
			}
			else
			{
				if (blockTemplate[i] === "0") continue;
				
				var x = (Math.floor(i / blockTemplateSize)*48);
				var y = (i % blockTemplateSize *48);			
				block.addChild(game.make.sprite(x, y, blockTemplateSprite));
			}			
		}
			
		block.templateGrid = blockTemplate;
		block.scale.setTo(0.75, 0.75);
		block.inputEnabled = true;
		block.input.enableDrag();
		block.input.enableSnap(48, 48, false, true);
		block.input.useHandCursor = true;
			
		if (typeof onDragStart != "undefined"){
			block.events.onDragStart.add(onDragStart, this);		
		}
		if (typeof onDragStop != "undefined"){
			block.events.onDragStop.add(onDragStop, this);
		}
		return block;		
	},
	getTemplate: function(){
		var level = player.getLevel();
		var max = 0;		
		if (level > 5){
			max = 1;		
			if (level > 10){
				max = 2;	
				if (level > 20){
					max = 3;	
					if (level > 30){
						max = 4;					
					}				
				}		
			}
		}
		return this.sprites[game.rnd.integerInRange(0, max)];
	}
	
};
var blockFactory = new BlockFactory();

function Player(){};
Player.prototype =	{
	points: 0,
	getLevel: function(){
		return parseInt(this.points/50); // L(n) = 50 * n;
	}
};
var player = new Player();

function Scene(game){};
Scene.prototype = {
	preload: function() 
	{
		game.load.script('font', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
		game.load.spritesheet('block_ground', 'img/Socket4.png', 48, 48, 1);
		game.load.image('block_grass', 'img/Laguz.png');
		game.load.image('block_wind', 'img/Othala.png');
		game.load.image('block_fire', 'img/Elhaz.png');
		game.load.image('block_water', 'img/Berkano.png');
		game.load.image('block_eletric', 'img/Sowilo.png');
	},
	create: function() 
	{
		// scalling 
		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	
		//game.stage.backgroundColor = '#20082a';
		game.stage.backgroundColor = '#2c2929';
		
		this.board = game.add.tileSprite(0, 0, 480, 480, 'block_ground');		
		
		// gera o layer dos blocos
		this.blocksLayer = game.add.group();	

		// gera o layer dos blocos novos
		this.newBlocksLayer = game.add.group();		
		
		// gera o layer dos textos e outras coisas 
		this.hudLayer = game.add.group();		
		
		this.createNewBlocks();	
		
	},
	render: function () 
	{	
		if (debug){
			game.debug.text(debugResult, 10, 480);
			for (var i = 0; i < grid.size; i ++){
				for (var j = 0; j < grid.size; j ++){
					if (grid.exists((i) + (j* grid.size))){
						game.debug.text("1", (i *48)+10, (j*48)+10);
					}
					else
					{
						game.debug.text("0", (i *48)+10, (j*48)+10);
					}
				}
			}
		}
	},
	updateText: function(){	
		scene.text.setText("Level "+player.getLevel()+" - "+player.points);
	},
	createText: function(){
		var text = game.add.text(0, 0, "1000");
		text.setTextBounds(0, 16, 580, 768);

		text.font = 'Skranji';
		text.fontSize = 20;
		text.fill = "#ffffff";
		text.align = 'center';
		text.boundsAlignV = 'top';
		text.boundsAlignH = "right";			
		scene.hudLayer.add(text);
		scene.text = text;
		scene.updateText();		
	},
	onGameOver: function(){
	
		// game over
		var graphics = game.add.graphics(0,0);
		graphics.beginFill(0x000000, 1);
		graphics.drawRect(0,0, game.width, game.height);      
		graphics.alpha = 0;
		graphics.endFill();
		
		game.add.tween(graphics).to({alpha: 0.8}, 600,  Phaser.Easing.Exponential.Out, true, 1000);
		
		gameover = game.add.text(game.world.centerX, -200, 'Game Over');
		gameover.font = 'Skranji';
		gameover.fontSize = 72;
		gameover.fill = "#ffffff";
		gameover.anchor.set(0.5);		
		game.add.tween(gameover).to( { y: game.world.centerY }, 3000, Phaser.Easing.Bounce.Out, true, 500);		
		
		this.blocksLayer.setAll("inputEnabled", false);
		this.blocksLayer.setAll("useHandCursor", false);
		this.newBlocksLayer.setAll("inputEnabled", false);
		this.newBlocksLayer.setAll("useHandCursor", false);
		
	},
	removeBlock: function(line)
	{	
		line.body = null;
		line.destroy();						
		grid.remove(line.x, line.y);
			
		// atualiza a pontuação do jogador 
		player.points++;
		scene.updateText();
	},
	checkGameOver: function(){
		for (var i = 0; i < this.newBlocksLayer.children.length; i ++){			
			var block = this.newBlocksLayer.children[i];
			for (var j = 0; j < grid.size; j++){
				for (var k = 0; k < grid.size; k++){
					if (grid.checkBlockPossible(j, k, block.templateGrid) == 1) {
						return;
					}
				}
			}				
		}		
		// se chegou aqui é porque é gameover
		this.onGameOver();	
		
	},
	checkLines: function()
	{		
		// verifica linhas
		for (var i = 0; i < grid.size; i ++){
			//
			//verifica as linhas verticais
			//
			var arr = $.grep(grid.array, function(block) {
			  return typeof block != "undefined" && grid.toColumn(block.x) == i;
			});			
			if (arr.length == grid.size){
				// remove a tela
				for (var j = 0; j < arr.length; j++){
					game.add.tween(arr[j]).to({alpha: 0}, 50, Phaser.Easing.Exponential.Out, true, 30+(50*j)).onComplete.add(function(block){this.removeBlock(block);}, this);
				}		
			}
			//
			//verifica as linhas horizontais
			//
			arr = [];
			arr = $.grep(grid.array, function(block) {
			  return typeof block != "undefined" && grid.toColumn(block.y) == i;
			});	
			if (arr.length == grid.size){
				// remove a tela
				for (var j = 0; j < arr.length; j++){
					game.add.tween(arr[j]).to({alpha: 0}, 50, Phaser.Easing.Exponential.Out, true, 30+(50*j)).onComplete.add(function(block){this.removeBlock(block);}, this);
				}
			}
		}	
		
	},
	onDragStart: function (sprite, pointer) 
	{			
		game.add.tween(sprite.scale).to({x: 1, y: 1}, 500, Phaser.Easing.Exponential.Out, true);
		sprite.startDragX = sprite.x;
		sprite.startDragY = sprite.y;
		scene.debugResult = "Dragging ";
	},
	onDragStop: function (sprite, pointer) 
	{		
		// testa a sprite pai	
		// se a posicao é invalida ou a posicao ja esta ocupada
		if (!grid.valid(sprite.x, sprite.y) || (typeof sprite.isEmpty === "undefined" && grid.exists(sprite.x, sprite.y))){
			game.add.tween(sprite).to({x: sprite.startDragX, y: sprite.startDragY}, 50, Phaser.Easing.Exponential.Out, true);
			game.add.tween(sprite.scale).to({x: 0.75, y: 0.75}, 50, Phaser.Easing.Exponential.Out, true);
			debugResult = "Drag Cancel parent";
			return;
		}				
		// testa os filhos		
		for (var i = 0; i< sprite.children.length; i++){	
			// se a posicao é invalida ou a posicao ja esta ocupada
			if (!grid.valid(sprite.x + sprite.children[i].x, sprite.y + sprite.children[i].y) || grid.exists(sprite.x + sprite.children[i].x, sprite.y + sprite.children[i].y)) {
				// volta a sprite pai para a posicao original
				game.add.tween(sprite).to({x: sprite.startDragX, y: sprite.startDragY}, 50, Phaser.Easing.Exponential.Out, true);
				game.add.tween(sprite.scale).to({x: 0.75, y: 0.75}, 50, Phaser.Easing.Exponential.Out, true);
				debugResult = "Drag Cancel "+(sprite.x + sprite.children[i].x)+"-"+(sprite.y + sprite.children[i].y) ;
				return;
			}
		}
		sprite.input.draggable = false;			
		sprite.input.useHandCursor = false;
		
		scene.newBlocksLayer.removeChild(sprite);
		
		// preenche as posições do grid
		if (typeof sprite.isEmpty === "undefined") // apenas sera diferente disse se for o primeiro block vazio
		{
			grid.add(sprite.x, sprite.y, sprite);		
			player.points++;
			scene.updateText();
			scene.blocksLayer.add(sprite);
		}
		
		var totalChildren = sprite.children.length;
		for (var i = 0; i < totalChildren; i++){	
			var child = sprite.children[0];	// eh zero porque quando faz removechild ele reordena a lista
			child.x += sprite.x;
			child.y += sprite.y;
			grid.add(child.x, child.y, child);
			
			player.points++;
			scene.updateText();
			
			scene.blocksLayer.add(child); // adiciona no mundo novamente
			sprite.removeChild(child); // desvincula o filho do pai						
		}
		
		scene.checkLines();
		scene.createNewBlocks(this);
		setTimeout(function(){ scene.checkGameOver(); }, 600); // precisa desse pela animação de tirar os caras do grid 
		scene.debugResult = "Drag finished";
	},
	createNewBlocks: function()
	{	
		var block ={};	
		if (this.newBlocksLayer.countLiving() == 0){
			block = blockFactory.createBlock(this.blocksLayer, 0, 500, this.onDragStart, this.onDragStop);				
			this.newBlocksLayer.add(block);
			
			block = blockFactory.createBlock(this.blocksLayer, 200, 500, this.onDragStart, this.onDragStop);
			this.newBlocksLayer.add(block);
			
			block = blockFactory.createBlock(this.blocksLayer, 400, 500, this.onDragStart, this.onDragStop);
			this.newBlocksLayer.add(block);
		}
	}
};
var scene = new Scene();

window.onload = function() {
	game = new Phaser.Game(600, 768, Phaser.AUTO, 'upup-game');
	
	game.state.add("PlayGame", scene);
	game.state.start("PlayGame");
	
	//  The Google WebFont Loader will look for this object, so create it before loading the script.
	WebFontConfig = {

		//  'active' means all requested fonts have finished loading
		//  We set a 1 second delay before calling 'createText'.
		//  For some reason if we don't the browser cannot render the text the first time it's created.
		active: function() {game.time.events.add(Phaser.Timer.SECOND, scene.createText, this); },

		//  The Google Fonts we want to load (specify as many as you like in the array)
		google: {
		  //families: ['Press Start 2P']
		  //families: ['Mouse Memoirs']
		  families: ['Skranji']
		}
	};	
};


