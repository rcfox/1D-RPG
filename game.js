window.onload = function() {
	//start crafty
	Crafty.init(88,31);
	Crafty.canvas();

	Crafty.sprite(28, "guy.png", {
		player: [0,0],
		enemy: [0,0],
	});
	
	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["guy.png","layer0.png","layer1.png","layer2.png","layer3.png",], function() {
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
			.animate("walk_right",20,-1);
		
		var layers = [Crafty.e("2D, DOM, image").image("layer0.png"),
					  Crafty.e("2D, DOM, image, parallax").image("layer1.png").parallax(0.2),
					  Crafty.e("2D, DOM, image, parallax").image("layer2.png").parallax(0.5),
					  Crafty.e("2D, DOM, image, parallax").image("layer3.png").parallax(0.7)];

		Crafty.c("enemy_encounter", {
			time: 6000,
			fight_time: 2500,
			flee_time: 10000,
			victory: function() {
				var now = new Date().getTime();
				if(now - this.start_time >= this.fight_time)
				{
					this.unbind("enterframe");
					this.start_time = now;
					
					Crafty("enemy").destroy();
					guy.tween({x:guy.x-20},200);
					Crafty("parallax").start();
					this.start(Crafty.randRange(5000,10000));
				}
			},
			flee: function() {
				var now = new Date().getTime();
				if(now - this.start_time >= this.fight_time)
				{
					this.unbind("enterframe");
					this.start_time = now;
										
					guy.stop()
						.animate("walk_left",15,-1)
						.tween({x:guy.x-20},100);
					Crafty("enemy Tween").tween({x:90},150);
					Crafty("parallax").start(-1);
					
					this.bind("enterframe",function() {
						var now = new Date().getTime();
						if(now - this.start_time >= this.flee_time)
						{
							this.unbind("enterframe");
							this.start_time = now;
							guy.stop()
								.animate("walk_right",20,-1);
							Crafty("parallax").stop().start(-1);
							Crafty("enemy").destroy();
							this.start(Crafty.randRange(5000,10000));
						}
					});
				}
			},
			start: function(time)
			{
				if(time) this.time = time;
				this.start_time = new Date().getTime();
				
				this.bind("enterframe",function() {
					var now = new Date().getTime();
					if(now - this.start_time >= this.time)
					{
						this.unbind("enterframe");
						this.start_time = now;

						Crafty("parallax").stop();
						Crafty("enemy").destroy();
						this.enemy = Crafty.e("2D, DOM, enemy, Animate, Tween")
							.attr({x:90,y:5,z:1})
							.animate("walk_left",1,0,4)
							.animate("walk_left",20,-1)
							.tween({x:40}, 40);
						guy.tween({x:guy.x+20},40);
						if(Crafty.randRange(1,1) == 1) {
							this.bind("enterframe",this.flee);
						} else {
							this.bind("enterframe",this.victory);
						}
					}
					return this;
				});
				return this;
			},
		});
		
		var enemy_encounter = Crafty.e("enemy_encounter").start(5000);
	});
};
