var Player = (function() {
    var module = Util.extend(GameEngine.Entity, {
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
                    for(var i = 0; i < 
                            this.game.world.imgResolution; i ++) {
                        
                        if (!this.inWall(this.x + Util.sign(this.dx), this.y))
                            this.x += Util.sign(this.dx);
                        else
                            break;
                    }
                    
                    this.dx = 0;
                } else
                    this.x += this.dx * delta;
                
                if (this.inWall(this.x, this.y + this.dy * delta)) {
                    for(var i = 0; i < 
                            this.game.world.imgResolution; i ++) {
                        
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
            
            var res = this.game.world.imgResolution;
            
            // Adjust friction to help align the player to the grid
            // Don't worry about the math, it just adjusts friction to fit
            var end = this.x + this.img.width / 2 + 
                    (delta * this.dx) / (1 - this.xFricDefault),
                leftover = (end - Util.sign(this.dx) * res / 2) % res;
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
                
                rc = this.game.world, tr = this.game.tileRegistry;

            var a = tr.isSolid(rc.get(fx1, fy1)),
                b = tr.isSolid(rc.get(fx2, fy1)),
                d = tr.isSolid(rc.get(fx1, fy2)),
                c = tr.isSolid(rc.get(fx2, fy2));

            return (a || b || c || d);
        },
        render: function(ctx) {
           ctx.drawImage(this.img, Math.round(this.x), Math.round(this.y));
        }
    });
    
    return (module);
})();