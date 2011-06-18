window.onload = function() {
	//start crafty
	Crafty.init(88,31);

	Crafty.extend({
		__delay_entities: [],
		delay_time: function(time,callback) {
			this.__delay_entities.push(Crafty.e().attr({
				start_time: new Date().getTime(),
				delay_time: time,
				index: this.__delay_entities.length
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
			return this;
		},
		delay_frames: function(frames,callback) {
			this.__delay_entities.push(Crafty.e().attr({
				start_frame: Crafty.frame(),
				delay_frame: frames,
				index: this.__delay_entities.length
			}).bind("enterframe",function() {
				var now = Crafty.frame();
				if(now - this.start_frame >= this.delay_frame) {
					this.unbind("enterframe");
					Crafty.__delay_entities.splice(this.index,1);
					for(var i = this.index; i < Crafty.__delay_entities.length; ++i) {
						Crafty.__delay_entities[i].index--;
					}
					callback();
				}
			}));
			return this;
		}
	});

	Crafty.sprite(28, "sprites.png", {
		player: [0,0],
		enemy: [0,2]
	});

	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["sprites.png",
					 "layer0.png","layer1.png","layer2.png","layer3.png",
					 "sword.png","sword-glow.png",
					 "shield.png","shield-glow.png",
					 "flee.png","flee-glow.png",
					 "bar-outline.png","bar-filling.png"], function() {
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
			width: Crafty.viewport.width,
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
					this.bind("enterframe",function() {
						this.x -= this.speed;
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
			}
		});

		var layers = [Crafty.e("2D, DOM, Image").image("layer0.png"),
					  Crafty.e("2D, DOM, Image, parallax").image("layer1.png").parallax(0.2),
					  Crafty.e("2D, DOM, Image, parallax").image("layer2.png").parallax(0.5),
					  Crafty.e("2D, DOM, Image, parallax").image("layer3.png").parallax(0.7)];

		var guy = Crafty.e("2D, DOM, player, SpriteAnimation, Tween")
		  .attr({x:0,y:5,z:1})
		  .animate("walk_right",6,0,9)
		  .animate("walk_left",1,0,4)
		  .animate("attack_right",0,1,2)
		  .animate("walk_right",20,-1);

		Crafty.c("Icon", {
			_name: "",
			selected: false,
			icon: function(name,selected) {
				this._name = name;
				if(selected) this.selected = selected;
				if(!this.has("Mouse")) this.addComponent("Mouse");
				if(!this.has("Image")) this.addComponent("Image");
				this.addComponent("Icon-"+name);

				this.image(this._name+".png");
				this.bind("mousedown", function() {
					Crafty("Icon").select(false);
					this.select(true);
				});
				return this;
			},
			select: function(is_selected)
			{
				this.each(function() {
					if(is_selected != undefined) this.selected = is_selected;

					if(this.selected) {
						this.image(this._name+"-glow.png");
					}
					else {
						this.image(this._name+".png");
					}
				});
				return this;
			}
		});

		var sword_icon = Crafty.e("2D, DOM, Icon").icon("sword").select(true)
		  .bind("enterframe",function() {
			  this.attr({x: guy.x+2, y: guy.y-2});
		  });


		var shield_icon = Crafty.e("2D, DOM, Image").image("shield.png")
		  .bind("enterframe",function() {
			  this.attr({x: sword_icon.x+sword_icon.w, y: guy.y-2});
		  });

		var flee_icon = Crafty.e("2D, DOM, Icon").icon("flee")
		  .bind("enterframe",function() {
			  this.attr({x: shield_icon.x+shield_icon.w, y: guy.y-2});
		  });

		Crafty.c("HealthBar", {
			_outline: null,
			_max_height: 0,
			_orig_y: 0,
			health_bar: function(x,y,width, height, image) {
				this.x = x;
				this.y = y;
				this.w = width;
				this.h = height;
				this.image(image,"repeat");
				this._max_height = height;
				this._orig_y = y;
				return this;
			},
			update: function(ratio) {
				this.each(function() {
					this.h = this._max_height * ratio;
					this.y = this._orig_y + this._max_height * (1-ratio);
				});
				return this;
			}
		});

		var health_bar = Crafty.e("2D, DOM, Image, HealthBar")
		  .health_bar(guy.x+2,guy.y+9,3,15,"bar-filling.png")
		  .bind("enterframe",function() {
			  this.attr({x: guy.x+2});
		  });

		var health_bar_frame = Crafty.e("2D, DOM, Image").image("bar-outline.png")
		  .bind("enterframe",function() {
			  this.attr({x: guy.x+2, y: guy.y+8});
		  });

		var health = 1.0;

		Crafty.c("enemy_encounter", {
			start: function(time,player)
			{
				var fight_time = 2500;
				var flee_time = 10000;
				this.each(function() {
					Crafty.delay_time(time,function() {
						Crafty("parallax").stop();
						var enemy = Crafty.e("2D, DOM, enemy, SpriteAnimation, Tween")
										.attr({x:90,y:5,z:1})
										.animate("walk_left",1,2,4)
										.animate("walk_left",20,-1)
										.tween({x:40}, 40);
						player.tween({x:player.x+22},40);
						Crafty.delay_frames(40,function() {
							player.stop()
								.animate("attack_right",10,-1);
						});
						if(Crafty(Crafty("Icon-flee")[0]).selected) {
							// Flee
							Crafty.delay_time(fight_time,function() {
								player.stop()
									.animate("walk_left",15,-1)
									.tween({x:player.x-22},100);
								enemy.tween({x:90},150);
								Crafty("parallax").start(-1);
								health -= 0.1;
								if(health < 0) health = 0;
								health_bar.update(health);

								Crafty.delay_time(flee_time, function() {
									player.stop().animate("walk_right",20,-1);
									Crafty("parallax").stop().start(-1);
									enemy.destroy();
									Crafty("enemy_encounter").start(Crafty.randRange(5000,10000),player);
								});
							});
						} else if(Crafty(Crafty("Icon-sword")[0]).selected) {
							// Victory
							Crafty.delay_time(fight_time,function() {
								health -= 0.25;
								if(health < 0) health = 0;
								health_bar.update(health);
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
			}
		});

		var enemy_encounter = Crafty.e("enemy_encounter").start(5000,guy);
	});
};
