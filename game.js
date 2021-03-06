window.onload = function() {
	//start crafty
	Crafty.init(88,31);

	Crafty.extend({ // delay_time, delay_frames
		//{
		__delay_entities: [],
		delay_time: function(time,callback) {
			this.__delay_entities.push(Crafty.e().attr({
				start_time: new Date().getTime(),
				delay_time: time,
				index: this.__delay_entities.length
			}).bind("EnterFrame",function() {
				var now = new Date().getTime();
				if(now - this.start_time >= this.delay_time) {
					this.unbind("EnterFrame");
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
			}).bind("EnterFrame",function() {
				var now = Crafty.frame();
				if(now - this.start_frame >= this.delay_frame) {
					this.unbind("EnterFrame");
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
	//}

	Crafty.c("Parallax", {
		//{
		_parallax_width: Crafty.viewport.width,
		parallax: function(speed,width)
		{
			this.each(function() {
				if(speed) this.speed = speed;
				if(width) this._parallax_width = width;
				this._extend_image();
				this.start();
			});
			return this;
		},
		start: function(speed)
		{
			this.each(function() {
				if(speed) this.speed *= speed;
				this.bind("EnterFrame",function() {
					this.x -= this.speed;
					if(this.x <= -(this.w-this._parallax_width)) this.x = 0;
					if(this.x > 0) this.x = -(this.w-this._parallax_width);
				});
			});
			return this;
		},
		stop: function()
		{
			this.each(function() {
				this.unbind("EnterFrame");
			});
			return this;
		},
		_extend_image: function() {
			var canvas = document.createElement('canvas');
			var canvasContext = canvas.getContext('2d');

			var imgW = this.img.width;
			var imgH = this.img.height;
			canvas.width = imgW + this._parallax_width;
			canvas.height = imgH;
			canvasContext.drawImage(this.img, 0, 0);
			canvasContext.putImageData(canvasContext.getImageData(0, 0, imgW, imgH),imgW,0);

			this.image(canvas.toDataURL());
		}
	});
	//}

	Crafty.c("AutoHider", {
		//{
		_auto_hide: "AutoHide",
		init: function() {
			if(!this.has("Mouse")) this.addComponent("Mouse");
			this.bind("MouseOver",function() {
				Crafty("2D "+this._auto_hide).each(function() {
					this.visible = true;
				});
			})
				.bind("MouseOut",function() {
					Crafty("2D "+this._auto_hide).each(function() {
						this.visible = false;
					});
				});
			return this;
		},
		autohide: function(type) {
			this._auto_hide = type;
		}
	});
	//}

	Crafty.c("Icon", {
		//{
		_name: "",
		selected: false,
		icon: function(name,selected) {
			this._name = name;
			if(selected) this.selected = selected;
			if(!this.has("Mouse")) this.addComponent("Mouse");
			if(!this.has("Image")) this.addComponent("Image");
			this.addComponent("Icon-"+name);

			this.z = 2;
			this.image(this._name+".png");
			this.bind("MouseDown", function() {
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
	//}

	Crafty.c("Follows", {
		//{
		_target: null,
		_x_offset: undefined,
		_y_offset: undefined,
		follow: function(target, x_offset, y_offset) {
			this.each(function () {
				this._target = target;
				if(target.has("AutoHider"))
				{
					if(!this.has("AutoHider")) this.addComponent("AutoHider");
					this.autohide(target._auto_hide);
				}
				if(typeof x_offset !== 'undefined') this._x_offset = x_offset;
				if(typeof y_offset !== 'undefined') this._y_offset = y_offset;
				this.bind("EnterFrame",function() {
					if(typeof this._x_offset !== 'undefined') this.x = this._target.x + this._x_offset;
					if(typeof this._y_offset !== 'undefined') this.y = this._target.y + this._y_offset;
				});
			});
			return this;
		}
	});
	//}

	Crafty.c("Foreground", {
		//{
		_target: null,
		_orig_x: undefined,
		init: function() {
			this._target = Crafty(Crafty("player")[0]);
			this.bind("EnterFrame",function() {
				this._orig_x = this.x;
				this.unbind("EnterFrame",arguments.callee);
				this.bind("EnterFrame",function() {
					this.x = this._orig_x - this._target.dist;
				});
			});
			return this;
		}
	});
	//}

	Crafty.c("HealthBar", {
		//{
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
	//}

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
					 "door.png",
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

		var layers = [Crafty.e("2D, DOM, Image").image("layer0.png"),
					  Crafty.e("2D, DOM, Image, Parallax").image("layer1.png").parallax(0.2),
					  Crafty.e("2D, DOM, Image, Parallax").image("layer2.png").parallax(0.5),
					  Crafty.e("2D, DOM, Image, Parallax").image("layer3.png").parallax(0.7)];


		var guy = Crafty.e("2D, DOM, player, SpriteAnimation, Tween, AutoHider")
		  .attr({paused:false,dist:0,x:0,y:5,z:1,direction: 1})
		  .animate("walk_right",6,0,9)
		  .animate("walk_left",1,0,4)
		  .animate("attack_right",0,1,2)
		  .animate("walk_right",20,-1)
		  .bind("EnterFrame",function() {
			  if(!this.paused && Crafty.frame() % 2)
			  {
				  this.dist += this.direction;
			  }
		  });

		var door = Crafty.e("2D, DOM, Image, Foreground").image("door.png").x = 600;

		var sword_icon = Crafty.e("2D, DOM, Icon, Follows, AutoHide")
		  .icon("sword")
		  .select(true)
		  .follow(guy,2,-2);

		var shield_icon = Crafty.e("2D, DOM, Image, Follows, AutoHide")
		  .image("shield.png")
		  .follow(sword_icon,sword_icon.w,0);

		var flee_icon = Crafty.e("2D, DOM, Icon, Follows, AutoHide")
		  .icon("flee")
		  .follow(shield_icon,shield_icon.w,0);

		var health_bar = Crafty.e("2D, DOM, Image, HealthBar, Follows, AutoHide")
		  .health_bar(guy.x+2,guy.y+9,3,15,"bar-filling.png")
		  .follow(guy,2);

		var health_bar_frame = Crafty.e("2D, DOM, Image, Follows, AutoHide")
		  .image("bar-outline.png")
		  .follow(guy,2,8);

		Crafty("2D AutoHide").each(function() {
			this.visible = false;
		});

		var dude = Crafty.e("2D, DOM, enemy, SpriteAnimation, Tween, Foreground")
		  .attr({x:90,y:5,z:1})
		  .animate("walk_left",1,2,4)
		  .animate("walk_left",20,-1);

		var health = 1.0;
		var walk_time = 8000;
		var fight_time = 2500;
		var flee_time = 10000;
		function demo() {
			Crafty.delay_time(walk_time,function() {
				Crafty("Parallax").stop();
				var enemy = Crafty.e("2D, DOM, enemy, SpriteAnimation, Tween")
			.attr({x:90,y:5,z:1})
			.animate("walk_left",1,2,4)
			.animate("walk_left",20,-1)
			.tween({x:40}, 40);
				guy.tween({x:guy.x+22},40).paused = true;;
				Crafty.delay_frames(40,function() {
					guy.stop()
						.animate("attack_right",10,-1);
				});
				if(flee_icon.selected) {
					// Flee
					Crafty.delay_time(fight_time,function() {
						guy.stop()
							.animate("walk_left",15,-1)
							.tween({x:guy.x-22},100).attr({paused: false, direction:-1});
						enemy.tween({x:90},150);
						Crafty("Parallax").start(-1);
						health -= 0.1;
						if(health < 0) health = 1;
						health_bar.update(health);

						Crafty.delay_time(flee_time, function() {
							guy.stop().animate("walk_right",20,-1).direction = 1;
							Crafty("Parallax").stop().start(-1);
							enemy.destroy();
							demo();
						});
					});
				} else if(sword_icon.selected) {
					// Victory
					Crafty.delay_time(fight_time,function() {
						health -= 0.25;
						if(health < 0) health = 1;
						health_bar.update(health);
						enemy.destroy();
						guy.stop()
							.animate("walk_right",20,-1)
							.tween({x:guy.x-22},200).paused = false;
						Crafty("Parallax").start();
						demo();
					});
				}
			});
		}
		demo();
	});
};
