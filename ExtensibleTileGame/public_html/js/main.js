var game;

"use strict";

window.onload = function() {
    var BlockGame = Util.extend(GameEngine.Game, {
        constructor: function(settings) {
            this.keys = {
                left:   'A'.charCodeAt(0),
                right:  'D'.charCodeAt(0),
                up:     'W'.charCodeAt(0),
                down:   'S'.charCodeAt(0)
            };
            this.tileRegistry = new TileRegistry(this);
            
            this.world = new World(this);
            
            this.player = new Player();
            this.cursor = new Cursor();
            
            // World should render below everything, so it is registered first
            this.entityHandler.addEntity(new WorldRenderer(this.world));
            
            this.entityHandler.addEntity(this.cursor);
            this.entityHandler.addEntity(this.player);
        }
    });
    var Player = Util.extend(GameEngine.Entity, {
        constructor: function() {
            this.dx = 0;
            this.dy = 0;
            
            this.maxDx = 256;
            this.xAcc = 16;
            
            this.xFricDefault = 0.9;
            this.xFric = this.xFricDefault;
            this.lrPressed = false;
            
            this.grav = 24;
            this.jumpSpeed = 768;
            this.maxDy = 1000;
            
            this.y = 0;
            
            this.imgSrc = "img/player.png";
        },
        init: function() {
            while (!this.inWall())
                this.y += this.game.world.imgResolution;
            while (this.inWall())
                this.y -= this.game.world.imgResolution;
        },
        update: function(delta) {
            // Managable figures; in distance, it is now px/sec
            delta *= 0.001;
            
            // delta = 1 / 60;
            
            var onGround = this.inWall(this.x, this.y + 1);
                    /*this.game.tileRegistry.isSolid(this.game.world.get(
                    Math.floor(0.5 + this.x / this.game.world.imgResolution),
                    Math.floor(1 + (this.y + 1) / this.game.world.imgResolution)));*/
            
            // Horizontal movement, in block for my code folding :)
            var change = 0;
            if (this.game.input.keyDown[this.game.keys.left])
                change -= this.xAcc;
            if (this.game.input.keyDown[this.game.keys.right])
                change += this.xAcc;
            
            this.dx += change;
            // Clamp
            this.dx = Math.min(this.maxDx, Math.max(-this.maxDx, this.dx));
            
            // Just released
            if (this.lrPressed && change === 0)
                this.xFric = this.adjustedFriction();
            
            this.lrPressed = (change !== 0);
            
            // Jumping, gravity
            if (onGround) {
                if (this.game.input.keyDown[this.game.keys.up])
                    this.dy = -this.jumpSpeed;
            } else
                this.dy += this.grav;
            this.dy = Math.min(this.maxDy, Math.max(-this.maxDy, this.dy));
            
            // Collision and motion update
            if (this.inWall(
                    this.x + this.dx * delta,
                    this.y + this.dy * delta)) {
                // Place not free, try to move in as close as possible to wall
                
                if (this.inWall(this.x + this.dx * delta, this.y)) {
                    for(var i = 0; i < this.game.world.imgResolution; i ++) {
                        if (!this.inWall(this.x + Util.sign(this.dx), this.y))
                            this.x += Util.sign(this.dx);
                        else
                            break;
                    }
                    
                    this.dx = 0;
                } else
                    this.x += this.dx * delta;
                
                if (this.inWall(this.x, this.y + this.dy * delta)) {
                    for(var i = 0; i < this.game.world.imgResolution; i ++) {
                        if (!this.inWall(this.x, this.y + Util.sign(this.dy)))
                            this.y += Util.sign(this.dy);
                        else
                            break;
                    }
                    
                    this.dy = 0;
                } else
                    this.y += this.dy * delta;
            } else {
                this.x += this.dx * delta;
                this.y += this.dy * delta;
            }
            
            // Friction
            if (change === 0)
                this.dx *= this.xFric;
            
            this.game.setView(this.x, this.y);
        },
        adjustedFriction: function(delta) {
            delta = delta || (1 / 60);
            // Adjust friction to help align the player to the grid
            // Don't worry about the math, it just adjusts friction to fit
            var end = this.x + this.img.width / 2 + 
                    (delta * this.dx) / (1 - this.xFricDefault),
                leftover = (
                (end - Util.sign(this.dx) * this.game.world.imgResolution / 2) %
                this.game.world.imgResolution);
            if (end - leftover - (this.x + this.img.width / 2) === 0)
                return (0.9);
            var af = 1 - ((delta * this.dx) / 
                    (end - leftover - (this.x + this.img.width / 2)));
            if (af > 0 && af < 1)
                return (af);
            return (this.xFricDefault);
        },
        inWall: function(x, y) {
            var imgres = this.game.world.imgResolution;
            var fx1 = Math.floor(Math.round((x || this.x)) / imgres),
                fy1 = Math.floor(Math.round((y || this.y)) / imgres),
                fx2 = Math.floor(Math.round((x || this.x) + 
                        this.img.width - 1) / imgres),
                fy2 = Math.floor(Math.round((y || this.y) + 
                        this.img.height - 1)/ imgres),
                
                w = this.game.world, tr = this.game.tileRegistry;

            var a = tr.isSolid(w.get(fx1, fy1)),
                b = tr.isSolid(w.get(fx2, fy1)),
                d = tr.isSolid(w.get(fx1, fy2)),
                c = tr.isSolid(w.get(fx2, fy2));

            return (a || b || c || d);
        },
        render: function(ctx) {
           ctx.drawImage(this.img, Math.round(this.x), Math.round(this.y));
        }
    });
    var Cursor = Util.extend(GameEngine.Entity, {
        constructor: function() {
            this.imgSrc = "img/cursor.png";
        }, update: function(delta) {
            if (this.game.input.mouse.button === GameEngine.CONST.MOUSE_LEFT)
                this.game.world.set(
                    this.game.tileRegistry.makeTile("air"),
                    this.x / this.game.world.imgResolution,
                    this.y / this.game.world.imgResolution);
        },
        render: function(ctx) {
            // Updates in the render function to avoid latency
            this.x = this.game.input.mouse.x - Math.round(
                this.game.canvas.width / 2 - this.game.viewFocus.x);
            this.y = this.game.input.mouse.y - Math.round(
                this.game.canvas.height / 2 - this.game.viewFocus.y);
                
            ctx.drawImage(this.img, this.x, this.y);
        }
    });
    var WorldRenderer = Util.extend(GameEngine.Entity, {
        constructor: function(world) {
            this.world = world;
            
            this.skyGradStops = [
                {depth: Number.MIN_SAFE_INTEGER,    r: 0,   g: 0,   b: 0    },
                {depth: 0,                          r: 126, g: 192, b: 238  },
                {depth: 5,                          r: 63,  g: 63,  b: 63   },
                {depth: Number.MAX_SAFE_INTEGER,    r: 63,  g: 63,  b: 63   }
            ];
        },
        render: function(ctx) {
            var focus = this.game.viewFocus.y / this.game.world.imgResolution;
            var level = 1;
            var stops = this.skyGradStops;
            while(focus > stops[level].depth)
                level ++;
            
            var ratio = (focus - stops[level - 1].depth) /
                    (stops[level].depth - stops[level - 1].depth);
            
            ctx.save();
                // Magic code to mix colors
                var 
    r = Math.round(ratio * stops[level].r + (1 - ratio) * stops[level - 1].r),
    g = Math.round(ratio * stops[level].g + (1 - ratio) * stops[level - 1].g),
    b = Math.round(ratio * stops[level].b + (1 - ratio) * stops[level - 1].b);
                
                ctx.fillStyle = "#" + (0x1000000 + r*0x10000 + g*0x100 + b)
                        .toString(16).substring(1);
                
                // Set identity for sky
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
            
            // Render the actual world
            this.world.setFocus(this.game.viewFocus.x, this.game.viewFocus.y);
            this.world.render();
        }
    });
    
    var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    
    game = new BlockGame({canvas: canvas});
    
    game.tileRegistry.add("invalid", "img/invalid.png", false);
    
    game.tileRegistry.add("air", undefined, false);
    game.tileRegistry.add("stone",  "img/stone.png");
    game.tileRegistry.add("dirt",   "img/dirt.png");
    game.tileRegistry.add("grass",  "img/grass.png");
    
    game.tileRegistry.requireResources();
    
    game.res.load(function() {
        game.start();
    });
};