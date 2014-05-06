var WorldRenderer = (function() {
    var module = Util.extend(GameEngine.Entity, {
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
            var focus = this.game.viewFocus.y / 
                        this.game.world.imgResolution;
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
    
    return (module);
})();