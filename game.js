window.onload = function() {
	//start crafty
	Crafty.init(88,31);
	Crafty.canvas();

	Crafty.extend({
		__delay_entities: [],
		delay: function(time,callback) {
			this.__delay_entities.push(Crafty.e().attr({
				start_time: new Date().getTime(),
				delay_time: time,
				index: this.__delay_entities.length,
			}).bind("enterframe",function() {
				var now = new Date().getTime();
				if(now - this.start_time >= this.delay_time) {
					this.unbind("enterframe");
					Crafty.__delay_entities.splice(this.index,1);
					for(var i = this.index; i < Crafty.__delay_entities.length; ++i) {
						Crafty.__delay_entities[i].index--;
					}
					callback();
				}
			}));
		},
	});

	Crafty.sprite(28, "sprites.png", {
		player: [0,0],
		enemy: [0,2],
	});
	
	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["sprites.png","layer0.png","layer1.png","layer2.png","layer3.png",], function() {
			Crafty.scene("main"); //when everything is loaded, run the main scene
		});
		//black background with some loading text
		Crafty.background("#000");
		Crafty.e("2D, DOM, Text").attr({w: 88, h: 31, x: 0, y: 0})
			.text("Loading")
			.css({"text-align": "center"});
	});
	
	Crafty.scene("loading");

	Crafty.scene("main",function() {
		Crafty.c("parallax", {
			width: Crafty._canvas.width,
			parallax: function(speed,width)
			{
				this.each(function() {
					if(speed) this.speed = speed;
					if(width) this.width = width;
					this.start();
				});
				return this;
			},
			start: function(speed)
			{
				this.each(function() {
					if(speed) this.speed *= speed;
					var foo = this.speed;
					this.bind("enterframe",function() {
						this.x -= foo;
						if(this.x <= -(this.w-this.width)) this.x = 0;
						if(this.x > 0) this.x = -(this.w-this.width);
					});
				});
				return this;
			},
			stop: function()
			{
				this.each(function() {
					this.unbind("enterframe");
				});
				return this;
			},
		});

		var guy = Crafty.e("2D, DOM, player, Animate, Tween")
			.attr({x:0,y:5,z:1})
			.animate("walk_right",6,0,9)
			.animate("walk_left",1,0,4)
			.animate("attack_right",0,1,2)
			.animate("walk_right",20,-1);
		
		var layers = [Crafty.e("2D, DOM, image").image("layer0.png"),
					  Crafty.e("2D, DOM, image, parallax").image("layer1.png").parallax(0.2),
					  Crafty.e("2D, DOM, image, parallax").image("layer2.png").parallax(0.5),
					  Crafty.e("2D, DOM, image, parallax").image("layer3.png").parallax(0.7)];

		Crafty.c("enemy_encounter", {
			start: function(time,player)
			{
				var fight_time = 2500;
				var flee_time = 10000;
				this.each(function() {
					Crafty.delay(time,function() {
						Crafty("parallax").stop();
						var enemy = Crafty.e("2D, DOM, enemy, Animate, Tween")
							.attr({x:90,y:5,z:1})
							.animate("walk_left",1,2,4)
							.animate("walk_left",20,-1)
							.tween({x:40}, 40);
						player.tween({x:player.x+22},40);
						Crafty.delay(800,function() {
							player.stop()
								.animate("attack_right",10,-1);
						});
						if(Crafty.randRange(1,3) == 1) {
							// Flee
							Crafty.delay(fight_time,function() {
								player.stop()
									.animate("walk_left",15,-1)
									.tween({x:player.x-22},100);
								enemy.tween({x:90},150);
								Crafty("parallax").start(-1);

								Crafty.delay(flee_time, function() {
									player.stop().animate("walk_right",20,-1);
									Crafty("parallax").stop().start(-1);
									enemy.destroy();
									Crafty("enemy_encounter").start(Crafty.randRange(5000,10000),player);
								});
							});
						} else {
							// Victory
							Crafty.delay(fight_time,function() {
								enemy.destroy();
								player.stop()
									.animate("walk_right",20,-1)
									.tween({x:player.x-22},200);
								Crafty("parallax").start();
								Crafty("enemy_encounter").start(Crafty.randRange(5000,10000),player);
							});
						}
					});
				});
				return this;
			},
		});
		
		var enemy_encounter = Crafty.e("enemy_encounter").start(5000,guy);
	});
};
